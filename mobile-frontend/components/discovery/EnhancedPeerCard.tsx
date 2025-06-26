import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { PeerProfile } from '../../types/profile';
import { EnhancedPeerProfile, VerificationResult } from '../../types/enhanced-profile';
import { formatDistanceToBrand } from '../../utils/format';
import Avatar from '../common/Avatar';
import VerificationBadge from './VerificationBadge';

interface EnhancedPeerCardProps {
  peer: EnhancedPeerProfile | PeerProfile;
  onPress: () => void;
  onVerify?: () => void;
  onExchangeProfile?: () => void;
  showVerificationStatus?: boolean;
  showCapabilities?: boolean;
  isEnhancedMode?: boolean;
}

function isEnhancedPeer(peer: EnhancedPeerProfile | PeerProfile): peer is EnhancedPeerProfile {
  return 'isEnhanced' in peer;
}

export default function EnhancedPeerCard({ 
  peer, 
  onPress, 
  onVerify,
  onExchangeProfile,
  showVerificationStatus = false,
  showCapabilities = false,
  isEnhancedMode = false
}: EnhancedPeerCardProps) {
  // Simple animation for card entry
  const opacity = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const enhancedPeer = isEnhancedPeer(peer) ? peer : null;
  const isEnhanced = enhancedPeer?.isEnhanced || false;
  const verification = enhancedPeer?.verification;
  const capabilities = enhancedPeer?.capabilities;

  return (
    <Animated.View style={{ opacity }}>
      <TouchableOpacity 
        style={[
          styles.container,
          isEnhanced && styles.enhancedContainer
        ]} 
        onPress={onPress}
      >
        <Avatar 
          name={peer.name}
          avatarUri={peer.avatarUri}
          size={48}
        />
        
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{peer.name || 'Unknown'}</Text>
            
            {/* Enhanced Mode Indicator */}
            {isEnhanced && (
              <View style={styles.enhancedIndicator}>
                <Text style={styles.enhancedText}>✓</Text>
              </View>
            )}
          </View>
          
          {peer.role && (
            <Text style={styles.role}>{peer.role}</Text>
          )}
          
          {peer.company && (
            <Text style={styles.company}>{peer.company}</Text>
          )}
          
          {/* Verification Status */}
          {showVerificationStatus && verification && (
            <VerificationBadge 
              verification={verification}
              style={styles.verificationBadge}
            />
          )}
          
          {/* Capabilities Row */}
          {showCapabilities && capabilities && (
            <View style={styles.capabilitiesRow}>
              {capabilities.biometric && (
                <View style={[styles.capabilityBadge, styles.biometricBadge]}>
                  <Text style={styles.capabilityText}>🔍</Text>
                </View>
              )}
              {capabilities.cryptographic && (
                <View style={[styles.capabilityBadge, styles.cryptoBadge]}>
                  <Text style={styles.capabilityText}>🔐</Text>
                </View>
              )}
              {capabilities.enhanced && (
                <View style={[styles.capabilityBadge, styles.enhancedBadge]}>
                  <Text style={styles.capabilityText}>⚡</Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        {/* Signal and Actions Container */}
        <View style={styles.rightContainer}>
          {/* Signal Strength */}
          <View style={styles.signalContainer}>
            <View style={[
              styles.signalStrength, 
              { backgroundColor: getSignalColor(peer.rssi || -70) }
            ]} />
            <Text style={styles.distance}>
              {formatDistanceToBrand(peer.rssi || -70)}
            </Text>
          </View>
          
          {/* Enhanced Actions */}
          {isEnhancedMode && isEnhanced && (
            <View style={styles.actionsContainer}>
              {capabilities?.cryptographic && onVerify && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.verifyButton]}
                  onPress={onVerify}
                >
                  <Text style={styles.actionButtonText}>Verify</Text>
                </TouchableOpacity>
              )}
              
              {capabilities?.enhanced && onExchangeProfile && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.exchangeButton]}
                  onPress={onExchangeProfile}
                >
                  <Text style={styles.actionButtonText}>Exchange</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Helper function to determine signal color based on RSSI
function getSignalColor(rssi: number): string {
  if (rssi > -60) return '#10B981'; // strong - green
  if (rssi > -75) return '#FBBF24'; // medium - yellow
  return '#94A3B8'; // weak - gray
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.5,
    elevation: 2,
  },
  enhancedContainer: {
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: '#F8FAFC',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  enhancedIndicator: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  enhancedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  company: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 1,
  },
  verificationBadge: {
    marginTop: 6,
  },
  capabilitiesRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 4,
  },
  capabilityBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricBadge: {
    backgroundColor: '#E0F2FE',
  },
  cryptoBadge: {
    backgroundColor: '#F0FDF4',
  },
  enhancedBadge: {
    backgroundColor: '#FEF3C7',
  },
  capabilityText: {
    fontSize: 10,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 60,
  },
  signalContainer: {
    alignItems: 'center',
  },
  signalStrength: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  distance: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 8,
    gap: 4,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 60,
  },
  verifyButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  exchangeButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
});