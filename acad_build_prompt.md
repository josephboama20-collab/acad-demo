# Build Acad - Academic Conditioning Platform

You are building "Acad" — an Academic Conditioning Platform using Vite + vanilla JavaScript (ES6 modules). The project already has a hand-coded SVG radar chart and localStorage persistence implemented. You're adding 5 new advanced features.

## PROJECT STRUCTURE

```
acad/
├── index.html
├── src/
│   ├── app.js (main entry)
│   ├── styles/
│   │   ├── main.css
│   │   └── components.css
│   ├── components/
│   │   ├── radarChart.js (ALREADY EXISTS)
│   │   ├── flashcards.js (NEW)
│   │   ├── studyRooms.js (NEW)
│   │   ├── chatAssistant.js (NEW)
│   │   ├── habitTracker.js (NEW)
│   │   └── challenges.js (NEW)
│   ├── utils/
│   │   ├── storage.js (ALREADY EXISTS - localStorage wrapper)
│   │   ├── sm2Algorithm.js (NEW - spaced repetition)
│   │   └── analytics.js (NEW - correlation engine)
│   └── data/
│       └── sampleData.js
├── vite.config.js
└── package.json
```

---

## CRITICAL FOUNDATION FEATURES (Build These First)

### 0A. Course Registration & Syllabus Import System

**This is THE MOST IMPORTANT feature - build this before anything else.**

**Problem:** Students can't use Acad if it doesn't know what they're studying.

**Requirements:**
- Course registration wizard (onboarding flow)
- Course data structure:
  ```javascript
  {
    courseId: "uuid",
    code: "BIO 101",
    name: "Introduction to Biology",
    instructor: "Dr. Chen",
    semester: "Fall 2025",
    credits: 3,
    meetingTimes: "Mon/Wed 10:00-11:30am",
    syllabus: { /* parsed data */ },
    topics: [
      {
        topicId: "uuid",
        name: "Cell Biology",
        importance: "high",
        examDate: "2025-09-28",
        masteryLevel: 45, // percentage
        flashcardCount: 25,
        lastStudied: "2025-04-25"
      }
    ],
    assignments: [
      {
        assignmentId: "uuid",
        title: "Lab Report 1",
        dueDate: "2025-09-15",
        weight: 10, // percentage of grade
        status: "pending" // pending | in-progress | completed
      }
    ],
    exams: [
      {
        examId: "uuid",
        title: "Midterm Exam",
        date: "2025-09-28",
        topics: ["Cell Biology", "Genetics"],
        weight: 25
      }
    ]
  }
  ```

**Syllabus Upload & AI Parsing:**
- Accept PDF/DOCX uploads
- Use Groq API to extract:
  - Learning objectives → convert to radar chart categories
  - Assignment deadlines
  - Exam dates
  - Grading breakdown
  - Required topics

**Groq Prompt for Syllabus Parsing:**
```javascript
const syllabusText = extractedTextFromPDF;

const prompt = `You are parsing a university course syllabus. Extract the following information and return ONLY valid JSON:

{
  "courseName": "string",
  "topics": ["topic1", "topic2", ...],
  "assignments": [
    {"title": "string", "dueDate": "YYYY-MM-DD", "weight": number}
  ],
  "exams": [
    {"title": "string", "date": "YYYY-MM-DD", "topics": ["topic"], "weight": number}
  ],
  "learningObjectives": ["objective1", "objective2", ...]
}

Syllabus text:
${syllabusText}`;

const response = await chatWithAI([
  { role: 'user', content: prompt }
], 'You are a syllabus parsing assistant. Return only valid JSON.');
```

**Manual Topic Entry (fallback if no syllabus):**
- Form to manually add topics
- Suggest common topics based on course code (e.g., BIO 101 → suggest Cell Biology, Genetics, etc.)

---

### 0B. Daily Task Generator

**Requirements:**
- Generate specific daily tasks based on:
  - Upcoming exams (prioritize topics on exam)
  - Assignment deadlines (suggest prep materials)
  - Student's weak areas (from radar chart)
  - Study time available (from user settings)

