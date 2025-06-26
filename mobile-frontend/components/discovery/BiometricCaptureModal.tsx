import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { BiometricCaptureConfig } from '../../types/enhanced-profile';

interface BiometricCaptureModalProps {
  visible: boolean;
  config: BiometricCaptureConfig;
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function BiometricCaptureModal({
  visible,
  config,
  onCapture,
  onCancel,
  onError
}: BiometricCaptureModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStep, setCaptureStep] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const cameraRef = useRef<Camera>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const countdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      requestCameraPermission();
      animateIn();
      resetCaptureState();
    } else {
      animateOut();
    }
    
    return () => {
      if (countdownTimeoutRef.current) {
        clearTimeout(countdownTimeoutRef.current);
      }
    };
  }, [visible]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      countdownTimeoutRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      captureImage();
    }
  }, [countdown]);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        onError('Camera permission is required for biometric capture');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      onError('Failed to request camera permission');
    }
  };

  const resetCaptureState = () => {
    setIsCapturing(false);
    setCaptureStep(0);
    setCapturedImages([]);
    setCountdown(null);
  };

  const animateIn = () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8
    }).start();
  };

  const animateOut = () => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnimation.stopAnimation();
    pulseAnimation.setValue(1);
  };

  const startCapture = () => {
    if (config.livenessCheck && config.multipleCaptures) {
      Alert.alert(
        'Liveness Check',
        'Please follow the instructions to capture multiple images for liveness verification.',
        [{ text: 'Start', onPress: startCaptureSequence }]
      );
    } else {
      startCaptureSequence();
    }
  };

  const startCaptureSequence = () => {
    setIsCapturing(true);
    setCaptureStep(0);
    startPulseAnimation();
    
    // Start countdown
    setCountdown(3);
  };

  const captureImage = async () => {
    try {
      if (!cameraRef.current) {
        throw new Error('Camera reference not available');
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: config.quality === 'high' ? 1 : config.quality === 'medium' ? 0.7 : 0.5,
        base64: true,
        skipProcessing: false
      });

      if (!photo.base64) {
        throw new Error('Failed to capture image data');
      }

      const newImages = [...capturedImages, photo.base64];
      setCapturedImages(newImages);
      
      const totalCaptures = config.multipleCaptures ? 3 : 1;
      const nextStep = captureStep + 1;
      
      if (nextStep >= totalCaptures) {
        // Capture sequence complete
        stopPulseAnimation();
        setIsCapturing(false);
        
        if (config.livenessCheck && newImages.length > 1) {
          // Use first image for processing, others for liveness verification
          onCapture(newImages[0]);
        } else {
          onCapture(newImages[0]);
        }
      } else {
        // Continue with next capture
        setCaptureStep(nextStep);
        setCountdown(3); // Reset countdown for next capture
      }
    } catch (error) {
      console.error('Image capture failed:', error);
      onError(`Failed to capture image: ${error}`);
      stopPulseAnimation();
      setIsCapturing(false);
    }
  };

  const getInstructionText = () => {
    if (countdown !== null && countdown > 0) {
      return `Get ready... ${countdown}`;
    }
    
    if (isCapturing) {
      if (config.multipleCaptures) {
        const stepInstructions = [
          'Look straight at the camera',
          'Turn your head slightly left',
          'Turn your head slightly right'
        ];
        return stepInstructions[captureStep] || 'Capturing...';
      } else {
        return 'Capturing...';
      }
    }
    
    return 'Position your face in the frame and tap capture';
  };

  const getProgressText = () => {
    if (!config.multipleCaptures) return '';
    const totalCaptures = 3;
    return `${captureStep + 1} of ${totalCaptures}`;
  };

  if (hasPermission === null) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Requesting camera permission...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Camera Permission Required</Text>
            <Text style={styles.errorText}>
              Camera access is needed for biometric capture. Please enable camera permissions in your device settings.
            </Text>
            <TouchableOpacity style={styles.button} onPress={onCancel}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            {
              transform: [
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }
              ],
              opacity: animatedValue
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {config.type === 'face' ? 'Face Capture' : 'Biometric Capture'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Camera View */}
          <View style={styles.cameraContainer}>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              type={CameraType.front}
              autoFocus={true}
            >
              {/* Face Outline Overlay */}
              <View style={styles.overlay}>
                <Animated.View 
                  style={[
                    styles.faceOutline,
                    {
                      transform: [{ scale: pulseAnimation }]
                    }
                  ]}
                />
              </View>
            </Camera>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionText}>{getInstructionText()}</Text>
            {config.multipleCaptures && (
              <Text style={styles.progressText}>{getProgressText()}</Text>
            )}
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onCancel}
              disabled={isCapturing}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.captureButton,
                isCapturing && styles.captureButtonDisabled
              ]} 
              onPress={startCapture}
              disabled={isCapturing || countdown !== null}
            >
              <Text style={styles.captureButtonText}>
                {isCapturing ? 'Capturing...' : 'Capture'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  cameraContainer: {
    height: 300,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  faceOutline: {
    position: 'absolute',
    top: '20%',
    left: '25%',
    width: '50%',
    height: '60%',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 100,
    backgroundColor: 'transparent',
  },
  instructionsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  captureButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  captureButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#374151',
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    maxWidth: screenWidth * 0.8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});