// app/components/userpreferences.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

type PrefContext = {
  displayName: string;
  setDisplayName: (value: string) => void;
  personalGreeting: boolean;
  setPersonalGreeting: (value: boolean) => void;
};

const UserPreferencesContext = createContext<PrefContext | undefined>(
  undefined,
);

const LS_KEY = 'lextrack_user_prefs_v1';

type StoredPrefs = {
  displayName?: string;
  personalGreeting?: boolean;
};

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayName] = useState<string>('Swen Heinrich');
  const [personalGreeting, setPersonalGreeting] = useState<boolean>(true);

  // Laden aus localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return;

      const parsed: StoredPrefs = JSON.parse(raw);

      if (typeof parsed.displayName === 'string') {
        setDisplayName(parsed.displayName);
      }
      if (typeof parsed.personalGreeting === 'boolean') {
        setPersonalGreeting(parsed.personalGreeting);
      }
    } catch (err) {
      console.error('Failed to load user preferences', err);
    }
  }, []);

  // Speichern in localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const payload: StoredPrefs = {
      displayName,
      personalGreeting,
    };

    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch (err) {
      console.error('Failed to save user preferences', err);
    }
  }, [displayName, personalGreeting]);

  const value: PrefContext = {
    displayName,
    setDisplayName,
    personalGreeting,
    setPersonalGreeting,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) {
    throw new Error(
      'useUserPreferences must be used within UserPreferencesProvider',
    );
  }
  return ctx;
}
