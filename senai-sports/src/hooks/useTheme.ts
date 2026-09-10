import { useEffect, useState } from 'react';
import type { Theme } from '../types/models';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return localStorage.getItem('senaiSportsThemeV1') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('senaiSportsThemeV1', theme); } catch { /* Tema continua disponível nesta sessão. */ }
  }, [theme]);
  return { theme, toggleTheme: () => setTheme(current => current === 'dark' ? 'light' : 'dark') };
}
