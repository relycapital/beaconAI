/**
 * Discovery Context
 * Implements Context-Based State Management requirement from BeaconAI ruleset
 * Follows Behavior-Driven Development (BDD) approach
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import BleService from '../services/BleService';
import { useProfile } from './ProfileContext';
import { DiscoveryStatus } from '../types/ble';
import { PeerProfile } from '../types/profile';
import { BleState, BlePermissionStatus } from '../types/ble';

/**
 * Context type definition
 */
export type DiscoveryContextType = {
  isDiscovering: boolean;
  status: DiscoveryStatus;
  nearbyPeers: PeerProfile[];
  bleState: BleState;
  permissionStatus: BlePermissionStatus;
  startDiscovery: () => Promise<void>;
  stopDiscovery: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  checkBleState: () => Promise<BleState>;
};

// Create the context
const DiscoveryContext = createContext<DiscoveryContextType | undefined>(undefined);

// Context provider component
export const DiscoveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State declarations
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [status, setStatus] = useState<DiscoveryStatus>('idle');
  const [nearbyPeers, setNearbyPeers] = useState<PeerProfile[]>([]);
  const [bleState, setBleState] = useState<BleState>(BleState.UNKNOWN);
  const [permissionStatus, setPermissionStatus] = useState<BlePermissionStatus>(BlePermissionStatus.UNKNOWN);
  
  // Get user profile from context
  const { profile } = useProfile();
  
  // Initialize BLE service
  useEffect(() => {
    const initialize = async () => {
      await BleService.initialize();
      await checkBleState();
      await checkPermissions();
    };
    
    initialize();
  }, []);
  
  // Listen for app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [isDiscovering]);
  
  // Check permissions on component mount
  useEffect(() => {
    checkPermissions();
  }, []);
  
  // Set up peer expiration interval
  useEffect(() => {
    // Clean up expired peers every minute
    const interval = setInterval(() => {
      if (nearbyPeers.length > 0) {
        expirePeers();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [nearbyPeers]);
  
  // Handle app going to background
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' && isDiscovering) {
      // Pause discovery when app goes to background (battery optimization)
      await BleService.stopScanning();
      await BleService.stopAdvertising();
      console.log('Discovery paused due to app going to background');
    } else if (nextAppState === 'active' && isDiscovering) {
      // Resume discovery when app comes to foreground
      startDiscoveryProcess();
      console.log('Discovery resumed due to app coming to foreground');
    }
  };
  
  // Check BLE state
  const checkBleState = async (): Promise<BleState> => {
    const state = await BleService.getState();
    setBleState(state);
    return state;
  };
  
  // Check permission status
  const checkPermissions = async (): Promise<BlePermissionStatus> => {
    const status = await BleService.checkPermissions();
    setPermissionStatus(status);
    return status;
  };
  
  // Request permissions
  const requestPermissions = async (): Promise<boolean> => {
    const status = await BleService.requestPermissions();
    setPermissionStatus(status);
    return status === BlePermissionStatus.GRANTED;
  };
  
  // Handle peer discovery
  const onPeerDiscovered = useCallback((peer: PeerProfile) => {
    setNearbyPeers(prevPeers => {
      // Check if this peer already exists
      const existingPeerIndex = prevPeers.findIndex(p => p.uuid === peer.uuid);
      
      if (existingPeerIndex >= 0) {
        // Update existing peer
        const updatedPeers = [...prevPeers];
        updatedPeers[existingPeerIndex] = {
          ...peer,
          discoveredAt: new Date().toISOString() // Update discovery timestamp
        };
        return updatedPeers;
      } else {
        // Add new peer
        return [...prevPeers, peer];
      }
    });
  }, []);
  
  // Start discovery process
  const startDiscoveryProcess = async () => {
    if (!profile) {
      console.log('Cannot start discovery: profile not available');
      return;
    }
    
    // Check BLE state and permissions
    const currentBleState = await checkBleState();
    const currentPermissions = await checkPermissions();
    
    if (currentBleState !== BleState.POWERED_ON) {
      console.log(`Cannot start discovery: BLE not powered on (state: ${currentBleState})`);
      return;
    }
    
    if (currentPermissions !== BlePermissionStatus.GRANTED) {
      console.log(`Cannot start discovery: Permissions not granted (status: ${currentPermissions})`);
      return;
    }
    
    try {
      // Start advertising
      const advertisingResult = await BleService.startAdvertising(profile);
      
      // Start scanning
      const scanningResult = await BleService.startScanning(onPeerDiscovered);
      
      // Update status based on results
      if (advertisingResult && scanningResult) {
        setStatus('scanning_and_advertising');
      } else if (advertisingResult) {
        setStatus('advertising');
      } else if (scanningResult) {
        setStatus('scanning');
      } else {
        setStatus('idle');
        return; // Failed to start
      }
      
      setIsDiscovering(true);
    } catch (error) {
      console.error('Error starting discovery:', error);
      setStatus('idle');
    }
  };
  
  // Start discovery (public method)
  const startDiscovery = async (): Promise<void> => {
    if (isDiscovering) return;
    
    await startDiscoveryProcess();
  };
  
  // Stop discovery (public method)
  const stopDiscovery = async (): Promise<void> => {
    if (!isDiscovering) return;
    
    try {
      await BleService.stopScanning();
      await BleService.stopAdvertising();
      
      setIsDiscovering(false);
      setStatus('idle');
    } catch (error) {
      console.error('Error stopping discovery:', error);
    }
  };
  
  // Expire old peers
  const expirePeers = useCallback(() => {
    const now = new Date();
    const expirationTime = BleService.getBleConfig().expirationTimeMs;
    
    setNearbyPeers(prevPeers => 
      prevPeers.filter(peer => {
        const peerTime = new Date(peer.discoveredAt);
        const ageMs = now.getTime() - peerTime.getTime();
        return ageMs < expirationTime;
      })
    );
  }, []);
  
  // Provider value
  const value: DiscoveryContextType = {
    isDiscovering,
    status,
    nearbyPeers,
    bleState,
    permissionStatus,
    startDiscovery,
    stopDiscovery,
    requestPermissions,
    checkBleState
  };
  
  return (
    <DiscoveryContext.Provider value={value}>
      {children}
    </DiscoveryContext.Provider>
  );
};

// Hook for using discovery context
export const useDiscovery = (): DiscoveryContextType => {
  const context = useContext(DiscoveryContext);
  
  if (context === undefined) {
    throw new Error('useDiscovery must be used within a DiscoveryProvider');
  }
  
  return context;
};