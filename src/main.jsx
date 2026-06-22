import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initTheme } from './contexts/ThemeContext.jsx';
import AppRoot from './AppRoot.jsx';
import './styles/index.css';
import './styles/themes.css';

initTheme();

if (import.meta.env.VITE_APP_ENV === 'staging') {
  const robots = document.createElement('meta');
  robots.name = 'robots';
  robots.content = 'noindex, nofollow';
  document.head.appendChild(robots);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
