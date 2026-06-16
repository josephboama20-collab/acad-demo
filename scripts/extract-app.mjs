import fs from 'fs';
import { execSync } from 'child_process';

const bundlePath = 'dist/assets/index-BLhUa2JK.js';
const s = fs.readFileSync(bundlePath, 'utf8');

const markers = [
  'acad_scholar_v',
  'Acad — Academic Conditioning',
  'Memory System',
  'Socratic Study Buddy',
];

for (const m of markers) {
  console.log(m, s.indexOf(m));
}

// App code appears to start around scholar storage
const start = s.indexOf('acad_scholar_v') - 500;
const end = s.lastIndexOf('createRoot');
const chunk = s.slice(Math.max(0, start), end + 200);

fs.mkdirSync('scripts/out', { recursive: true });
fs.writeFileSync('scripts/out/app-chunk.js', chunk);
console.log('Wrote chunk', chunk.length, 'chars');

try {
  execSync('npx prettier --write scripts/out/app-chunk.js', { stdio: 'inherit' });
} catch {
  console.log('Prettier failed, raw chunk saved');
}
