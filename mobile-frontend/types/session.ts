export interface DiscoverySession {
  id: string;
  startedAt: string;
  endedAt?: string;
  mode: 'default' | 'event';
  roomCode?: string;
  sessionName?: string;
  peerIds: string[];
}

export interface ConnectionLog {
  logId: string;
  peerId: string;
  sessionId: string;
  saved: boolean;
  notes?: string;
  interactionType: 'viewed' | 'saved' | 'shared';
  timestamp: string;
}