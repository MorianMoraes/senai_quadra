import { useEffect, useState } from 'react';
import type { Theme } from '../types/models';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return localStorage.getItem('senaiSportsThemeV1') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#10171b' : '#f3f5f4');
    try { localStorage.setItem('senaiSportsThemeV1', theme); } catch { /* Tema continua disponível nesta sessão. */ }
  }, [theme]);
  return { theme, toggleTheme: () => setTheme(current => current === 'dark' ? 'light' : 'dark') };
}
