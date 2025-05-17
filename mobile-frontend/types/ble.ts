/**
 * BLE type definitions
 * Following TypeScript best practices and BeaconAI type safety requirements
 */

/**
 * BLE states for the service
 */
export enum BleState {
  UNKNOWN = 'unknown',
  POWERED_OFF = 'powered_off',
  POWERED_ON = 'powered_on',
  UNAUTHORIZED = 'unauthorized'
}

/**
 * BLE permission statuses
 */
export enum BlePermissionStatus {
  UNKNOWN = 'unknown',
  GRANTED = 'granted',
  DENIED = 'denied'
}

/**
 * BLE discovery status
 */
export type DiscoveryStatus = 
  | 'idle' 
  | 'scanning'
  | 'advertising'
  | 'scanning_and_advertising';