**Task Structure:**
```javascript
{
  taskId: "uuid",
  courseId: "course_uuid",
  type: "flashcards", // flashcards | quiz | ai_tutor | reading
  title: "Review Cell Biology flashcards",
  description: "Study 10 flashcards from Cell Biology topic",
  estimatedTime: 10, // minutes
  priority: "high", // high | medium | low
  dueDate: "2025-04-30",
  completed: false,
  xpReward: 50,
  linkedTopic: "Cell Biology"
}
```

**Daily Task Generation Logic:**
```javascript
function generateDailyTasks(student) {
  const tasks = [];
  const today = new Date();
  
  // 1. Upcoming exams (next 7 days)
  const upcomingExams = student.courses
    .flatMap(c => c.exams)
    .filter(e => isWithinDays(e.date, 7));
  
  upcomingExams.forEach(exam => {
    exam.topics.forEach(topic => {
      tasks.push({
        type: 'flashcards',
        title: `Review ${topic} for ${exam.title}`,
        priority: 'high',
        estimatedTime: 15
      });
    });
  });
  
  // 2. Due assignments (next 3 days)
  const dueAssignments = student.courses
    .flatMap(c => c.assignments)
    .filter(a => isWithinDays(a.dueDate, 3) && a.status !== 'completed');
  
  dueAssignments.forEach(assignment => {
    tasks.push({
      type: 'ai_tutor',
      title: `Get help on ${assignment.title}`,
      priority: 'high',
      estimatedTime: 20
    });
  });
  
  // 3. Weak topics (radar chart < 60%)
  const weakTopics = student.courses
    .flatMap(c => c.topics)
    .filter(t => t.masteryLevel < 60);
  
  weakTopics.forEach(topic => {
    tasks.push({
      type: 'flashcards',
      title: `Improve ${topic.name} (currently ${topic.masteryLevel}%)`,
      priority: 'medium',
      estimatedTime: 10
    });
  });
  
  // 4. Spaced repetition (cards due for review)
  const dueCards = getFlashcardsDueToday(student);
  if (dueCards.length > 0) {
    tasks.push({
      type: 'flashcards',
      title: `Review ${dueCards.length} flashcards due today`,
      priority: 'medium',
      estimatedTime: Math.ceil(dueCards.length / 2) // ~2 cards/min
    });
  }
  
  // Sort by priority and limit to 5-7 tasks
  return tasks
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, 7);
}
```

**UI: Daily Dashboard**
```
📋 Today's Study Plan (Wednesday, April 30)

⚠️ High Priority:
[ ] Review Cell Biology flashcards (15min) - Exam in 3 days
[ ] Complete BIO 101 practice quiz (20min)

📚 Recommended:
[ ] Improve Genetics (currently 55%) - Study 10 cards (10min)
[ ] Review 15 flashcards due today (8min)
[ ] AI Tutor: "Explain osmosis" (10min)

Total time: 1hr 3min

[Start First Task]
```

---

### 0C. Course-Specific Radar Chart

**Instead of generic categories, radar chart shows topics from student's actual courses:**

**Data Structure:**
```javascript
{
  radarData: [
    {
      courseId: "bio_101",
      courseName: "BIO 101",
      categories: [
        { name: "Cell Biology", score: 45, color: "#EF4444" },      // red
        { name: "Genetics", score: 62, color: "#F59E0B" },          // yellow
        { name: "Evolution", score: 38, color: "#EF4444" },
        { name: "Ecology", score: 78, color: "#10B981" },           // green
        { name: "Molecular Biology", score: 70, color: "#10B981" },
        { name: "Lab Skills", score: 50, color: "#F59E0B" }
      ]
    },
    {
      courseId: "math_201",
      courseName: "MATH 201",
      categories: [
        { name: "Derivatives", score: 75, color: "#10B981" },
        { name: "Integrals", score: 42, color: "#EF4444" },
        { name: "Series", score: 60, color: "#F59E0B" },
        { name: "Applications", score: 55, color: "#F59E0B" }
      ]
    }
  ]
}
```

