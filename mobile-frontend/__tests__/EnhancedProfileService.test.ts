import { EnhancedProfileService } from '../services/EnhancedProfileService';
import { Profile } from '../types/profile';
import {
  EnhancementSettings,
  BiometricCaptureConfig,
  EnhancedProfile
} from '../types/enhanced-profile';

// Mock services
jest.mock('../services/CryptoService', () => ({
  cryptoService: {
    signProfile: jest.fn().mockResolvedValue({
      algorithm: 'Ed25519',
      signature: 'mock-signature',
      publicKey: 'mock-public-key',
      signedAt: new Date().toISOString()
    }),
    verifySignature: jest.fn().mockResolvedValue(true),
    generateNonce: jest.fn().mockReturnValue('mock-nonce'),
    getKeyPair: jest.fn().mockResolvedValue({
      privateKey: 'mock-private-key',
      publicKey: 'mock-public-key'
    })
  }
}));

jest.mock('../services/TinyMLService', () => ({
  tinyMLService: {
    loadModels: jest.fn().mockResolvedValue(undefined),
    encodeText: jest.fn().mockResolvedValue(new Float32Array(128).fill(0.1)),
    encodeFace: jest.fn().mockResolvedValue(new Float32Array(128).fill(0.2)),
    verifyBiometric: jest.fn().mockResolvedValue(0.95),
    checkLiveness: jest.fn().mockResolvedValue(true),
    float32ArrayToBase64: jest.fn().mockReturnValue('mock-base64-vector'),
    isReady: jest.fn().mockReturnValue(true)
  }
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  getCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true, canAskAgain: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{
      uri: 'mock-image-uri',
      base64: 'mock-base64-image'
    }]
  }),
  MediaTypeOptions: {
    Images: 'Images'
  }
}));

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({
    uri: 'mock-processed-uri',
    base64: 'mock-processed-base64'
  }),
  SaveFormat: {
    JPEG: 'jpeg'
  }
}));

