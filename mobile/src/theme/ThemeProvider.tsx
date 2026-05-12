// Animated theme provider with persist + high-visibility mode for field use.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type ColorTokens,
  darkTokens,
  highVisDarkTokens,
  highVisLightTokens,
  lightTokens,
} from './colors';

export type ThemeMode = 'system' | 'light' | 'dark';

export type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  highVisibility: boolean;
  colors: ColorTokens;
  setMode: (mode: ThemeMode) => void;
  toggleHighVisibility: () => void;
  setHighVisibility: (on: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY_MODE = 'forest-sentry:theme:mode';
const STORAGE_KEY_HIVIS = 'forest-sentry:theme:hivis';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [highVisibility, setHighVisibilityState] = useState<boolean>(false);
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() ?? 'light');

  useEffect(() => {
    let active = true;
    void (async () => {
      const [storedMode, storedHivis] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_MODE),
        AsyncStorage.getItem(STORAGE_KEY_HIVIS),
      ]);
      if (!active) return;
      if (storedMode === 'system' || storedMode === 'light' || storedMode === 'dark') {
        setModeState(storedMode);
      }
      if (storedHivis === '1') {
        setHighVisibilityState(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? 'light');
    });
    return () => sub.remove();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY_MODE, next);
  }, []);

  const setHighVisibility = useCallback((on: boolean) => {
    setHighVisibilityState(on);
    void AsyncStorage.setItem(STORAGE_KEY_HIVIS, on ? '1' : '0');
  }, []);

  const toggleHighVisibility = useCallback(() => {
    setHighVisibilityState((prev) => {
      const next = !prev;
      void AsyncStorage.setItem(STORAGE_KEY_HIVIS, next ? '1' : '0');
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved: 'light' | 'dark' = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
    const isDark = resolved === 'dark';
    const colors = highVisibility
      ? isDark
        ? highVisDarkTokens
        : highVisLightTokens
      : isDark
        ? darkTokens
        : lightTokens;
    return { mode, isDark, highVisibility, colors, setMode, toggleHighVisibility, setHighVisibility };
  }, [mode, systemScheme, highVisibility, setMode, toggleHighVisibility, setHighVisibility]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

export function useColors(): ColorTokens {
  return useTheme().colors;
}