**Score Calculation Logic:**
```javascript
function calculateTopicMastery(topic) {
  const flashcardPerformance = getAvgFlashcardScore(topic);
  const quizPerformance = getAvgQuizScore(topic);
  const studyTime = getStudyTimeWeight(topic);
  
  // Weighted average
  return Math.round(
    (flashcardPerformance * 0.4) + 
    (quizPerformance * 0.5) + 
    (studyTime * 0.1)
  );
}
```

**Auto-updates when student:**
- Completes flashcards in a topic
- Takes a quiz
- Spends time in AI tutor discussing topic
- Marks assignment as complete

---

## 5 NEW FEATURES TO IMPLEMENT (After Foundation is Built)

### 1. Smart Flashcard System with Spaced Repetition (SM-2 Algorithm)

### 1. Smart Flashcard System with Spaced Repetition (SM-2 Algorithm)

**Requirements:**
- **THREE ways to generate flashcards:**
  1. **From uploaded lecture notes/textbooks** (primary method)
  2. **From course syllabus topics** (auto-generate based on learning objectives)
  3. **Manual creation** (student types their own)

**Method 1: Upload Lecture Notes → Generate Flashcards**

**UI Flow:**
```
📁 Generate Flashcards from Content

Select source:
( ) Upload PDF/DOCX
( ) Paste text
( ) Upload image (OCR)

[File selected: Week3_CellBiology.pdf]

How many flashcards? [10] [25] [50]

Subject: [Cell Biology ▼]

[Generate Flashcards]

⏳ Processing...

✅ Generated 25 flashcards!

Preview:
Front: "What is the primary function of mitochondria?"
Back: "Produce ATP through cellular respiration"

[Review All] [Start Studying] [Edit Flashcards]
```

**Groq/HuggingFace Integration:**
```javascript
async function generateFlashcardsFromContent(contentText, count = 25, subject) {
  const prompt = `Generate exactly ${count} educational flashcards from this content about ${subject}.

Rules:
- Return ONLY valid JSON array: [{"front": "question", "back": "answer"}]
- Questions should test understanding, not just memorization
- Cover the most important concepts
- Vary question types (definition, comparison, application, process)
- Front should be a clear question
- Back should be concise answer (1-3 sentences max)

Content:
${contentText}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an educational content expert. Generate flashcards that promote deep understanding.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048
    })
  });
  
  const data = await response.json();
  const responseText = data.choices[0].message.content;
  
  // Extract JSON from response
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Failed to parse flashcards');
  
  const flashcards = JSON.parse(jsonMatch[0]);
  
  // Add metadata and SM-2 initial values
  return flashcards.map(card => ({
    cardId: generateUUID(),
    front: card.front,
    back: card.back,
    subject: subject,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: new Date().toISOString().split('T')[0],
    masteryLevel: 'learning',
    createdFrom: 'ai_generated',
    createdAt: new Date().toISOString()
  }));
}

// PDF Processing
async function extractTextFromPDF(file) {
  // Use pdf.js or similar library
  const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}
```

**Method 2: Auto-Generate from Syllabus Topics**

```javascript
async function generateFlashcardsFromTopic(topic, difficulty = 'medium') {
  const prompt = `Generate 20 ${difficulty} difficulty flashcards about ${topic}.

Return ONLY valid JSON array: [{"front": "question", "back": "answer"}]

Topic: ${topic}
Difficulty: ${difficulty}`;

  // Use same Groq API call as Method 1
  // ...
}
```

**Method 3: Manual Creation**
- Simple form to add cards one by one
- Bulk import: paste multiple Q&A pairs

---

**SM-2 Spaced Repetition Implementation:**
  - Cards appear based on difficulty rating (1-5 stars)
  - Intervals: 1 day → 6 days → 2 weeks → 1 month (adjusts based on performance)
  - Track "ease factor" per card
- Three mastery states: Learning (red), Reviewing (yellow), Mastered (green)
- Study session UI:
  - Card flip animation (click or spacebar)
  - Keyboard shortcuts: 1-5 for difficulty rating, Space to flip, Arrow keys to navigate
  - Progress bar: X/Y cards reviewed today
- Dashboard metrics:
  - Cards due today
  - Study streak (consecutive days)
  - Mastery distribution pie chart
  - Review accuracy % per subject

**Data Structure (localStorage):**
```javascript
{
  cardId: "uuid",
  front: "Question text",
  back: "Answer text",
  subject: "Math",
  easeFactor: 2.5,
  interval: 1,
  repetitions: 0,
  nextReview: "2025-05-01",
  lastReviewed: "2025-04-30",
  masteryLevel: "learning" // learning | reviewing | mastered
}
```

**Hugging Face API Integration:**
```javascript
const HF_API_KEY = import.meta.env.VITE_HF_API_KEY; // Free at huggingface.co/settings/tokens

