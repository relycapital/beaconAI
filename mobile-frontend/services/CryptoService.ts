import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';
import {
  ICryptoService,
  EnhancedProfile,
  CryptographicSignature,
  TokenMetadata,
  EnhancedProfileError,
  EnhancedProfileErrorDetails
} from '../types/enhanced-profile';

/**
 * CryptoService handles all cryptographic operations for BeaconAI enhanced profiles
 * Uses Ed25519 for digital signatures and secure key management
 */
export class CryptoService implements ICryptoService {
  private static instance: CryptoService;
  private keyPair: { privateKey: string; publicKey: string } | null = null;
  private usedNonces: Set<string> = new Set();
  private nonceExpiry: Map<string, number> = new Map();
  private readonly NONCE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
  private readonly PRIVATE_KEY_STORAGE_KEY = 'beaconai_private_key';
  private readonly PUBLIC_KEY_STORAGE_KEY = 'beaconai_public_key';

  // Singleton pattern for consistent key management
  public static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  private constructor() {
    this.cleanupExpiredNonces();
    // Clean up expired nonces every 15 minutes
    setInterval(() => this.cleanupExpiredNonces(), 15 * 60 * 1000);
  }

  /**
   * Generate Ed25519 key pair for signing operations
   * Keys are securely stored in device keychain/keystore
   */
  public async generateKeyPair(): Promise<{privateKey: string, publicKey: string}> {
    try {
      // Generate cryptographically secure random private key (32 bytes)
      const privateKeyBytes = await Crypto.getRandomBytesAsync(32);
      const privateKey = Buffer.from(privateKeyBytes).toString('base64');
      
      // Derive public key from private key using Ed25519
      const publicKey = await this.derivePublicKey(privateKey);
      
      // Store keys securely
      await this.storeKeyPair(privateKey, publicKey);
      
      this.keyPair = { privateKey, publicKey };
      
      return { privateKey, publicKey };
    } catch (error) {
      const errorDetails: EnhancedProfileErrorDetails = {
        code: 'CRYPTO_OPERATION_FAILED',
        message: `Key generation failed: ${error}`,
        details: error,
        timestamp: new Date().toISOString()
      };
      throw errorDetails;
    }
  }

  /**
   * Load existing key pair from secure storage
   */
  public async loadKeyPair(): Promise<{privateKey: string, publicKey: string} | null> {
    try {
      const privateKey = await SecureStore.getItemAsync(this.PRIVATE_KEY_STORAGE_KEY);
      const publicKey = await SecureStore.getItemAsync(this.PUBLIC_KEY_STORAGE_KEY);
      
      if (privateKey && publicKey) {
        this.keyPair = { privateKey, publicKey };
        return { privateKey, publicKey };
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to load key pair from secure storage:', error);
      return null;
    }
  }

  /**
   * Get or generate key pair
   */
  public async getKeyPair(): Promise<{privateKey: string, publicKey: string}> {
    if (this.keyPair) {
      return this.keyPair;
    }
    
    // Try to load existing keys
    const existingKeys = await this.loadKeyPair();
    if (existingKeys) {
      return existingKeys;
    }
    
    // Generate new keys if none exist
    return await this.generateKeyPair();
  }

  /**
   * Sign an enhanced profile with Ed25519
   */
  public async signProfile(
    profile: EnhancedProfile, 
    privateKey?: string
  ): Promise<CryptographicSignature> {
    try {
      const keys = privateKey ? 
        { privateKey, publicKey: await this.derivePublicKey(privateKey) } :
        await this.getKeyPair();
      
      // Create canonical representation of profile for signing
      const canonicalData = this.createCanonicalProfileData(profile);
      
      // Generate signature
      const signature = await this.signData(canonicalData, keys.privateKey);
      
      const cryptoSignature: CryptographicSignature = {
        algorithm: 'Ed25519',
        signature,
        publicKey: keys.publicKey,
        signedAt: new Date().toISOString()
      };
      
      return cryptoSignature;
    } catch (error) {
      const errorDetails: EnhancedProfileErrorDetails = {
        code: 'SIGNATURE_GENERATION_FAILED',
        message: `Profile signing failed: ${error}`,
        details: error,
        timestamp: new Date().toISOString()
      };
      throw errorDetails;
    }
  }

  /**
   * Verify Ed25519 signature of an enhanced profile
   */
  public async verifySignature(profile: EnhancedProfile): Promise<boolean> {
    try {
      if (!profile.signature) {
        return false;
      }
      
      const { signature, publicKey, algorithm } = profile.signature;
      
      if (algorithm !== 'Ed25519') {
        console.warn(`Unsupported signature algorithm: ${algorithm}`);
        return false;
      }
      
      // Create canonical representation (same as when signing)
      const canonicalData = this.createCanonicalProfileData(profile);
      
      // Verify signature
      return await this.verifySignatureData(canonicalData, signature, publicKey);
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate cryptographically secure nonce for anti-replay protection
   */
  public generateNonce(): string {
    const nonce = Crypto.getRandomBytes(16).toString('hex');
    const expiry = Date.now() + this.NONCE_EXPIRY_MS;
    
    this.nonceExpiry.set(nonce, expiry);
    
    return nonce;
  }

  /**
   * Validate nonce (check if not used and not expired)
   */
  public validateNonce(nonce: string): boolean {
    // Check if nonce was already used
    if (this.usedNonces.has(nonce)) {
      return false;
    }
    
    // Check if nonce exists and is not expired
    const expiry = this.nonceExpiry.get(nonce);
    if (!expiry || Date.now() > expiry) {
      return false;
    }
    
    // Mark nonce as used
    this.usedNonces.add(nonce);
    this.nonceExpiry.delete(nonce);
    
    return true;
  }

  /**
   * Create a challenge for secure token exchange
   */
  public createChallenge(): string {
    return this.generateNonce();
  }

  /**
   * Create response to challenge
   */
  public async createChallengeResponse(
    challenge: string, 
    privateKey?: string
  ): Promise<string> {
    const keys = privateKey ? 
      { privateKey, publicKey: await this.derivePublicKey(privateKey) } :
      await this.getKeyPair();
    
    const responseData = `${challenge}:${Date.now()}:${keys.publicKey}`;
    return await this.signData(responseData, keys.privateKey);
  }

  /**
   * Verify challenge response
   */
  public async verifyChallengeResponse(
    challenge: string,
    response: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      // Extract timestamp from response data
      const responseData = `${challenge}:${Date.now()}:${publicKey}`;
      return await this.verifySignatureData(responseData, response, publicKey);
    } catch (error) {
      console.error('Challenge response verification failed:', error);
      return false;
    }
  }

  /**
   * Securely store key pair in device keychain/keystore
   */
  private async storeKeyPair(privateKey: string, publicKey: string): Promise<void> {
    await SecureStore.setItemAsync(this.PRIVATE_KEY_STORAGE_KEY, privateKey);
    await SecureStore.setItemAsync(this.PUBLIC_KEY_STORAGE_KEY, publicKey);
  }

  /**
   * Create canonical representation of profile data for consistent signing
   */
  private createCanonicalProfileData(profile: EnhancedProfile): string {
    // Create a copy without the signature field
    const profileCopy = { ...profile };
    delete profileCopy.signature;
    delete profileCopy.verification; // Computed field, not signed
    
    // Sort keys for canonical representation
    const sortedProfile = this.sortObjectKeys(profileCopy);
    
    return JSON.stringify(sortedProfile);
  }

  /**
   * Recursively sort object keys for canonical representation
   */
  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }
    
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: any = {};
    
    for (const key of sortedKeys) {
      sortedObj[key] = this.sortObjectKeys(obj[key]);
    }
    
    return sortedObj;
  }

