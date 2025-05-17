import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/components/common/Header';
import { CreditCard as Edit, Linkedin, Twitter, Globe } from 'lucide-react-native';

export default function ProfileScreen() {
  const { profile, saveProfile, isProfileComplete } = useProfile();
  const [isEditing, setIsEditing] = useState(!isProfileComplete);
  const [name, setName] = useState(profile.name || '');
  const [role, setRole] = useState(profile.role || '');
  const [company, setCompany] = useState(profile.company || '');
  const [linkedin, setLinkedin] = useState(profile.socialLinks?.linkedin || '');
  const [twitter, setTwitter] = useState(profile.socialLinks?.twitter || '');
  const [website, setWebsite] = useState(profile.socialLinks?.website || '');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your name to continue');
      return;
    }

    const updatedProfile = {
      ...profile,
      name,
      role,
      company,
      socialLinks: {
        linkedin,
        twitter,
        website
      }
    };

    saveProfile(updatedProfile);
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <Header
          title="Your Profile"
          rightIcon={isEditing ? null : <Edit color="#5046E5" size={24} />}
          onRightPress={() => setIsEditing(true)}
        />
        
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {isEditing ? (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Role / Title</Text>
                <TextInput
                  style={styles.input}
                  value={role}
                  onChangeText={setRole}
                  placeholder="Your professional role"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company / Organization</Text>
                <TextInput
                  style={styles.input}
                  value={company}
                  onChangeText={setCompany}
                  placeholder="Where you work"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              
              <Text style={styles.sectionTitle}>Social Links (Optional)</Text>
              
              <View style={styles.socialInputGroup}>
                <Linkedin size={20} color="#0A66C2" style={styles.socialIcon} />
                <TextInput
                  style={styles.socialInput}
                  value={linkedin}
                  onChangeText={setLinkedin}
                  placeholder="LinkedIn username"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              
              <View style={styles.socialInputGroup}>
                <Twitter size={20} color="#1DA1F2" style={styles.socialIcon} />
                <TextInput
                  style={styles.socialInput}
                  value={twitter}
                  onChangeText={setTwitter}
                  placeholder="Twitter handle"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              
              <View style={styles.socialInputGroup}>
                <Globe size={20} color="#64748B" style={styles.socialIcon} />
                <TextInput
                  style={styles.socialInput}
                  value={website}
                  onChangeText={setWebsite}
                  placeholder="Personal website"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.profileDisplay}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
              </View>
              
              <Text style={styles.displayName}>{name}</Text>
              
              {role ? (
                <Text style={styles.displayRole}>{role}</Text>
              ) : null}
              
              {company ? (
                <Text style={styles.displayCompany}>{company}</Text>
              ) : null}
              
              {(linkedin || twitter || website) && (
                <View style={styles.socialLinks}>
                  {linkedin && (
                    <View style={styles.socialItem}>
                      <Linkedin size={20} color="#0A66C2" />
                      <Text style={styles.socialText}>LinkedIn</Text>
                    </View>
                  )}
                  
                  {twitter && (
                    <View style={styles.socialItem}>
                      <Twitter size={20} color="#1DA1F2" />
                      <Text style={styles.socialText}>Twitter</Text>
                    </View>
                  )}
                  
                  {website && (
                    <View style={styles.socialItem}>
                      <Globe size={20} color="#64748B" />
                      <Text style={styles.socialText}>Website</Text>
                    </View>
                  )}
                </View>
              )}
              
              <Text style={styles.idText}>Device ID: {profile.uuid}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#334155',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginTop: 24,
    marginBottom: 16,
  },
  socialInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  socialIcon: {
    marginRight: 12,
  },
  socialInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#0F172A',
  },
  saveButton: {
    backgroundColor: '#5046E5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  profileDisplay: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#5046E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '600',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  displayRole: {
    fontSize: 18,
    color: '#334155',
    marginBottom: 4,
  },
  displayCompany: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
  },
  socialLinks: {
    marginTop: 16,
    marginBottom: 24,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  socialText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#334155',
  },
  idText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 16,
  },
});