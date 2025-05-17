/**
 * BLE Service Implementation
 * Follows BeaconAI ruleset for battery optimization and privacy
 */
import { Platform } from 'react-native';
import { BleManager, State as BleState, ScanMode } from 'react-native-ble-plx';
import { PermissionsAndroid } from 'react-native';
import { Profile, PeerProfile } from '../types/profile';
import { BleState as BleServiceState, BlePermissionStatus } from '../types/ble';

// UUID constants for BLE operations
const BEACON_SERVICE_UUID = '00000000-0000-1000-8000-00805F9B34FB';
const BEACON_CHARACTERISTIC_UUID = '00000000-0000-1000-8000-00805F9B34FB';

// Convert BLE library state to our app's state enum
const mapBleStateToServiceState = (state: BleState): BleServiceState => {
  switch (state) {
    case BleState.PoweredOn:
      return BleServiceState.POWERED_ON;
    case BleState.PoweredOff:
      return BleServiceState.POWERED_OFF;
    case BleState.Resetting:
    case BleState.Unsupported:
    case BleState.Unauthorized:
      return BleServiceState.UNAUTHORIZED;
    default:
      return BleServiceState.UNKNOWN;
  }
};

// Helper function for logging
const log = (message: string) => {
  console.log(`[BLE] ${message}`);
};

// Default BLE configuration
const DEFAULT_BLE_CONFIG = {
  expirationTimeMs: 300000, // 5 minutes
  scanIntervalMs: 10000,    // 10 seconds
  scanDurationMs: 5000,     // 5 seconds
  advertisingIntervalMs: 1000 // 1 second
};

/**
 * Interface for BLE service
 */
export interface IBleService {
  initialize(): Promise<boolean>;
  getState(): Promise<BleServiceState>;
  checkPermissions(): Promise<BlePermissionStatus>;
  requestPermissions(): Promise<BlePermissionStatus>;
  startAdvertising(profile: Profile): Promise<boolean>;
  stopAdvertising(): Promise<void>;
  startScanning(onDiscovery: (peer: PeerProfile) => void): Promise<boolean>;
  stopScanning(): Promise<void>;
  setTestMode(enabled: boolean): void;
  getBleConfig(): typeof DEFAULT_BLE_CONFIG;
}

/**
 * BLE Service implementation
 * Handles Bluetooth operations for peer discovery
 */
class BleServiceImpl implements IBleService {
  private bleManager: BleManager;
  private bleState: BleServiceState = BleServiceState.UNKNOWN;
  private permissionStatus: BlePermissionStatus = BlePermissionStatus.UNKNOWN;
  private advertisingTimer: NodeJS.Timeout | null = null;
  private scanningTimer: NodeJS.Timeout | null = null;
  private isScanning: boolean = false;
  private testMode: boolean = false;
  private config = { ...DEFAULT_BLE_CONFIG };

  constructor() {
    this.bleManager = new BleManager();
  }

  /**
   * Initialize the BLE service
   */
  async initialize(): Promise<boolean> {
    // In test mode, skip actual BLE initialization
    if (this.testMode) {
      this.bleState = BleServiceState.POWERED_ON;
      this.permissionStatus = BlePermissionStatus.GRANTED;
      return true;
    }

    try {
      // Subscribe to BLE state changes
      this.bleManager.onStateChange((state) => {
        log(`BLE state changed: ${state}`);
        this.bleState = mapBleStateToServiceState(state);
      }, true);

      // Get initial BLE state
      const state = await this.bleManager.state();
      this.bleState = mapBleStateToServiceState(state);

      // Check initial permissions
      this.permissionStatus = await this.checkPermissions();

      return true;
    } catch (error) {
      log(`BLE initialization error: ${error}`);
      return false;
    }
  }

