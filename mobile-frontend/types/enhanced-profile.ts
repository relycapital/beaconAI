import { Profile, PeerProfile, SocialLinks } from './profile';

/**
 * Enhanced profile types for biometric and cryptographic features
 */

export interface BiometricVector {
  data: string; // base64 encoded Float32Array
  model: string; // e.g., 'FaceNet_v1.0'
  dimensions: number; // e.g., 128
  normalization: string; // e.g., 'l2_norm'
  capturedAt: string; // ISO timestamp
}

export interface SemanticVector {
  data: string; // base64 encoded Float32Array
  sourceText: string; // Original text used for embedding
  model: string; // e.g., 'TinyBERT_v1.0'
  dimensions: number; // e.g., 128
  compression: string; // e.g., 'PCA_128'
  generatedAt: string; // ISO timestamp
}

export interface TokenMetadata {
  version: string; // Token format version
  createdAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp
  issuer: string; // Token issuer identifier
  eventId?: string; // Optional event identifier
  permissions: string[]; // ['discover', 'verify', 'exchange']
  revocationId?: string; // Optional revocation identifier
  nonce?: string; // Anti-replay nonce
}

export interface CryptographicSignature {
  algorithm: string; // 'Ed25519'
  signature: string; // base64 encoded signature
  publicKey: string; // base64 encoded public key
  keyId?: string; // Optional key identifier
  signedAt: string; // ISO timestamp
}

export interface VerificationResult {
  isValid: boolean;
  verificationLevel: 'none' | 'basic' | 'biometric' | 'cryptographic' | 'full';
  biometricMatch?: number; // Similarity score 0-1
  signatureValid?: boolean;
  errors?: string[];
  verifiedAt: string; // ISO timestamp
}

export interface EnhancedProfile extends Profile {
  // Biometric features (optional)
  biometricVector?: BiometricVector;
  
  // Semantic features (optional)
  semanticVector?: SemanticVector;
  
  // Cryptographic features (optional)
  signature?: CryptographicSignature;
  
  // Token metadata (optional)
  tokenMetadata?: TokenMetadata;
  
  // Verification status (computed)
  verification?: VerificationResult;
  
  // Enhancement flags
  isEnhanced: boolean;
  enhancementLevel: 'basic' | 'biometric' | 'cryptographic' | 'full';
}

export interface EnhancedPeerProfile extends PeerProfile, EnhancedProfile {
  // Peer-specific enhanced data
  discoveryMethod: 'basic' | 'enhanced';
  protocolVersion?: string;
  capabilities?: PeerCapabilities;
}

export interface PeerCapabilities {
  basic: boolean; // Always true
  enhanced: boolean; // Supports enhanced profiles
  biometric: boolean; // Supports biometric verification
  cryptographic: boolean; // Supports crypto verification
  revocation: boolean; // Supports token revocation
  zeroKnowledge: boolean; // Supports ZK proofs
}

export interface BiometricCaptureConfig {
  type: 'face' | 'fingerprint' | 'voice';
  quality: 'low' | 'medium' | 'high';
  livenessCheck: boolean;
  multipleCaptures: boolean;
  timeout: number; // milliseconds
}

export interface EnhancementSettings {
  enableBiometric: boolean;
  enableCryptographic: boolean;
  biometricTypes: ('face' | 'fingerprint' | 'voice')[];
  tokenExpiration: number; // hours
  autoRefresh: boolean;
  privacyLevel: 'minimal' | 'balanced' | 'maximum';
  requireVerification: boolean;
}

export interface TokenExchangeRequest {
  requestId: string;
  requestedCapabilities: PeerCapabilities;
  challenge: string; // Random challenge for anti-replay
  timestamp: string; // ISO timestamp
}

export interface TokenExchangeResponse {
  requestId: string;
  profile: EnhancedProfile;
  challengeResponse: string;
  timestamp: string; // ISO timestamp
}

// Error types for enhanced features
export type EnhancedProfileError = 
  | 'BIOMETRIC_CAPTURE_FAILED'
  | 'SEMANTIC_ENCODING_FAILED'
  | 'SIGNATURE_GENERATION_FAILED'
  | 'SIGNATURE_VERIFICATION_FAILED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_REVOKED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'PROTOCOL_VERSION_MISMATCH'
  | 'BIOMETRIC_VERIFICATION_FAILED'
  | 'LIVENESS_CHECK_FAILED'
  | 'MODEL_LOADING_FAILED'
  | 'CRYPTO_OPERATION_FAILED';

export interface EnhancedProfileErrorDetails {
  code: EnhancedProfileError;
  message: string;
  details?: any;
  timestamp: string;
}

// Service interfaces
export interface IEnhancedProfileService {
  createEnhancedProfile(basicProfile: Profile, config: EnhancementSettings): Promise<EnhancedProfile>;
  captureBiometric(config: BiometricCaptureConfig): Promise<BiometricVector>;
  generateSemanticVector(profile: Profile): Promise<SemanticVector>;
  verifyProfile(profile: EnhancedProfile): Promise<VerificationResult>;
  refreshToken(profile: EnhancedProfile): Promise<EnhancedProfile>;
}

export interface ICryptoService {
  generateKeyPair(): Promise<{privateKey: string, publicKey: string}>;
  signProfile(profile: EnhancedProfile, privateKey: string): Promise<CryptographicSignature>;
  verifySignature(profile: EnhancedProfile): Promise<boolean>;
  generateNonce(): string;
  validateNonce(nonce: string): boolean;
}

export interface ITinyMLService {
  loadModels(): Promise<void>;
  isReady(): boolean;
  encodeFace(imageData: string): Promise<Float32Array>;
  encodeText(text: string): Promise<Float32Array>;
  verifyBiometric(stored: BiometricVector, live: string): Promise<number>;
  checkLiveness(imageSequence: string[]): Promise<boolean>;
}