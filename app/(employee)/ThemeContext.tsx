'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeCtx { isDark: boolean; toggle: () => void; }

const Ctx = createContext<ThemeCtx>({ isDark: true, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) setIsDark(saved === 'dark');
  }, []);

  const toggle = () => {
    setIsDark(p => {
      const next = !p;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return <Ctx.Provider value={{ isDark, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);