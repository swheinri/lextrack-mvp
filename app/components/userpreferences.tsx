// app/components/userpreferences.tsx
'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type UserPreferences = {
  displayName: string;
  personalGreeting: boolean;
};

type Ctx = UserPreferences & {
  setDisplayName: (name: string) => void;
  setPersonalGreeting: (enabled: boolean) => void;
  resetPreferences: () => void;
};

const DEFAULTS: UserPreferences = {
  displayName: '',
  personalGreeting: true,
};

const LS_KEY = 'lextrack_userprefs_v1';

const UserPreferencesContext = createContext<Ctx>({
  ...DEFAULTS,
  setDisplayName: () => {},
  setPersonalGreeting: () => {},
  resetPreferences: () => {},
});

function safeReadPrefs(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULTS;

  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULTS;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULTS;

    const p = parsed as Partial<UserPreferences>;

    return {
      displayName: typeof p.displayName === 'string' ? p.displayName : DEFAULTS.displayName,
      personalGreeting:
        typeof p.personalGreeting === 'boolean' ? p.personalGreeting : DEFAULTS.personalGreeting,
    };
  } catch {
    return DEFAULTS;
  }
}

function safeWritePrefs(prefs: UserPreferences) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => safeReadPrefs(), []);
  const [displayName, setDisplayNameState] = useState<string>(initial.displayName);
  const [personalGreeting, setPersonalGreetingState] = useState<boolean>(initial.personalGreeting);

  // Persist (ohne setState im Effect)
  useEffect(() => {
    safeWritePrefs({ displayName, personalGreeting });
  }, [displayName, personalGreeting]);

  const setDisplayName = (name: string) => setDisplayNameState(name);
  const setPersonalGreeting = (enabled: boolean) => setPersonalGreetingState(enabled);

  const resetPreferences = () => {
    setDisplayNameState(DEFAULTS.displayName);
    setPersonalGreetingState(DEFAULTS.personalGreeting);
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        displayName,
        personalGreeting,
        setDisplayName,
        setPersonalGreeting,
        resetPreferences,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  return useContext(UserPreferencesContext);
}
