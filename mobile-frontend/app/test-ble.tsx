/**
 * BLE Test Screen
 * Interactive UI for testing BLE functionality
 * Follows BeaconAI ruleset UI/UX Standards with clear status indicators
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Switch, ScrollView, SafeAreaView } from 'react-native';
import { useDiscovery } from '../context/DiscoveryContext';
import BleService from '../services/BleService';
import { BleState, BlePermissionStatus } from '../types/ble';

/**
 * BLE Test Screen
 */
export default function TestBleScreen() {
  // State from discovery context
  const { 
    isDiscovering,
    status,
    nearbyPeers,
    bleState,
    permissionStatus,
    startDiscovery,
    stopDiscovery,
    requestPermissions,
    checkBleState
  } = useDiscovery();
  
  // Local state
  const [testMode, setTestMode] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Enable console logging to screen
  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      const logMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      setLogs(prevLogs => [...prevLogs, `${new Date().toLocaleTimeString()}: ${logMessage}`]);
      originalConsoleLog(...args);
    };
    
    return () => {
      console.log = originalConsoleLog;
    };
  }, []);
  
  // Handle toggling test mode
  const handleToggleTestMode = (value: boolean) => {
    setTestMode(value);
    BleService.setTestMode(value);
    addLog(`Test mode ${value ? 'enabled' : 'disabled'}`);
  };
  
  // Add log message
  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  // Run BLE tests
  const runTests = async () => {
    addLog('Starting BLE tests...');
    
    // Check BLE state
    addLog('Checking BLE state...');
    const state = await checkBleState();
    addLog(`BLE state: ${state}`);
    
    // Check permissions
    addLog('Checking BLE permissions...');
    const currentPermissions = await BleService.checkPermissions();
    addLog(`BLE permissions: ${currentPermissions}`);
    
    if (currentPermissions !== BlePermissionStatus.GRANTED) {
      addLog('Requesting BLE permissions...');
      const requested = await requestPermissions();
      addLog(`BLE permissions ${requested ? 'granted' : 'denied'}`);
      
      if (!requested) {
        addLog('Cannot proceed with tests: permissions denied');
        return;
      }
    }
    
    // Test BLE configuration
    addLog('Checking BLE configuration...');
    const config = BleService.getBleConfig();
    addLog(`BLE config: ${JSON.stringify(config)}`);
    
    addLog('BLE tests completed');
  };
  
  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };
  
  // Toggle discovery
  const toggleDiscovery = async () => {
    if (isDiscovering) {
      addLog('Stopping discovery...');
      await stopDiscovery();
      addLog('Discovery stopped');
    } else {
      addLog('Starting discovery...');
      await startDiscovery();
      addLog(`Discovery status: ${status}`);
    }
  };
  
  // Get BLE state as a styled element
  const getBleStateElement = () => {
    let color = 'gray';
    switch (bleState) {
      case BleState.POWERED_ON:
        color = 'green';
        break;
      case BleState.POWERED_OFF:
        color = 'red';
        break;
      case BleState.UNAUTHORIZED:
        color = 'orange';
        break;
      default:
        color = 'gray';
    }
    
    return <Text style={[styles.stateText, { color }]}>{bleState}</Text>;
  };
  
  // Get permission status as a styled element
  const getPermissionElement = () => {
    let color = 'gray';
    switch (permissionStatus) {
      case BlePermissionStatus.GRANTED:
        color = 'green';
        break;
      case BlePermissionStatus.DENIED:
        color = 'red';
        break;
      default:
        color = 'gray';
    }
    
    return <Text style={[styles.stateText, { color }]}>{permissionStatus}</Text>;
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>BLE Test Screen</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Configuration</Text>
        <View style={styles.row}>
          <Text>Test Mode:</Text>
          <Switch
            value={testMode}
            onValueChange={handleToggleTestMode}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BLE Status</Text>
        <View style={styles.row}>
          <Text>BLE State:</Text>
          {getBleStateElement()}
        </View>
        <View style={styles.row}>
          <Text>Permission Status:</Text>
          {getPermissionElement()}
        </View>
        <View style={styles.row}>
          <Text>Discovery Status:</Text>
          <Text style={styles.stateText}>{status}</Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Run Tests" 
          onPress={runTests} 
        />
        <Button 
          title={isDiscovering ? "Stop Discovery" : "Start Discovery"} 
          onPress={toggleDiscovery}
          color={isDiscovering ? 'red' : 'green'}
        />
        <Button 
          title="Request Permissions" 
          onPress={requestPermissions} 
        />
        <Button 
          title="Clear Logs" 
          onPress={clearLogs} 
          color="gray"
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearby Peers ({nearbyPeers.length})</Text>
        <ScrollView style={styles.peersList}>
          {nearbyPeers.map((peer, index) => (
            <View key={peer.uuid + index} style={styles.peerItem}>
              <Text style={styles.peerName}>{peer.name}</Text>
              <Text>ID: {peer.uuid}</Text>
              <Text>Role: {peer.role || 'N/A'}</Text>
              <Text>Company: {peer.company || 'N/A'}</Text>
              <Text>Signal: {peer.rssi} dBm</Text>
              <Text>Discovered: {new Date(peer.discoveredAt).toLocaleTimeString()}</Text>
            </View>
          ))}
          {nearbyPeers.length === 0 && (
            <Text style={styles.noPeers}>No peers discovered yet</Text>
          )}
        </ScrollView>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logs</Text>
        <ScrollView style={styles.logs}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logItem}>
              {log}
            </Text>
          ))}
          {logs.length === 0 && (
            <Text style={styles.noLogs}>No logs yet</Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/**
 * Styles for the BLE Test Screen
 * Following BeaconAI UI/UX Standards for minimal UI
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  stateText: {
    fontWeight: 'bold',
  },
  peersList: {
    maxHeight: 150,
  },
  peerItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  peerName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  noPeers: {
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 8,
  },
  logs: {
    maxHeight: 150,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
  },
  logItem: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  noLogs: {
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 8,
  },
});