async function generateFlashcards(studyText) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
    {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: `Generate 10 flashcards from this text. Return ONLY a JSON array with format [{"front": "question", "back": "answer"}]. Text: ${studyText}`,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.7,
        }
      }),
    }
  );
  
  const result = await response.json();
  return JSON.parse(result[0].generated_text);
}
```

---

### 2. Real-time Collaborative Study Rooms

**Requirements:**
- Use **PeerJS** (FREE WebRTC library) for peer-to-peer connections - no backend needed!
- Room features:
  - Shareable room codes (6-digit)
  - Max 8 participants per room
  - Live participant list with colored avatars
  - Text chat with typing indicators
  - Message reactions (emoji)
- Shared Pomodoro timer:
  - Host starts timer, all participants sync via PeerJS
  - Browser notifications when break/focus session starts
  - Timer appears in room header
- Collaborative whiteboard canvas:
  - HTML5 Canvas with drawing tools (pen, eraser, shapes, text)
  - Real-time drawing sync using PeerJS data connections
  - Export canvas as PNG
- Room analytics (end of session):
  - Message count per participant
  - Active time tracking
  - "Most Helpful" vote

**Tech Stack:**
- **PeerJS** (https://peerjs.com/) - FREE peer-to-peer WebRTC
- HTML5 Canvas API for whiteboard
- Web Notifications API for Pomodoro alerts

**PeerJS Setup:**
```javascript
import Peer from 'peerjs';

// Create peer connection (uses free PeerJS cloud server)
const peer = new Peer();

peer.on('open', (id) => {
  console.log('My peer ID is: ' + id); // Share this as room code
});

// Connect to another peer
const conn = peer.connect('their-peer-id');

// Send data
conn.on('open', () => {
  conn.send({ type: 'chat', message: 'Hello!' });
});

// Receive data
conn.on('data', (data) => {
  console.log('Received:', data);
});
```

---

### 3. AI Study Buddy Chat Assistant

**Requirements:**
- Use **Groq API** (FREE, blazing fast Llama models) instead of Claude
- Model: `llama-3.1-70b-versatile` (free tier: 30 requests/min)
- Features:
  - Aware of student's radar chart data (knows weak subjects)
  - Socratic teaching method: gives hints, not answers
  - Can summarize uploaded text/notes
  - Subject-specific modes: Math, Science, Writing, etc.
- UI:
  - Clean chat interface (Markdown rendering for formatted responses)
  - Text input area for pasting notes
  - "Explain this concept" quick actions
  - Chat history saved per subject (searchable)
  - Typing animation while AI responds
- Advanced features:
  - "Quiz me on this topic" — generates 5 questions
  - "Create a study plan" — uses radar chart to prioritize weak areas

**Groq API Integration (FREE):**
```javascript
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY; // Free at console.groq.com

