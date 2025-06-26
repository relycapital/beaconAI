import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';
import { Profile } from '../types/profile';
import {
  IEnhancedProfileService,
  EnhancedProfile,
  BiometricVector,
  SemanticVector,
  VerificationResult,
  BiometricCaptureConfig,
  EnhancementSettings,
  TokenMetadata,
  EnhancedProfileError,
  EnhancedProfileErrorDetails
} from '../types/enhanced-profile';
import { cryptoService } from './CryptoService';
import { tinyMLService } from './TinyMLService';

/**
 * EnhancedProfileService orchestrates biometric capture, semantic encoding,
 * and cryptographic signing to create enhanced identity tokens
 */
export class EnhancedProfileService implements IEnhancedProfileService {
  private static instance: EnhancedProfileService;
  
  // Singleton pattern
  public static getInstance(): EnhancedProfileService {
    if (!EnhancedProfileService.instance) {
      EnhancedProfileService.instance = new EnhancedProfileService();
    }
    return EnhancedProfileService.instance;
  }

  private constructor() {
    // Initialize services
    this.initializeServices();
  }

  /**
   * Create enhanced profile from basic profile with biometric and crypto features
   */
  public async createEnhancedProfile(
    basicProfile: Profile,
    settings: EnhancementSettings
  ): Promise<EnhancedProfile> {
    try {
      console.log('Creating enhanced profile for:', basicProfile.name);
      
      // Start with basic profile
      const enhancedProfile: EnhancedProfile = {
        ...basicProfile,
        isEnhanced: true,
        enhancementLevel: 'basic'
      };

      // Add biometric vector if enabled
      if (settings.enableBiometric && settings.biometricTypes.includes('face')) {
        console.log('Capturing biometric data...');
        const biometricConfig: BiometricCaptureConfig = {
          type: 'face',
          quality: 'high',
          livenessCheck: true,
          multipleCaptures: true,
          timeout: 30000
        };
        
        enhancedProfile.biometricVector = await this.captureBiometric(biometricConfig);
        enhancedProfile.enhancementLevel = 'biometric';
      }

      // Add semantic vector
      console.log('Generating semantic vector...');
      enhancedProfile.semanticVector = await this.generateSemanticVector(basicProfile);

      // Add token metadata
      enhancedProfile.tokenMetadata = this.createTokenMetadata(settings);

      // Add cryptographic signature if enabled
      if (settings.enableCryptographic) {
        console.log('Generating cryptographic signature...');
        enhancedProfile.signature = await cryptoService.signProfile(enhancedProfile);
        enhancedProfile.enhancementLevel = 'cryptographic';
        
        if (settings.enableBiometric) {
          enhancedProfile.enhancementLevel = 'full';
        }
      }

      // Verify the created profile
      enhancedProfile.verification = await this.verifyProfile(enhancedProfile);

      console.log('Enhanced profile created successfully');
      return enhancedProfile;
    } catch (error) {
      const errorDetails: EnhancedProfileErrorDetails = {
        code: 'BIOMETRIC_CAPTURE_FAILED',
        message: `Enhanced profile creation failed: ${error}`,
        details: error,
        timestamp: new Date().toISOString()
      };
      throw errorDetails;
    }
  }

  /**
   * Capture biometric data (face, fingerprint, etc.)
   */
  public async captureBiometric(
    config: BiometricCaptureConfig
  ): Promise<BiometricVector> {
    try {
      console.log(`Capturing ${config.type} biometric...`);
      
      if (config.type === 'face') {
        return await this.captureFaceBiometric(config);
      } else if (config.type === 'fingerprint') {
        return await this.captureFingerprintBiometric(config);
      } else {
        throw new Error(`Unsupported biometric type: ${config.type}`);
      }
    } catch (error) {
      const errorDetails: EnhancedProfileErrorDetails = {
        code: 'BIOMETRIC_CAPTURE_FAILED',
        message: `Biometric capture failed: ${error}`,
        details: error,
        timestamp: new Date().toISOString()
      };
      throw errorDetails;
    }
  }

