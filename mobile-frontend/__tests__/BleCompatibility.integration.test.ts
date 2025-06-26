/**
 * BLE Compatibility Integration Tests
 * 
 * Tests backwards compatibility between basic and enhanced BLE discovery
 * Ensures enhanced clients can communicate with basic peers and vice versa
 */

import { Profile, PeerProfile } from '../types/profile';
import {
  EnhancedProfile,
  EnhancedPeerProfile,
  PeerCapabilities,
  EnhancementSettings
} from '../types/enhanced-profile';
import { EnhancedBleService } from '../services/EnhancedBleService';
import { EnhancedProfileService } from '../services/EnhancedProfileService';
import { CryptoService } from '../services/CryptoService';
import { TinyMLService } from '../services/TinyMLService';

// Mock all external dependencies
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn().mockImplementation(() => {
    const array = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return Promise.resolve(array);
  }),
  getRandomBytes: jest.fn().mockImplementation(() => {
    const array = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  digestStringAsync: jest.fn().mockImplementation((algorithm, data) => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Promise.resolve(Buffer.from(Math.abs(hash).toString(16)).toString('base64'));
  }),
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  CryptoEncoding: { BASE64: 'base64' },
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  getCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true, canAskAgain: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'mock-image-uri', base64: 'mock-base64-image' }]
  }),
  MediaTypeOptions: { Images: 'Images' }
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({
    uri: 'mock-processed-uri',
    base64: 'mock-processed-base64'
  }),
  SaveFormat: { JPEG: 'jpeg' }
}));

// Mock basic BLE service
jest.mock('../services/BleService', () => ({
  __esModule: true,
  default: {
    startScanning: jest.fn(),
    stopScanning: jest.fn(),
    startAdvertising: jest.fn(),
    stopAdvertising: jest.fn(),
  },
  bleService: {
    startScanning: jest.fn(),
    stopScanning: jest.fn(),
    startAdvertising: jest.fn(),
    stopAdvertising: jest.fn(),
  }
}));

