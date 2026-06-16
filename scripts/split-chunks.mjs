import fs from 'fs';
import path from 'path';

const bundle = fs.readFileSync('dist/assets/index-BLhUa2JK.js', 'utf8');

const fnStarts = [
  ['storage', 'function jt('],
  ['auth', 'function y('],
  ['courses', 'function xt('],
  ['game', 'function pt('],
  ['flashcards', 'function Ze('],
  ['nav', 'function Tt('],
  ['loader', 'function Rt('],
  ['modal', 'function Ot('],
  ['landing', 'function Wt('],
  ['authPage', 'function Gt('],
  ['onboarding', 'function Kt('],
  ['dashboard', 'function rn('],
  ['projects', 'function on('],
  ['forge', 'function cn('],
  ['reports', 'function pn('],
  ['flashcardsPage', 'function wn('],
  ['aiBuddy', 'function oi('],
  ['habits', 'function Np('],
  ['challenges', 'function Vp('],
  ['studyRoom', 'function Kp('],
  ['coursesPage', 'function Zp('],
  ['app', 'function um('],
  ['root', 'function fm('],
];

const positions = fnStarts
  .map(([name, sig]) => ({ name, idx: bundle.indexOf(sig) }))
  .filter((x) => x.idx >= 0)
  .sort((a, b) => a.idx - b.idx);

const outDir = 'scripts/out/chunks';
fs.mkdirSync(outDir, { recursive: true });

for (let i = 0; i < positions.length; i++) {
  const { name, idx } = positions[i];
  const end = i + 1 < positions.length ? positions[i + 1].idx : bundle.length;
  const chunk = bundle.slice(idx, end);
  fs.writeFileSync(path.join(outDir, `${name}.js`), chunk);
  console.log(name, chunk.length);
}

const strings = [...bundle.matchAll(/`([^`\\]{4,120})`/g)]
  .map((m) => m[1])
  .filter((s) => /[A-Za-z]{3}/.test(s) && !s.includes('${') && !/^#[0-9a-f]{3,8}$/i.test(s))
  .filter((s) => !/^[a-z-]+(:[a-z-]+)?$/.test(s) || s.includes(' '));

fs.writeFileSync(
  'scripts/out/ui-strings.json',
  JSON.stringify([...new Set(strings)].sort(), null, 2),
);

console.log('UI strings:', new Set(strings).size);