async function chatWithAI(messages) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a Socratic tutor. Guide students with questions, not direct answers. Student weak areas: Math (45%), Writing (52%).'
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}
```

**Alternative FREE APIs:**
- **Cohere API** (free tier: 5 calls/min): https://cohere.com/
- **Together AI** (free $25 credits): https://together.ai/

---

### 4. Habit & Mood Tracker with Correlation Analysis

**Requirements:**
- Daily check-in form:
  - Sleep hours (slider: 0-12)
  - Stress level (1-5 scale)
  - Focus rating (1-5 scale)
  - Mood (emoji picker: 😞 😐 😊 😄)
  - Study hours today
  - Optional notes
- Correlation engine (client-side, no API needed):
  - Analyze relationships: sleep vs. performance, mood vs. focus, etc.
  - Generate insights: "You score 18% higher on 8+ hours sleep"
  - Detect patterns: "Math performance dips on Mondays"
- Visualizations:
  - Line charts: mood/sleep/performance over 30 days (use Chart.js)
  - Heatmap calendar: study activity intensity
  - Scatter plot: sleep hours vs. test scores
- Export wellness report as PDF (weekly/monthly summary)

**Data Structure:**
```javascript
{
  date: "2025-04-30",
  sleepHours: 7.5,
  stressLevel: 3,
  focusRating: 4,
  mood: "happy",
  studyHours: 4,
  notes: "Felt productive after morning run",
  performanceScore: 78 // from radar chart average
}
```

**Correlation Algorithm (No API needed - use math.js library):**
```javascript
import { mean, std, variance } from 'mathjs';

function calculateCorrelation(xData, yData) {
  const n = xData.length;
  const sumX = xData.reduce((a, b) => a + b, 0);
  const sumY = yData.reduce((a, b) => a + b, 0);
  const sumXY = xData.reduce((sum, x, i) => sum + x * yData[i], 0);
  const sumX2 = xData.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = yData.reduce((sum, y) => sum + y * y, 0);
  
  const numerator = (n * sumXY) - (sumX * sumY);
  const denominator = Math.sqrt(((n * sumX2) - (sumX ** 2)) * ((n * sumY2) - (sumY ** 2)));
  
  return numerator / denominator; // Pearson correlation coefficient
}

// Generate insights
function generateInsights(habitData) {
  const sleepHours = habitData.map(d => d.sleepHours);
  const performance = habitData.map(d => d.performanceScore);
  
  const correlation = calculateCorrelation(sleepHours, performance);
  
  if (correlation > 0.5) {
    return `Strong positive correlation: You score ${Math.round(correlation * 100)}% better with more sleep!`;
  }
}
```

---

### 5. Gamified Challenge System with Leaderboards

**Requirements:**
- Weekly challenges (auto-generated, no API needed):
  - "Solve 50 math problems"
  - "Study 5 consecutive days"
  - "Score 90%+ on 3 quizzes"
  - "Help 5 peers in study rooms"
- XP and leveling system:
  - Earn XP for: completing flashcards (10 XP), study time (5 XP/hour), quiz scores (score * 2), helping peers (20 XP)
  - Level up every 1000 XP
  - Display level badge on profile
- Leaderboard:
  - Public opt-in (anonymous usernames)
  - Weekly reset
  - Top 10 displayed
  - Stored in localStorage (can upgrade to Firebase later)
- Team battles:
  - Classes compete on total XP
  - Real-time team progress bars
  - Victory announcement at week end
- Unlockable rewards:
  - Profile themes (dark mode, pastel mode, nord theme, cyberpunk)
  - Custom badges
  - Radar chart color schemes
  - Title flairs ("Top Performer", "Study Streak King")

**Gamification UI:**
- XP progress bar (persistent header)
- Challenge cards with progress rings (use CSS conic-gradient)
- Confetti animation on level up (use canvas-confetti library)
- Achievement toast notifications

**Challenge Data Structure:**
```javascript
{
  id: "week_2025_18",
  challenges: [
    {
      id: "math_50",
      title: "Solve 50 Math Problems",
      description: "Complete 50 flashcards in Math category",
      xpReward: 500,
      progress: 23,
      target: 50,
      completed: false
    }
  ],
  leaderboard: [
    { username: "StudyNinja", xp: 3400, level: 3 },
    { username: "MathWizard", xp: 2800, level: 2 }
  ]
}
```

---

## TECHNICAL REQUIREMENTS

### Framework & Tooling
- **Framework:** Vite + vanilla JavaScript (ES6 modules), NO React/Vue
- **Styling:** Tailwind CSS (PostCSS setup)
- **Fonts:** Inter (UI), Lora (headings) — already configured

### APIs (ALL FREE)
- **Groq API** (chat assistant): https://console.groq.com/keys
  - Model: `llama-3.1-70b-versatile`
  - Free tier: 30 requests/min, 14,400/day
- **Hugging Face Inference API** (flashcard generation): https://huggingface.co/settings/tokens
  - Model: `mistralai/Mistral-7B-Instruct-v0.2`
  - Free tier: rate limited but sufficient for personal use
- **PeerJS** (study rooms): Uses free PeerServer cloud, no API key needed

### Libraries
- **Chart.js** (habit tracker visualizations)
- **jsPDF** (export reports)
- **canvas-confetti** (gamification effects)
- **marked.js** (Markdown rendering in chat)
- **PeerJS** (WebRTC for study rooms)
- **math.js** (correlation calculations)

### Storage
- **localStorage** for user data, settings, flashcards
- **IndexedDB** (using Dexie.js) for large datasets (chat history, habit logs)

### Design
- **Responsive:** Mobile-first design, works on tablets/phones
- **Accessibility:** ARIA labels, keyboard navigation, screen reader support

---

## DESIGN GUIDELINES

### Color Palette
- **Primary:** #3B82F6 (blue)
- **Success:** #10B981 (green)
- **Warning:** #F59E0B (amber)
- **Danger:** #EF4444 (red)
- **Neutral:** Tailwind gray scale

### Typography
- **Headings:** Lora (serif, elegant)
- **Body:** Inter (sans-serif, clean)
- **Code/monospace:** Fira Code

### Animations
- Smooth transitions (200-300ms)
- Fade-in on component mount
- Slide-up for modals
- Pulse for notifications

### Components
- Rounded corners (border-radius: 8px)
- Subtle shadows (Tailwind shadow-md)
- Gradient accents where appropriate

---

## COMPLETE API INTEGRATION EXAMPLES

### Groq Chat Assistant Setup

```javascript
// utils/groqClient.js
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function sendMessage(messages, systemPrompt) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });
  
  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Usage in chat component
