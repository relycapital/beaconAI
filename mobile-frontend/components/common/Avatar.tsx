import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface AvatarProps {
  name?: string;
  avatarUri?: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
}

export default function Avatar({
  name,
  avatarUri,
  size = 40,
  backgroundColor = '#5046E5',
  textColor = '#FFFFFF'
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const getInitials = (name?: string): string => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const showImage = avatarUri && !imageError;

  return (
    <View 
      style={[
        styles.container, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: showImage ? 'transparent' : backgroundColor
        }
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: avatarUri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          onError={() => setImageError(true)}
        />
      ) : (
        <Text 
          style={[
            styles.initials, 
            { 
              fontSize: size * 0.4, 
              color: textColor 
            }
          ]}
        >
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '600',
  },
});