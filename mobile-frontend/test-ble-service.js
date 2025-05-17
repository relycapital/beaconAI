/**
 * Simple BLE Service Test
 * Following Semantic Seed Coding Standards BDD approach
 */
const bleService = require('./services/BleService').default;

// Simple test framework
const test = async (name, fn) => {
  console.log(`\n🧪 Testing: ${name}`);
  try {
    await fn();
    console.log(`✅ Passed: ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${name}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
};

// Simple expect functions
const expect = (actual) => ({
  toBe: (expected) => {
    if (actual !== expected) {
      throw new Error(`Expected ${expected} but got ${actual}`);
    }
  },
  toEqual: (expected) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    }
  },
  toBeTruthy: () => {
    if (!actual) {
      throw new Error(`Expected truthy value but got ${actual}`);
    }
  },
  toBeDefined: () => {
    if (actual === undefined) {
      throw new Error('Expected value to be defined');
    }
  }
});

// Set BLE service to test mode
bleService.setTestMode(true);
console.log('🔧 Running BLE tests in mock mode');

// Run tests
async function runTests() {
  let passed = 0;
  let failed = 0;
  
  // Initialize
  const initResult = await test('initialize BLE service', async () => {
    const result = await bleService.initialize();
    expect(result).toBeTruthy();
  });
  if (initResult) passed++; else failed++;
  
  // Get state in test mode
  const stateResult = await test('get BLE state', async () => {
    const state = await bleService.getState();
    expect(state).toBe('POWERED_ON');
  });
  if (stateResult) passed++; else failed++;
  
  // Check permissions in test mode
  const permResult = await test('check permissions', async () => {
    const permStatus = await bleService.checkPermissions();
    expect(permStatus).toBe('GRANTED');
  });
  if (permResult) passed++; else failed++;
  
  // Start advertising test
  const advResult = await test('start advertising', async () => {
    const mockProfile = {
      uuid: 'test-uuid',
      name: 'Test User',
      role: 'Developer'
    };
    
    const result = await bleService.startAdvertising(mockProfile);
    expect(result).toBeTruthy();
    
    // Stop advertising
    await bleService.stopAdvertising();
  });
  if (advResult) passed++; else failed++;
  
  // Test scanning
  const scanResult = await test('start scanning', async () => {
    let peerDiscovered = false;
    
    const result = await bleService.startScanning((peer) => {
      console.log('📱 Discovered peer:', peer.name);
      peerDiscovered = true;
    });
    
    expect(result).toBeTruthy();
    
    // Wait for simulated peer discovery
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await bleService.stopScanning();
    
    expect(peerDiscovered).toBeTruthy();
  });
  if (scanResult) passed++; else failed++;
  
  // Test config
  const configResult = await test('get BLE config', () => {
    const config = bleService.getBleConfig();
    expect(config).toBeDefined();
    expect(config.expirationTimeMs).toBeDefined();
  });
  if (configResult) passed++; else failed++;
  
  // Summary
  console.log('\n🏁 Test Summary:');
  console.log(`✅ ${passed} tests passed`);
  console.log(`❌ ${failed} tests failed`);
}

// Run all tests
runTests()
  .then(() => {
    console.log('\n🔄 Tests completed');
  })
  .catch(error => {
    console.error('Error running tests:', error);
  });
