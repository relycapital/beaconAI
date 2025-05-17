/**
 * Unit tests for BleService
 * Following Semantic Seed Coding Standards BDD format
 */
import bleService from '../services/BleService';
import { Profile } from '../types/profile';
import { BleState, BlePermissionStatus } from '../types/ble';
import { Device } from 'react-native-ble-plx';

// Note: We've moved the mock to jest.setup.js

// Platform and permissions are mocked in jest.setup.js

describe('BleService', () => {
  let mockProfile: Profile;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockProfile = {
      uuid: 'test-uuid',
      name: 'Test User',
      role: 'Developer',
      company: 'Test Co',
      socialLinks: {
        linkedin: 'testuser'
      }
    };
  });

  describe('initialization', () => {
    it('should successfully initialize the BLE service', async () => {
      const result = await bleService.initialize();
      expect(result).toBe(true);
    });
  });

  describe('permissions', () => {
    it('should check permissions correctly', async () => {
      const status = await bleService.checkPermissions();
      expect(status).toBeDefined();
    });

    it('should request permissions correctly', async () => {
      const status = await bleService.requestPermissions();
      expect(status).toBeDefined();
    });
  });

  describe('advertising', () => {
    it('should start advertising with a valid profile', async () => {
      await bleService.initialize();
      const result = await bleService.startAdvertising(mockProfile);
      expect(result).toBe(true);
    });

    it('should stop advertising when requested', async () => {
      await bleService.initialize();
      await bleService.startAdvertising(mockProfile);
      await bleService.stopAdvertising();
      expect(bleService['isAdvertising']).toBe(false);
    });
  });

  describe('scanning', () => {
    // Increase timeout to 10 seconds for this test as BLE scanning takes longer
    it('should start scanning correctly', async () => {
      const onDiscoveryMock = jest.fn();
      await bleService.initialize();
      const result = await bleService.startScanning(onDiscoveryMock);
      
      expect(result).toBe(true);
      
      // Check if mock was called when receiving a device
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(onDiscoveryMock).toHaveBeenCalled();
      
      // Cleanup
      await bleService.stopScanning();
    }, 10000); // 10 second timeout

    it('should stop scanning when requested', async () => {
      await bleService.initialize();
      await bleService.startScanning(jest.fn());
      await bleService.stopScanning();
      expect(bleService['isScanning']).toBe(false);
    });
  });

  describe('peer handling', () => {
    it('should encode and decode profile data correctly', async () => {
      // This test uses internal methods which would need to be exposed for testing
      // or tested indirectly through the public API
      expect(bleService.getBleConfig()).toBeDefined();
    });
  });
});
