import { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '@/context/ProfileContext';
import { useDiscovery } from '@/context/DiscoveryContext';
import { useSettings } from '@/context/SettingsContext';
import Header from '@/components/common/Header';
import { Trash2, TriangleAlert as AlertTriangle, CircleHelp as HelpCircle, Shield, Clock, Bell, Bluetooth } from 'lucide-react-native';

export default function SettingsScreen() {
  const { resetProfile } = useProfile();
  const { isDiscovering, stopDiscovery } = useDiscovery();
  const { settings, updateSettings, resetSettings } = useSettings();
  
  const handleResetProfile = () => {
    Alert.alert(
      'Reset Profile',
      'Are you sure you want to reset your profile? This will delete all your profile information.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            if (isDiscovering) {
              stopDiscovery();
            }
            resetProfile();
          },
        },
      ],
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Settings" />
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discovery Preferences</Text>
          
          <View style={styles.setting}>
            <View style={styles.settingTextContainer}>
              <View style={styles.settingTitleContainer}>
                <Bluetooth size={20} color="#334155" style={styles.settingIcon} />
                <Text style={styles.settingTitle}>Bluetooth Advertising</Text>
              </View>
              <Text style={styles.settingDescription}>
                Allow your device to be discovered by nearby peers
              </Text>
            </View>
            <Switch
              value={settings.advertisingEnabled}
              onValueChange={(value) => updateSettings({ advertisingEnabled: value })}
              trackColor={{ false: '#CBD5E1', true: '#C7D2FE' }}
              thumbColor={settings.advertisingEnabled ? '#5046E5' : '#F8FAFC'}
            />
          </View>
          
          <View style={styles.setting}>
            <View style={styles.settingTextContainer}>
              <View style={styles.settingTitleContainer}>
                <Clock size={20} color="#334155" style={styles.settingIcon} />
                <Text style={styles.settingTitle}>Auto-expire peers ({settings.autoExpireTimeout} min)</Text>
              </View>
              <Text style={styles.settingDescription}>
                Remove discovered peers after {settings.autoExpireTimeout} minutes of inactivity
              </Text>
            </View>
          </View>
          
          <View style={styles.setting}>
            <View style={styles.settingTextContainer}>
              <View style={styles.settingTitleContainer}>
                <Bell size={20} color="#334155" style={styles.settingIcon} />
                <Text style={styles.settingTitle}>Notifications</Text>
              </View>
              <Text style={styles.settingDescription}>
                Show notifications when new peers are discovered
              </Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) => updateSettings({ notificationsEnabled: value })}
              trackColor={{ false: '#CBD5E1', true: '#C7D2FE' }}
              thumbColor={settings.notificationsEnabled ? '#5046E5' : '#F8FAFC'}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <View style={styles.setting}>
            <View style={styles.settingTextContainer}>
              <View style={styles.settingTitleContainer}>
                <Shield size={20} color="#334155" style={styles.settingIcon} />
                <Text style={styles.settingTitle}>Privacy Mode</Text>
              </View>
              <Text style={styles.settingDescription}>
                Disable all peer visibility and discovery features
              </Text>
            </View>
            <Switch
              value={settings.privacyMode}
              onValueChange={(value) => updateSettings({ privacyMode: value })}
              trackColor={{ false: '#CBD5E1', true: '#C7D2FE' }}
              thumbColor={settings.privacyMode ? '#5046E5' : '#F8FAFC'}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.supportItem}>
            <HelpCircle size={20} color="#334155" style={styles.supportIcon} />
            <Text style={styles.supportText}>Help & FAQ</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.dangerSection}>
          <TouchableOpacity 
            style={[styles.dangerButton, { marginBottom: 12 }]}
            onPress={() => {
              Alert.alert(
                'Reset Settings',
                'Are you sure you want to reset all settings to default values?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Reset', 
                    style: 'destructive',
                    onPress: () => resetSettings()
                  }
                ]
              );
            }}
          >
            <AlertTriangle size={20} color="#F59E0B" />
            <Text style={[styles.dangerButtonText, { color: '#F59E0B' }]}>Reset Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleResetProfile}
          >
            <Trash2 size={20} color="#EF4444" />
            <Text style={styles.dangerButtonText}>Reset Profile</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.versionText}>BeaconAI v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingIcon: {
    marginRight: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 28,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  supportIcon: {
    marginRight: 12,
  },
  supportText: {
    fontSize: 16,
    color: '#334155',
  },
  dangerSection: {
    marginBottom: 24,
    padding: 16,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginBottom: 24,
  },
});