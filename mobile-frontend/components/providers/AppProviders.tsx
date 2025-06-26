import React from 'react';
import { ProfileProvider } from '@/context/ProfileContext';
import { DiscoveryProvider } from '@/context/DiscoveryContext';
import { SettingsProvider } from '@/context/SettingsContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <SettingsProvider>
      <ProfileProvider>
        <DiscoveryProvider>
          {children}
        </DiscoveryProvider>
      </ProfileProvider>
    </SettingsProvider>
  );
};