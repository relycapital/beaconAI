import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Clipboard,
  Platform,
  Alert,
  Share,
} from 'react-native';
import { X, Linkedin, Twitter, Globe, Copy, Share2, Heart } from 'lucide-react-native';
import { PeerProfile } from '@/types/profile';
import { useDiscovery } from '@/context/DiscoveryContext';
import Avatar from '@/components/common/Avatar';

interface ProfileDetailModalProps {
  visible: boolean;
  peer: PeerProfile;
  onClose: () => void;
}

export default function ProfileDetailModal({
  visible,
  peer,
  onClose,
}: ProfileDetailModalProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { logPeerInteraction } = useDiscovery();

  // Log that the user viewed this peer's profile
  useEffect(() => {
    if (visible && peer) {
      logPeerInteraction(peer.uuid, 'viewed');
    }
  }, [visible, peer]);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const copyToClipboard = (text: string, label: string) => {
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(text);
    } else {
      Clipboard.setString(text);
    }
    
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const getFormattedProfile = () => {
    return `
Name: ${peer.name || 'Not provided'}
Role: ${peer.role || 'Not provided'}
Company: ${peer.company || 'Not provided'}
${peer.socialLinks?.linkedin ? `LinkedIn: ${peer.socialLinks.linkedin}` : ''}
${peer.socialLinks?.twitter ? `Twitter: ${peer.socialLinks.twitter}` : ''}
${peer.socialLinks?.website ? `Website: ${peer.socialLinks.website}` : ''}

Discovered via BeaconAI
    `.trim();
  };

  const copyProfileToClipboard = async () => {
    const profileText = getFormattedProfile();
    copyToClipboard(profileText, 'Profile');
    await logPeerInteraction(peer.uuid, 'saved');
  };

  const shareProfile = async () => {
    try {
      const profileText = getFormattedProfile();
      
      if (Platform.OS === 'web') {
        // Web fallback - copy to clipboard
        copyToClipboard(profileText, 'Profile (web share not supported)');
      } else {
        await Share.share({
          message: profileText,
          title: `${peer.name || 'Contact'} - BeaconAI`,
        });
      }
      
      await logPeerInteraction(peer.uuid, 'shared');
    } catch (error) {
      console.error('Error sharing profile:', error);
      Alert.alert('Share Error', 'Unable to share profile. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Profile Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.profileSection}>
              <Avatar 
                name={peer.name}
                avatarUri={peer.avatarUri}
                size={80}
                backgroundColor="#EEF2FF"
                textColor="#5046E5"
              />

              <Text style={styles.name}>{peer.name || 'Unknown'}</Text>

              {peer.role ? <Text style={styles.role}>{peer.role}</Text> : null}

              {peer.company ? (
                <Text style={styles.company}>{peer.company}</Text>
              ) : null}
            </View>

            {(peer.socialLinks?.linkedin ||
              peer.socialLinks?.twitter ||
              peer.socialLinks?.website) && (
              <View style={styles.socialSection}>
                <Text style={styles.sectionTitle}>Social Links</Text>

                {peer.socialLinks?.linkedin && (
                  <TouchableOpacity
                    style={styles.socialItem}
                    onPress={() =>
                      copyToClipboard(
                        peer.socialLinks?.linkedin || '',
                        'LinkedIn'
                      )
                    }
                  >
                    <Linkedin size={20} color="#0A66C2" />
                    <Text style={styles.socialText}>
                      {peer.socialLinks.linkedin}
                    </Text>
                    <Copy size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}

                {peer.socialLinks?.twitter && (
                  <TouchableOpacity
                    style={styles.socialItem}
                    onPress={() =>
                      copyToClipboard(
                        peer.socialLinks?.twitter || '',
                        'Twitter'
                      )
                    }
                  >
                    <Twitter size={20} color="#1DA1F2" />
                    <Text style={styles.socialText}>
                      {peer.socialLinks.twitter}
                    </Text>
                    <Copy size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}

                {peer.socialLinks?.website && (
                  <TouchableOpacity
                    style={styles.socialItem}
                    onPress={() =>
                      copyToClipboard(
                        peer.socialLinks?.website || '',
                        'Website'
                      )
                    }
                  >
                    <Globe size={20} color="#64748B" />
                    <Text style={styles.socialText}>
                      {peer.socialLinks.website}
                    </Text>
                    <Copy size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.metaSection}>
              <Text style={styles.metaText}>
                First seen: {peer.discoveredAt ? new Date(peer.discoveredAt).toLocaleString() : 'Unknown'}
              </Text>
              {peer.rssi && (
                <Text style={styles.metaText}>
                  Signal strength: {peer.rssi} dBm
                </Text>
              )}
              <Text style={styles.metaText}>Device ID: {peer.uuid}</Text>
            </View>
          </ScrollView>

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={copyProfileToClipboard}
            >
              <Copy size={18} color="#FFFFFF" style={styles.actionIcon} />
              <Text style={styles.actionButtonText}>Copy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={shareProfile}
            >
              <Share2 size={18} color="#5046E5" style={styles.actionIcon} />
              <Text style={[styles.actionButtonText, styles.shareButtonText]}>Share</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '60%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#334155',
    marginBottom: 4,
  },
  company: {
    fontSize: 16,
    color: '#64748B',
  },
  socialSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  socialText: {
    flex: 1,
    fontSize: 16,
    color: '#334155',
    marginLeft: 12,
  },
  metaSection: {
    marginBottom: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#5046E5',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButtonText: {
    color: '#5046E5',
  },
});