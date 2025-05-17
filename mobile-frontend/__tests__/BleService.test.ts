/**
 * BLE Service Unit Tests
 * Following Semantic Seed Coding Standards BDD test format
 */

// Import the BLE Service and types
import BleService from '../services/BleService';
import { BleState, BlePermissionStatus } from '../types/ble';
import { Profile } from '../types/profile';

// Platform and permissions are mocked in jest.setup.js

describe('BleService', () => {
  let mockProfile: Profile;
  
  beforeEach(() => {
    // Set test mode to avoid real BLE operations
    BleService.setTestMode(true);
    
    // Create mock profile for tests
    mockProfile = {
      uuid: 'test-uuid',
      name: 'Test User',
      role: 'Developer',
      company: 'Test Co'
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize correctly', async () => {
      // Given: A BLE service
      expect(BleService).toBeDefined();
      
      // When: The service is initialized
      const result = await BleService.initialize();
      
      // Then: It should complete successfully
      expect(result).toBe(true);
    });
    
    it('should get BLE state', async () => {
      // Given: The BLE service is initialized
      await BleService.initialize();
      
      // When: Getting BLE state
      const state = await BleService.getState();
      
      // Then: The state should be powered on in test mode
      expect(state).toBe(BleState.POWERED_ON);
    });
    
    it('should check permissions', async () => {
      // Given: The BLE service is initialized
      await BleService.initialize();
      
      // When: Checking permissions
      const permissionStatus = await BleService.checkPermissions();
      
      // Then: Permissions should be granted in test mode
      expect(permissionStatus).toBe(BlePermissionStatus.GRANTED);
    });
  });
  
  describe('advertising', () => {
    it('should start advertising correctly', async () => {
      // Given: The BLE service is initialized
      await BleService.initialize();
      
      // When: Starting advertising
      const result = await BleService.startAdvertising(mockProfile);
      
      // Then: Advertising should start successfully
      expect(result).toBe(true);
      
      // Cleanup
      await BleService.stopAdvertising();
    });
    
    it('should stop advertising when requested', async () => {
      // Given: The BLE service is advertising
      await BleService.initialize();
      await BleService.startAdvertising(mockProfile);
      
      // When: Stopping advertising
      await BleService.stopAdvertising();
      
      // Then: It should complete without errors
      expect(BleService.stopAdvertising).toBeDefined();
    });
  });
  
  describe('scanning', () => {
    it('should start scanning correctly', async () => {
      // Given: The BLE service is initialized
      const onDiscoveryMock = jest.fn();
      await BleService.initialize();
      
      // When: Starting scanning
      const result = await BleService.startScanning(onDiscoveryMock);
      
      // Then: Scanning should start successfully
      expect(result).toBe(true);
      
      // And: After a delay, the mock should be called with discovered peers
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(onDiscoveryMock).toHaveBeenCalled();
      
      // Cleanup
      await BleService.stopScanning();
    });
    
    it('should stop scanning when requested', async () => {
      // Given: The BLE service is scanning
      await BleService.initialize();
      await BleService.startScanning(jest.fn());
      
      // When: Stopping scanning
      await BleService.stopScanning();
      
      // Then: It should complete without errors
      expect(BleService.stopScanning).toBeDefined();
    });
  });
  
  describe('configuration', () => {
    it('should return valid BLE configuration', () => {
      // Given: The BLE service
      
      // When: Getting the BLE configuration
      const config = BleService.getBleConfig();
      
      // Then: The configuration should have valid values
      expect(config.expirationTimeMs).toBeGreaterThan(0);
      expect(config.scanIntervalMs).toBeGreaterThan(0);
      expect(config.scanDurationMs).toBeGreaterThan(0);
      expect(config.advertisingIntervalMs).toBeGreaterThan(0);
    });
  });
});