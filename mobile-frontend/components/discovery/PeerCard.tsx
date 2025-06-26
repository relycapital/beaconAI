import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { PeerProfile } from '@/types/profile';
import { formatDistanceToBrand } from '@/utils/format';
import Avatar from '@/components/common/Avatar';

interface PeerCardProps {
  peer: PeerProfile;
  onPress: () => void;
}

export default function PeerCard({ peer, onPress }: PeerCardProps) {
  // Simple animation for card entry
  const opacity = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity }}>
      <TouchableOpacity style={styles.container} onPress={onPress}>
        <Avatar 
          name={peer.name}
          avatarUri={peer.avatarUri}
          size={48}
        />
        
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{peer.name || 'Unknown'}</Text>
          
          {peer.role ? (
            <Text style={styles.role}>{peer.role}</Text>
          ) : null}
          
          {peer.company ? (
            <Text style={styles.company}>{peer.company}</Text>
          ) : null}
        </View>
        
        <View style={styles.signalContainer}>
          <View style={[styles.signalStrength, { backgroundColor: getSignalColor(peer.rssi || -70) }]} />
          <Text style={styles.distance}>{formatDistanceToBrand(peer.rssi || -70)}</Text>
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
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 2,
  },
  company: {
    fontSize: 14,
    color: '#64748B',
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
    fontSize: 12,
    color: '#64748B',
  },
});