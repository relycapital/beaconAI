/**
 * Integration tests for enhanced services that work without external dependencies
 * These tests verify the core functionality works together
 */

import { TinyMLService } from '../services/TinyMLService';
import { CryptoService } from '../services/CryptoService';
import { Profile } from '../types/profile';
import { EnhancedProfile, EnhancementSettings } from '../types/enhanced-profile';

// Mock external dependencies
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
  digestStringAsync: jest.fn().mockImplementation((algorithm, data, options) => {
    // Create deterministic hash from data
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const hashString = Math.abs(hash).toString(16).padStart(8, '0');
    return Promise.resolve(Buffer.from(hashString).toString('base64'));
  }),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  CryptoEncoding: {
    BASE64: 'base64',
  },
}));

describe('Enhanced Services Integration', () => {
  let tinyMLService: TinyMLService;
  let cryptoService: CryptoService;
  
  beforeEach(async () => {
    tinyMLService = TinyMLService.getInstance();
    cryptoService = CryptoService.getInstance();
    
    // Clear any existing state
    await cryptoService.clearKeys();
    await tinyMLService.cleanup();
    
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cryptoService.clearKeys();
    await tinyMLService.cleanup();
  });

  describe('Service Initialization', () => {
    it('should initialize all services successfully', async () => {
      // Initialize TinyML service
      await tinyMLService.loadModels();
      expect(tinyMLService.isReady()).toBe(true);
      
      // Initialize Crypto service
      const keyPair = await cryptoService.generateKeyPair();
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair).toHaveProperty('publicKey');
      
      expect(await cryptoService.hasValidKeys()).toBe(true);
    });

    it('should handle service initialization failures gracefully', async () => {
      // Test crypto service without proper initialization
      const publicKey = await cryptoService.getPublicKey();
      expect(typeof publicKey).toBe('string');
      
      // Test TinyML service model info without loading
      const modelInfo = tinyMLService.getModelInfo();
      expect(modelInfo).toHaveProperty('faceNet');
      expect(modelInfo).toHaveProperty('textEncoder');
    });
  });

  describe('End-to-End Enhanced Profile Workflow', () => {
    let mockProfile: Profile;
    
    beforeEach(() => {
      mockProfile = {
        uuid: 'test-uuid-123',
        name: 'John Doe',
        role: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        avatarUri: 'https://example.com/avatar.jpg'
      };
    });

    it('should create and verify enhanced profile with crypto features', async () => {
      // Initialize services
      await tinyMLService.loadModels();
      await cryptoService.generateKeyPair();
      
      // Step 1: Create semantic vector
      const semanticText = `${mockProfile.name} ${mockProfile.role} ${mockProfile.company}`;
      const semanticVector = await tinyMLService.encodeText(semanticText);
      expect(semanticVector).toBeInstanceOf(Float32Array);
      expect(semanticVector.length).toBe(128);
      
      // Step 2: Create enhanced profile
      const enhancedProfile: EnhancedProfile = {
        ...mockProfile,
        isEnhanced: true,
        enhancementLevel: 'cryptographic',
        semanticVector: {
          data: tinyMLService.float32ArrayToBase64(semanticVector),
          sourceText: semanticText,
          model: 'TinyBERT_v1.0_mock',
          dimensions: 128,
          compression: 'PCA_128',
          generatedAt: new Date().toISOString()
        },
        tokenMetadata: {
          version: '1.0',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          issuer: 'BeaconAI:LocalSession',
          permissions: ['discover', 'verify', 'exchange']
        }
      };
      
      // Step 3: Sign the profile
      const signature = await cryptoService.signProfile(enhancedProfile);
      enhancedProfile.signature = signature;
      
      expect(signature).toHaveProperty('algorithm', 'Ed25519');
      expect(signature).toHaveProperty('signature');
      expect(signature).toHaveProperty('publicKey');
      
      // Step 4: Verify the signature
      const isValid = await cryptoService.verifySignature(enhancedProfile);
      expect(isValid).toBe(true);
      
      // Step 5: Test tampering detection
      const tamperedProfile = {
        ...enhancedProfile,
        name: 'Tampered Name'
      };
      
      const isTamperedValid = await cryptoService.verifySignature(tamperedProfile);
      expect(isTamperedValid).toBe(false);
    });

    it('should handle biometric vector encoding and verification', async () => {
      await tinyMLService.loadModels();
      
      // Step 1: Encode "biometric" data (mock image)
      const mockImageData = 'mock-face-image-data-base64';
      const biometricVector = await tinyMLService.encodeFace(mockImageData);
      
      expect(biometricVector).toBeInstanceOf(Float32Array);
      expect(biometricVector.length).toBe(128);
      
      // Step 2: Convert to storage format
      const vectorBase64 = tinyMLService.float32ArrayToBase64(biometricVector);
      expect(typeof vectorBase64).toBe('string');
      
      // Step 3: Create biometric vector object
      const storedBiometric = {
        data: vectorBase64,
        model: 'FaceNet_v1.0_mock',
        dimensions: 128,
        normalization: 'l2_norm',
        capturedAt: new Date().toISOString()
      };
      
      // Step 4: Verify against same "image"
      const similarity = await tinyMLService.verifyBiometric(storedBiometric, mockImageData);
      expect(similarity).toBeCloseTo(1, 2); // Should be very similar to itself
      
      // Step 5: Verify against different "image"
      const differentImageData = 'different-face-image-data-base64';
      const differentSimilarity = await tinyMLService.verifyBiometric(storedBiometric, differentImageData);
      expect(differentSimilarity).toBeLessThan(1);
    });

    it('should perform semantic vector comparison', async () => {
      await tinyMLService.loadModels();
      
      // Test semantic similarity
      const text1 = 'John Doe Senior Engineer TechCorp';
      const text2 = 'John Doe Senior Engineer TechCorp'; // Same
      const text3 = 'Jane Smith Junior Developer StartupCo'; // Different
      
      const vector1 = await tinyMLService.encodeText(text1);
      const vector2 = await tinyMLService.encodeText(text2);
      const vector3 = await tinyMLService.encodeText(text3);
      
      // Same text should produce identical vectors
      expect(vector1).toEqual(vector2);
      
      // Different text should produce different vectors
      expect(vector1).not.toEqual(vector3);
      
      // Test cosine similarity
      const similarity = (tinyMLService as any).cosineSimilarity(vector1, vector3);
      expect(similarity).toBeGreaterThanOrEqual(-1);
      expect(similarity).toBeLessThanOrEqual(1);
    });
  });

  describe('Security and Anti-Replay Features', () => {
    beforeEach(async () => {
      await cryptoService.generateKeyPair();
    });

    it('should implement nonce-based anti-replay protection', () => {
      // Generate nonces
      const nonce1 = cryptoService.generateNonce();
      const nonce2 = cryptoService.generateNonce();
      
      expect(nonce1).not.toBe(nonce2);
      
      // First use should succeed
      expect(cryptoService.validateNonce(nonce1)).toBe(true);
      
      // Second use should fail (replay attack)
      expect(cryptoService.validateNonce(nonce1)).toBe(false);
      
      // Different nonce should still work
      expect(cryptoService.validateNonce(nonce2)).toBe(true);
    });

    it('should implement challenge-response authentication', async () => {
      const keyPair = await cryptoService.getKeyPair();
      
      // Step 1: Create challenge
      const challenge = cryptoService.createChallenge();
      expect(typeof challenge).toBe('string');
      
      // Step 2: Create response
      const response = await cryptoService.createChallengeResponse(challenge);
      expect(typeof response).toBe('string');
      
      // Step 3: Verify response
      const isValid = await cryptoService.verifyChallengeResponse(
        challenge,
        response,
        keyPair.publicKey
      );
      expect(isValid).toBe(true);
      
      // Step 4: Test invalid response
      const invalidResponse = 'invalid-response-data';
      const isInvalid = await cryptoService.verifyChallengeResponse(
        challenge,
        invalidResponse,
        keyPair.publicKey
      );
      expect(isInvalid).toBe(false);
    });

    it('should detect profile tampering through signature verification', async () => {
      await tinyMLService.loadModels();
      
      const profile: EnhancedProfile = {
        uuid: 'test-uuid',
        name: 'Alice Smith',
        role: 'Data Scientist',
        company: 'AI Corp',
        isEnhanced: true,
        enhancementLevel: 'cryptographic'
      };
      
      // Sign original profile
      const signature = await cryptoService.signProfile(profile);
      const signedProfile = { ...profile, signature };
      
      // Verify original is valid
      expect(await cryptoService.verifySignature(signedProfile)).toBe(true);
      
      // Test various tampering scenarios
      const tamperedProfiles = [
        { ...signedProfile, name: 'Bob Smith' }, // Name change
        { ...signedProfile, role: 'CEO' }, // Role change
        { ...signedProfile, company: 'Evil Corp' }, // Company change
        { ...signedProfile, uuid: 'different-uuid' }, // UUID change
      ];
      
      for (const tamperedProfile of tamperedProfiles) {
        expect(await cryptoService.verifySignature(tamperedProfile)).toBe(false);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid data gracefully', async () => {
      await tinyMLService.loadModels();
      
      // Test empty inputs
      const emptyVector = await tinyMLService.encodeText('');
      expect(emptyVector).toBeInstanceOf(Float32Array);
      
      // Test very long inputs
      const longText = 'a'.repeat(10000);
      const longVector = await tinyMLService.encodeText(longText);
      expect(longVector).toBeInstanceOf(Float32Array);
      expect(longVector.length).toBe(128);
    });

    it('should handle malformed signature data', async () => {
      const malformedProfile: EnhancedProfile = {
        uuid: 'test',
        isEnhanced: true,
        enhancementLevel: 'cryptographic',
        signature: {
          algorithm: 'Ed25519',
          signature: 'invalid-base64-data!@#$%',
          publicKey: 'invalid-public-key-data',
          signedAt: new Date().toISOString()
        }
      };
      
      // Should return false rather than throwing
      const isValid = await cryptoService.verifySignature(malformedProfile);
      expect(isValid).toBe(false);
    });

    it('should handle concurrent operations safely', async () => {
      await tinyMLService.loadModels();
      
      // Test concurrent encoding operations
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(tinyMLService.encodeText(`test text ${i}`));
      }
      
      const results = await Promise.all(promises);
      
      // All should succeed and produce different results
      expect(results.length).toBe(10);
      for (let i = 0; i < results.length; i++) {
        expect(results[i]).toBeInstanceOf(Float32Array);
        expect(results[i].length).toBe(128);
      }
      
      // Different inputs should produce different outputs
      expect(results[0]).not.toEqual(results[1]);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle large numbers of operations efficiently', async () => {
      await tinyMLService.loadModels();
      await cryptoService.generateKeyPair();
      
      const startTime = Date.now();
      
      // Perform batch operations
      const operations = [];
      for (let i = 0; i < 50; i++) {
        operations.push(
          tinyMLService.encodeText(`Performance test text ${i}`)
        );
      }
      
      const results = await Promise.all(operations);
      const endTime = Date.now();
      
      expect(results.length).toBe(50);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should properly cleanup resources', async () => {
      await tinyMLService.loadModels();
      expect(tinyMLService.isReady()).toBe(true);
      
      await tinyMLService.cleanup();
      expect(tinyMLService.isReady()).toBe(false);
      
      await cryptoService.clearKeys();
      expect(await cryptoService.hasValidKeys()).toBe(false);
    });
  });
});