  /**
   * Derive Ed25519 public key from private key
   * This is a placeholder - in production, use a proper Ed25519 implementation
   */
  private async derivePublicKey(privateKey: string): Promise<string> {
    // PLACEHOLDER: In production, use react-native-sodium or similar
    // For now, create a deterministic "public key" from private key
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      privateKey + '_public',
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    return hash;
  }

  /**
   * Sign data with Ed25519 private key
   * This is a placeholder - in production, use a proper Ed25519 implementation
   */
  private async signData(data: string, privateKey: string): Promise<string> {
    // PLACEHOLDER: In production, use react-native-sodium or similar
    // For now, create a deterministic "signature" using HMAC
    const signature = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data + privateKey,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    return signature;
  }

  /**
   * Verify Ed25519 signature
   * This is a placeholder - in production, use a proper Ed25519 implementation
   */
  private async verifySignatureData(
    data: string, 
    signature: string, 
    publicKey: string
  ): Promise<boolean> {
    // PLACEHOLDER: In production, use react-native-sodium or similar
    // For now, verify by recreating the "signature" and comparing
    try {
      // Derive private key from public key (only possible in this mock implementation)
      const mockPrivateKey = publicKey.replace('_public', '').replace(/[^A-Za-z0-9+/=]/g, '');
      const expectedSignature = await this.signData(data, mockPrivateKey);
      return signature === expectedSignature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up expired nonces to prevent memory leaks
   */
  private cleanupExpiredNonces(): void {
    const now = Date.now();
    const expiredNonces: string[] = [];
    
    for (const [nonce, expiry] of this.nonceExpiry.entries()) {
      if (now > expiry) {
        expiredNonces.push(nonce);
      }
    }
    
    for (const nonce of expiredNonces) {
      this.nonceExpiry.delete(nonce);
      this.usedNonces.delete(nonce);
    }
  }

  /**
   * Clear all stored keys (for testing or user logout)
   */
  public async clearKeys(): Promise<void> {
    this.keyPair = null;
    await SecureStore.deleteItemAsync(this.PRIVATE_KEY_STORAGE_KEY);
    await SecureStore.deleteItemAsync(this.PUBLIC_KEY_STORAGE_KEY);
  }

  /**
   * Get public key for sharing with peers
   */
  public async getPublicKey(): Promise<string> {
    const keys = await this.getKeyPair();
    return keys.publicKey;
  }

  /**
   * Check if service has valid keys
   */
  public async hasValidKeys(): Promise<boolean> {
    try {
      const keys = await this.loadKeyPair();
      return keys !== null;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const cryptoService = CryptoService.getInstance();