'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'forest' | 'ocean' | 'high-contrast' | 'colorblind';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as Theme | null;

    // Check if saved theme is valid
    if (savedTheme && ['dark', 'light', 'forest', 'ocean', 'high-contrast', 'colorblind'].includes(savedTheme)) {
      setThemeState(savedTheme);
    } else {
      // Fall back to system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      setThemeState(systemTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) {return;}

    // Update document attribute
    document.documentElement.setAttribute('data-theme', theme);
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      // Cycle through: dark -> light -> forest -> ocean -> high-contrast -> colorblind -> dark
      if (prev === 'dark') {return 'light';}
      if (prev === 'light') {return 'forest';}
      if (prev === 'forest') {return 'ocean';}
      if (prev === 'ocean') {return 'high-contrast';}
      if (prev === 'high-contrast') {return 'colorblind';}
      return 'dark';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

const defaultTheme: ThemeContextType = {
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
};

export function useTheme() {
  const context = useContext(ThemeContext);
  return context ?? defaultTheme;
}
