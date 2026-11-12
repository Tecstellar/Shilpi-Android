import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildThemeColors,
  Colors,
  THEME_LIST,
  ThemeColors,
  ThemeDefinition,
  ThemeName,
  THEMES,
} from './colors';

const THEME_STORAGE_KEY = '@shilpi_theme';

interface ThemeContextValue {
  themeName: ThemeName;
  colors: ThemeColors;
  themes: ThemeDefinition[];
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeName: 'Signature',
  colors: Colors,
  themes: THEME_LIST,
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>('Signature');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (!mounted || !saved) return;
        if (saved in THEMES) {
          const valid = saved as ThemeName;
          Object.assign(Colors, buildThemeColors(valid));
          setThemeName(valid);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const setTheme = useCallback((name: ThemeName) => {
    const valid: ThemeName = name in THEMES ? name : 'Signature';
    Object.assign(Colors, buildThemeColors(valid));
    setThemeName(valid);
    AsyncStorage.setItem(THEME_STORAGE_KEY, valid).catch(() => {});
  }, []);

  const colors = useMemo(() => buildThemeColors(themeName), [themeName]);

  const value = useMemo(
    () => ({
      themeName,
      colors,
      themes: THEME_LIST,
      setTheme,
    }),
    [themeName, colors, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
