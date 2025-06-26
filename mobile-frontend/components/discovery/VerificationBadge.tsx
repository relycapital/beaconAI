import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { VerificationResult } from '../../types/enhanced-profile';

interface VerificationBadgeProps {
  verification: VerificationResult;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
}

export default function VerificationBadge({ 
  verification, 
  style,
  size = 'small'
}: VerificationBadgeProps) {
  const getBadgeConfig = () => {
    if (!verification.isValid) {
      return {
        icon: '❌',
        text: 'Invalid',
        backgroundColor: '#FEE2E2',
        borderColor: '#FECACA',
        textColor: '#DC2626'
      };
    }

    switch (verification.verificationLevel) {
      case 'full':
        return {
          icon: '🛡️',
          text: 'Full',
          backgroundColor: '#DCFCE7',
          borderColor: '#BBF7D0',
          textColor: '#059669'
        };
      case 'cryptographic':
        return {
          icon: '🔐',
          text: 'Crypto',
          backgroundColor: '#E0F2FE',
          borderColor: '#BAE6FD',
          textColor: '#0284C7'
        };
      case 'biometric':
        return {
          icon: '👤',
          text: 'Bio',
          backgroundColor: '#F3E8FF',
          borderColor: '#DDD6FE',
          textColor: '#7C3AED'
        };
      case 'basic':
        return {
          icon: '✓',
          text: 'Basic',
          backgroundColor: '#F1F5F9',
          borderColor: '#CBD5E1',
          textColor: '#475569'
        };
      default:
        return {
          icon: '❓',
          text: 'Unknown',
          backgroundColor: '#F9FAFB',
          borderColor: '#E5E7EB',
          textColor: '#6B7280'
        };
    }
  };

  const config = getBadgeConfig();
  const sizeStyles = getSizeStyles(size);

  return (
    <View style={[
      styles.badge,
      sizeStyles.container,
      {
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
      },
      style
    ]}>
      <Text style={[sizeStyles.icon]}>
        {config.icon}
      </Text>
      <Text style={[
        sizeStyles.text,
        { color: config.textColor }
      ]}>
        {config.text}
      </Text>
      
      {/* Show additional verification info for larger sizes */}
      {size !== 'small' && verification.biometricMatch && (
        <Text style={[
          sizeStyles.subtext,
          { color: config.textColor }
        ]}>
          {Math.round(verification.biometricMatch * 100)}% match
        </Text>
      )}
    </View>
  );
}

function getSizeStyles(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'large':
      return {
        container: styles.largeBadge,
        icon: styles.largeIcon,
        text: styles.largeText,
        subtext: styles.largeSubtext
      };
    case 'medium':
      return {
        container: styles.mediumBadge,
        icon: styles.mediumIcon,
        text: styles.mediumText,
        subtext: styles.mediumSubtext
      };
    default:
      return {
        container: styles.smallBadge,
        icon: styles.smallIcon,
        text: styles.smallText,
        subtext: styles.smallSubtext
      };
  }
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  
  // Small size styles
  smallBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  smallIcon: {
    fontSize: 8,
    marginRight: 3,
  },
  smallText: {
    fontSize: 10,
    fontWeight: '500',
  },
  smallSubtext: {
    fontSize: 8,
    marginLeft: 4,
  },
  
  // Medium size styles
  mediumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mediumIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  mediumText: {
    fontSize: 11,
    fontWeight: '500',
  },
  mediumSubtext: {
    fontSize: 9,
    marginLeft: 4,
  },
  
  // Large size styles
  largeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  largeIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  largeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  largeSubtext: {
    fontSize: 10,
    marginLeft: 6,
  },
});