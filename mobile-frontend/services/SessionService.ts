import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { DiscoverySession, ConnectionLog } from '@/types/session';

const SESSIONS_STORAGE_KEY = 'discovery_sessions';
const CONNECTION_LOGS_STORAGE_KEY = 'connection_logs';
const MAX_SESSIONS_TO_KEEP = 10;
const MAX_LOGS_TO_KEEP = 100;

class SessionService {
  private currentSession: DiscoverySession | null = null;

  async startSession(mode: 'default' | 'event' = 'default', roomCode?: string, sessionName?: string): Promise<DiscoverySession> {
    const session: DiscoverySession = {
      id: uuidv4(),
      startedAt: new Date().toISOString(),
      mode,
      roomCode,
      sessionName,
      peerIds: []
    };

    this.currentSession = session;
    await this.saveSession(session);
    return session;
  }

  async endCurrentSession(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.endedAt = new Date().toISOString();
    await this.saveSession(this.currentSession);
    this.currentSession = null;
  }

  getCurrentSession(): DiscoverySession | null {
    return this.currentSession;
  }

  async addPeerToSession(peerId: string): Promise<void> {
    if (!this.currentSession) return;
    
    if (!this.currentSession.peerIds.includes(peerId)) {
      this.currentSession.peerIds.push(peerId);
      await this.saveSession(this.currentSession);
    }
  }

  private async saveSession(session: DiscoverySession): Promise<void> {
    try {
      const existingSessions = await this.getAllSessions();
      const updatedSessions = existingSessions.filter(s => s.id !== session.id);
      updatedSessions.unshift(session);
      
      // Keep only the most recent sessions
      const sessionsToKeep = updatedSessions.slice(0, MAX_SESSIONS_TO_KEEP);
      
      await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessionsToKeep));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  async getAllSessions(): Promise<DiscoverySession[]> {
    try {
      const stored = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  async logConnection(peerId: string, interactionType: 'viewed' | 'saved' | 'shared', notes?: string): Promise<void> {
    if (!this.currentSession) return;

    const log: ConnectionLog = {
      logId: uuidv4(),
      peerId,
      sessionId: this.currentSession.id,
      saved: interactionType === 'saved',
      notes,
      interactionType,
      timestamp: new Date().toISOString()
    };

    try {
      const existingLogs = await this.getConnectionLogs();
      existingLogs.unshift(log);
      
      // Keep only the most recent logs
      const logsToKeep = existingLogs.slice(0, MAX_LOGS_TO_KEEP);
      
      await AsyncStorage.setItem(CONNECTION_LOGS_STORAGE_KEY, JSON.stringify(logsToKeep));
    } catch (error) {
      console.error('Error saving connection log:', error);
    }
  }

  async getConnectionLogs(): Promise<ConnectionLog[]> {
    try {
      const stored = await AsyncStorage.getItem(CONNECTION_LOGS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading connection logs:', error);
      return [];
    }
  }

  async clearOldSessions(): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const recentSessions = sessions.slice(0, MAX_SESSIONS_TO_KEEP);
      await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(recentSessions));
      
      const logs = await this.getConnectionLogs();
      const recentLogs = logs.slice(0, MAX_LOGS_TO_KEEP);
      await AsyncStorage.setItem(CONNECTION_LOGS_STORAGE_KEY, JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Error clearing old sessions:', error);
    }
  }
}

export const sessionService = new SessionService();
export default sessionService;