  /**
   * Generate semantic vector from profile information
   */
  public async generateSemanticVector(profile: Profile): Promise<SemanticVector> {
    try {
      // Combine profile fields into semantic text
      const semanticText = this.createSemanticText(profile);
      
      // Encode using TinyML text encoder
      const vector = await tinyMLService.encodeText(semanticText);
      
      // Convert to base64 for storage
      const vectorBase64 = tinyMLService.float32ArrayToBase64(vector);
      
      const semanticVector: SemanticVector = {
        data: vectorBase64,
        sourceText: semanticText,
        model: 'TinyBERT_v1.0_mock',
        dimensions: 128,
        compression: 'PCA_128',
        generatedAt: new Date().toISOString()
      };
      
      return semanticVector;
    } catch (error) {
      const errorDetails: EnhancedProfileErrorDetails = {
        code: 'SEMANTIC_ENCODING_FAILED',
        message: `Semantic encoding failed: ${error}`,
        details: error,
        timestamp: new Date().toISOString()
      };
      throw errorDetails;
    }
  }

  /**
   * Verify enhanced profile integrity and authenticity
   */
  public async verifyProfile(profile: EnhancedProfile): Promise<VerificationResult> {
    try {
      const result: VerificationResult = {
        isValid: true,
        verificationLevel: 'basic',
        verifiedAt: new Date().toISOString(),
        errors: []
      };

      // Verify cryptographic signature
      if (profile.signature) {
        const signatureValid = await cryptoService.verifySignature(profile);
        result.signatureValid = signatureValid;
        
        if (signatureValid) {
          result.verificationLevel = 'cryptographic';
        } else {
          result.isValid = false;
          result.errors!.push('Invalid cryptographic signature');
        }
      }

      // Check token expiration
      if (profile.tokenMetadata?.expiresAt) {
        const expiresAt = new Date(profile.tokenMetadata.expiresAt);
        if (new Date() > expiresAt) {
          result.isValid = false;
          result.errors!.push('Token expired');
        }
      }

      // Verify biometric if present
      if (profile.biometricVector) {
        result.verificationLevel = 
          result.verificationLevel === 'cryptographic' ? 'full' : 'biometric';
      }

      return result;
    } catch (error) {
      return {
        isValid: false,
        verificationLevel: 'none',
        errors: [`Verification failed: ${error}`],
        verifiedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Refresh token with new expiration and signature
   */
  public async refreshToken(profile: EnhancedProfile): Promise<EnhancedProfile> {
    try {
      const refreshedProfile = { ...profile };
      
      // Update token metadata
      if (refreshedProfile.tokenMetadata) {
        refreshedProfile.tokenMetadata = {
          ...refreshedProfile.tokenMetadata,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };
      }
      
      // Re-sign the profile
      if (refreshedProfile.signature) {
        refreshedProfile.signature = await cryptoService.signProfile(refreshedProfile);
      }
      
      // Re-verify
      refreshedProfile.verification = await this.verifyProfile(refreshedProfile);
      
      return refreshedProfile;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error}`);
    }
  }

  /**
   * Verify live biometric against stored profile
   */
  public async verifyLiveBiometric(
    profile: EnhancedProfile,
    liveImageData: string
  ): Promise<number> {
    if (!profile.biometricVector) {
      throw new Error('Profile does not contain biometric data');
    }
    
    return await tinyMLService.verifyBiometric(profile.biometricVector, liveImageData);
  }

  /**
   * Update profile with new biometric data
   */
  public async updateBiometric(
    profile: EnhancedProfile,
    config: BiometricCaptureConfig
  ): Promise<EnhancedProfile> {
    const updatedProfile = { ...profile };
    updatedProfile.biometricVector = await this.captureBiometric(config);
    
    // Re-sign if cryptographic features are enabled
    if (updatedProfile.signature) {
      updatedProfile.signature = await cryptoService.signProfile(updatedProfile);
    }
    
    // Re-verify
    updatedProfile.verification = await this.verifyProfile(updatedProfile);
    
    return updatedProfile;
  }

  // Private methods

  /**
   * Initialize required services
   */
  private async initializeServices(): Promise<void> {
    try {
      // Initialize TinyML models in background
      tinyMLService.loadModels().catch(error => {
        console.warn('TinyML models failed to load:', error);
      });
      
      // Initialize crypto service
      cryptoService.getKeyPair().catch(error => {
        console.warn('Crypto service initialization failed:', error);
      });
    } catch (error) {
      console.warn('Service initialization failed:', error);
    }
  }

  /**
   * Capture face biometric using camera
   */
  private async captureFaceBiometric(
    config: BiometricCaptureConfig
  ): Promise<BiometricVector> {
    // Request camera permissions
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Camera permission not granted');
    }

    // Capture image(s)
    const images: string[] = [];
    const captureCount = config.multipleCaptures ? 3 : 1;
    
    for (let i = 0; i < captureCount; i++) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: config.quality === 'high' ? 1 : 0.7,
      });
      
      if (!result.canceled && result.assets[0]) {
        // Preprocess image
        const processedImage = await this.preprocessImage(result.assets[0].uri);
        images.push(processedImage);
      } else {
        throw new Error('Image capture was cancelled');
      }
    }

    // Perform liveness check if enabled
    if (config.livenessCheck && images.length > 1) {
      const isLive = await tinyMLService.checkLiveness(images);
      if (!isLive) {
        throw new Error('Liveness check failed');
      }
    }

    // Use the first/best image for encoding
    const faceVector = await tinyMLService.encodeFace(images[0]);
    const vectorBase64 = tinyMLService.float32ArrayToBase64(faceVector);
    
    const biometricVector: BiometricVector = {
      data: vectorBase64,
      model: 'FaceNet_v1.0_mock',
      dimensions: 128,
      normalization: 'l2_norm',
      capturedAt: new Date().toISOString()
    };
    
    return biometricVector;
  }

  /**
   * Capture fingerprint biometric (placeholder)
   */
  private async captureFingerprintBiometric(
    config: BiometricCaptureConfig
  ): Promise<BiometricVector> {
    // PLACEHOLDER: Implement fingerprint capture
    // This would use platform-specific fingerprint APIs
    throw new Error('Fingerprint capture not yet implemented');
  }

  /**
   * Preprocess captured image for ML models
   */
  private async preprocessImage(imageUri: string): Promise<string> {
    try {
      // Resize and crop image for face recognition
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 160, height: 160 } }, // FaceNet input size
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );
      
      return manipulatedImage.base64 || '';
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      throw error;
    }
  }

  /**
   * Create semantic text from profile data
   */
  private createSemanticText(profile: Profile): string {
    const parts: string[] = [];
    
    if (profile.name) parts.push(profile.name);
    if (profile.role) parts.push(profile.role);
    if (profile.company) parts.push(profile.company);
    
    // Add social links if available
    if (profile.socialLinks) {
      Object.values(profile.socialLinks).forEach(link => {
        if (link) parts.push(link);
      });
    }
    
    return parts.join(' ');
  }

  /**
   * Create token metadata
   */
  private createTokenMetadata(settings: EnhancementSettings): TokenMetadata {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + settings.tokenExpiration * 60 * 60 * 1000);
    
    return {
      version: '1.0',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      issuer: 'BeaconAI:LocalSession',
      permissions: ['discover', 'verify', 'exchange'],
      nonce: cryptoService.generateNonce()
    };
  }

  /**
   * Check if device supports biometric capture
   */
  public async checkBiometricSupport(): Promise<{
    face: boolean;
    fingerprint: boolean;
    voice: boolean;
  }> {
    try {
      // Check camera permissions for face
      const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
      
      return {
        face: cameraPermission.canAskAgain || cameraPermission.granted,
        fingerprint: false, // TODO: Implement fingerprint detection
        voice: false // TODO: Implement voice detection
      };
    } catch (error) {
      return { face: false, fingerprint: false, voice: false };
    }
  }

  /**
   * Get enhancement recommendations based on device capabilities
   */
  public async getEnhancementRecommendations(): Promise<EnhancementSettings> {
    const support = await this.checkBiometricSupport();
    
    return {
      enableBiometric: support.face,
      enableCryptographic: true,
      biometricTypes: support.face ? ['face'] : [],
      tokenExpiration: 24, // 24 hours
      autoRefresh: true,
      privacyLevel: 'balanced',
      requireVerification: false
    };
  }
}

// Export singleton instance
export const enhancedProfileService = EnhancedProfileService.getInstance();