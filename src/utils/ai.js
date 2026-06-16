import { isCloudEnabled, supabase } from '../lib/supabase.js';

const FLASHCARD_BANK = {
  Mathematics: [
    { front: 'What is the quadratic formula?', back: 'x = (−b ± √(b²−4ac)) / 2a, where ax² + bx + c = 0' },
    { front: 'Define the derivative of f(x) using limits.', back: "f'(x) = lim(h→0) [f(x+h) − f(x)] / h" },
    { front: "What is Euler's number (e)?", back: 'e ≈ 2.71828. The base of natural logarithms.' },
    { front: 'State the Pythagorean Theorem.', back: 'In a right triangle: a² + b² = c²' },
    { front: 'What is a prime number?', back: 'A natural number > 1 with no divisors other than 1 and itself.' },
  ],
  Biology: [
    { front: 'What is photosynthesis?', back: 'Plants convert light + CO₂ + H₂O → glucose + O₂ in chloroplasts.' },
    { front: 'Define mitosis.', back: 'Cell division producing two genetically identical diploid daughter cells.' },
    { front: "What is Darwin's theory of natural selection?", back: 'Organisms with advantageous traits survive and reproduce more.' },
    { front: 'What is the function of mitochondria?', back: 'Produce ATP via cellular respiration. Often called the powerhouse of the cell.' },
    { front: 'Distinguish DNA from RNA.', back: 'DNA: double-stranded, thymine. RNA: single-stranded, uracil.' },
  ],
  General: [
    { front: 'What is the scientific method?', back: 'Observation → Hypothesis → Experiment → Analysis → Conclusion.' },
    { front: 'Define opportunity cost.', back: 'Value of the best alternative forgone when making a decision.' },
    { front: 'What is cognitive load theory?', back: 'Working memory is limited; effective learning minimises extraneous load.' },
    { front: 'What is the spacing effect?', back: 'Spaced study intervals beat cramming for long-term retention.' },
    { front: 'Define the Pareto Principle.', back: 'Roughly 80% of effects come from 20% of causes.' },
  ],
};

const SOCRATIC_REPLIES = [
  "That's a great question. Rather than giving you the answer directly: **what do you already know** about this concept?",
  'Before I explain, try this: in your own words, what do you *think* the answer might be?',
  "Let's approach this step by step. The concept has **two key components**. Can you identify them?",
  'Good question. Understanding *why* the concept exists usually unlocks the idea itself.',
  "I'll guide you rather than answer directly: **what problem is this concept trying to solve?**",
];

const DIRECT_REPLIES = [
  "Here's a clear breakdown of the core idea and how it fits together.",
  'The key point is the underlying principle. Once you see that, the rest follows.',
  'Think of it this way: start with the definition, then apply it to a concrete example.',
  'The most common mistake here is confusing two related but distinct concepts. Here is the distinction.',
];

const FEYNMAN_REPLIES = [
  'Try explaining this as if to someone with no background. What is the simplest version you can say out loud?',
  'If you had to teach this in one minute, what three sentences would you use?',
  'Where does your explanation break down? That gap is exactly what to study next.',
  'Use an analogy from everyday life. What is this concept *like*?',
];

export const TEACHING_METHODS = [
  {
    id: 'socratic',
    label: 'Socratic',
    why: 'Forces you to retrieve and reason before receiving answers.',
    detail: 'Named after Socrates, who taught by asking questions. Research shows self-generated answers stick longer than passively read explanations. Use this when you want depth, not speed.',
  },
  {
    id: 'direct',
    label: 'Direct',
    why: 'Best when you need a clear explanation to get unstuck.',
    detail: 'Straight explanations when you are lost or need a foundation before practice. Use sparingly, then test yourself immediately after.',
  },
  {
    id: 'feynman',
    label: 'Feynman',
    why: 'Surfaces gaps by making you explain simply.',
    detail: 'Based on Richard Feynman\'s technique: explain simply, identify gaps, refine. If you cannot explain it plainly, you do not fully understand it yet.',
  },
];

const METHOD_PROMPTS = {
  socratic: (subject) => `You are Acad's Socratic Study Buddy for ${subject}. Guide through questions, not direct answers. Use markdown sparingly.`,
  direct: (subject) => `You are Acad's Study Buddy for ${subject}. Give clear, structured explanations. Be concise. Use markdown sparingly.`,
  feynman: (subject) => `You are Acad's Feynman-style Study Buddy for ${subject}. Ask the student to explain in simple terms, point out gaps, and use analogies. Use markdown sparingly.`,
};

const FALLBACK_REPLIES = {
  socratic: SOCRATIC_REPLIES,
  direct: DIRECT_REPLIES,
  feynman: FEYNMAN_REPLIES,
};

function delay(ms = 1200) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callBuddyViaEdge(messages, subject, method) {
  if (!isCloudEnabled() || !supabase) return null;
  const { data, error } = await supabase.functions.invoke('buddy-chat', {
    body: { messages, subject, method },
  });
  if (error) return null;
  return data?.reply ?? null;
}

async function callAnthropic(messages, systemPrompt) {
  if (isCloudEnabled()) return null;
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.content?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

export async function generateFlashcardsFromText(_text, subject = 'General') {
  await delay(1800);
  return FLASHCARD_BANK[subject] || FLASHCARD_BANK.General;
}

export function quizPrompt(subject) {
  return `Here are 5 questions on **${subject}** to test your understanding:

**Q1.** Define the core principle behind this topic and give one real-world example.
**Q2.** What are the key differences between two major concepts in this domain?
**Q3.** If you had to explain this to a 12-year-old, how would you frame it?
**Q4.** Identify one common misconception and correct it.
**Q5.** How does this connect to something you've studied elsewhere?

Take your time. Write your answers before reviewing. Retrieval practice is the point.`;
}

export async function chatWithBuddy(messages, subject, _mastery = {}, method = 'socratic') {
  const last = messages[messages.length - 1]?.content?.toLowerCase() || '';
  if (last.includes('quiz')) {
    await delay(1400);
    return quizPrompt(subject);
  }

  const apiMessages = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-8);

  const systemFn = METHOD_PROMPTS[method] || METHOD_PROMPTS.socratic;
  const edgeReply = await callBuddyViaEdge(apiMessages, subject, method);
  if (edgeReply) return edgeReply;

  const apiReply = await callAnthropic(apiMessages, systemFn(subject));
  if (apiReply) return apiReply;

  await delay(1400);
  const pool = FALLBACK_REPLIES[method] || FALLBACK_REPLIES.socratic;
  return pool[Math.floor(Math.random() * pool.length)];
}
