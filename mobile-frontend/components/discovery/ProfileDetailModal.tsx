import React, { useRef } from 'react';
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
} from 'react-native';
import { X, Linkedin, Twitter, Globe, Copy } from 'lucide-react-native';
import { PeerProfile } from '@/types/profile';

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

  const copyProfileToClipboard = () => {
    const profileText = `
Name: ${peer.name || 'Not provided'}
Role: ${peer.role || 'Not provided'}
Company: ${peer.company || 'Not provided'}
${peer.socialLinks?.linkedin ? `LinkedIn: ${peer.socialLinks.linkedin}` : ''}
${peer.socialLinks?.twitter ? `Twitter: ${peer.socialLinks.twitter}` : ''}
${peer.socialLinks?.website ? `Website: ${peer.socialLinks.website}` : ''}
    `.trim();
    
    copyToClipboard(profileText, 'Profile');
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
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {peer.name
                    ? peer.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                    : '?'}
                </Text>
              </View>

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
                First seen: {new Date().toLocaleTimeString()}
              </Text>
              <Text style={styles.metaText}>Device ID: {peer.uuid}</Text>
            </View>
          </ScrollView>

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={copyProfileToClipboard}
            >
              <Copy size={18} color="#FFFFFF" style={styles.copyIcon} />
              <Text style={styles.copyButtonText}>Copy Contact Info</Text>
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
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#5046E5',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
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
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  copyButton: {
    backgroundColor: '#5046E5',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyIcon: {
    marginRight: 8,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});