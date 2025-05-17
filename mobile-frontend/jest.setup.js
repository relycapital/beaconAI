/**
 * Jest Setup File
 * Configures global mocks for testing BLE functionality
 * Following Semantic Seed Coding Standards for testing
 */

// Mock react-native-ble-plx
jest.mock('react-native-ble-plx', () => {
  return {
    BleManager: jest.fn().mockImplementation(() => ({
      // BleManager implementation
      onStateChange: jest.fn((callback) => {
        // Simulate state change to powered on
        callback('PoweredOn');
        return { remove: jest.fn() };
      }),
      state: jest.fn().mockResolvedValue('PoweredOn'),
      startDeviceScan: jest.fn(),
      stopDeviceScan: jest.fn(),
    })),
    State: {
      PoweredOff: 'PoweredOff',
      PoweredOn: 'PoweredOn',
      Unauthorized: 'Unauthorized',
      Unknown: 'Unknown',
    },
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock the Platform API
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
  Version: 15,
}));

// Mock PermissionsAndroid
jest.mock('react-native', () => {
  const ActualReactNative = jest.requireActual('react-native');
  return {
    ...ActualReactNative,
    PermissionsAndroid: {
      PERMISSIONS: {
        ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
        BLUETOOTH_SCAN: 'android.permission.BLUETOOTH_SCAN',
        BLUETOOTH_ADVERTISE: 'android.permission.BLUETOOTH_ADVERTISE',
        BLUETOOTH_CONNECT: 'android.permission.BLUETOOTH_CONNECT',
      },
      RESULTS: {
        GRANTED: 'granted',
        DENIED: 'denied',
        NEVER_ASK_AGAIN: 'never_ask_again',
      },
      check: jest.fn().mockResolvedValue(true),
      request: jest.fn().mockResolvedValue('granted'),
      requestMultiple: jest.fn().mockResolvedValue({
        'android.permission.ACCESS_FINE_LOCATION': 'granted',
        'android.permission.BLUETOOTH_SCAN': 'granted',
        'android.permission.BLUETOOTH_ADVERTISE': 'granted',
        'android.permission.BLUETOOTH_CONNECT': 'granted',
      }),
    },
    AppState: {
      addEventListener: jest.fn(() => ({
        remove: jest.fn(),
      })),
    },
  };
});

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-12345'),
}));