import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Zap, Wifi, TriangleAlert as AlertTriangle } from 'lucide-react-native';

interface DiscoveryStatusProps {
  status: 'idle' | 'scanning' | 'advertising' | 'scanning_and_advertising' | 'error';
}

export default function DiscoveryStatus({ status }: DiscoveryStatusProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (status === 'scanning' || status === 'advertising' || status === 'scanning_and_advertising') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  const getStatusColor = () => {
    switch (status) {
      case 'scanning':
      case 'advertising':
      case 'scanning_and_advertising':
        return '#5046E5';
      case 'error':
        return '#EF4444';
      default:
        return '#94A3B8';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'scanning':
        return 'Scanning for nearby peers...';
      case 'advertising':
        return 'Broadcasting your profile...';
      case 'scanning_and_advertising':
        return 'Broadcasting and scanning...';
      case 'error':
        return 'Bluetooth error. Please try again.';
      default:
        return 'Not discovering';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'scanning':
        return <Wifi size={18} color={getStatusColor()} />;
      case 'advertising':
        return <Zap size={18} color={getStatusColor()} />;
      case 'scanning_and_advertising':
        // Use a combination of both icons for dual mode
        return (
          <View style={{ flexDirection: 'row' }}>
            <Wifi size={14} color={getStatusColor()} />
            <Zap size={14} color={getStatusColor()} style={{ marginLeft: -4 }} />
          </View>
        );
      case 'error':
        return <AlertTriangle size={18} color={getStatusColor()} />;
      default:
        return <Wifi size={18} color={getStatusColor()} />;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.iconContainer, 
          { 
            backgroundColor: `${getStatusColor()}20`,
            transform: [{ scale: status !== 'idle' ? pulseAnim : 1 }],
          }
        ]}
      >
        {getStatusIcon()}
      </Animated.View>
      <Text style={[styles.statusText, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
});