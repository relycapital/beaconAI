import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert, Platform, AppState, AppStateStatus } from 'react-native';
import { useProfile } from './ProfileContext';
import { useSettings } from './SettingsContext';
import { useDiscovery } from './DiscoveryContext';
import { Profile, PeerProfile } from '../types/profile';
import {
  EnhancedProfile,
  EnhancedPeerProfile,
  PeerCapabilities,
  EnhancementSettings,
  VerificationResult,
  BiometricCaptureConfig
} from '../types/enhanced-profile';
import { enhancedBleService } from '../services/EnhancedBleService';
import { enhancedProfileService } from '../services/EnhancedProfileService';
import { cryptoService } from '../services/CryptoService';
import { DiscoverySession } from '../types/session';
import sessionService from '../services/SessionService';

type EnhancedDiscoveryStatus = 
  | 'idle' 
  | 'basic_discovery' 
  | 'enhanced_discovery' 
  | 'profile_exchange' 
  | 'biometric_verification'
  | 'error';

interface EnhancedDiscoveryContextType {
  // Enhanced discovery state
  isEnhancedMode: boolean;
  enhancedStatus: EnhancedDiscoveryStatus;
  enhancedPeers: EnhancedPeerProfile[];
  userEnhancedProfile: EnhancedProfile | null;
  supportedCapabilities: PeerCapabilities;
  
  // Enhanced discovery actions
  enableEnhancedMode: () => Promise<boolean>;
  disableEnhancedMode: () => Promise<void>;
  startEnhancedDiscovery: () => Promise<boolean>;
  stopEnhancedDiscovery: () => Promise<void>;
  
  // Profile management
  createEnhancedProfile: (settings: EnhancementSettings) => Promise<EnhancedProfile>;
  refreshEnhancedProfile: () => Promise<void>;
  captureBiometric: (config: BiometricCaptureConfig) => Promise<void>;
  
  // Peer interactions
  exchangeProfileWithPeer: (peerUuid: string) => Promise<EnhancedProfile | null>;
  verifyPeerBiometric: (peerUuid: string, liveCapture: string) => Promise<number>;
  getPeerCapabilities: (peerUuid: string) => PeerCapabilities | null;
  
  // Verification and security
  verifyPeerProfile: (peerUuid: string) => Promise<VerificationResult | null>;
  checkPeerTrust: (peerUuid: string) => Promise<number>; // Trust score 0-1
  
  // Settings and preferences
  enhancementSettings: EnhancementSettings;
  updateEnhancementSettings: (settings: Partial<EnhancementSettings>) => void;
  
  // Backwards compatibility
  fallbackToBasicMode: () => void;
}

const defaultEnhancementSettings: EnhancementSettings = {
  enableBiometric: false,
  enableCryptographic: true,
  biometricTypes: ['face'],
  tokenExpiration: 24,
  autoRefresh: true,
  privacyLevel: 'balanced',
  requireVerification: false
};

const EnhancedDiscoveryContext = createContext<EnhancedDiscoveryContextType>({
  isEnhancedMode: false,
  enhancedStatus: 'idle',
  enhancedPeers: [],
  userEnhancedProfile: null,
  supportedCapabilities: {
    basic: true,
    enhanced: false,
    biometric: false,
    cryptographic: false,
    revocation: false,
    zeroKnowledge: false
  },
  enableEnhancedMode: async () => false,
  disableEnhancedMode: async () => {},
  startEnhancedDiscovery: async () => false,
  stopEnhancedDiscovery: async () => {},
  createEnhancedProfile: async () => ({} as EnhancedProfile),
  refreshEnhancedProfile: async () => {},
  captureBiometric: async () => {},
  exchangeProfileWithPeer: async () => null,
  verifyPeerBiometric: async () => 0,
  getPeerCapabilities: () => null,
  verifyPeerProfile: async () => null,
  checkPeerTrust: async () => 0,
  enhancementSettings: defaultEnhancementSettings,
  updateEnhancementSettings: () => {},
  fallbackToBasicMode: () => {}
});

export const useEnhancedDiscovery = () => useContext(EnhancedDiscoveryContext);

