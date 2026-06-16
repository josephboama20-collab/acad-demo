import fs from 'fs';

const s = fs.readFileSync('dist/assets/index-BLhUa2JK.js', 'utf8');

const appIdx = s.indexOf('function um()');
const appChunk = s.slice(appIdx, appIdx + 12000);
const pageMatches = [...appChunk.matchAll(/n===`([^`]+)`/g)].map((m) => m[1]);
console.log('App pages:', [...new Set(pageMatches)].join(', '));

const navMatches = [...s.matchAll(/setPage:\w+,page:`([^`]+)`/g)].map((m) => m[1]);
console.log('Nav pages:', [...new Set(navMatches)].join(', '));

const storage = [...s.matchAll(/acad_[a-z_]+/g)].map((m) => m[0]);
console.log('Storage keys:', [...new Set(storage)].join(', '));

const classPrefixes = [...s.matchAll(/className:`([a-z]{2})-/g)].map((m) => m[1]);
const counts = {};
for (const p of classPrefixes) counts[p] = (counts[p] || 0) + 1;
console.log('CSS prefixes:', Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k, v]) => `${k}:${v}`).join(', '));
