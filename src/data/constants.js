import { uid } from '../utils/storage.js';
import { createCard } from '../utils/sm2.js';

export const DEFAULT_SCHOLAR = {
  user: null,
  profile: null,
  streak: {
    current: 0,
    best: 0,
    history: Array.from({ length: 42 }, () => false),
    lastActiveDate: null,
  },
  metrics: {
    tasksCompleted: 0,
    completionRate: 0,
    activeProjects: 0,
    engagementScore: 0,
  },
  projects: [],
  settings: { focusMode: false, emailNotifications: true, dailyReminders: true, showStreak: true },
};

export const SAMPLE_FLASHCARDS = [
  createCard('Key term 1', '[Add the definition from your notes]', 'General'),
  createCard('Key term 2', '[Add the definition from your notes]', 'General'),
  createCard('Core concept', '[Summarise the main idea in your own words]', 'General'),
  createCard('Application', '[Describe one way this concept applies in your course]', 'General'),
  createCard('Connection', '[Link this topic to another concept you are studying]', 'General'),
];

export const SAMPLE_COURSES = [
  {
    courseId: uid(),
    code: 'BIO',
    name: 'Cell & Genetics',
    topics: [
      { topicId: uid(), name: 'Cell Biology', importance: 'high', masteryLevel: 45, lastStudied: null },
      { topicId: uid(), name: 'Genetics', importance: 'high', masteryLevel: 62, lastStudied: null },
      { topicId: uid(), name: 'Evolution', importance: 'medium', masteryLevel: 38, lastStudied: null },
      { topicId: uid(), name: 'Ecology', importance: 'medium', masteryLevel: 78, lastStudied: null },
      { topicId: uid(), name: 'Molecular Biology', importance: 'high', masteryLevel: 70, lastStudied: null },
    ],
  },
  {
    courseId: uid(),
    code: 'CALC',
    name: 'Calculus Foundations',
    topics: [
      { topicId: uid(), name: 'Derivatives', importance: 'high', masteryLevel: 75, lastStudied: null },
      { topicId: uid(), name: 'Integrals', importance: 'high', masteryLevel: 42, lastStudied: null },
      { topicId: uid(), name: 'Series & Sequences', importance: 'medium', masteryLevel: 60, lastStudied: null },
      { topicId: uid(), name: 'Applications', importance: 'medium', masteryLevel: 55, lastStudied: null },
    ],
  },
];

export const CHALLENGES = [
  { id: 'fc_review', title: 'Recall Marathon', desc: 'Review 25 flashcards this week', icon: '📚', xpReward: 200, target: 25, unit: 'cards' },
  { id: 'streak_5', title: 'Consistency Chain', desc: 'Study 5 consecutive days', icon: '🔥', xpReward: 250, target: 5, unit: 'days' },
  { id: 'chat_10', title: 'Socratic Dialogue', desc: 'Exchange 10 messages with AI Buddy', icon: '💬', xpReward: 150, target: 10, unit: 'messages' },
  { id: 'habit_7', title: 'Wellness Discipline', desc: 'Log your wellness 7 days in a row', icon: '📊', xpReward: 180, target: 7, unit: 'logs' },
  { id: 'mastered', title: "Scholar's Mark", desc: 'Master 5 flashcards (5+ repetitions)', icon: '🏅', xpReward: 300, target: 5, unit: 'mastered' },
];

export const ACHIEVEMENTS = [
  { id: 'first_card', title: 'First Inscription', desc: 'Review your first flashcard', icon: '📖', xp: 50 },
  { id: 'streak_3', title: 'Three-Day Flame', desc: 'Maintain a 3-day study streak', icon: '🔥', xp: 75 },
  { id: 'streak_7', title: 'Week of Focus', desc: 'Maintain a 7-day study streak', icon: '🔥', xp: 100 },
  { id: 'habit_first', title: 'Self-Aware', desc: 'Complete your first wellness check-in', icon: '🌙', xp: 50 },
  { id: 'chat_first', title: 'First Inquiry', desc: 'Send your first AI Buddy message', icon: '💬', xp: 50 },
  { id: 'whiteboard', title: 'Studio Session', desc: 'Use the collaborative whiteboard', icon: '🎨', xp: 75 },
  { id: 'mastery_first', title: 'Card Mastered', desc: 'Master your first flashcard', icon: '🏅', xp: 100 },
];

