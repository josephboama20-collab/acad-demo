import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('src');
const chunk = fs.readFileSync('scripts/out/app-chunk.js', 'utf8');

function write(rel, content) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log('wrote', rel);
}

// Copy CSS
fs.mkdirSync(path.join(ROOT, 'styles'), { recursive: true });
fs.copyFileSync('dist/assets/index-D3R7APZT.css', path.join(ROOT, 'styles/index.css'));
console.log('copied styles/index.css');

// Extract slices by known positions in app-chunk
const slice = (start, end) => chunk.slice(start, end);

const STORAGE_START = chunk.indexOf('acad_scholar_v');
const POS = {
  storage: [STORAGE_START, 2553],
  flashcardsUtils: [2553, 4523],
  flashcardsProvider: [4523, 16241],
  habitsConfettiGame: [16241, 31285],
  gameTail: [31285, 34741],
  coursesNav: [34741, 80743],
  loaderLanding: [80743, 87332],
  authPage: [87332, 90010],
  onboardingUtils: [90010, 95438],
  dashboard: [95438, 104762],
  projects: [104762, 109126],
  forge: [109126, 113186],
  reports: [113186, 124805],
  flashcardsPage: [124805, 178012],
  aiBuddy: [178012, 365786],
  habitsPage: [365786, 375471],
  challenges: [375471, 379996],
  studyRoom: [379996, 390405],
  coursesPage: [390405, 416949],
  app: [416949, 418322],
  bridge: [418322, 418656],
};

console.log('Positions verified:', Object.fromEntries(
  Object.entries(POS).map(([k, [s]]) => [k, s >= 0])
));
