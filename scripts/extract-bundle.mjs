import fs from 'fs';
const s = fs.readFileSync('dist/assets/index-BLhUa2JK.js', 'utf8');

const keys = ['acad_scholar_v', 'acad_flashcards_v', 'acad_game_v', 'acad_courses_v', 'acad_habits_v'];
for (const k of keys) {
  const i = s.indexOf(k);
  console.log('\n===', k, '===');
  console.log(s.substring(i - 100, i + 300));
}

// nav items
const navMatch = s.match(/dock-btn[^`]*`([^`]+)`/g);
console.log('\n=== SAMPLE UI STRINGS ===');
const ui = [...s.matchAll(/children:\`([^\`]{3,80})\`/g)].map(m => m[1]);
const unique = [...new Set(ui)].slice(0, 80);
console.log(unique.join('\n'));