export const LEADERBOARD = [
  { rank: 1, name: 'Isadora V.', streak: 24, badge: '⭐' },
  { rank: 2, name: 'Marcus T.', streak: 19, badge: '🔥' },
  { rank: 3, name: 'Priya N.', streak: 16, badge: '🎓' },
  { rank: 4, name: 'Eliot W.', streak: 14, badge: '🎯' },
  { rank: 5, name: 'Amara L.', streak: 12, badge: '🎯' },
  { rank: 6, name: 'Leon K.', streak: 10, badge: '📖' },
  { rank: 7, name: 'Nadia P.', streak: 8, badge: '📖' },
  { rank: 8, name: 'Rashid M.', streak: 6, badge: '📖' },
  { rank: 9, name: 'Sofia B.', streak: 4, badge: '📖' },
  { rank: 10, name: 'You', streak: null, badge: '🔰', isUser: true },
];

export const LOADER_LINES = [
  'Cognitive performance declines measurably when mental engagement drops for extended periods.',
  'Short, consistent effort tends to outperform irregular intense bursts over any given month.',
  'Projects signal applied ability more reliably than grades alone.',
  'The brain consolidates skills during low-intensity, consistent practice.',
  'Deliberate practice, not repetition, is what separates improvement from maintenance.',
  'Cognitive sharpness can deteriorate within two weeks of sustained disengagement.',
  'Portfolio work demonstrates capability. Certificates demonstrate exposure.',
  'Consistency compounds. Four weeks of daily effort yields nonlinear results.',
  'Mental conditioning is not acceleration. It is prevention of regression.',
  'Structured reflection on output accelerates skill acquisition.',
];

export const ONBOARDING_QUESTIONS = [
  {
    id: 'duration',
    q: 'How much time do you have for your comeback?',
    hint: 'This sets your course limit and which tools unlock. Three months is the maximum depth; under a month we keep only what is essential.',
    opts: ['2–3 weeks', '1 month (4 weeks)', '2 months (8 weeks)', '3 months (12+ weeks)'],
  },
  {
    id: 'effort',
    q: 'What level of effort are you prepared to commit?',
    hint: 'This affects task complexity and daily expectations.',
    opts: ['Low: light engagement', 'Moderate: steady and structured', 'High: intensive and demanding'],
  },
  {
    id: 'time',
    q: 'How much time can you realistically give each day?',
    hint: 'Realistic input produces realistic results.',
    opts: ['Under 30 minutes / day', '30–60 minutes / day', '1–2 hours / day', 'More than 2 hours / day'],
  },
  {
    id: 'position',
    q: 'Where are you starting from?',
    hint: 'No judgment. This shapes how we pace your plan.',
    opts: ['Rebuilding after a rough stretch', 'Maintaining what I have', 'Pushing to the next level', 'Still figuring it out'],
  },
  {
    id: 'sharpness',
    q: 'How mentally sharp do you feel right now?',
    hint: 'Rate your current state of cognitive engagement.',
    opts: ['Very sharp, in flow', 'Somewhat sharp, manageable', 'Dull, disengaged lately', 'Very dull, need to restart'],
  },
  {
    id: 'focus',
    q: 'Which area matters most right now?',
    hint: 'Your added courses drive every tool on the platform.',
    opts: ['Technology & systems', 'Creative & design work', 'Writing & communication', 'Data & analysis', 'Business & strategy', "I'm exploring"],
  },
  {
    id: 'intention',
    q: 'What is your primary intention?',
    hint: 'Focused comeback training. Not open-ended learning.',
    opts: ['Recover lost momentum', 'Rebuild core habits', 'Build a portfolio piece', 'Stay sharp during a break', 'Prepare for what comes next'],
  },
];

export const RATING_LABELS = ['Blackout', 'Wrong', 'Hard', 'Good', 'Perfect'];
export const MASTERY_COLORS = { learning: '#8b2e2e', reviewing: '#8b7346', mastered: '#4e6b66' };
