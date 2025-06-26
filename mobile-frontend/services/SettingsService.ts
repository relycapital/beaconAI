import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings, DEFAULT_SETTINGS } from '@/types/settings';

const SETTINGS_STORAGE_KEY = 'app_settings';

class SettingsService {
  private settings: Settings = DEFAULT_SETTINGS;

  async loadSettings(): Promise<Settings> {
    try {
      const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
      } else {
        this.settings = DEFAULT_SETTINGS;
        await this.saveSettings(this.settings);
      }
      return this.settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: Partial<Settings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  getSettings(): Settings {
    return { ...this.settings };
  }

  async resetSettings(): Promise<void> {
    try {
      this.settings = DEFAULT_SETTINGS;
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  }
}

export const settingsService = new SettingsService();
export default settingsService;