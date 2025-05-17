import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Link } from 'expo-router';

interface EmptyStateProps {
  isDiscovering: boolean;
  isProfileComplete: boolean;
}

export default function EmptyState({ isDiscovering, isProfileComplete }: EmptyStateProps) {
  if (!isProfileComplete) {
    return (
      <View style={styles.container}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/6331040/pexels-photo-6331040.jpeg' }}
          style={styles.image}
        />
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          You need to set up your profile before you can discover others.
        </Text>
        <Link href="/profile" style={styles.link}>
          <Text style={styles.linkText}>Go to Profile</Text>
        </Link>
      </View>
    );
  }

  if (!isDiscovering) {
    return (
      <View style={styles.container}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/7709020/pexels-photo-7709020.jpeg' }}
          style={styles.image}
        />
        <Text style={styles.title}>Start Discovery</Text>
        <Text style={styles.subtitle}>
          Tap the button below to start discovering nearby peers.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: 'https://images.pexels.com/photos/7504837/pexels-photo-7504837.jpeg' }}
        style={styles.image}
      />
      <Text style={styles.title}>Looking for Peers</Text>
      <Text style={styles.subtitle}>
        Discovered peers will appear here. Make sure others have the app open nearby.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  link: {
    backgroundColor: '#5046E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  linkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});