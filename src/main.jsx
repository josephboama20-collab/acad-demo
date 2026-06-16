import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initTheme } from './contexts/ThemeContext.jsx';
import AppRoot from './AppRoot.jsx';
import './styles/index.css';
import './styles/themes.css';

initTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