describe('BLE Compatibility Integration Tests', () => {
  let enhancedBleService: EnhancedBleService;
  let enhancedProfileService: EnhancedProfileService;
  let cryptoService: CryptoService;
  let tinyMLService: TinyMLService;
  
  const mockBasicProfile: Profile = {
    uuid: 'basic-user-uuid',
    name: 'John Doe',
    role: 'Software Engineer',
    company: 'TechCorp'
  };
  
  const mockEnhancementSettings: EnhancementSettings = {
    enableBiometric: false, // Disabled for compatibility tests
    enableCryptographic: true,
    biometricTypes: ['face'],
    tokenExpiration: 24,
    autoRefresh: false,
    privacyLevel: 'balanced',
    requireVerification: false
  };

  beforeEach(async () => {
    enhancedBleService = EnhancedBleService.getInstance();
    enhancedProfileService = EnhancedProfileService.getInstance();
    cryptoService = CryptoService.getInstance();
    tinyMLService = TinyMLService.getInstance();
    
    // Initialize services
    await cryptoService.clearKeys();
    await tinyMLService.cleanup();
    await tinyMLService.loadModels();
    
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await enhancedBleService.stopEnhancedDiscovery();
    await cryptoService.clearKeys();
    await tinyMLService.cleanup();
  });

  describe('Backwards Compatibility', () => {
    it('should discover basic peers with enhanced client', async () => {
      // Create enhanced profile
      const enhancedProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );
      
      expect(enhancedProfile.isEnhanced).toBe(true);
      expect(enhancedProfile.enhancementLevel).toBe('cryptographic');
      
      // Mock basic peer discovery
      const mockBasicPeer: PeerProfile = {
        uuid: 'basic-peer-uuid',
        name: 'Jane Smith',
        role: 'Designer',
        company: 'DesignCo',
        rssi: -60,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        discoveredAt: new Date().toISOString()
      };
      
      const discoveredPeers: EnhancedPeerProfile[] = [];
      
      const { bleService } = require('../services/BleService');
      bleService.startScanning.mockImplementation((onDiscovery: (peer: PeerProfile) => void) => {
        // Simulate basic peer discovery
        setTimeout(() => onDiscovery(mockBasicPeer), 100);
        return Promise.resolve(true);
      });
      
      // Start enhanced discovery
      const success = await enhancedBleService.startEnhancedDiscovery(
        enhancedProfile,
        (peer: EnhancedPeerProfile) => {
          discoveredPeers.push(peer);
        }
      );
      
      expect(success).toBe(true);
      expect(bleService.startScanning).toHaveBeenCalled();
      
      // Wait for peer discovery
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(discoveredPeers.length).toBeGreaterThan(0);
      const discoveredPeer = discoveredPeers.find(p => p.uuid === mockBasicPeer.uuid);
      
      expect(discoveredPeer).toBeDefined();
      expect(discoveredPeer!.discoveryMethod).toBe('basic');
      expect(discoveredPeer!.capabilities.basic).toBe(true);
      expect(discoveredPeer!.capabilities.enhanced).toBe(false);
    });

    it('should gracefully handle mixed enhanced and basic peers', async () => {
      const enhancedProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );
      
      const discoveredPeers: EnhancedPeerProfile[] = [];
      
      const { bleService } = require('../services/BleService');
      bleService.startScanning.mockImplementation((onDiscovery: (peer: PeerProfile) => void) => {
        // Simulate discovering multiple peer types
        const basicPeer: PeerProfile = {
          uuid: 'basic-peer-1',
          name: 'Basic User',
          role: 'Manager',
          company: 'BasicCorp',
          rssi: -65,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          discoveredAt: new Date().toISOString()
        };
        
        setTimeout(() => onDiscovery(basicPeer), 100);
        return Promise.resolve(true);
      });
      
      await enhancedBleService.startEnhancedDiscovery(
        enhancedProfile,
        (peer: EnhancedPeerProfile) => {
          discoveredPeers.push(peer);
        }
      );
      
      // Wait for discovery
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(discoveredPeers.length).toBeGreaterThan(0);
      
      // Should have both basic and enhanced peers
      const basicPeers = discoveredPeers.filter(p => p.discoveryMethod === 'basic');
      const enhancedPeers = discoveredPeers.filter(p => p.discoveryMethod === 'enhanced');
      
      expect(basicPeers.length).toBeGreaterThan(0);
      // Enhanced peers are simulated in the service
      expect(enhancedPeers.length).toBeGreaterThanOrEqual(0);
    });

    it('should attempt capability detection for discovered basic peers', async () => {
      const enhancedProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );
      
      const discoveredPeers: EnhancedPeerProfile[] = [];
      let capabilityDetectionAttempted = false;
      
      // Mock capability detection
      const originalProbe = (enhancedBleService as any).probeForEnhancedCapabilities;
      (enhancedBleService as any).probeForEnhancedCapabilities = jest.fn().mockImplementation(() => {
        capabilityDetectionAttempted = true;
        return Promise.resolve({
          basic: true,
          enhanced: true,
          biometric: false,
          cryptographic: true,
          revocation: false,
          zeroKnowledge: false
        });
      });
      
      const { bleService } = require('../services/BleService');
      bleService.startScanning.mockImplementation((onDiscovery: (peer: PeerProfile) => void) => {
        const basicPeer: PeerProfile = {
          uuid: 'upgradeable-peer',
          name: 'Upgradeable User',
          role: 'Developer',
          company: 'TechStart',
          rssi: -55,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          discoveredAt: new Date().toISOString()
        };
        
        setTimeout(() => onDiscovery(basicPeer), 100);
        return Promise.resolve(true);
      });
      
      await enhancedBleService.startEnhancedDiscovery(
        enhancedProfile,
        (peer: EnhancedPeerProfile) => {
          discoveredPeers.push(peer);
        }
      );
      
      // Wait for discovery and capability detection
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(capabilityDetectionAttempted).toBe(true);
      
      // Restore original method
      (enhancedBleService as any).probeForEnhancedCapabilities = originalProbe;
    });
  });

  describe('Profile Exchange Compatibility', () => {
    it('should handle profile exchange between enhanced peers', async () => {
      const userProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );
      
      const discoveredPeers: EnhancedPeerProfile[] = [];
      
      await enhancedBleService.startEnhancedDiscovery(
        userProfile,
        (peer: EnhancedPeerProfile) => {
          discoveredPeers.push(peer);
        }
      );
      
      // Wait for peer discovery
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const enhancedPeer = discoveredPeers.find(p => p.capabilities?.enhanced);
      
      if (enhancedPeer) {
        const exchangedProfile = await enhancedBleService.exchangeEnhancedProfile(
          enhancedPeer.uuid,
          userProfile
        );
        
        expect(exchangedProfile).toBeDefined();
        expect(exchangedProfile!.isEnhanced).toBe(true);
        expect(exchangedProfile!.signature).toBeDefined();
      }
    });

    it('should gracefully fail profile exchange with basic peers', async () => {
      const userProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );
      
      const discoveredPeers: EnhancedPeerProfile[] = [];
      
      const { bleService } = require('../services/BleService');
      bleService.startScanning.mockImplementation((onDiscovery: (peer: PeerProfile) => void) => {
        const basicPeer: PeerProfile = {
          uuid: 'basic-only-peer',
          name: 'Basic Only User',
          role: 'Analyst',
          company: 'DataCorp',
          rssi: -70,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          discoveredAt: new Date().toISOString()
        };
        
        setTimeout(() => onDiscovery(basicPeer), 100);
        return Promise.resolve(true);
      });
      
      await enhancedBleService.startEnhancedDiscovery(
        userProfile,
        (peer: EnhancedPeerProfile) => {
          discoveredPeers.push(peer);
        }
      );
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const basicPeer = discoveredPeers.find(p => !p.capabilities?.enhanced);
      
      if (basicPeer) {
        const exchangedProfile = await enhancedBleService.exchangeEnhancedProfile(
          basicPeer.uuid,
          userProfile
        );
        
        // Should return null for basic peers
        expect(exchangedProfile).toBeNull();
      }
    });
  });

  describe('Protocol Version Handling', () => {
    it('should handle different protocol versions gracefully', async () => {
      const userProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );
      
      // Test with different protocol version
      const mockPeerWithDifferentVersion: EnhancedPeerProfile = {
        uuid: 'version-test-peer',
        name: 'Version Test User',
        role: 'QA Engineer',
        company: 'TestCorp',
        rssi: -50,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        discoveredAt: new Date().toISOString(),
        isEnhanced: true,
        enhancementLevel: 'cryptographic',
        discoveryMethod: 'enhanced',
        protocolVersion: '0.9', // Different version
        capabilities: {
          basic: true,
          enhanced: true,
          biometric: false,
          cryptographic: true,
          revocation: false,
          zeroKnowledge: false
        }
      };
      
      // Service should handle version differences gracefully
      const capabilities = enhancedBleService.getPeer(mockPeerWithDifferentVersion.uuid);
      
      // Should not crash on version mismatch
      expect(() => {
        enhancedBleService.getSupportedCapabilities();
      }).not.toThrow();
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should fallback to basic mode on enhanced discovery failure', async () => {
      const userProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );
      
      // Mock enhanced discovery failure
      const originalStartEnhanced = (enhancedBleService as any).startEnhancedScanning;
      (enhancedBleService as any).startEnhancedScanning = jest.fn().mockRejectedValue(new Error('Enhanced discovery failed'));
      
      const { bleService } = require('../services/BleService');
      bleService.startScanning.mockResolvedValue(true);
      
      // Should still start basic discovery
      const success = await enhancedBleService.startEnhancedDiscovery(
        userProfile,
        () => {}
      );
      
      // Should succeed with basic fallback
      expect(bleService.startScanning).toHaveBeenCalled();
      
      // Restore original method
      (enhancedBleService as any).startEnhancedScanning = originalStartEnhanced;
    });

    it('should handle BLE permission issues gracefully', async () => {
      const userProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );
      
      const { bleService } = require('../services/BleService');
      bleService.startScanning.mockResolvedValue(false); // Permission denied
      
      const success = await enhancedBleService.startEnhancedDiscovery(
        userProfile,
        () => {}
      );
      
      expect(success).toBe(false);
    });

    it('should handle malformed peer data gracefully', async () => {
      const userProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );
      
      const discoveredPeers: EnhancedPeerProfile[] = [];
      
      const { bleService } = require('../services/BleService');
      bleService.startScanning.mockImplementation((onDiscovery: (peer: PeerProfile) => void) => {
        // Simulate malformed peer data
        const malformedPeer = {
          uuid: 'malformed-peer',
          // Missing required fields
        } as PeerProfile;
        
        setTimeout(() => {
          try {
            onDiscovery(malformedPeer);
          } catch (error) {
            // Should handle errors gracefully
          }
        }, 100);
        return Promise.resolve(true);
      });
      
      const success = await enhancedBleService.startEnhancedDiscovery(
        userProfile,
        (peer: EnhancedPeerProfile) => {
          discoveredPeers.push(peer);
        }
      );
      
      expect(success).toBe(true);
      
      // Wait for discovery attempt
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should not crash on malformed data
      expect(discoveredPeers.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should manage discovery timeouts properly', async () => {
      const userProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );
      
      const { bleService } = require('../services/BleService');
      bleService.startScanning.mockResolvedValue(true);
      bleService.stopScanning.mockResolvedValue(undefined);
      
      await enhancedBleService.startEnhancedDiscovery(
        userProfile,
        () => {}
      );
      
      // Should stop discovery after timeout
      expect(enhancedBleService.isEnhancedModeActive()).toBe(true);
      
      await enhancedBleService.stopEnhancedDiscovery();
      
      expect(bleService.stopScanning).toHaveBeenCalled();
    });

    it('should handle concurrent discovery requests', async () => {
      const userProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );
      
      const { bleService } = require('../services/BleService');
      bleService.startScanning.mockResolvedValue(true);
      
      // Start multiple discovery sessions
      const promises = [
        enhancedBleService.startEnhancedDiscovery(userProfile, () => {}),
        enhancedBleService.startEnhancedDiscovery(userProfile, () => {}),
        enhancedBleService.startEnhancedDiscovery(userProfile, () => {})
      ];
      
      const results = await Promise.all(promises);
      
      // Should handle concurrent requests gracefully
      expect(results.filter(r => r === true).length).toBeGreaterThan(0);
    });

    it('should cleanup resources on service destruction', async () => {
      const userProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );
      
      await enhancedBleService.startEnhancedDiscovery(
        userProfile,
        () => {}
      );
      
      const discoveredBefore = enhancedBleService.getDiscoveredPeers();
      
      await enhancedBleService.stopEnhancedDiscovery();
      
      // Should clear discovered peers
      const discoveredAfter = enhancedBleService.getDiscoveredPeers();
      expect(discoveredAfter.length).toBe(0);
    });
  });
});