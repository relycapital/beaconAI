/**
 * Profile Context
 * Manages user profiles for BLE discovery
 * Follows Context-Based State Management requirement from BeaconAI ruleset
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile } from '../types/profile';
import { v4 as uuidv4 } from 'uuid';

// Storage key
const PROFILE_STORAGE_KEY = '@BeaconAI:userProfile';

/**
 * Context type definition
 */
export type ProfileContextType = {
  profile: Profile | null;
  isLoading: boolean;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
  clearProfile: () => Promise<void>;
};

// Create the context
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Context provider component
export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Load profile from storage on mount
  useEffect(() => {
    loadProfile();
  }, []);
  
  // Load profile from AsyncStorage
  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profileData = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      
      if (profileData) {
        setProfile(JSON.parse(profileData));
      } else {
        // Create a default profile if none exists
        const defaultProfile: Profile = {
          uuid: uuidv4(),
          name: 'User',
        };
        
        setProfile(defaultProfile);
        await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(defaultProfile));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update profile
  const updateProfile = async (updatedProfile: Partial<Profile>) => {
    try {
      setIsLoading(true);
      
      const newProfile = profile 
        ? { ...profile, ...updatedProfile }
        : { uuid: uuidv4(), name: 'User', ...updatedProfile };
      
      setProfile(newProfile);
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear profile
  const clearProfile = async () => {
    try {
      setIsLoading(true);
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
      setProfile(null);
    } catch (error) {
      console.error('Error clearing profile:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Provider value
  const value: ProfileContextType = {
    profile,
    isLoading,
    updateProfile,
    clearProfile
  };
  
  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

// Hook for using profile context
export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  
  return context;
};