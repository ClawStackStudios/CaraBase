import React, { createContext, useContext, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setTheme: (theme: Theme, event?: React.MouseEvent | React.SyntheticEvent) => void;
  toggleTheme: (event?: React.MouseEvent | React.SyntheticEvent) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cb_theme') as Theme | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    }
    return 'system';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Dynamically react to OS-level theme preference shifts when in system mode
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme: ResolvedTheme = theme === 'system'
    ? (systemPrefersDark ? 'dark' : 'light')
    : theme;

  const isDark = resolvedTheme === 'dark';

  // Keep root DOM class in sync for initial mount or system preference shifts
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('cb_theme', theme);
  }, [theme, resolvedTheme]);

  const applyThemeWithTransition = (newTheme: Theme, event?: React.MouseEvent | React.SyntheticEvent) => {
    const targetResolved: ResolvedTheme = newTheme === 'system'
      ? (systemPrefersDark ? 'dark' : 'light')
      : newTheme;

    const isTransitionable =
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // If both preference and visual output match, no transition needed
    if (newTheme === theme && targetResolved === resolvedTheme) {
      return;
    }

    if (!isTransitionable) {
      setThemeState(newTheme);
      const root = document.documentElement;
      if (targetResolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('cb_theme', newTheme);
      return;
    }

    // Extract click origin coordinates or default to screen center
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    if (event && 'clientX' in event && typeof (event as any).clientX === 'number') {
      x = (event as any).clientX;
      y = (event as any).clientY;
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      flushSync(() => {
        setThemeState(newTheme);
        const root = document.documentElement;
        if (targetResolved === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        localStorage.setItem('cb_theme', newTheme);
      });
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`
      ];

      document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 900,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    }).catch(() => {
      // Graceful fallback if view transition fails
    });
  };

  const setTheme = (newTheme: Theme, event?: React.MouseEvent | React.SyntheticEvent) => {
    applyThemeWithTransition(newTheme, event);
  };

  const toggleTheme = (event?: React.MouseEvent | React.SyntheticEvent) => {
    const nextTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
    applyThemeWithTransition(nextTheme, event);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
