/**
 * Profile type definitions
 * Following BeaconAI type safety requirements
 */

/**
 * User profile interface
 */
export interface Profile {
  uuid: string;
  name: string;
  role?: string;
  company?: string;
}

/**
 * Discovered peer profile with additional metadata
 */
export interface PeerProfile extends Profile {
  rssi: number;            // Signal strength indicator
  discoveredAt: string;    // ISO date string of discovery time
}