const systemPrompt = `You are a Socratic tutor helping a student with weak areas in Math (45%) and Writing (52%). 
Guide them with questions rather than giving direct answers. Be encouraging and supportive.`;

const chatHistory = [
  { role: 'user', content: 'How do I solve quadratic equations?' }
];

const response = await sendMessage(chatHistory, systemPrompt);
console.log(response);
```

### Hugging Face Flashcard Generation

```javascript
// utils/flashcardGenerator.js
const HF_API_KEY = import.meta.env.VITE_HF_API_KEY;
const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';

export async function generateFlashcards(studyMaterial, count = 10) {
  const prompt = `Generate exactly ${count} educational flashcards from this study material.
Return ONLY a valid JSON array with this exact format: [{"front": "question here", "back": "answer here"}]
Do not include any other text, explanations, or markdown formatting.

Study Material:
${studyMaterial}`;

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${HF_MODEL}`,
    {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 2000,
          temperature: 0.7,
          return_full_text: false
        }
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`HF API error: ${response.statusText}`);
  }
  
  const result = await response.json();
  const generatedText = result[0].generated_text;
  
  // Extract JSON array from response
  const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse flashcards from AI response');
  }
  
  return JSON.parse(jsonMatch[0]);
}

// Usage
const flashcards = await generateFlashcards(`
Photosynthesis is the process by which plants convert light energy into chemical energy.
The equation is: 6CO2 + 6H2O + light → C6H12O6 + 6O2
Chlorophyll is the green pigment that captures light energy.
`, 5);
```

### PeerJS Study Room Setup

```javascript
// utils/peerConnection.js
import Peer from 'peerjs';

class StudyRoom {
  constructor() {
    this.peer = null;
    this.connections = new Map();
    this.roomId = null;
  }
  
  // Create a new room (host)
  async createRoom() {
    this.peer = new Peer(); // Uses free PeerJS cloud server
    
    return new Promise((resolve) => {
      this.peer.on('open', (id) => {
        this.roomId = id;
        console.log('Room created with ID:', id);
        resolve(id);
      });
      
      // Listen for incoming connections
      this.peer.on('connection', (conn) => {
        this.handleConnection(conn);
      });
    });
  }
  
  // Join existing room
  joinRoom(roomId) {
    this.peer = new Peer();
    
    this.peer.on('open', () => {
      const conn = this.peer.connect(roomId);
      this.handleConnection(conn);
    });
  }
  
  // Handle peer connections
  handleConnection(conn) {
    this.connections.set(conn.peer, conn);
    
    conn.on('open', () => {
      console.log('Connected to peer:', conn.peer);
      
      // Send join message
      conn.send({
        type: 'join',
        username: localStorage.getItem('username'),
        timestamp: Date.now()
      });
    });
    
    conn.on('data', (data) => {
      this.handleMessage(data, conn.peer);
    });
    
    conn.on('close', () => {
      this.connections.delete(conn.peer);
      console.log('Peer disconnected:', conn.peer);
    });
  }
  
  // Send message to all peers
  broadcast(message) {
    this.connections.forEach((conn) => {
      conn.send(message);
    });
  }
  
  // Handle incoming messages
  handleMessage(data, peerId) {
    switch (data.type) {
      case 'chat':
        console.log(`${data.username}: ${data.message}`);
        break;
      case 'whiteboard':
        // Update canvas with drawing data
        this.drawOnCanvas(data.drawData);
        break;
      case 'timer':
        // Sync Pomodoro timer
        this.syncTimer(data.timeLeft, data.isBreak);
        break;
    }
  }
  
  // Send chat message
  sendChat(message) {
    const chatData = {
      type: 'chat',
      username: localStorage.getItem('username'),
      message: message,
      timestamp: Date.now()
    };
    
    this.broadcast(chatData);
  }
  
  // Sync whiteboard drawing
  syncDrawing(drawData) {
    this.broadcast({
      type: 'whiteboard',
      drawData: drawData
    });
  }
}

export default StudyRoom;
```

---

## DELIVERABLES

1. ✅ Complete file structure for all 5 new features
2. ✅ Updated vite.config.js with Tailwind CSS PostCSS setup
3. ✅ package.json with all dependencies
4. ✅ .env.example for API keys:
   ```
   VITE_GROQ_API_KEY=your_groq_api_key_here
   VITE_HF_API_KEY=your_huggingface_token_here
   ```
5. ✅ README.md with:
   - Setup instructions
   - How to get free API keys
   - Feature descriptions
   - Development workflow
6. ✅ Sample data generators for testing
7. ✅ Error handling and loading states for all async operations
8. ✅ Mobile-responsive design tested on 375px, 768px, 1440px viewports
9. ✅ Offline functionality where possible (service worker optional)

---

## DEVELOPMENT WORKFLOW

### Phase 0: Foundation - Content System (CRITICAL - 3-4 hours)
**Without this, Acad is useless. Build this first.**

1. **Course Registration System** (1 hour)
   - Create course entry form
   - Store courses in localStorage
   - Display course list in dashboard

2. **Syllabus Upload & Parsing** (1.5 hours)
   - PDF upload component
   - Text extraction from PDF
   - Groq API integration for parsing
   - Extract topics, assignments, exams
   - Generate radar chart categories from topics

3. **Daily Task Generator** (1 hour)
   - Algorithm to prioritize tasks
   - Task list UI component
   - Mark tasks complete → update radar chart

4. **Course-Specific Radar Chart** (30 min)
   - Update radar chart to use course topics
   - Color-code by mastery level
   - Make it clickable (click topic → see flashcards for that topic)

**Milestone:** Student can add courses, upload syllabus, see personalized study plan

---

### Phase 1: Content Generation (2-3 hours)
1. Initialize Vite project
2. Install all dependencies
3. Configure Tailwind CSS
4. Set up .env file with API keys
5. Create folder structure

### Phase 2: Flashcard System (2 hours)
1. Build SM-2 algorithm utility
2. Create flashcard UI components
3. Integrate Hugging Face API
4. Implement study session interface
5. Add progress tracking dashboard

### Phase 3: AI Chat Assistant (1.5 hours)
1. Set up Groq API client
2. Build chat UI with Markdown rendering
3. Implement context awareness (radar chart data)
4. Add "Quiz me" and "Study plan" features
5. Save chat history to IndexedDB

### Phase 4: Habit Tracker (1.5 hours)
1. Create daily check-in form
2. Implement correlation algorithm
3. Build Chart.js visualizations
4. Generate insights from data
5. Add PDF export functionality

### Phase 5: Gamification System (1 hour)
1. Design XP and leveling logic
2. Create challenge cards
3. Build leaderboard UI
4. Implement unlockable themes
5. Add confetti animations

### Phase 6: Study Rooms (2 hours)
1. Set up PeerJS connections
2. Build room creation/joining flow
3. Implement text chat
4. Create whiteboard canvas
5. Add Pomodoro timer sync

### Phase 7: Integration & Polish (1 hour)
1. Test all features together
2. Fix bugs and edge cases
3. Optimize performance
4. Add loading states and error handling
5. Final UI/UX polish

---

## CODE QUALITY STANDARDS

- ✅ Modular ES6 code (one component per file)
- ✅ JSDoc comments for all functions
- ✅ Consistent naming: camelCase for variables, PascalCase for classes
- ✅ Error boundaries for async operations
- ✅ Input validation and sanitization
- ✅ Performance optimization: debounce, throttle where needed
- ✅ Accessibility: semantic HTML, ARIA attributes, focus management
- ✅ Mobile-first responsive design

---

## EXAMPLE FILE STRUCTURE

```
acad/
├── .env.example
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── public/
│   └── favicon.ico
└── src/
    ├── app.js
    ├── styles/
    │   ├── main.css
    │   └── components.css
    ├── components/
    │   ├── radarChart.js
    │   ├── flashcards/
    │   │   ├── FlashcardDeck.js
    │   │   ├── StudySession.js
    │   │   └── ProgressDashboard.js
    │   ├── studyRooms/
    │   │   ├── RoomCreator.js
    │   │   ├── ChatBox.js
    │   │   └── Whiteboard.js
    │   ├── chatAssistant/
    │   │   ├── ChatInterface.js
    │   │   └── MessageBubble.js
    │   ├── habitTracker/
    │   │   ├── DailyCheckIn.js
    │   │   ├── CorrelationDashboard.js
    │   │   └── InsightCard.js
    │   └── challenges/
    │       ├── ChallengeList.js
    │       ├── Leaderboard.js
    │       └── XPProgressBar.js
    ├── utils/
    │   ├── storage.js
    │   ├── sm2Algorithm.js
    │   ├── analytics.js
    │   ├── groqClient.js
    │   ├── hfClient.js
    │   └── peerConnection.js
    └── data/
        ├── sampleFlashcards.js
        ├── challengeTemplates.js
        └── mockStudentData.js
```

---

## FREE API KEY SETUP INSTRUCTIONS

### 1. Groq API (Chat Assistant)
1. Go to https://console.groq.com
2. Sign up with email (no credit card required)
3. Navigate to "API Keys" section
4. Click "Create API Key"
5. Copy key and paste in `.env` as `VITE_GROQ_API_KEY`

**Free Tier Limits:**
- 30 requests per minute
- 14,400 requests per day
- More than enough for student use!

### 2. Hugging Face (Flashcard Generation)
1. Go to https://huggingface.co/join
2. Sign up for free account
3. Go to https://huggingface.co/settings/tokens
4. Click "New token"
5. Name it "Acad Flashcards", select "Read" access
6. Copy token and paste in `.env` as `VITE_HF_API_KEY`

**Free Tier Limits:**
- Rate limited based on server load
- Generally allows 100-200 requests/hour
- Sufficient for flashcard generation!

### 3. PeerJS (Study Rooms)
**No API key needed!** PeerJS provides free cloud servers for WebRTC signaling.

---

## START CODING NOW

Build this in the order specified in the Development Workflow. Focus on making each feature production-ready before moving to the next. The supervisor needs to see a polished, professional platform.

**Priorities:**
1. Make it WORK (functionality first)
2. Make it FAST (optimize loading/API calls)
3. Make it BEAUTIFUL (polish UI/UX)
4. Make it MOBILE-FRIENDLY (responsive design)

This platform should be impressive enough to convince any supervisor. Let's build something amazing! 🚀
