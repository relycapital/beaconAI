import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDiscovery } from '@/context/DiscoveryContext';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/components/common/Header';
import DiscoveryStatus from '@/components/discovery/DiscoveryStatus';
import PeerCard from '@/components/discovery/PeerCard';
import EmptyState from '@/components/discovery/EmptyState';
import ProfileDetailModal from '@/components/discovery/ProfileDetailModal';
import DiscoveryButton from '@/components/discovery/DiscoveryButton';
import { PeerProfile } from '@/types/profile';
import { BleState, BlePermissionStatus } from '@/types/ble';
import { Battery, Bluetooth, AlertTriangle, Lock } from 'lucide-react-native';

export default function DiscoveryScreen() {
  const { isProfileComplete } = useProfile();
  const { 
    isDiscovering, 
    startDiscovery, 
    stopDiscovery, 
    nearbyPeers,
    status,
    bleState,
    permissionStatus,
    requestPermissions
  } = useDiscovery();
  
  const [selectedPeer, setSelectedPeer] = useState<PeerProfile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleOpenModal = (peer: PeerProfile) => {
    setSelectedPeer(peer);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedPeer(null);
  };

  const handleToggleDiscovery = () => {
    if (isDiscovering) {
      stopDiscovery();
    } else {
      // BLE state and permissions are checked inside startDiscovery,
      // but we could add additional UI feedback here if needed
      startDiscovery();
    }
  };
  
  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert(
        'Bluetooth Permissions Required',
        'Bluetooth permissions are needed to discover nearby peers. Please enable them in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Generate a status message based on bleState
  const getBleStateMessage = () => {
    switch (bleState) {
      case BleState.POWERED_OFF:
        return 'Bluetooth is turned off. Please enable it to discover peers.';
      case BleState.UNAUTHORIZED:
        return 'Bluetooth permission not granted.';
      case BleState.UNSUPPORTED:
        return 'Bluetooth LE is not supported on this device.';
      case BleState.RESETTING:
        return 'Bluetooth is restarting...';
      case BleState.UNKNOWN:
        return 'Checking Bluetooth status...';
      default:
        return '';
    }
  };
  
  // Determine if discovery button should be disabled
  const isDiscoveryDisabled = !isProfileComplete || 
    bleState !== BleState.POWERED_ON || 
    permissionStatus !== BlePermissionStatus.GRANTED;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Nearby Peers" />
      
      <DiscoveryStatus status={status} />
      
      {/* BLE State Banner */}
      {bleState !== BleState.POWERED_ON && (
        <View style={styles.warningBanner}>
          <Bluetooth size={18} color="#64748B" />
          <Text style={styles.warningText}>{getBleStateMessage()}</Text>
        </View>
      )}
      
      {/* Permission Status Banner */}
      {permissionStatus !== BlePermissionStatus.GRANTED && bleState === BleState.POWERED_ON && (
        <TouchableOpacity 
          style={styles.warningBanner} 
          onPress={handleRequestPermissions}
        >
          <Lock size={18} color="#64748B" />
          <Text style={styles.warningText}>Bluetooth permissions required</Text>
          <Text style={styles.actionText}>Tap to request</Text>
        </TouchableOpacity>
      )}
      
      {/* Battery Warning when discovering */}
      {isDiscovering && (
        <View style={styles.infoBanner}>
          <Battery size={18} color="#64748B" />
          <Text style={styles.infoText}>Bluetooth discovery is active and using battery</Text>
        </View>
      )}
      
      <Animated.View 
        style={[
          styles.content,
          { opacity: fadeAnim }
        ]}
      >
        {nearbyPeers.length > 0 ? (
          <FlatList
            data={nearbyPeers}
            keyExtractor={(item) => item.uuid}
            renderItem={({ item }) => (
              <PeerCard 
                peer={item} 
                onPress={() => handleOpenModal(item)}
              />
            )}
            contentContainerStyle={styles.peerList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState 
            isDiscovering={isDiscovering} 
            isProfileComplete={isProfileComplete}
          />
        )}
      </Animated.View>
      
      <View style={styles.buttonContainer}>
        <DiscoveryButton 
          isDiscovering={isDiscovering}
          onPress={handleToggleDiscovery}
          disabled={isDiscoveryDisabled}
        />
      </View>
      
      {selectedPeer && (
        <ProfileDetailModal
          visible={modalVisible}
          peer={selectedPeer}
          onClose={handleCloseModal}
        />
      )}
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
  peerList: {
    paddingBottom: 80,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FBBF24',
  },
  warningText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
    flex: 1,
  },
  actionText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#93C5FD',
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
});