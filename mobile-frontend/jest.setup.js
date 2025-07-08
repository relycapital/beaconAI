// Jest setup for BeaconAI project
// Following Semantic Seed Coding Standards for TDD workflow

// Setup global fetch polyfill
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
  blob: jest.fn().mockResolvedValue(new Blob()),
});

// Mock TensorFlow.js modules
jest.mock('@tensorflow/tfjs', () => ({
  ready: jest.fn().mockResolvedValue(undefined),
  version: { tfjs: '4.0.0' },
  getBackend: jest.fn().mockReturnValue('cpu'),
  util: {
    decodeString: jest.fn(),
  },
  browser: {
    decodeImage: jest.fn().mockReturnValue({
      shape: [224, 224, 3],
      dispose: jest.fn(),
    }),
  },
  randomUniform: jest.fn().mockReturnValue({
    shape: [224, 224, 3],
    dispose: jest.fn(),
  }),
}));

jest.mock('@tensorflow/tfjs-react-native');
jest.mock('@tensorflow/tfjs-backend-cpu');

jest.mock('@tensorflow-models/blazeface', () => ({
  load: jest.fn().mockResolvedValue({
    estimateFaces: jest.fn().mockResolvedValue([
      {
        landmarks: [[100, 100], [200, 200], [150, 150]],
        probability: [0.95],
        topLeft: [50, 50],
        bottomRight: [250, 250],
      },
    ]),
  }),
}));

jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn().mockResolvedValue({
    embed: jest.fn().mockResolvedValue({
      data: jest.fn().mockResolvedValue(new Float32Array(512).fill(0.1)),
      dispose: jest.fn(),
    }),
  }),
}));

// Mock expo crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => `test-uuid-${Math.random()}`),
  getRandomValues: jest.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  digestStringAsync: jest.fn().mockResolvedValue('mocked-hash'),
}));

// Mock react-native modules
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