  /**
   * Get current BLE state
   */
  async getState(): Promise<BleServiceState> {
    if (this.testMode) {
      return BleServiceState.POWERED_ON;
    }
    
    try {
      const state = await this.bleManager.state();
      this.bleState = mapBleStateToServiceState(state);
      return this.bleState;
    } catch (error) {
      log(`Error getting BLE state: ${error}`);
      return BleServiceState.UNKNOWN;
    }
  }

  /**
   * Check BLE permissions
   */
  async checkPermissions(): Promise<BlePermissionStatus> {
    if (this.testMode) {
      return BlePermissionStatus.GRANTED;
    }
    
    try {
      if (Platform.OS === 'ios') {
        // iOS permissions are checked at runtime
        return BlePermissionStatus.GRANTED;
      } else if (Platform.OS === 'android') {
        if (Platform.Version >= 31) { // Android 12+
          const results = await Promise.all([
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN),
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT),
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION),
          ]);
          
          if (results.every(result => result)) {
            return BlePermissionStatus.GRANTED;
          } else {
            return BlePermissionStatus.DENIED;
          }
        } else {
          const result = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          return result ? BlePermissionStatus.GRANTED : BlePermissionStatus.DENIED;
        }
      }
      
      return BlePermissionStatus.UNKNOWN;
    } catch (error) {
      log(`Error checking permissions: ${error}`);
      return BlePermissionStatus.UNKNOWN;
    }
  }

  /**
   * Request BLE permissions
   */
  async requestPermissions(): Promise<BlePermissionStatus> {
    if (this.testMode) {
      return BlePermissionStatus.GRANTED;
    }
    
    try {
      if (Platform.OS === 'ios') {
        // iOS permissions are requested at runtime by the OS
        return BlePermissionStatus.GRANTED;
      } else if (Platform.OS === 'android') {
        if (Platform.Version >= 31) { // Android 12+
          const results = await Promise.all([
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN),
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT),
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION),
          ]);
          
          if (results.every(result => result === PermissionsAndroid.RESULTS.GRANTED)) {
            this.permissionStatus = BlePermissionStatus.GRANTED;
          } else {
            this.permissionStatus = BlePermissionStatus.DENIED;
          }
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: "Location Permission",
              message: "Bluetooth requires location permission to discover nearby devices.",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK"
            }
          );
          
          this.permissionStatus = granted === PermissionsAndroid.RESULTS.GRANTED
            ? BlePermissionStatus.GRANTED
            : BlePermissionStatus.DENIED;
        }
        
        return this.permissionStatus;
      }
      
      return BlePermissionStatus.UNKNOWN;
    } catch (error) {
      log(`Error requesting permissions: ${error}`);
      return BlePermissionStatus.UNKNOWN;
    }
  }

  /**
   * Start advertising the user's profile
   */
  async startAdvertising(profile: Profile): Promise<boolean> {
    if (this.advertisingTimer) {
      clearInterval(this.advertisingTimer);
      this.advertisingTimer = null;
    }
    
    try {
      const advertisementData = this.encodeProfileForAdvertisement(profile);
      
      if (this.testMode) {
        this.log(`Started advertising with data: ${JSON.stringify(advertisementData)}`);
        
        // Simulate periodic advertising in test mode
        this.advertisingTimer = setInterval(() => {
          this.log(`Advertising pulse at: ${new Date().toISOString()}`);
        }, this.config.advertisingIntervalMs);
        
        return true;
      }
      
      // Real BLE implementation would use:
      // this.bleManager.startAdvertising(advertisementData)
      
      // For now in our implementation, we'll simulate advertising
      this.log(`Started advertising with data: ${JSON.stringify(advertisementData)}`);
      
      this.advertisingTimer = setInterval(() => {
        this.log(`Advertising pulse at: ${new Date().toISOString()}`);
      }, this.config.advertisingIntervalMs);
      
      return true;
    } catch (error) {
      log(`Error starting advertising: ${error}`);
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
      this.log('Stopped advertising');
    }
    
    if (!this.testMode) {
      // Actual BLE implementation would use:
      // await this.bleManager.stopAdvertising();
    }
  }

  /**
   * Start scanning for peers
   */
  async startScanning(onDiscovery: (peer: PeerProfile) => void): Promise<boolean> {
    if (this.isScanning) {
      return true;
    }
    
    try {
      // Check state and permissions before scanning
      const state = await this.getState();
      const permissions = await this.checkPermissions();
      
      if (state !== BleServiceState.POWERED_ON) {
        log(`Cannot scan: BLE not powered on (state: ${state})`);
        return false;
      }
      
      if (permissions !== BlePermissionStatus.GRANTED) {
        log(`Cannot scan: Permissions not granted (status: ${permissions})`);
        return false;
      }
      
      if (this.testMode) {
        this.isScanning = true;
        log('Starting scan cycle (test mode)');
        
        // In test mode, simulate finding peers
        setTimeout(() => {
          const mockPeer: PeerProfile = {
            uuid: 'test-device-id',
            name: 'Test Device',
            role: 'Developer',
            company: 'Test Co',
            rssi: -60,
            discoveredAt: new Date().toISOString()
          };
          
          onDiscovery(mockPeer);
        }, 1000);
        
        return true;
      }
      
      // Set up scan/pause cycle for battery optimization
      const startScanCycle = () => {
        if (!this.isScanning) return;
        
        log('Starting scan cycle');
        
        // Configure scan mode based on platform
        let scanMode;
        if (Platform.OS === 'android') {
          scanMode = ScanMode.LowLatency;
        }
        
        // Start the scan
        this.bleManager.startDeviceScan(
          [BEACON_SERVICE_UUID],
          { scanMode },
          (error, device) => {
            if (error) {
              log(`Scan error: ${error}`);
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
        
        // Stop scanning after duration to save battery
        setTimeout(() => {
          if (this.isScanning) {
            this.bleManager.stopDeviceScan();
            log('Pausing scan cycle to save battery');
            
            // Resume scanning after pause
            setTimeout(startScanCycle, 
              this.config.scanIntervalMs - this.config.scanDurationMs);
          }
        }, this.config.scanDurationMs);
      };
      
      this.isScanning = true;
      startScanCycle();
      return true;
    } catch (error) {
      log(`Error starting scanning: ${error}`);
      return false;
    }
  }

  /**
   * Stop scanning for peers
   */
  async stopScanning(): Promise<void> {
    this.isScanning = false;
    
    if (!this.testMode) {
      this.bleManager.stopDeviceScan();
    }
    
    this.log('BLE scanning stopped');
  }

  /**
   * Enable/disable test mode
   */
  setTestMode(enabled: boolean): void {
    this.testMode = enabled;
    log(`Test mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get BLE configuration
   */
  getBleConfig(): typeof DEFAULT_BLE_CONFIG {
    return this.config;
  }

  /**
   * Log BLE events (private method)
   */
  private log(message: string): void {
    log(message);
  }

  /**
   * Encode profile for BLE advertisement
   */
  private encodeProfileForAdvertisement(profile: Profile): any {
    // In a real implementation, we would compress the profile data
    // to fit within the BLE advertisement size constraints (31 bytes)
    return {
      uuid: profile.uuid,
      name: profile.name,
      isDiscoverable: true
    };
  }

  /**
   * Decode peer profile from BLE device
   */
  private decodePeerProfile(device: any): PeerProfile | null {
    try {
      // In a real implementation, this would decode the compressed BLE data
      // For now, we'll just create a mock profile based on the device ID
      return {
        uuid: device.id,
        name: device.name || 'Unknown Device',
        role: 'Unknown',
        company: 'Unknown',
        rssi: device.rssi,
        discoveredAt: new Date().toISOString()
      };
    } catch (error) {
      log(`Error decoding peer profile: ${error}`);
      return null;
    }
  }
}

// Export a singleton instance
const BleService = new BleServiceImpl();
export default BleService;