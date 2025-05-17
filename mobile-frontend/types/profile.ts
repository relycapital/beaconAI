export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  website?: string;
}

export interface Profile {
  uuid: string;
  name?: string;
  role?: string;
  company?: string;
  socialLinks?: SocialLinks;
}

export interface PeerProfile extends Profile {
  rssi?: number; // Signal strength indicator
  firstSeen?: number; // Timestamp
  lastSeen?: number; // Timestamp
  discoveredAt?: string; // ISO string timestamp when peer was first discovered
}