import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert, Platform, AppState, AppStateStatus } from 'react-native';
import { useProfile } from './ProfileContext';
import { PeerProfile } from '@/types/profile';
import bleService from '@/services/BleService';
import { BleDiscoveryStatus, BlePermissionStatus, BleState } from '@/types/ble';



// Map BleDiscoveryStatus to simpler UI status
type DiscoveryStatus = 'idle' | 'scanning' | 'advertising' | 'scanning_and_advertising' | 'error';

interface DiscoveryContextType {
  isDiscovering: boolean;
  status: DiscoveryStatus;
  nearbyPeers: PeerProfile[];
  startDiscovery: () => void;
  stopDiscovery: () => void;
  permissionStatus: BlePermissionStatus;
  requestPermissions: () => Promise<boolean>;
  bleState: BleState;
}

const DiscoveryContext = createContext<DiscoveryContextType>({
  isDiscovering: false,
  status: 'idle',
  nearbyPeers: [],
  startDiscovery: () => {},
  stopDiscovery: () => {},
  permissionStatus: BlePermissionStatus.UNKNOWN,
  requestPermissions: async () => false,
  bleState: BleState.UNKNOWN
});

export const useDiscovery = () => useContext(DiscoveryContext);

export const DiscoveryProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { profile, isProfileComplete } = useProfile();
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [status, setStatus] = useState<DiscoveryStatus>('idle');
  const [nearbyPeers, setNearbyPeers] = useState<PeerProfile[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<BlePermissionStatus>(BlePermissionStatus.UNKNOWN);
  const [bleState, setBleState] = useState<BleState>(BleState.UNKNOWN);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  
  // References for timeout and interval IDs - using number type for compatibility with browser setInterval/setTimeout
  const discoveryTimeoutRef = useRef<number | null>(null);
  const peerExpirationIntervalRef = useRef<number | null>(null);

  // Cleanup function for all intervals and timeouts and BLE operations
  const cleanup = () => {
    if (discoveryTimeoutRef.current) {
      clearTimeout(discoveryTimeoutRef.current);
      discoveryTimeoutRef.current = null;
    }
    
    if (peerExpirationIntervalRef.current) {
      clearInterval(peerExpirationIntervalRef.current);
      peerExpirationIntervalRef.current = null;
    }
    
    // Stop BLE operations
    bleService.stopAdvertising();
    bleService.stopScanning();
  };

  // Initialize BLE service
  useEffect(() => {
    const initialize = async () => {
      await bleService.initialize();
      updateBleState();
      checkPermissions();
    };
    
    initialize();

    // Handle app state changes (for battery optimization)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // When app goes to background, stop discovery to save battery
      if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        if (isDiscovering) {
          // Need to call stopDiscovery via reference to avoid TypeScript errors
          setIsDiscovering(false);
          setStatus('idle');
          cleanup();
        }
      } 
      // When app comes to foreground, check BLE state and permissions
      else if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        updateBleState();
        checkPermissions();
      }
      
      appStateRef.current = nextAppState;
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Clean up on unmount
    return () => {
      subscription.remove();
      cleanup();
    };
  }, []);
  
  // Update BLE state
  const updateBleState = async () => {
    const state = await bleService.getState();
    setBleState(state);
  };
  
  // Check BLE permissions
  const checkPermissions = async () => {
    const status = await bleService.checkPermissions();
    setPermissionStatus(status);
    return status === BlePermissionStatus.GRANTED;
  };
  
  // Request BLE permissions
  const requestPermissions = async () => {
    const status = await bleService.requestPermissions();
    setPermissionStatus(status);
    return status === BlePermissionStatus.GRANTED;
  };

  const startDiscovery = async () => {
    // Check if profile is complete
    if (!isProfileComplete) {
      Alert.alert(
        'Profile Required',
        'Please complete your profile before starting discovery.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check Bluetooth state
    const state = await bleService.getState();
    setBleState(state);
    
    if (state !== BleState.POWERED_ON) {
      Alert.alert(
        'Bluetooth Required',
        'Please enable Bluetooth to discover nearby peers.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Check permissions
    const permissionsGranted = await checkPermissions();
    if (!permissionsGranted) {
      const requested = await requestPermissions();
      if (!requested) {
        Alert.alert(
          'Permissions Required',
          'Bluetooth permissions are needed to discover nearby peers.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    // Start discovery process
    setIsDiscovering(true);
    setStatus('scanning_and_advertising');
    setNearbyPeers([]);
    
    // Start advertising profile
    const advertisingStarted = await bleService.startAdvertising(profile);
    
    // Start scanning for peers
    const scanningStarted = await bleService.startScanning((discoveredPeer) => {
      // Process discovered peer
      setNearbyPeers(prevPeers => {
        // Check if peer already exists
        if (prevPeers.some(p => p.uuid === discoveredPeer.uuid)) {
          // Update existing peer with new data (like RSSI)
          return prevPeers.map(p => 
            p.uuid === discoveredPeer.uuid 
              ? { ...p, rssi: discoveredPeer.rssi } 
              : p
          );
        }
        
        // Add new peer
        return [...prevPeers, discoveredPeer];
      });
    });
    
    // Update status based on what operations succeeded
    if (advertisingStarted && scanningStarted) {
      setStatus('scanning_and_advertising');
    } else if (advertisingStarted) {
      setStatus('advertising');
    } else if (scanningStarted) {
      setStatus('scanning');
    } else {
      setStatus('error');
      setIsDiscovering(false);
      Alert.alert(
        'Discovery Failed',
        'Failed to start Bluetooth discovery. Please try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Auto-disconnect after 5 minutes (battery optimization)
    discoveryTimeoutRef.current = window.setTimeout(() => {
      stopDiscovery();
      Alert.alert('Session Timeout', 'Discovery session ended after 5 minutes to save battery');
    }, 5 * 60 * 1000);

    // Set up interval to remove expired peers
    peerExpirationIntervalRef.current = window.setInterval(() => {
      const expirationTime = bleService.getBleConfig().expirationTimeMs;
      const now = new Date().getTime();
      
      setNearbyPeers(prevPeers => {
        return prevPeers.filter(peer => {
          if (!peer.discoveredAt) return true;
          
          const peerTime = new Date(peer.discoveredAt).getTime();
          return (now - peerTime) < expirationTime;
        });
      });
    }, 30 * 1000);
  };

  const stopDiscovery = async () => {
    setIsDiscovering(false);
    setStatus('idle');
    
    // Stop BLE operations
    await bleService.stopAdvertising();
    await bleService.stopScanning();
    
    // Clean up timers
    cleanup();
  };

  return (
    <DiscoveryContext.Provider
      value={{
        isDiscovering,
        status,
        nearbyPeers,
        startDiscovery,
        stopDiscovery,
        permissionStatus,
        requestPermissions,
        bleState
      }}
    >
      {children}
    </DiscoveryContext.Provider>
  );
};