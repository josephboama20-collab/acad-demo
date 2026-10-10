const TASKS = [
  { title: 'Structured Output Drill', type: 'Writing', desc: 'Draft a short analysis of a topic from your courses. Focus on clarity and structure, not length.' },
  { title: 'Concept Mapping Session', type: 'Analysis', desc: 'Pick one concept from your recent study. Map its connections to three related ideas without looking at notes.' },
  { title: 'Applied Problem Set', type: 'Technical', desc: 'Solve two problems in your course material using only first principles. Write out each step explicitly.' },
  { title: 'Reflection Log', type: 'Meta-cognition', desc: 'Write briefly on what you learned yesterday and one thing you found difficult. Be specific.' },
  { title: 'Speed Synthesis', type: 'Communication', desc: 'Explain a complex idea from your courses in under 3 minutes of writing, as if to someone new to the subject.' },
];

let lastIndex = -1;

export function pickDailyTask(profile) {
  let idx;
  do {
    idx = Math.floor(Math.random() * TASKS.length);
  } while (idx === lastIndex && TASKS.length > 1);
  lastIndex = idx;
  const task = TASKS[idx];
  let desc = task.desc;
  if (profile?.sharpness?.startsWith('Very dull')) {
    desc = desc.replace('short analysis', 'brief analysis').replace('under 3 minutes', 'under 2 minutes');
  }
  if (profile?.progressionStatus === 'regressed') {
    desc = `${desc} Prioritize fundamentals and rebuild confidence before speed.`;
  } else if (profile?.progressionStatus === 'improved') {
    desc = `${desc} Push for depth and stretch one level beyond your comfort zone.`;
  }
  return { ...task, desc };
}

export function fetchDailyTask(profile) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ data: pickDailyTask(profile), source: 'adaptive' }), 1100);
  });
}
