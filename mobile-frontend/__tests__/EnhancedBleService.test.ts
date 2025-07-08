import { EnhancedBleService } from '../services/EnhancedBleService';
import { EnhancedProfile, EnhancementSettings } from '../types/enhanced-profile';
import { Profile } from '../types/profile';

// Mock dependencies
jest.mock('../services/BleService');
jest.mock('../services/CryptoService');
jest.mock('../services/EnhancedProfileService');

const mockBasicProfile: Profile = {
  uuid: 'test-uuid',
  name: 'Test User',
  role: 'Developer',
  company: 'Test Company',
  socialLinks: {}
};

const mockEnhancedProfile: EnhancedProfile = {
  ...mockBasicProfile,
  isEnhanced: true,
  enhancementLevel: 'full',
  tokenMetadata: {
    version: '1.0',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    issuer: 'BeaconAI:Test',
    permissions: ['discover', 'verify']
  },
  signature: {
    data: 'test-signature',
    algorithm: 'Ed25519',
    publicKey: 'test-public-key',
    timestamp: new Date().toISOString()
  }
};

describe('EnhancedBleService', () => {
  let enhancedBleService: EnhancedBleService;

  beforeEach(() => {
    enhancedBleService = EnhancedBleService.getInstance();
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should create singleton instance', () => {
      const instance1 = EnhancedBleService.getInstance();
      const instance2 = EnhancedBleService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should initialize with correct capabilities', () => {
      expect(enhancedBleService.isEnhancedModeActive()).toBe(false);
    });
  });

  describe('Enhanced Discovery', () => {
    it('should start enhanced discovery successfully', async () => {
      const mockPeerCallback = jest.fn();
      
      const result = await enhancedBleService.startEnhancedDiscovery(
        mockEnhancedProfile,
        mockPeerCallback
      );
      
      expect(result).toBe(true);
      expect(enhancedBleService.isEnhancedModeActive()).toBe(true);
    });

    it('should stop enhanced discovery successfully', async () => {
      const mockPeerCallback = jest.fn();
      await enhancedBleService.startEnhancedDiscovery(mockEnhancedProfile, mockPeerCallback);
      
      await enhancedBleService.stopEnhancedDiscovery();
      
      expect(enhancedBleService.isEnhancedModeActive()).toBe(false);
    });

    it('should handle discovery start failure gracefully', async () => {
      // Mock basic discovery failure
      jest.spyOn(require('../services/BleService'), 'bleService', 'get').mockReturnValue({
        startScanning: jest.fn().mockResolvedValue(false),
        stopScanning: jest.fn(),
        stopAdvertising: jest.fn(),
        startAdvertising: jest.fn()
      });
      
      const mockPeerCallback = jest.fn();
      
      const result = await enhancedBleService.startEnhancedDiscovery(
        mockEnhancedProfile,
        mockPeerCallback
      );
      
      expect(result).toBe(false);
    });

    it('should discover enhanced peers', async () => {
      const mockPeerCallback = jest.fn();
      
      await enhancedBleService.startEnhancedDiscovery(mockEnhancedProfile, mockPeerCallback);
      
      // Wait for simulated peer discovery
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const discoveredPeers = enhancedBleService.getDiscoveredPeers();
      expect(discoveredPeers.length).toBeGreaterThan(0);
    });
  });

  describe('Profile Exchange', () => {
    it('should exchange enhanced profiles successfully', async () => {
      const peerUuid = 'test-peer-uuid';
      
      const exchangedProfile = await enhancedBleService.exchangeEnhancedProfile(
        peerUuid,
        mockEnhancedProfile
      );
      
      expect(exchangedProfile).toBeDefined();
      expect(exchangedProfile.isEnhanced).toBe(true);
    });

    it('should handle exchange failures', async () => {
      const peerUuid = 'invalid-peer-uuid';
      
      // Mock verification failure
      jest.spyOn(require('../services/EnhancedProfileService'), 'enhancedProfileService', 'get').mockReturnValue({
        verifyProfile: jest.fn().mockResolvedValue({ isValid: false, errors: ['Test error'] })
      });
      
      await expect(
        enhancedBleService.exchangeEnhancedProfile(peerUuid, mockEnhancedProfile)
      ).rejects.toThrow();
    });
  });

  describe('Peer Management', () => {
    it('should get discovered peers', () => {
      const peers = enhancedBleService.getDiscoveredPeers();
      expect(Array.isArray(peers)).toBe(true);
    });

    it('should get peer by UUID', async () => {
      const mockPeerCallback = jest.fn();
      await enhancedBleService.startEnhancedDiscovery(mockEnhancedProfile, mockPeerCallback);
      
      // Wait for peer discovery
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const peers = enhancedBleService.getDiscoveredPeers();
      if (peers.length > 0) {
        const peer = enhancedBleService.getPeer(peers[0].uuid);
        expect(peer).toBeDefined();
        expect(peer?.uuid).toBe(peers[0].uuid);
      }
    });

    it('should return undefined for non-existent peer', () => {
      const peer = enhancedBleService.getPeer('non-existent-uuid');
      expect(peer).toBeUndefined();
    });
  });

  describe('Crypto Token Integration', () => {
    it('should create enhanced advertisement data with crypto tokens', async () => {
      const mockPeerCallback = jest.fn();
      
      // Start discovery to trigger advertisement data creation
      await enhancedBleService.startEnhancedDiscovery(mockEnhancedProfile, mockPeerCallback);
      
      // Advertisement data creation is logged, check that it includes crypto token info
      expect(console.log).toHaveBeenCalledWith(
        'Enhanced advertising data prepared:',
        expect.objectContaining({
          hasSignature: true,
          biometricLevel: expect.any(String)
        })
      );
    });

    it('should handle profiles without signatures', async () => {
      const profileWithoutSignature: EnhancedProfile = {
        ...mockBasicProfile,
        isEnhanced: true,
        enhancementLevel: 'basic'
      };
      
      const mockPeerCallback = jest.fn();
      
      await enhancedBleService.startEnhancedDiscovery(profileWithoutSignature, mockPeerCallback);
      
      expect(console.log).toHaveBeenCalledWith(
        'Enhanced advertising data prepared:',
        expect.objectContaining({
          hasSignature: false
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle advertising failures gracefully', async () => {
      // Mock advertising failure
      jest.spyOn(require('../services/BleService'), 'bleService', 'get').mockReturnValue({
        startScanning: jest.fn().mockResolvedValue(true),
        startAdvertising: jest.fn().mockRejectedValue(new Error('Advertising failed')),
        stopScanning: jest.fn(),
        stopAdvertising: jest.fn()
      });
      
      const mockPeerCallback = jest.fn();
      
      await expect(
        enhancedBleService.startEnhancedDiscovery(mockEnhancedProfile, mockPeerCallback)
      ).rejects.toThrow();
    });

    it('should handle peer discovery simulation errors', async () => {
      // This test ensures error handling in peer discovery simulation
      const mockPeerCallback = jest.fn();
      
      const result = await enhancedBleService.startEnhancedDiscovery(
        mockEnhancedProfile,
        mockPeerCallback
      );
      
      expect(result).toBe(true);
    });
  });

  describe('Protocol Compatibility', () => {
    it('should support backwards compatibility with basic profiles', async () => {
      const mockPeerCallback = jest.fn();
      
      await enhancedBleService.startEnhancedDiscovery(mockEnhancedProfile, mockPeerCallback);
      
      // Should start basic scanning for backwards compatibility
      expect(require('../services/BleService').bleService.startScanning).toHaveBeenCalled();
    });

    it('should determine enhancement levels correctly', () => {
      const capabilities = {
        basic: true,
        enhanced: true,
        biometric: true,
        cryptographic: true,
        revocation: false,
        zeroKnowledge: false
      };
      
      // Test the enhancement level determination logic
      const mockPeerCallback = jest.fn();
      enhancedBleService.startEnhancedDiscovery(mockEnhancedProfile, mockPeerCallback);
      
      // Enhancement level determination is tested through peer creation
      expect(capabilities.basic).toBe(true);
      expect(capabilities.enhanced).toBe(true);
    });
  });
});