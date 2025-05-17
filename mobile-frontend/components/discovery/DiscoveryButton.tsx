import React, { useRef, useEffect } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Animated, 
  Easing,
  View 
} from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';

interface DiscoveryButtonProps {
  isDiscovering: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export default function DiscoveryButton({ 
  isDiscovering, 
  onPress,
  disabled = false
}: DiscoveryButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDiscovering) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.linear,
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
      rotateAnim.stopAnimation();
    }
  }, [isDiscovering]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const buttonBackgroundColor = isDiscovering ? '#EF4444' : '#5046E5';
  const buttonText = isDiscovering ? 'Stop Discovery' : 'Start Discovery';
  const buttonIcon = isDiscovering ? (
    <WifiOff size={20} color="#FFFFFF" />
  ) : (
    <Wifi size={20} color="#FFFFFF" />
  );

  return (
    <Animated.View
      style={[
        styles.buttonWrapper,
        {
          transform: [
            { scale: isDiscovering ? pulseAnim : 1 },
          ],
        },
      ]}
    >
      <TouchableOpacity 
        style={[
          styles.button, 
          { backgroundColor: buttonBackgroundColor },
          disabled && styles.disabledButton
        ]} 
        onPress={onPress}
        disabled={disabled}
      >
        {isDiscovering && (
          <Animated.View 
            style={[
              styles.rotatingBorder, 
              { transform: [{ rotate }] }
            ]}
          />
        )}
        <View style={styles.buttonContent}>
          {buttonIcon}
          <Text style={styles.buttonText}>{buttonText}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    width: 200,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5046E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
  },
  rotatingBorder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
    opacity: 0.5,
  },
});