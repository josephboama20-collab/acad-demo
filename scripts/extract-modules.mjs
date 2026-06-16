import fs from 'fs';

const s = fs.readFileSync('scripts/out/app-chunk.js', 'utf8');

const positions = [
  ['00_storage_ai', 500, 2553],
  ['01_auth', 2553, 4523],
  ['02_flashcards_bridge', 4523, 16241],
  ['03_flashcards_provider', 16241, 31285],
  ['04_game', 31285, 34741],
  ['05_courses', 34741, 37244],
  ['06_nav_modal', 37244, 80743],
  ['07_loader', 80743, 83069],
  ['08_landing', 83069, 87332],
  ['09_authPage', 87332, 90010],
  ['10_onboarding', 90010, 95438],
  ['11_dashboard', 95438, 104762],
  ['12_projects', 104762, 109126],
  ['13_forge', 109126, 113186],
  ['14_reports', 113186, 124805],
  ['15_flashcardsPage', 124805, 178012],
  ['16_aiBuddy', 178012, 365786],
  ['17_habits', 365786, 375471],
  ['18_challenges', 375471, 379996],
  ['19_studyRoom', 379996, 390405],
  ['20_coursesPage', 390405, 416949],
  ['21_app', 416949, 418322],
  ['22_bridge', 418322, 418656],
  ['23_root', 418656, s.length],
];

fs.mkdirSync('scripts/out/extracted', { recursive: true });
for (const [name, start, end] of positions) {
  const chunk = s.slice(start, end);
  fs.writeFileSync(`scripts/out/extracted/${name}.js`, chunk);
  console.log(name, chunk.length);
}
