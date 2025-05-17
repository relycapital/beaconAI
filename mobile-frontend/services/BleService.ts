/**
 * BLE Service Implementation
 * Implements functionality for Bluetooth Low Energy operations
 * Following BeaconAI project ruleset for BLE implementation
 */
import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import { Profile, PeerProfile } from '../types/profile';
import { BleState, BlePermissionStatus } from '../types/ble';

// Constants for BLE operations
export const BEACON_SERVICE_UUID = '00000000-0000-1000-8000-00805F9B34FB';
export const MANUFACTURER_ID = 0xFF; // Custom manufacturer ID

/**
 * BLE configuration interface
 */
interface BleConfig {
  expirationTimeMs: number;   // Time after which peers are considered expired
  scanIntervalMs: number;     // Interval between scans
  scanDurationMs: number;     // Duration of each scan
  advertisingIntervalMs: number; // Interval between advertisements
}

/**
 * BLE Service Implementation
 * Follows singleton pattern for global access
 */
class BleServiceImpl {
  private bleManager: BleManager;
  private isInitialized: boolean = false;
  private scanningTimer: NodeJS.Timeout | null = null;
  private advertisingTimer: NodeJS.Timeout | null = null;
  private isTestMode: boolean = false;
  
  /**
   * Default configuration with battery optimization
   * Following BeaconAI BLE Implementation guidelines
   */
  private config: BleConfig = {
    expirationTimeMs: 5 * 60 * 1000, // 5 minutes
    scanIntervalMs: 30 * 1000,       // 30 seconds
    scanDurationMs: 5 * 1000,        // 5 seconds
    advertisingIntervalMs: 1000       // 1 second
  };
  
  constructor() {
    this.bleManager = new BleManager();
  }
  
  /**
   * Initialize BLE service
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      if (this.isTestMode) {
        // In test mode, skip actual BLE initialization
        this.isInitialized = true;
        return true;
      }
      
      // Subscribe to BLE state changes
      this.bleManager.onStateChange((state) => {
        console.log('BLE state changed:', state);
      }, true);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize BLE service:', error);
      return false;
    }
  }
  
  /**
   * Set test mode (for unit testing)
   */
  setTestMode(isTestMode: boolean): void {
    this.isTestMode = isTestMode;
  }
  
  /**
   * Get current BLE state
   */
  async getState(): Promise<BleState> {
    if (this.isTestMode) {
      return BleState.POWERED_ON;
    }
    
    try {
      const state = await this.bleManager.state();
      
      switch (state) {
        case 'PoweredOn':
          return BleState.POWERED_ON;
        case 'PoweredOff':
          return BleState.POWERED_OFF;
        case 'Unauthorized':
          return BleState.UNAUTHORIZED;
        default:
          return BleState.UNKNOWN;
      }
    } catch (error) {
      console.error('Failed to get BLE state:', error);
      return BleState.UNKNOWN;
    }
  }
  
