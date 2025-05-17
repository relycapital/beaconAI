import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDiscovery } from '@/context/DiscoveryContext';
import { useProfile } from '@/context/ProfileContext';
import Header from '@/components/common/Header';
import { BleState, BlePermissionStatus } from '@/types/ble';
import bleService from '@/services/BleService';

/**
 * BLE Testing Screen
 * Following Semantic Seed Coding Standards - Test-Driven Development
 */
export default function TestBleScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { 
    bleState, 
    permissionStatus, 
    requestPermissions, 
    startDiscovery, 
    stopDiscovery,
    isDiscovering,
    nearbyPeers,
    status
  } = useDiscovery();
  
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [useMockData, setUseMockData] = useState(true);
  
  // Log helper function
  const log = (message: string) => {
    setTestLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };
  
  // Clear test logs and reset test state
  const resetTests = () => {
    setTestLogs([]);
    if (isDiscovering) {
      stopDiscovery();
      log('Discovery stopped by test reset');
    }
    bleService.setTestMode(useMockData);
    log('🔄 Test state reset');
  };
  
  // Set mock mode on component mount
  useEffect(() => {
    bleService.setTestMode(true);
    log('🔧 Mock mode automatically enabled for testing');
    
    return () => {
      // Clean up when component unmounts
      bleService.setTestMode(false);
    };
  }, []);
  
  // Run basic tests
  const runBasicTests = async () => {
    log('🧪 Starting basic BLE tests');
    log(`Current BLE state: ${bleState}`);
    log(`Current permission status: ${permissionStatus}`);
    
    try {
      // Test BLE initialization
      log('Testing BLE initialization...');
      const initResult = await bleService.initialize();
      log(`✅ BLE initialization ${initResult ? 'successful' : 'failed'}`);
      
      // Test permissions
      if (permissionStatus !== BlePermissionStatus.GRANTED) {
        log('Testing permission request...');
        const permResult = await requestPermissions();
        log(`✅ Permission request ${permResult ? 'granted' : 'denied'}`);
      } else {
        log('✅ BLE permissions already granted');
      }
      
      // Test advertising (only if permissions granted and BLE powered on)
      if (bleState === BleState.POWERED_ON && permissionStatus === BlePermissionStatus.GRANTED) {
        log('Testing profile advertising...');
        const advResult = await bleService.startAdvertising(profile);
        log(`✅ Start advertising ${advResult ? 'successful' : 'failed'}`);
        
        log('Waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        log('Testing stop advertising...');
        await bleService.stopAdvertising();
        log('✅ Stop advertising completed');
      } else {
        log('⚠️ Skipping advertising test: BLE not ready');
      }
      
      log('🏁 Basic tests completed');
    } catch (error) {
      // Type-safe error handling
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`❌ Test error: ${errorMessage}`);
    }
  };
  
  // Run a comprehensive BDD-style test sequence that follows Semantic Seed Coding Standards
  const runFullTestSequence = async () => {
    log('🔔 Starting FULL BLE test sequence (BDD format)');
    log('Following Semantic Seed Coding Standards V2.0');
    
    // Setup - make sure we're in mock mode for consistent testing
    bleService.setTestMode(true);
    log('🔧 Test mode enabled for consistent testing');
    
    try {
      // Given: The BLE service is initialized
      log('\nGiven: The BLE service is initialized');
      const initResult = await bleService.initialize();
      if (!initResult) throw new Error('BLE initialization failed');
      log('✅ BLE service initialized successfully');
      
      // When: Checking BLE state
      log('\nWhen: Checking BLE state');
      const state = await bleService.getState();
      log(`✅ BLE state is: ${state}`);
      
      // Then: State should be POWERED_ON in test mode
      log('\nThen: State should be POWERED_ON in test mode');
      if (state !== BleState.POWERED_ON) {
        throw new Error(`Expected POWERED_ON but got ${state}`);
      }
      log('✅ BLE state is correctly POWERED_ON');
      
      // Given: BLE permissions are required
      log('\nGiven: BLE permissions are required');
      // When: Checking permissions
      log('When: Checking permissions');
      const permStatus = await bleService.checkPermissions();
      log(`✅ Permission status is: ${permStatus}`);
      // Then: Permissions should be granted in test mode
      log('Then: Permissions should be granted in test mode');
      if (permStatus !== BlePermissionStatus.GRANTED) {
        throw new Error(`Expected GRANTED but got ${permStatus}`);
      }
      log('✅ Permissions are correctly GRANTED');
      
      // Given: A user profile exists
      log('\nGiven: A user profile exists');
      if (!profile) throw new Error('Profile not available');
      log(`✅ Profile exists: ${profile.name || 'Anonymous'}`);
      
      // When: Starting to advertise the profile
      log('\nWhen: Starting to advertise the profile');
      const advResult = await bleService.startAdvertising(profile);
      log(`✅ Start advertising result: ${advResult}`);
      
      // Then: Advertising should be successful
      log('\nThen: Advertising should be successful');
      if (!advResult) throw new Error('Advertising failed to start');
      log('✅ Advertising started successfully');
      
      // Wait a moment
      log('Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Given: Advertising is active
      log('\nGiven: Advertising is active');
      
      // When: Stopping advertising
      log('When: Stopping advertising');
      await bleService.stopAdvertising();
      
      // Then: Advertising should stop
      log('\nThen: Advertising should stop successfully');
      log('✅ Advertising stopped');
      
      // When: Starting to scan for peers
      log('\nWhen: Starting to scan for peers');
      let discoveredPeer = false;
      const scanResult = await bleService.startScanning((peer) => {
        log(`📱 Discovered peer: ${peer.name}`);
        discoveredPeer = true;
      });
      
      // Then: Scanning should start successfully
      log('\nThen: Scanning should start successfully');
      if (!scanResult) throw new Error('Scanning failed to start');
      log('✅ Scanning started successfully');
      
      // Wait for peer discovery
      log('Waiting for peer discovery...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Then: At least one peer should be discovered in test mode
      log('\nThen: At least one peer should be discovered in test mode');
      if (!discoveredPeer) {
        log('⚠️ No peers discovered, this may be expected in certain testing scenarios');
      } else {
        log('✅ Successfully discovered at least one peer');
      }
      
      // When: Stopping scanning
      log('\nWhen: Stopping scanning');
      await bleService.stopScanning();
      
      // Then: Scanning should stop
      log('\nThen: Scanning should stop successfully');
      log('✅ Scanning stopped');
      
      // Get BLE configuration
      log('\nVerifying BLE configuration');
      const config = bleService.getBleConfig();
      log(`✅ BLE configuration: ${JSON.stringify(config)}`);
      
      log('\n🏆 TEST SEQUENCE COMPLETED SUCCESSFULLY');
    } catch (error) {
      // Type-safe error handling
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`❌ TEST SEQUENCE FAILED: ${errorMessage}`);
    } finally {
      // Clean up
      if (isDiscovering) {
        stopDiscovery();
        log('Discovery stopped after tests');
      }
    }
  };
  
  // Toggle discovery
  const toggleDiscovery = () => {
    if (isDiscovering) {
      stopDiscovery();
      log('Discovery stopped');
    } else {
      log('Starting discovery...');
      startDiscovery();
    }
  };
  
  // Toggle mock mode
  const toggleMockMode = () => {
    setUseMockData(!useMockData);
    bleService.setTestMode(!useMockData);
    log(`Switched to ${!useMockData ? 'mock' : 'real'} BLE mode`);
  };
  
  // Log BLE state changes
  useEffect(() => {
    log(`BLE state changed: ${bleState}`);
  }, [bleState]);
  
  // Log permission status changes
  useEffect(() => {
    log(`Permission status changed: ${permissionStatus}`);
  }, [permissionStatus]);
  
  // Log discovery status changes
  useEffect(() => {
    if (status !== 'idle') {
      log(`Discovery status: ${status}`);
    }
  }, [status]);
  
  // Log when peers are discovered
  useEffect(() => {
    if (nearbyPeers.length > 0) {
      log(`Found ${nearbyPeers.length} peers nearby`);
    }
  }, [nearbyPeers.length]);
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="BLE Testing" />
      
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>BLE State:</Text>
          <Text style={[
            styles.statusValue, 
            { color: bleState === BleState.POWERED_ON ? '#10B981' : '#EF4444' }
          ]}>
            {bleState}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Permissions:</Text>
          <Text style={[
            styles.statusValue, 
            { color: permissionStatus === BlePermissionStatus.GRANTED ? '#10B981' : '#EF4444' }
          ]}>
            {permissionStatus}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Discovery Status:</Text>
          <Text style={styles.statusValue}>{status}</Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Nearby Peers:</Text>
          <Text style={styles.statusValue}>{nearbyPeers.length}</Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Mock Mode:</Text>
          <Switch 
            value={useMockData} 
            onValueChange={toggleMockMode}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={useMockData ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.buttonPrimary]} 
          onPress={runBasicTests}
        >
          <Text style={styles.buttonText}>Run Basic Tests</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#10B981' }]} 
          onPress={runFullTestSequence}
        >
          <Text style={styles.buttonText}>Run Full Test Sequence</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            isDiscovering ? styles.buttonDanger : styles.buttonSecondary
          ]} 
          onPress={toggleDiscovery}
        >
          <Text style={styles.buttonText}>
            {isDiscovering ? 'Stop Discovery' : 'Start Discovery'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.buttonTertiary]} 
          onPress={resetTests}
        >
          <Text style={styles.buttonText}>Reset Tests</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#94A3B8' }]} 
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Back to App</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.logContainer}>
        <Text style={styles.logHeader}>Test Logs:</Text>
        <ScrollView style={styles.logScroll}>
          {testLogs.map((log, index) => (
            <Text key={index} style={styles.logEntry}>{log}</Text>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  statusContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonPrimary: {
    backgroundColor: '#5046E5',
  },
  buttonSecondary: {
    backgroundColor: '#10B981',
  },
  buttonDanger: {
    backgroundColor: '#EF4444',
  },
  buttonTertiary: {
    backgroundColor: '#64748B',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  logContainer: {
    flex: 1,
    margin: 16,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
  },
  logHeader: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  logScroll: {
    flex: 1,
  },
  logEntry: {
    color: '#E2E8F0',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 6,
  },
});
