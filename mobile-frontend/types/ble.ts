/**
 * BLE-related type definitions for BeaconAI
 * Following BLE implementation standards from project ruleset
 */
import { Profile, PeerProfile } from './profile';

/**
 * BLE advertisement modes balancing discovery vs battery life
 */
export enum BleAdvertiseMode {
  LOW_POWER = 'LOW_POWER',       // Longest advertisement interval, lowest power
  BALANCED = 'BALANCED',         // Medium advertisement interval, medium power
  LOW_LATENCY = 'LOW_LATENCY'    // Shortest advertisement interval, highest power
}

/**
 * BLE scan modes balancing discovery vs battery life
 */
export enum BleScanMode {
  LOW_POWER = 'LOW_POWER',       // Scan with lowest power consumption
  BALANCED = 'BALANCED',         // Balanced between power and latency
  LOW_LATENCY = 'LOW_LATENCY',   // Scan with highest frequency and priority
  OPPORTUNISTIC = 'OPPORTUNISTIC' // Only scan when other apps are scanning
}

/**
 * Permission statuses for BLE operations
 */
export enum BlePermissionStatus {
  UNKNOWN = 'UNKNOWN',  // Initial state before checking permissions
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  REQUESTING = 'REQUESTING',
  UNAVAILABLE = 'UNAVAILABLE'
}

/**
 * BLE connection states
 */
export enum BleState {
  UNKNOWN = 'UNKNOWN',
  UNSUPPORTED = 'UNSUPPORTED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  POWERED_OFF = 'POWERED_OFF',
  POWERED_ON = 'POWERED_ON',
  RESETTING = 'RESETTING',
}

/**
 * BLE advertisement data structure (max 31 bytes)
 * Optimized for compact encoding
 */
export interface BleAdvertisementData {
  uuid: string;           // User's unique identifier (16 bytes)
  name?: string;          // Optional shortened name
  isDiscoverable: boolean; // Whether the user wants to be discovered
}

/**
 * BLE service configuration
 */
export interface BleConfig {
  scanMode: BleScanMode;
  advertiseMode: BleAdvertiseMode;
  scanDurationMs: number;        // How long to scan before pausing
  scanIntervalMs: number;        // Time between scan cycles
  advertisingIntervalMs: number; // Time between advertising broadcasts
  expirationTimeMs: number;      // Time after which a peer is considered expired
}

/**
 * BLE discovery status
 */
export enum BleDiscoveryStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  ADVERTISING = 'ADVERTISING',
  SCANNING_AND_ADVERTISING = 'SCANNING_AND_ADVERTISING',
  ERROR = 'ERROR'
}

/**
 * BLE service interface
 */
export interface BleService {
  initialize(): Promise<boolean>;
  checkPermissions(): Promise<BlePermissionStatus>;
  requestPermissions(): Promise<BlePermissionStatus>;
  startAdvertising(profile: Profile): Promise<boolean>;
  stopAdvertising(): Promise<void>;
  startScanning(onDiscovery: (peer: PeerProfile) => void): Promise<boolean>;
  stopScanning(): Promise<void>;
  getState(): Promise<BleState>;
  setBleConfig(config: Partial<BleConfig>): void;
  getBleConfig(): BleConfig;
}