  /**
   * Check BLE permissions
   */
  async checkPermissions(): Promise<BlePermissionStatus> {
    if (this.isTestMode) {
      return BlePermissionStatus.GRANTED;
    }
    
    try {
      if (Platform.OS === 'ios') {
        const state = await this.bleManager.state();
        if (state === 'Unauthorized') {
          return BlePermissionStatus.DENIED;
        }
        return BlePermissionStatus.GRANTED;
      } else if (Platform.OS === 'android') {
        const blePermissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ...(Platform.Version >= 31 
            ? [
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
              ] 
            : [])
        ];
        
        const results = await PermissionsAndroid.requestMultiple(blePermissions);
        
        // Check if all permissions are granted
        const allGranted = Object.values(results).every(
          result => result === PermissionsAndroid.RESULTS.GRANTED
        );
        
        return allGranted 
          ? BlePermissionStatus.GRANTED 
          : BlePermissionStatus.DENIED;
      }
      
      return BlePermissionStatus.UNKNOWN;
    } catch (error) {
      console.error('Failed to check BLE permissions:', error);
      return BlePermissionStatus.UNKNOWN;
    }
  }
  
  /**
   * Request BLE permissions
   */
  async requestPermissions(): Promise<BlePermissionStatus> {
    if (this.isTestMode) {
      return BlePermissionStatus.GRANTED;
    }
    
    try {
      if (Platform.OS === 'ios') {
        // iOS permission request is handled by the system
        // We just need to check the current status
        return await this.checkPermissions();
      } else if (Platform.OS === 'android') {
        const blePermissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ...(Platform.Version >= 31 
            ? [
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
              ] 
            : [])
        ];
        
        const results = await PermissionsAndroid.requestMultiple(blePermissions);
        
        // Check if all permissions are granted
        const allGranted = Object.values(results).every(
          result => result === PermissionsAndroid.RESULTS.GRANTED
        );
        
        return allGranted 
          ? BlePermissionStatus.GRANTED 
          : BlePermissionStatus.DENIED;
      }
      
      return BlePermissionStatus.UNKNOWN;
    } catch (error) {
      console.error('Failed to request BLE permissions:', error);
      return BlePermissionStatus.UNKNOWN;
    }
  }
  
  /**
   * Start advertising the user's profile
   * Battery optimization: Use periodic advertising with compact encoding
   */
  async startAdvertising(profile: Profile): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.isTestMode) {
      // In test mode, simulate advertising
      this.advertisingTimer = setInterval(() => {
        console.log('[TEST] Advertising pulse at:', new Date().toISOString());
      }, this.config.advertisingIntervalMs);
      return true;
    }
    
    try {
      // Prepare advertisement data with compact encoding
      const advertisementData = this.encodeProfileForAdvertisement(profile);
      
      // Start periodic advertising (simulated with a timer since react-native-ble-plx
      // doesn't support direct periodic advertising)
      this.advertisingTimer = setInterval(() => {
        console.log('Advertising pulse at:', new Date().toISOString());
        // Note: In a real implementation, we would refresh the advertisement here
        // This is a placeholder for real BLE advertising which would be device-specific
      }, this.config.advertisingIntervalMs);
      
      return true;
    } catch (error) {
      console.error('Failed to start BLE advertising:', error);
      return false;
    }
  }
  
  /**
   * Stop advertising
   */
  async stopAdvertising(): Promise<void> {
    if (this.advertisingTimer) {
      clearInterval(this.advertisingTimer);
      this.advertisingTimer = null;
    }
    
    // If not in test mode, additional cleanup may be needed here
    // depending on the specific advertising implementation
  }
  
  /**
   * Start scanning for nearby BLE devices
   * Battery optimization: Use interval scanning with low power mode
   */
  async startScanning(onDiscovery: (peer: PeerProfile) => void): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.isTestMode) {
      // In test mode, generate mock discoveries
      this.scanningTimer = setInterval(() => {
        const mockPeer: PeerProfile = {
          uuid: `mock-${Math.floor(Math.random() * 1000)}`,
          name: `Mock User ${Math.floor(Math.random() * 10)}`,
          role: 'Test User',
          company: 'Mock Co',
          rssi: -1 * (Math.floor(Math.random() * 50) + 40), // Random RSSI between -40 and -90
          discoveredAt: new Date().toISOString()
        };
        
        console.log('[TEST] Discovered mock peer:', mockPeer.name);
        onDiscovery(mockPeer);
      }, 2000); // Discover a mock peer every 2 seconds
      
      return true;
    }
    
    try {
      // Define scan mode based on battery optimization
      // BALANCED on iOS, LOW_POWER on Android
      const scanMode = Platform.OS === 'ios' ? 1 : 0;
      
      // Set up interval scanning for battery optimization
      const runScan = () => {
        // Start scanning
        console.log('Starting BLE scan at:', new Date().toISOString());
        this.bleManager.startDeviceScan(
          [BEACON_SERVICE_UUID],
          { scanMode },
          (error, device) => {
            if (error) {
              console.error('BLE scan error:', error);
              return;
            }
            
            if (device && device.manufacturerData) {
              const peerProfile = this.decodePeerProfile(device);
              if (peerProfile) {
                onDiscovery(peerProfile);
              }
            }
          }
        );
        
        // Stop scan after scanDurationMs to save battery
        setTimeout(() => {
          console.log('Stopping BLE scan at:', new Date().toISOString());
          this.bleManager.stopDeviceScan();
        }, this.config.scanDurationMs);
      };
      
      // Run scan immediately
      runScan();
      
      // Schedule periodic scans
      this.scanningTimer = setInterval(runScan, this.config.scanIntervalMs);
      
      return true;
    } catch (error) {
      console.error('Failed to start BLE scanning:', error);
      return false;
    }
  }
  
  /**
   * Stop scanning
   */
  async stopScanning(): Promise<void> {
    if (this.scanningTimer) {
      clearInterval(this.scanningTimer);
      this.scanningTimer = null;
    }
    
    if (!this.isTestMode) {
      this.bleManager.stopDeviceScan();
    }
  }
  
  /**
   * Encode profile data for BLE advertisement (max 31 bytes)
   * Follows compact encoding for BLE advertisements
   */
  private encodeProfileForAdvertisement(profile: Profile): Uint8Array {
    // In a real implementation, this would compress the profile data into a compact format
    // For simplicity, we're just creating a placeholder here
    // Max BLE advertisement data is 31 bytes, so we need to be very efficient
    
    // Example encoding strategy:
    // - 16 bytes for UUID (compressed)
    // - 10 bytes for name (truncated if needed)
    // - 1 byte for role code
    // - 4 bytes for company code
    
    // This is a placeholder implementation
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      id: profile.uuid.substring(0, 8), // Truncated for demo
      n: profile.name.substring(0, 10), // Truncated
      r: profile.role?.charAt(0) || '', // Just first letter
      c: profile.company?.substring(0, 4) || '' // First 4 letters
    }));
    
    return data;
  }
  
  /**
   * Decode peer profile from BLE advertisement data
   */
  private decodePeerProfile(device: any): PeerProfile | null {
    try {
      // In a real implementation, this would parse the compact encoded data
      // For simplicity in the demo, we're creating a mock peer from the device
      
      return {
        uuid: device.id,
        name: device.name || 'Unknown Device',
        role: 'Discovered Peer',
        company: 'Unknown',
        rssi: device.rssi || -70,
        discoveredAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error decoding peer profile:', error);
      return null;
    }
  }
  
  /**
   * Get the current BLE configuration
   */
  getBleConfig(): BleConfig {
    return { ...this.config };
  }
}

// Singleton instance
const BleService = new BleServiceImpl();
export default BleService;