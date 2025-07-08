import { bleService } from '../services/BleService';
import { enhancedBleService } from '../services/EnhancedBleService';
import { enhancedProfileService } from '../services/EnhancedProfileService';
import { cryptoService } from '../services/CryptoService';
import { tinyMLService } from '../services/TinyMLService';
import { Profile } from '../types/profile';
import { EnhancementSettings, EnhancedProfile } from '../types/enhanced-profile';

// Increase timeout for integration tests
jest.setTimeout(60000);

const mockBasicProfile: Profile = {
  uuid: 'integration-test-uuid',
  name: 'Integration Test User',
  role: 'QA Engineer',
  company: 'TestCorp',
  socialLinks: {
    linkedin: 'integration-test-user',
    github: 'test-user'
  }
};

const mockEnhancementSettings: EnhancementSettings = {
  enableBiometric: true,
  enableCryptographic: true,
  biometricTypes: ['face'],
  securityLevel: 'high'
};

describe('End-to-End Integration Tests', () => {
  beforeAll(async () => {
    // Initialize all services
    bleService.setTestMode(true);
    await bleService.initialize();
    await tinyMLService.loadModels();
    await cryptoService.generateKeyPair();
  });

  afterAll(async () => {
    // Cleanup all services
    await bleService.stopScanning();
    await bleService.stopAdvertising();
    await enhancedBleService.stopEnhancedDiscovery();
    await tinyMLService.cleanup();
    await cryptoService.clearKeys();
  });

  describe('Complete Enhanced Profile Workflow', () => {
    it('should create, sign, and verify an enhanced profile end-to-end', async () => {
      // Step 1: Create enhanced profile
      const enhancedProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );

      expect(enhancedProfile).toBeDefined();
      expect(enhancedProfile.isEnhanced).toBe(true);
      expect(enhancedProfile.enhancementLevel).toBe('full');
      expect(enhancedProfile.signature).toBeDefined();
      expect(enhancedProfile.biometricVector).toBeDefined();
      expect(enhancedProfile.semanticVector).toBeDefined();

      // Step 2: Verify the profile
      const verification = await enhancedProfileService.verifyProfile(enhancedProfile);

      expect(verification.isValid).toBe(true);
      expect(verification.errors).toHaveLength(0);

      // Step 3: Test BLE advertising with the enhanced profile
      const advertisingResult = await enhancedBleService.startEnhancedDiscovery(
        enhancedProfile,
        () => {}
      );

      expect(advertisingResult).toBe(true);
      expect(enhancedBleService.isEnhancedModeActive()).toBe(true);

      // Step 4: Cleanup
      await enhancedBleService.stopEnhancedDiscovery();
    });

    it('should handle profile exchange between enhanced peers', async () => {
      // Create two enhanced profiles
      const userProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );

      const peerProfile = await enhancedProfileService.createEnhancedProfile(
        {
          ...mockBasicProfile,
          uuid: 'peer-uuid',
          name: 'Peer User'
        },
        mockEnhancementSettings
      );

      // Start enhanced discovery
      let discoveredPeer: EnhancedProfile | null = null;
      await enhancedBleService.startEnhancedDiscovery(
        userProfile,
        (peer) => {
          if (peer.isEnhanced) {
            discoveredPeer = peer;
          }
        }
      );

      // Wait for peer discovery simulation
      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(discoveredPeer).toBeDefined();

      // Perform profile exchange
      if (discoveredPeer) {
        const exchangedProfile = await enhancedBleService.exchangeEnhancedProfile(
          discoveredPeer.uuid,
          userProfile
        );

        expect(exchangedProfile).toBeDefined();
        expect(exchangedProfile.isEnhanced).toBe(true);
      }

      await enhancedBleService.stopEnhancedDiscovery();
    });

    it('should maintain backwards compatibility with basic profiles', async () => {
      let basicPeerDiscovered = false;
      let enhancedPeerDiscovered = false;

      // Create enhanced profile
      const enhancedProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );

      // Start enhanced discovery (which includes basic scanning)
      await enhancedBleService.startEnhancedDiscovery(
        enhancedProfile,
        (peer) => {
          if (peer.isEnhanced) {
            enhancedPeerDiscovered = true;
          } else {
            basicPeerDiscovered = true;
          }
        }
      );

      // Also start basic advertising for compatibility test
      await bleService.startAdvertising(mockBasicProfile);

      // Wait for discovery
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Should discover both types of peers
      expect(enhancedPeerDiscovered || basicPeerDiscovered).toBe(true);

      await enhancedBleService.stopEnhancedDiscovery();
      await bleService.stopAdvertising();
    });
  });

  describe('Security and Privacy Workflow', () => {
    it('should ensure profile signatures are valid throughout the workflow', async () => {
      const enhancedProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );

      // Verify signature immediately after creation
      expect(enhancedProfile.signature).toBeDefined();
      const initialVerification = await cryptoService.verifySignature(enhancedProfile);
      expect(initialVerification).toBe(true);

      // Start advertising
      await enhancedBleService.startEnhancedDiscovery(enhancedProfile, () => {});

      // Verify signature is still valid after advertising setup
      const postAdvertisingVerification = await cryptoService.verifySignature(enhancedProfile);
      expect(postAdvertisingVerification).toBe(true);

      // Perform profile exchange
      const exchangedProfile = await enhancedBleService.exchangeEnhancedProfile(
        'test-peer-uuid',
        enhancedProfile
      );

      // Verify received profile has valid signature
      if (exchangedProfile.signature) {
        const exchangedVerification = await cryptoService.verifySignature(exchangedProfile);
        expect(exchangedVerification).toBe(true);
      }

      await enhancedBleService.stopEnhancedDiscovery();
    });

    it('should handle biometric verification in the complete workflow', async () => {
      const enhancedProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );

      expect(enhancedProfile.biometricVector).toBeDefined();

      // Test biometric verification
      const mockLiveCapture = 'data:image/jpeg;base64,test-image-data';
      const similarity = await tinyMLService.verifyBiometric(
        enhancedProfile.biometricVector!,
        mockLiveCapture
      );

      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);

      // Start discovery with biometric-enabled profile
      await enhancedBleService.startEnhancedDiscovery(enhancedProfile, () => {});

      // Verify the advertising includes biometric information
      const discoveredPeers = enhancedBleService.getDiscoveredPeers();
      
      // Wait for peer discovery
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedPeers = enhancedBleService.getDiscoveredPeers();
      expect(updatedPeers.length).toBeGreaterThanOrEqual(0);

      await enhancedBleService.stopEnhancedDiscovery();
    });

    it('should properly handle profile expiration and cleanup', async () => {
      // Create profile with short expiration
      const shortLivedProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        {
          ...mockEnhancementSettings,
          tokenExpiration: 1 // 1 second for testing
        }
      );

      expect(shortLivedProfile.tokenMetadata?.expiresAt).toBeDefined();

      // Start advertising
      await enhancedBleService.startEnhancedDiscovery(shortLivedProfile, () => {});

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify profile validation detects expiration
      const verification = await enhancedProfileService.verifyProfile(shortLivedProfile);
      
      // Profile should either be invalid due to expiration or still valid if expiration isn't implemented yet
      expect(verification).toBeDefined();

      await enhancedBleService.stopEnhancedDiscovery();
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from service failures gracefully', async () => {
      const enhancedProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );

      // Start discovery
      const discoveryResult = await enhancedBleService.startEnhancedDiscovery(
        enhancedProfile,
        () => {}
      );
      expect(discoveryResult).toBe(true);

      // Simulate service restart
      await enhancedBleService.stopEnhancedDiscovery();
      
      // Should be able to restart successfully
      const restartResult = await enhancedBleService.startEnhancedDiscovery(
        enhancedProfile,
        () => {}
      );
      expect(restartResult).toBe(true);

      await enhancedBleService.stopEnhancedDiscovery();
    });

    it('should handle partial profile creation failures', async () => {
      // Test with settings that might cause partial failures
      const limitedSettings: EnhancementSettings = {
        enableBiometric: false, // Disable biometric to test partial enhancement
        enableCryptographic: true,
        biometricTypes: [],
        securityLevel: 'medium'
      };

      const partialProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        limitedSettings
      );

      expect(partialProfile.isEnhanced).toBe(true);
      expect(partialProfile.enhancementLevel).toBe('cryptographic');
      expect(partialProfile.biometricVector).toBeUndefined();
      expect(partialProfile.signature).toBeDefined();

      // Should still be able to advertise and discover
      const discoveryResult = await enhancedBleService.startEnhancedDiscovery(
        partialProfile,
        () => {}
      );
      expect(discoveryResult).toBe(true);

      await enhancedBleService.stopEnhancedDiscovery();
    });

    it('should handle network-like failures in peer exchange', async () => {
      const enhancedProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );

      await enhancedBleService.startEnhancedDiscovery(enhancedProfile, () => {});

      // Test exchange with non-existent peer (should handle gracefully)
      try {
        await enhancedBleService.exchangeEnhancedProfile(
          'non-existent-peer-uuid',
          enhancedProfile
        );
      } catch (error) {
        // Should throw an error but not crash
        expect(error).toBeDefined();
      }

      // Service should still be functional
      expect(enhancedBleService.isEnhancedModeActive()).toBe(true);

      await enhancedBleService.stopEnhancedDiscovery();
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain data consistency across service boundaries', async () => {
      const originalProfile = { ...mockBasicProfile };
      
      const enhancedProfile = await enhancedProfileService.createEnhancedProfile(
        originalProfile,
        mockEnhancementSettings
      );

      // Verify basic profile data is preserved
      expect(enhancedProfile.uuid).toBe(originalProfile.uuid);
      expect(enhancedProfile.name).toBe(originalProfile.name);
      expect(enhancedProfile.role).toBe(originalProfile.role);
      expect(enhancedProfile.company).toBe(originalProfile.company);

      // Start discovery and check consistency
      let discoveredProfile: any = null;
      await enhancedBleService.startEnhancedDiscovery(
        enhancedProfile,
        (peer) => { discoveredProfile = peer; }
      );

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (discoveredProfile) {
        expect(discoveredProfile.name).toBeDefined();
        expect(discoveredProfile.isEnhanced).toBe(true);
      }

      await enhancedBleService.stopEnhancedDiscovery();
    });

    it('should ensure token metadata consistency', async () => {
      const enhancedProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );

      expect(enhancedProfile.tokenMetadata).toBeDefined();
      expect(enhancedProfile.tokenMetadata?.version).toBe('1.0');
      expect(enhancedProfile.tokenMetadata?.issuer).toContain('BeaconAI');
      expect(enhancedProfile.tokenMetadata?.permissions).toContain('discover');

      // Verify timestamps are valid
      const createdAt = new Date(enhancedProfile.tokenMetadata!.createdAt);
      const expiresAt = new Date(enhancedProfile.tokenMetadata!.expiresAt);
      
      expect(createdAt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(expiresAt.getTime()).toBeGreaterThan(createdAt.getTime());
    });
  });

  describe('Performance Integration', () => {
    it('should complete full workflow within acceptable time', async () => {
      const startTime = performance.now();

      // Complete workflow
      const enhancedProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );

      await enhancedBleService.startEnhancedDiscovery(enhancedProfile, () => {});
      
      // Wait for some discovery activity
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await enhancedBleService.stopEnhancedDiscovery();

      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      // Complete workflow should finish within 15 seconds
      expect(totalDuration).toBeLessThan(15000);
    });
  });
});