import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { darkColors, lightColors, type Colors } from '../theme';

const STORAGE_KEY = 'theme-scheme';

type Scheme = 'light' | 'dark';

interface ThemeState {
  scheme: Scheme;
  colors: Colors;
  toggleScheme: () => void;
}

const Context = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setScheme] = useState<Scheme>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') setScheme(saved);
    });
  }, []);

  const toggleScheme = useCallback(() => {
    setScheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const colors = scheme === 'dark' ? darkColors : lightColors;

  return <Context.Provider value={{ scheme, colors, toggleScheme }}>{children}</Context.Provider>;
}

export function useTheme() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
