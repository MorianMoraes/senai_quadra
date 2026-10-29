import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow/800.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/900.css';
import './styles/app.css';
import App from './App';
import { AppProvider } from './contexts/AppContext';
import { testarConexaoSupabase } from './lib/supabaseClient';

testarConexaoSupabase();

const root = document.getElementById('app');
if (!root) throw new Error('Elemento de montagem não encontrado.');
createRoot(root).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
);