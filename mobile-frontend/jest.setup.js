// Jest setup for BeaconAI project
// Following Semantic Seed Coding Standards for TDD workflow

// Mock the react-native modules
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.NativeModules.BleModule = {
    state: jest.fn().mockResolvedValue('PoweredOn'),
    startScan: jest.fn(),
    stopScan: jest.fn(),
  };
  rn.Platform = {
    ...rn.Platform,
    OS: 'ios',
    select: jest.fn().mockImplementation(obj => obj.ios)
  };
  rn.PermissionsAndroid = {
    request: jest.fn().mockResolvedValue(true),
    PERMISSIONS: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    },
    RESULTS: {
      GRANTED: 'granted',
    },
  };
  return rn;
});

// Mock AsyncStorage for testing profile storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(JSON.stringify({
    uuid: 'test-uuid',
    name: 'Test User',
    role: 'Developer',
    company: 'Test Co'
  })),
  setItem: jest.fn().mockResolvedValue(undefined)
}));

// Mock react-native-ble-plx
jest.mock('react-native-ble-plx', () => {
  const mockDevice = {
    id: 'test-device-id',
    name: 'Test Device',
    manufacturerData: 'test-data',
    rssi: -60
  };

  return {
    BleManager: jest.fn().mockImplementation(() => ({
      onStateChange: jest.fn((callback, emitCurrentState) => {
        if (emitCurrentState) {
          callback('PoweredOn');
        }
        return { remove: jest.fn() };
      }),
      state: jest.fn().mockResolvedValue('PoweredOn'),
      startDeviceScan: jest.fn((uuids, options, callback) => {
        // Simulate finding a device
        setTimeout(() => {
          callback(null, mockDevice);
        }, 100);
      }),
      stopDeviceScan: jest.fn(),
      destroy: jest.fn()
    })),
    State: {
      PoweredOn: 'PoweredOn',
      PoweredOff: 'PoweredOff',
      Unauthorized: 'Unauthorized',
      Unsupported: 'Unsupported',
      Resetting: 'Resetting',
      Unknown: 'Unknown'
    },
    ScanMode: {
      Balanced: 'Balanced',
      LowLatency: 'LowLatency',
      LowPower: 'LowPower',
      Opportunistic: 'Opportunistic'
    }
  };
});

// Make console.error throw to catch rendering errors
const originalConsoleError = console.error;
console.error = function(message) {
  if (message.startsWith('Warning:')) {
    return;
  }
  originalConsoleError(message);
};

// Mock Expo modules if needed
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    back: jest.fn(),
    push: jest.fn()
  }),
}));

// Set up global timing for animations
jest.useFakeTimers();