export const EnhancedDiscoveryProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { profile, isProfileComplete } = useProfile();
  const { settings } = useSettings();
  const basicDiscovery = useDiscovery();
  
  // Enhanced discovery state
  const [isEnhancedMode, setIsEnhancedMode] = useState(false);
  const [enhancedStatus, setEnhancedStatus] = useState<EnhancedDiscoveryStatus>('idle');
  const [enhancedPeers, setEnhancedPeers] = useState<EnhancedPeerProfile[]>([]);
  const [userEnhancedProfile, setUserEnhancedProfile] = useState<EnhancedProfile | null>(null);
  const [enhancementSettings, setEnhancementSettings] = useState<EnhancementSettings>(defaultEnhancementSettings);
  const [supportedCapabilities, setSupportedCapabilities] = useState<PeerCapabilities>({
    basic: true,
    enhanced: true,
    biometric: false,
    cryptographic: true,
    revocation: false,
    zeroKnowledge: false
  });
  
  // Refs for cleanup
  const enhancedDiscoveryTimeoutRef = useRef<number | null>(null);
  const profileRefreshIntervalRef = useRef<number | null>(null);

  // Initialize enhanced capabilities on mount
  useEffect(() => {
    initializeEnhancedCapabilities();
    
    return () => {
      cleanup();
    };
  }, []);

  // Sync basic discovery state with enhanced state
  useEffect(() => {
    if (basicDiscovery.isDiscovering && !isEnhancedMode) {
      // Convert basic peers to enhanced format
      const convertedPeers = basicDiscovery.nearbyPeers.map(basicPeer => 
        convertBasicToEnhancedPeer(basicPeer)
      );
      setEnhancedPeers(convertedPeers);
    }
  }, [basicDiscovery.nearbyPeers, isEnhancedMode]);

  /**
   * Initialize enhanced capabilities based on device support
   */
  const initializeEnhancedCapabilities = async () => {
    try {
      // Check device capabilities
      const biometricSupport = await enhancedProfileService.checkBiometricSupport();
      const cryptoSupport = await cryptoService.hasValidKeys();
      
      const capabilities: PeerCapabilities = {
        basic: true,
        enhanced: true,
        biometric: biometricSupport.face || biometricSupport.fingerprint,
        cryptographic: true, // Always supported
        revocation: false, // Phase 4 feature
        zeroKnowledge: false // Phase 4 feature
      };
      
      setSupportedCapabilities(capabilities);
      enhancedBleService.updateSupportedCapabilities(capabilities);
      
      // Get enhancement recommendations
      const recommendations = await enhancedProfileService.getEnhancementRecommendations();
      setEnhancementSettings(recommendations);
      
      console.log('Enhanced capabilities initialized:', capabilities);
    } catch (error) {
      console.error('Failed to initialize enhanced capabilities:', error);
    }
  };

  /**
   * Enable enhanced mode
   */
  const enableEnhancedMode = async (): Promise<boolean> => {
    try {
      console.log('Enabling enhanced discovery mode...');
      
      if (!profile || !isProfileComplete) {
        Alert.alert('Profile Required', 'Please complete your profile before enabling enhanced mode.');
        return false;
      }
      
      // Create enhanced profile if it doesn't exist
      if (!userEnhancedProfile) {
        setEnhancedStatus('profile_exchange');
        const enhanced = await createEnhancedProfile(enhancementSettings);
        if (!enhanced) {
          setEnhancedStatus('error');
          return false;
        }
      }
      
      setIsEnhancedMode(true);
      setEnhancedStatus('enhanced_discovery');
      
      console.log('Enhanced mode enabled successfully');
      return true;
    } catch (error) {
      console.error('Failed to enable enhanced mode:', error);
      setEnhancedStatus('error');
      return false;
    }
  };

  /**
   * Disable enhanced mode
   */
  const disableEnhancedMode = async (): Promise<void> => {
    console.log('Disabling enhanced discovery mode...');
    
    await stopEnhancedDiscovery();
    setIsEnhancedMode(false);
    setEnhancedStatus('idle');
    setEnhancedPeers([]);
    
    console.log('Enhanced mode disabled');
  };

  /**
   * Start enhanced discovery
   */
  const startEnhancedDiscovery = async (): Promise<boolean> => {
    try {
      if (!userEnhancedProfile) {
        console.warn('No enhanced profile available for discovery');
        return false;
      }
      
      console.log('Starting enhanced discovery...');
      setEnhancedStatus('enhanced_discovery');
      
      const success = await enhancedBleService.startEnhancedDiscovery(
        userEnhancedProfile,
        handleEnhancedPeerDiscovery
      );
      
      if (success) {
        // Set discovery timeout (default 5 minutes)
        enhancedDiscoveryTimeoutRef.current = window.setTimeout(() => {
          stopEnhancedDiscovery();
        }, 5 * 60 * 1000);
        
        // Start profile refresh interval if auto-refresh is enabled
        if (enhancementSettings.autoRefresh) {
          profileRefreshIntervalRef.current = window.setInterval(() => {
            refreshEnhancedProfile();
          }, enhancementSettings.tokenExpiration * 60 * 60 * 1000 / 2); // Refresh at half expiration time
        }
        
        console.log('Enhanced discovery started successfully');
      } else {
        setEnhancedStatus('error');
      }
      
      return success;
    } catch (error) {
      console.error('Failed to start enhanced discovery:', error);
      setEnhancedStatus('error');
      return false;
    }
  };

  /**
   * Stop enhanced discovery
   */
  const stopEnhancedDiscovery = async (): Promise<void> => {
    console.log('Stopping enhanced discovery...');
    
    await enhancedBleService.stopEnhancedDiscovery();
    cleanup();
    setEnhancedStatus('idle');
    
    console.log('Enhanced discovery stopped');
  };

  /**
   * Create enhanced profile
   */
  const createEnhancedProfile = async (settings: EnhancementSettings): Promise<EnhancedProfile | null> => {
    try {
      if (!profile) {
        throw new Error('Basic profile required');
      }
      
      console.log('Creating enhanced profile...');
      
      const enhanced = await enhancedProfileService.createEnhancedProfile(profile, settings);
      setUserEnhancedProfile(enhanced);
      
      console.log('Enhanced profile created successfully');
      return enhanced;
    } catch (error) {
      console.error('Failed to create enhanced profile:', error);
      Alert.alert('Enhanced Profile Error', 'Failed to create enhanced profile. Please try again.');
      return null;
    }
  };

  /**
   * Refresh enhanced profile
   */
  const refreshEnhancedProfile = async (): Promise<void> => {
    try {
      if (!userEnhancedProfile) {
        return;
      }
      
      console.log('Refreshing enhanced profile...');
      
      const refreshed = await enhancedProfileService.refreshToken(userEnhancedProfile);
      setUserEnhancedProfile(refreshed);
      
      console.log('Enhanced profile refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh enhanced profile:', error);
    }
  };

  /**
   * Capture biometric data
   */
  const captureBiometric = async (config: BiometricCaptureConfig): Promise<void> => {
    try {
      if (!userEnhancedProfile) {
        throw new Error('Enhanced profile required');
      }
      
      setEnhancedStatus('biometric_verification');
      console.log('Capturing biometric data...');
      
      const updated = await enhancedProfileService.updateBiometric(userEnhancedProfile, config);
      setUserEnhancedProfile(updated);
      
      setEnhancedStatus('enhanced_discovery');
      console.log('Biometric capture completed successfully');
    } catch (error) {
      console.error('Failed to capture biometric:', error);
      setEnhancedStatus('error');
      Alert.alert('Biometric Capture Error', 'Failed to capture biometric data. Please try again.');
    }
  };

  /**
   * Exchange profile with peer
   */
  const exchangeProfileWithPeer = async (peerUuid: string): Promise<EnhancedProfile | null> => {
    try {
      if (!userEnhancedProfile) {
        throw new Error('Enhanced profile required');
      }
      
      setEnhancedStatus('profile_exchange');
      console.log(`Exchanging profile with peer: ${peerUuid}`);
      
      const peerProfile = await enhancedBleService.exchangeEnhancedProfile(peerUuid, userEnhancedProfile);
      
      if (peerProfile) {
        // Update peer in discovered list
        setEnhancedPeers(current => 
          current.map(peer => 
            peer.uuid === peerUuid 
              ? { ...peer, ...peerProfile, isEnhanced: true }
              : peer
          )
        );
        
        // Log interaction
        await sessionService.logPeerInteraction(peerUuid, 'exchanged');
      }
      
      setEnhancedStatus('enhanced_discovery');
      return peerProfile;
    } catch (error) {
      console.error('Failed to exchange profile:', error);
      setEnhancedStatus('error');
      return null;
    }
  };

  /**
   * Verify peer biometric
   */
  const verifyPeerBiometric = async (peerUuid: string, liveCapture: string): Promise<number> => {
    try {
      const peer = enhancedPeers.find(p => p.uuid === peerUuid);
      if (!peer || !peer.biometricVector) {
        throw new Error('Peer biometric data not available');
      }
      
      setEnhancedStatus('biometric_verification');
      
      const similarity = await enhancedProfileService.verifyLiveBiometric(
        peer as EnhancedProfile,
        liveCapture
      );
      
      setEnhancedStatus('enhanced_discovery');
      
      // Log verification attempt
      await sessionService.logPeerInteraction(peerUuid, 'biometric_verified');
      
      return similarity;
    } catch (error) {
      console.error('Failed to verify peer biometric:', error);
      setEnhancedStatus('error');
      return 0;
    }
  };

  /**
   * Get peer capabilities
   */
  const getPeerCapabilities = (peerUuid: string): PeerCapabilities | null => {
    const peer = enhancedPeers.find(p => p.uuid === peerUuid);
    return peer?.capabilities || null;
  };

  /**
   * Verify peer profile
   */
  const verifyPeerProfile = async (peerUuid: string): Promise<VerificationResult | null> => {
    try {
      const peer = enhancedPeers.find(p => p.uuid === peerUuid);
      if (!peer) {
        return null;
      }
      
      const verification = await enhancedProfileService.verifyProfile(peer as EnhancedProfile);
      
      // Update peer verification status
      setEnhancedPeers(current => 
        current.map(p => 
          p.uuid === peerUuid 
            ? { ...p, verification }
            : p
        )
      );
      
      return verification;
    } catch (error) {
      console.error('Failed to verify peer profile:', error);
      return null;
    }
  };

  /**
   * Check peer trust score
   */
  const checkPeerTrust = async (peerUuid: string): Promise<number> => {
    try {
      const peer = enhancedPeers.find(p => p.uuid === peerUuid);
      if (!peer) {
        return 0;
      }
      
      let trustScore = 0.5; // Base trust
      
      // Increase trust based on verification
      if (peer.verification?.isValid) {
        trustScore += 0.3;
        
        if (peer.verification.verificationLevel === 'cryptographic') {
          trustScore += 0.1;
        } else if (peer.verification.verificationLevel === 'full') {
          trustScore += 0.2;
        }
      }
      
      // Increase trust based on capabilities
      if (peer.capabilities?.cryptographic) {
        trustScore += 0.1;
      }
      
      // Cap at 1.0
      return Math.min(trustScore, 1.0);
    } catch (error) {
      console.error('Failed to check peer trust:', error);
      return 0;
    }
  };

  /**
   * Update enhancement settings
   */
  const updateEnhancementSettings = (newSettings: Partial<EnhancementSettings>): void => {
    setEnhancementSettings(current => ({ ...current, ...newSettings }));
  };

  /**
   * Fallback to basic mode
   */
  const fallbackToBasicMode = (): void => {
    console.log('Falling back to basic discovery mode');
    setIsEnhancedMode(false);
    setEnhancedStatus('basic_discovery');
  };

  // Helper functions

  /**
   * Handle enhanced peer discovery
   */
  const handleEnhancedPeerDiscovery = (peer: EnhancedPeerProfile): void => {
    setEnhancedPeers(current => {
      const existingIndex = current.findIndex(p => p.uuid === peer.uuid);
      
      if (existingIndex >= 0) {
        // Update existing peer
        const updated = [...current];
        updated[existingIndex] = { ...updated[existingIndex], ...peer, lastSeen: Date.now() };
        return updated;
      } else {
        // Add new peer
        return [...current, peer];
      }
    });
    
    console.log(`Enhanced peer discovered: ${peer.name} (${peer.enhancementLevel})`);
  };

  /**
   * Convert basic peer to enhanced peer format
   */
  const convertBasicToEnhancedPeer = (basicPeer: PeerProfile): EnhancedPeerProfile => {
    return {
      ...basicPeer,
      isEnhanced: false,
      enhancementLevel: 'basic',
      discoveryMethod: 'basic',
      capabilities: {
        basic: true,
        enhanced: false,
        biometric: false,
        cryptographic: false,
        revocation: false,
        zeroKnowledge: false
      }
    };
  };

  /**
   * Cleanup function
   */
  const cleanup = (): void => {
    if (enhancedDiscoveryTimeoutRef.current) {
      clearTimeout(enhancedDiscoveryTimeoutRef.current);
      enhancedDiscoveryTimeoutRef.current = null;
    }
    
    if (profileRefreshIntervalRef.current) {
      clearInterval(profileRefreshIntervalRef.current);
      profileRefreshIntervalRef.current = null;
    }
  };

  const contextValue: EnhancedDiscoveryContextType = {
    isEnhancedMode,
    enhancedStatus,
    enhancedPeers,
    userEnhancedProfile,
    supportedCapabilities,
    enableEnhancedMode,
    disableEnhancedMode,
    startEnhancedDiscovery,
    stopEnhancedDiscovery,
    createEnhancedProfile,
    refreshEnhancedProfile,
    captureBiometric,
    exchangeProfileWithPeer,
    verifyPeerBiometric,
    getPeerCapabilities,
    verifyPeerProfile,
    checkPeerTrust,
    enhancementSettings,
    updateEnhancementSettings,
    fallbackToBasicMode
  };

  return (
    <EnhancedDiscoveryContext.Provider value={contextValue}>
      {children}
    </EnhancedDiscoveryContext.Provider>
  );
};

export default EnhancedDiscoveryProvider;