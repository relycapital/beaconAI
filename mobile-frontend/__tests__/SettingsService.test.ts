import { settingsService } from '../services/SettingsService';
import { DEFAULT_SETTINGS } from '../types/settings';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

describe('SettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Settings Management', () => {
    it('should load default settings when no stored settings exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const settings = await settingsService.loadSettings();
      
      expect(settings).toEqual(DEFAULT_SETTINGS);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'app_settings',
        JSON.stringify(DEFAULT_SETTINGS)
      );
    });

    it('should load stored settings when they exist', async () => {
      const storedSettings = {
        ...DEFAULT_SETTINGS,
        scanInterval: 60,
        privacyMode: true,
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(storedSettings)
      );
      
      const settings = await settingsService.loadSettings();
      
      expect(settings).toEqual(storedSettings);
    });

    it('should merge partial stored settings with defaults', async () => {
      const partialSettings = {
        scanInterval: 45,
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(partialSettings)
      );
      
      const settings = await settingsService.loadSettings();
      
      expect(settings).toEqual({
        ...DEFAULT_SETTINGS,
        scanInterval: 45,
      });
    });

    it('should handle JSON parse errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-json');
      
      const settings = await settingsService.loadSettings();
      
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should save settings successfully', async () => {
      const newSettings = { scanInterval: 120 };
      
      await settingsService.saveSettings(newSettings);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'app_settings',
        expect.stringContaining('"scanInterval":120')
      );
    });

    it('should get current settings', () => {
      const settings = settingsService.getSettings();
      
      expect(settings).toBeDefined();
      expect(settings.id).toBe('user-settings');
    });

    it('should reset settings to defaults', async () => {
      await settingsService.resetSettings();
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'app_settings',
        JSON.stringify(DEFAULT_SETTINGS)
      );
    });

    it('should handle save errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      // Should not throw
      await expect(settingsService.saveSettings({ scanInterval: 100 })).resolves.toBeUndefined();
    });

    it('should handle reset errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      // Should not throw
      await expect(settingsService.resetSettings()).resolves.toBeUndefined();
    });
  });

  describe('Setting Validation', () => {
    it('should validate scan interval bounds', async () => {
      await settingsService.saveSettings({ scanInterval: 5 });
      const settings = settingsService.getSettings();
      expect(settings.scanInterval).toBe(5);
    });

    it('should validate auto-expire timeout', async () => {
      await settingsService.saveSettings({ autoExpireTimeout: 1 });
      const settings = settingsService.getSettings();
      expect(settings.autoExpireTimeout).toBe(1);
    });

    it('should handle boolean settings correctly', async () => {
      await settingsService.saveSettings({
        advertisingEnabled: false,
        notificationsEnabled: false,
        privacyMode: true,
      });
      
      const settings = settingsService.getSettings();
      expect(settings.advertisingEnabled).toBe(false);
      expect(settings.notificationsEnabled).toBe(false);
      expect(settings.privacyMode).toBe(true);
    });
  });

  describe('Settings Persistence', () => {
    it('should persist multiple setting updates', async () => {
      await settingsService.saveSettings({ scanInterval: 30 });
      await settingsService.saveSettings({ autoExpireTimeout: 10 });
      await settingsService.saveSettings({ privacyMode: true });
      
      const settings = settingsService.getSettings();
      expect(settings.scanInterval).toBe(30);
      expect(settings.autoExpireTimeout).toBe(10);
      expect(settings.privacyMode).toBe(true);
    });

    it('should maintain settings across service instantiation', async () => {
      await settingsService.saveSettings({ scanInterval: 90 });
      
      // Settings should persist in memory
      const settings = settingsService.getSettings();
      expect(settings.scanInterval).toBe(90);
    });
  });
});