/**
 * Generates src/ from extracted bundle slices.
 * Run: node scripts/rebuild-src.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = 'src';
const chunk = fs.readFileSync('scripts/out/app-chunk.js', 'utf8');

function write(rel, content) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function extractBetween(startMarker, endMarker) {
  const start = chunk.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing: ${startMarker}`);
  const end = endMarker ? chunk.indexOf(endMarker, start + startMarker.length) : chunk.length;
  return chunk.slice(start, end < 0 ? chunk.length : end);
}

// Copy CSS
fs.mkdirSync(path.join(ROOT, 'styles'), { recursive: true });
fs.copyFileSync('dist/assets/index-D3R7APZT.css', path.join(ROOT, 'styles/index.css'));

write('main.jsx', `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppRoot from './AppRoot.jsx';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
`);

write('AppRoot.jsx', `import { AuthProvider } from './contexts/AuthContext.jsx';
import { GameProvider } from './contexts/GameContext.jsx';
import { CoursesProvider } from './contexts/CoursesContext.jsx';
import { FlashcardMasteryBridge } from './contexts/FlashcardMasteryBridge.jsx';
import { HabitsProvider } from './contexts/HabitsContext.jsx';
import App from './App.jsx';

export default function AppRoot() {
  return (
    <AuthProvider>
      <GameProvider>
        <CoursesProvider>
          <FlashcardMasteryBridge>
            <HabitsProvider>
              <App />
            </HabitsProvider>
          </FlashcardMasteryBridge>
        </CoursesProvider>
      </GameProvider>
    </AuthProvider>
  );
}
`);

console.log('Base files written. Run full generator for pages...');
