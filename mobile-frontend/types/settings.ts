export interface Settings {
  id: string;
  scanInterval: number;
  advertisingEnabled: boolean;  
  notificationsEnabled: boolean;
  autoExpireTimeout: number;
  privacyMode: boolean;
  defaultDiscoveryMode: 'default' | 'event';
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'user-settings',
  scanInterval: 30,
  advertisingEnabled: true,
  notificationsEnabled: true,
  autoExpireTimeout: 5,
  privacyMode: false,
  defaultDiscoveryMode: 'default'
};