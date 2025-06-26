import React, { createContext, useContext, useState, useEffect } from 'react';
import { Settings } from '@/types/settings';
import settingsService from '@/services/SettingsService';

interface SettingsContextType {
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: settingsService.getSettings(),
  updateSettings: async () => {},
  resetSettings: async () => {},
  isLoading: true,
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(settingsService.getSettings());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await settingsService.loadSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      await settingsService.saveSettings(newSettings);
      setSettings(settingsService.getSettings());
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const resetSettings = async () => {
    try {
      await settingsService.resetSettings();
      setSettings(settingsService.getSettings());
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};