describe('EnhancedProfileService', () => {
  let enhancedProfileService: EnhancedProfileService;
  let mockBasicProfile: Profile;
  let mockEnhancementSettings: EnhancementSettings;
  
  beforeEach(() => {
    enhancedProfileService = EnhancedProfileService.getInstance();
    
    mockBasicProfile = {
      uuid: 'test-uuid',
      name: 'John Doe',
      role: 'Senior Engineer',
      company: 'TechCorp',
      avatarUri: 'mock-avatar-uri'
    };
    
    mockEnhancementSettings = {
      enableBiometric: true,
      enableCryptographic: true,
      biometricTypes: ['face'],
      tokenExpiration: 24,
      autoRefresh: true,
      privacyLevel: 'balanced',
      requireVerification: false
    };
    
    jest.clearAllMocks();
  });

  describe('Enhanced Profile Creation', () => {
    it('should create enhanced profile with all features', async () => {
      const enhancedProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        mockEnhancementSettings
      );
      
      expect(enhancedProfile).toMatchObject(mockBasicProfile);
      expect(enhancedProfile.isEnhanced).toBe(true);
      expect(enhancedProfile.enhancementLevel).toBe('full');
      expect(enhancedProfile.biometricVector).toBeDefined();
      expect(enhancedProfile.semanticVector).toBeDefined();
      expect(enhancedProfile.signature).toBeDefined();
      expect(enhancedProfile.tokenMetadata).toBeDefined();
      expect(enhancedProfile.verification).toBeDefined();
    });

    it('should create profile with only cryptographic features', async () => {
      const settingsNoBiometric = {
        ...mockEnhancementSettings,
        enableBiometric: false
      };
      
      const enhancedProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        settingsNoBiometric
      );
      
      expect(enhancedProfile.enhancementLevel).toBe('cryptographic');
      expect(enhancedProfile.biometricVector).toBeUndefined();
      expect(enhancedProfile.semanticVector).toBeDefined();
      expect(enhancedProfile.signature).toBeDefined();
    });

    it('should create profile with only biometric features', async () => {
      const settingsNoCrypto = {
        ...mockEnhancementSettings,
        enableCryptographic: false
      };
      
      const enhancedProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        settingsNoCrypto
      );
      
      expect(enhancedProfile.enhancementLevel).toBe('biometric');
      expect(enhancedProfile.biometricVector).toBeDefined();
      expect(enhancedProfile.semanticVector).toBeDefined();
      expect(enhancedProfile.signature).toBeUndefined();
    });

    it('should create basic enhanced profile with minimal features', async () => {
      const minimalSettings = {
        ...mockEnhancementSettings,
        enableBiometric: false,
        enableCryptographic: false
      };
      
      const enhancedProfile = await enhancedProfileService.createEnhancedProfile(
        mockBasicProfile,
        minimalSettings
      );
      
      expect(enhancedProfile.enhancementLevel).toBe('basic');
      expect(enhancedProfile.biometricVector).toBeUndefined();
      expect(enhancedProfile.semanticVector).toBeDefined();
      expect(enhancedProfile.signature).toBeUndefined();
    });

    it('should handle profile creation errors', async () => {
      // Mock a service failure
      const { tinyMLService } = require('../services/TinyMLService');
      tinyMLService.encodeText.mockRejectedValueOnce(new Error('TinyML failure'));
      
      await expect(
        enhancedProfileService.createEnhancedProfile(mockBasicProfile, mockEnhancementSettings)
      ).rejects.toThrow();
    });
  });

  describe('Biometric Capture', () => {
    it('should capture face biometric successfully', async () => {
      const config: BiometricCaptureConfig = {
        type: 'face',
        quality: 'high',
        livenessCheck: true,
        multipleCaptures: true,
        timeout: 30000
      };
      
      const biometric = await enhancedProfileService.captureBiometric(config);
      
      expect(biometric).toHaveProperty('data');
      expect(biometric).toHaveProperty('model');
      expect(biometric).toHaveProperty('dimensions', 128);
      expect(biometric).toHaveProperty('normalization');
      expect(biometric).toHaveProperty('capturedAt');
    });

    it('should handle camera permission denial', async () => {
      const { requestCameraPermissionsAsync } = require('expo-image-picker');
      requestCameraPermissionsAsync.mockResolvedValueOnce({ granted: false });
      
      const config: BiometricCaptureConfig = {
        type: 'face',
        quality: 'medium',
        livenessCheck: false,
        multipleCaptures: false,
        timeout: 10000
      };
      
      await expect(enhancedProfileService.captureBiometric(config)).rejects.toThrow('Camera permission not granted');
    });

    it('should handle image capture cancellation', async () => {
      const { launchCameraAsync } = require('expo-image-picker');
      launchCameraAsync.mockResolvedValueOnce({ canceled: true });
      
      const config: BiometricCaptureConfig = {
        type: 'face',
        quality: 'medium',
        livenessCheck: false,
        multipleCaptures: false,
        timeout: 10000
      };
      
      await expect(enhancedProfileService.captureBiometric(config)).rejects.toThrow('Image capture was cancelled');
    });

    it('should reject unsupported biometric type', async () => {
      const config: BiometricCaptureConfig = {
        type: 'voice' as any,
        quality: 'medium',
        livenessCheck: false,
        multipleCaptures: false,
        timeout: 10000
      };
      
      await expect(enhancedProfileService.captureBiometric(config)).rejects.toThrow('Unsupported biometric type');
    });

    it('should handle liveness check failure', async () => {
      const { tinyMLService } = require('../services/TinyMLService');
      tinyMLService.checkLiveness.mockResolvedValueOnce(false);
      
      const config: BiometricCaptureConfig = {
        type: 'face',
        quality: 'high',
        livenessCheck: true,
        multipleCaptures: true,
        timeout: 30000
      };
      
      await expect(enhancedProfileService.captureBiometric(config)).rejects.toThrow('Liveness check failed');
    });
  });

  describe('Semantic Vector Generation', () => {
    it('should generate semantic vector from profile', async () => {
      const semanticVector = await enhancedProfileService.generateSemanticVector(mockBasicProfile);
      
      expect(semanticVector).toHaveProperty('data');
      expect(semanticVector).toHaveProperty('sourceText');
      expect(semanticVector).toHaveProperty('model');
      expect(semanticVector).toHaveProperty('dimensions', 128);
      expect(semanticVector).toHaveProperty('generatedAt');
      
      expect(semanticVector.sourceText).toContain(mockBasicProfile.name!);
      expect(semanticVector.sourceText).toContain(mockBasicProfile.role!);
      expect(semanticVector.sourceText).toContain(mockBasicProfile.company!);
    });

    it('should handle empty profile fields', async () => {
      const emptyProfile: Profile = {
        uuid: 'test-uuid'
      };
      
      const semanticVector = await enhancedProfileService.generateSemanticVector(emptyProfile);
      
      expect(semanticVector).toHaveProperty('data');
      expect(semanticVector.sourceText).toBe('');
    });

    it('should handle encoding errors', async () => {
      const { tinyMLService } = require('../services/TinyMLService');
      tinyMLService.encodeText.mockRejectedValueOnce(new Error('Encoding failed'));
      
      await expect(
        enhancedProfileService.generateSemanticVector(mockBasicProfile)
      ).rejects.toThrow();
    });
  });

  describe('Profile Verification', () => {
    it('should verify valid enhanced profile', async () => {
      const mockEnhancedProfile: EnhancedProfile = {
        ...mockBasicProfile,
        isEnhanced: true,
        enhancementLevel: 'full',
        signature: {
          algorithm: 'Ed25519',
          signature: 'valid-signature',
          publicKey: 'valid-public-key',
          signedAt: new Date().toISOString()
        },
        tokenMetadata: {
          version: '1.0',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          issuer: 'BeaconAI:LocalSession',
          permissions: ['discover', 'verify']
        }
      };
      
      const verification = await enhancedProfileService.verifyProfile(mockEnhancedProfile);
      
      expect(verification.isValid).toBe(true);
      expect(verification.verificationLevel).toBe('cryptographic');
      expect(verification.signatureValid).toBe(true);
    });

    it('should detect expired token', async () => {
      const expiredProfile: EnhancedProfile = {
        ...mockBasicProfile,
        isEnhanced: true,
        enhancementLevel: 'cryptographic',
        tokenMetadata: {
          version: '1.0',
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expired
          issuer: 'BeaconAI:LocalSession',
          permissions: ['discover']
        }
      };
      
      const verification = await enhancedProfileService.verifyProfile(expiredProfile);
      
      expect(verification.isValid).toBe(false);
      expect(verification.errors).toContain('Token expired');
    });

    it('should detect invalid signature', async () => {
      const { cryptoService } = require('../services/CryptoService');
      cryptoService.verifySignature.mockResolvedValueOnce(false);
      
      const invalidProfile: EnhancedProfile = {
        ...mockBasicProfile,
        isEnhanced: true,
        enhancementLevel: 'cryptographic',
        signature: {
          algorithm: 'Ed25519',
          signature: 'invalid-signature',
          publicKey: 'invalid-public-key',
          signedAt: new Date().toISOString()
        }
      };
      
      const verification = await enhancedProfileService.verifyProfile(invalidProfile);
      
      expect(verification.isValid).toBe(false);
      expect(verification.signatureValid).toBe(false);
      expect(verification.errors).toContain('Invalid cryptographic signature');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token with new expiration', async () => {
      const originalProfile: EnhancedProfile = {
        ...mockBasicProfile,
        isEnhanced: true,
        enhancementLevel: 'cryptographic',
        signature: {
          algorithm: 'Ed25519',
          signature: 'old-signature',
          publicKey: 'public-key',
          signedAt: new Date(Date.now() - 1000).toISOString()
        },
        tokenMetadata: {
          version: '1.0',
          createdAt: new Date(Date.now() - 1000).toISOString(),
          expiresAt: new Date(Date.now() + 1000).toISOString(),
          issuer: 'BeaconAI:LocalSession',
          permissions: ['discover']
        }
      };
      
      const refreshedProfile = await enhancedProfileService.refreshToken(originalProfile);
      
      expect(refreshedProfile.tokenMetadata!.createdAt).not.toBe(originalProfile.tokenMetadata!.createdAt);
      expect(refreshedProfile.tokenMetadata!.expiresAt).not.toBe(originalProfile.tokenMetadata!.expiresAt);
      expect(refreshedProfile.signature!.signature).toBe('mock-signature'); // New signature from mock
    });
  });

  describe('Live Biometric Verification', () => {
    it('should verify live biometric against stored profile', async () => {
      const profileWithBiometric: EnhancedProfile = {
        ...mockBasicProfile,
        isEnhanced: true,
        enhancementLevel: 'biometric',
        biometricVector: {
          data: 'stored-biometric-vector',
          model: 'FaceNet_v1.0',
          dimensions: 128,
          normalization: 'l2_norm',
          capturedAt: new Date().toISOString()
        }
      };
      
      const liveImageData = 'live-capture-data';
      const similarity = await enhancedProfileService.verifyLiveBiometric(
        profileWithBiometric,
        liveImageData
      );
      
      expect(similarity).toBe(0.95); // From mock
    });

    it('should reject profile without biometric data', async () => {
      const profileWithoutBiometric: EnhancedProfile = {
        ...mockBasicProfile,
        isEnhanced: true,
        enhancementLevel: 'basic'
      };
      
      await expect(
        enhancedProfileService.verifyLiveBiometric(profileWithoutBiometric, 'live-data')
      ).rejects.toThrow('Profile does not contain biometric data');
    });
  });

  describe('Biometric Update', () => {
    it('should update biometric data in profile', async () => {
      const originalProfile: EnhancedProfile = {
        ...mockBasicProfile,
        isEnhanced: true,
        enhancementLevel: 'biometric',
        biometricVector: {
          data: 'old-biometric-data',
          model: 'FaceNet_v1.0',
          dimensions: 128,
          normalization: 'l2_norm',
          capturedAt: new Date(Date.now() - 1000).toISOString()
        }
      };
      
      const config: BiometricCaptureConfig = {
        type: 'face',
        quality: 'high',
        livenessCheck: true,
        multipleCaptures: false,
        timeout: 30000
      };
      
      const updatedProfile = await enhancedProfileService.updateBiometric(originalProfile, config);
      
      expect(updatedProfile.biometricVector!.data).toBe('mock-base64-vector'); // From mock
      expect(updatedProfile.biometricVector!.capturedAt).not.toBe(
        originalProfile.biometricVector!.capturedAt
      );
    });
  });

  describe('Device Capability Checks', () => {
    it('should check biometric support', async () => {
      const support = await enhancedProfileService.checkBiometricSupport();
      
      expect(support).toHaveProperty('face');
      expect(support).toHaveProperty('fingerprint');
      expect(support).toHaveProperty('voice');
      expect(support.face).toBe(true); // From mock
    });

    it('should provide enhancement recommendations', async () => {
      const recommendations = await enhancedProfileService.getEnhancementRecommendations();
      
      expect(recommendations).toHaveProperty('enableBiometric');
      expect(recommendations).toHaveProperty('enableCryptographic');
      expect(recommendations).toHaveProperty('biometricTypes');
      expect(recommendations).toHaveProperty('tokenExpiration');
      expect(recommendations.enableCryptographic).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization errors gracefully', () => {
      // Test that service can be created even if dependencies fail
      const service = EnhancedProfileService.getInstance();
      expect(service).toBeInstanceOf(EnhancedProfileService);
    });

    it('should handle verification errors gracefully', async () => {
      const { cryptoService } = require('../services/CryptoService');
      cryptoService.verifySignature.mockRejectedValueOnce(new Error('Verification failed'));
      
      const profile: EnhancedProfile = {
        ...mockBasicProfile,
        isEnhanced: true,
        enhancementLevel: 'cryptographic'
      };
      
      const verification = await enhancedProfileService.verifyProfile(profile);
      
      expect(verification.isValid).toBe(false);
      expect(verification.verificationLevel).toBe('none');
      expect(verification.errors).toBeDefined();
    });
  });
});