import { CryptoService } from '../services/CryptoService';
import { EnhancedProfile } from '../types/enhanced-profile';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn().mockResolvedValue(new Uint8Array(32).fill(1)),
  getRandomBytes: jest.fn().mockReturnValue(new Uint8Array(16).fill(2)),
  digestStringAsync: jest.fn().mockImplementation((algorithm, data, options) => {
    // Create deterministic mock hash
    const hash = Buffer.from(data, 'utf8').toString('base64');
    return Promise.resolve(hash);
  }),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  CryptoEncoding: {
    BASE64: 'base64',
  },
}));

describe('CryptoService', () => {
  let cryptoService: CryptoService;
  
  beforeEach(() => {
    cryptoService = CryptoService.getInstance();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cryptoService.clearKeys();
  });

  describe('Key Management', () => {
    it('should generate a new key pair', async () => {
      const keyPair = await cryptoService.generateKeyPair();
      
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair).toHaveProperty('publicKey');
      expect(typeof keyPair.privateKey).toBe('string');
      expect(typeof keyPair.publicKey).toBe('string');
      expect(keyPair.privateKey).not.toBe(keyPair.publicKey);
    });

    it('should return the same key pair on subsequent calls', async () => {
      const keyPair1 = await cryptoService.getKeyPair();
      const keyPair2 = await cryptoService.getKeyPair();
      
      expect(keyPair1.privateKey).toBe(keyPair2.privateKey);
      expect(keyPair1.publicKey).toBe(keyPair2.publicKey);
    });

    it('should get public key', async () => {
      const keyPair = await cryptoService.getKeyPair();
      const publicKey = await cryptoService.getPublicKey();
      
      expect(publicKey).toBe(keyPair.publicKey);
    });

    it('should check if has valid keys', async () => {
      const hasKeys1 = await cryptoService.hasValidKeys();
      expect(hasKeys1).toBe(false);
      
      await cryptoService.generateKeyPair();
      const hasKeys2 = await cryptoService.hasValidKeys();
      expect(hasKeys2).toBe(true);
    });

    it('should clear keys', async () => {
      await cryptoService.generateKeyPair();
      expect(await cryptoService.hasValidKeys()).toBe(true);
      
      await cryptoService.clearKeys();
      expect(await cryptoService.hasValidKeys()).toBe(false);
    });
  });

  describe('Profile Signing', () => {
    let mockProfile: EnhancedProfile;
    
    beforeEach(() => {
      mockProfile = {
        uuid: 'test-uuid',
        name: 'Test User',
        role: 'Developer',
        company: 'Test Corp',
        isEnhanced: true,
        enhancementLevel: 'cryptographic',
      };
    });

    it('should sign a profile', async () => {
      const signature = await cryptoService.signProfile(mockProfile);
      
      expect(signature).toHaveProperty('algorithm', 'Ed25519');
      expect(signature).toHaveProperty('signature');
      expect(signature).toHaveProperty('publicKey');
      expect(signature).toHaveProperty('signedAt');
      expect(typeof signature.signature).toBe('string');
    });

    it('should sign with custom private key', async () => {
      const customKeyPair = await cryptoService.generateKeyPair();
      const signature = await cryptoService.signProfile(mockProfile, customKeyPair.privateKey);
      
      expect(signature.publicKey).toBe(customKeyPair.publicKey);
    });

    it('should verify a valid signature', async () => {
      const signature = await cryptoService.signProfile(mockProfile);
      const profileWithSignature = { ...mockProfile, signature };
      
      const isValid = await cryptoService.verifySignature(profileWithSignature);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const signature = await cryptoService.signProfile(mockProfile);
      
      // Tamper with the profile
      const tamperedProfile = {
        ...mockProfile,
        name: 'Tampered Name',
        signature
      };
      
      const isValid = await cryptoService.verifySignature(tamperedProfile);
      expect(isValid).toBe(false);
    });

    it('should reject profile without signature', async () => {
      const isValid = await cryptoService.verifySignature(mockProfile);
      expect(isValid).toBe(false);
    });

    it('should reject unsupported algorithm', async () => {
      const signature = await cryptoService.signProfile(mockProfile);
      const profileWithBadSignature = {
        ...mockProfile,
        signature: { ...signature, algorithm: 'RSA' }
      };
      
      const isValid = await cryptoService.verifySignature(profileWithBadSignature);
      expect(isValid).toBe(false);
    });
  });

  describe('Nonce Management', () => {
    it('should generate unique nonces', () => {
      const nonce1 = cryptoService.generateNonce();
      const nonce2 = cryptoService.generateNonce();
      
      expect(nonce1).not.toBe(nonce2);
      expect(typeof nonce1).toBe('string');
      expect(nonce1.length).toBeGreaterThan(0);
    });

    it('should validate fresh nonce', () => {
      const nonce = cryptoService.generateNonce();
      const isValid = cryptoService.validateNonce(nonce);
      
      expect(isValid).toBe(true);
    });

    it('should reject used nonce', () => {
      const nonce = cryptoService.generateNonce();
      
      const isValid1 = cryptoService.validateNonce(nonce);
      expect(isValid1).toBe(true);
      
      const isValid2 = cryptoService.validateNonce(nonce);
      expect(isValid2).toBe(false);
    });

    it('should reject unknown nonce', () => {
      const unknownNonce = 'unknown-nonce';
      const isValid = cryptoService.validateNonce(unknownNonce);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Challenge-Response', () => {
    it('should create challenge', () => {
      const challenge = cryptoService.createChallenge();
      
      expect(typeof challenge).toBe('string');
      expect(challenge.length).toBeGreaterThan(0);
    });

    it('should create challenge response', async () => {
      const challenge = cryptoService.createChallenge();
      const response = await cryptoService.createChallengeResponse(challenge);
      
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should verify valid challenge response', async () => {
      const keyPair = await cryptoService.getKeyPair();
      const challenge = cryptoService.createChallenge();
      const response = await cryptoService.createChallengeResponse(challenge);
      
      const isValid = await cryptoService.verifyChallengeResponse(
        challenge,
        response,
        keyPair.publicKey
      );
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid challenge response', async () => {
      const keyPair = await cryptoService.getKeyPair();
      const challenge = cryptoService.createChallenge();
      const invalidResponse = 'invalid-response';
      
      const isValid = await cryptoService.verifyChallengeResponse(
        challenge,
        invalidResponse,
        keyPair.publicKey
      );
      
      expect(isValid).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle signature verification errors gracefully', async () => {
      const malformedProfile = {
        uuid: 'test',
        isEnhanced: true,
        enhancementLevel: 'cryptographic' as const,
        signature: {
          algorithm: 'Ed25519',
          signature: 'invalid-base64!@#',
          publicKey: 'invalid-key',
          signedAt: new Date().toISOString()
        }
      };
      
      const isValid = await cryptoService.verifySignature(malformedProfile);
      expect(isValid).toBe(false);
    });

    it('should handle challenge response verification errors', async () => {
      const challenge = 'test-challenge';
      const response = 'test-response';
      const publicKey = 'invalid-key';
      
      const isValid = await cryptoService.verifyChallengeResponse(
        challenge,
        response,
        publicKey
      );
      
      expect(isValid).toBe(false);
    });
  });

  describe('Canonical Data Creation', () => {
    it('should create consistent canonical representation', async () => {
      const profile1 = {
        uuid: 'test',
        name: 'Test',
        role: 'Dev',
        isEnhanced: true,
        enhancementLevel: 'basic' as const
      };
      
      const profile2 = {
        role: 'Dev',
        uuid: 'test',
        enhancementLevel: 'basic' as const,
        name: 'Test',
        isEnhanced: true
      };
      
      const signature1 = await cryptoService.signProfile(profile1);
      const signature2 = await cryptoService.signProfile(profile2);
      
      // Should produce same signature for same data regardless of property order
      expect(signature1.signature).toBe(signature2.signature);
    });

    it('should exclude computed fields from signing', async () => {
      const profileWithVerification = {
        uuid: 'test',
        name: 'Test',
        isEnhanced: true,
        enhancementLevel: 'basic' as const,
        verification: {
          isValid: true,
          verificationLevel: 'basic' as const,
          verifiedAt: new Date().toISOString()
        }
      };
      
      const signature = await cryptoService.signProfile(profileWithVerification);
      const profileWithSignature = { ...profileWithVerification, signature };
      
      const isValid = await cryptoService.verifySignature(profileWithSignature);
      expect(isValid).toBe(true);
    });
  });
});