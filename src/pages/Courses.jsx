import { useEffect, useMemo, useState } from 'react';
import { useCourses } from '../contexts/CoursesContext.jsx';
import { useFlashcards } from '../contexts/FlashcardsContext.jsx';
import { useGame } from '../contexts/GameContext.jsx';
import { useSemesters } from '../contexts/SemestersContext.jsx';
import { usePlanCapacity } from '../hooks/usePlanCapacity.js';
import PlanBanner from '../components/PlanBanner.jsx';
import { masteryPctColor } from '../utils/themeColors.js';
import { trendLabel } from '../utils/semesterUtils.js';

const QUIZ_TIME_SEC = 45;

const QUIZ_BANK = {
  'Cell Biology': [
    { question: 'Explain the structure and function of the cell membrane.', hint: 'Think: phospholipid bilayer, selective permeability', answer: 'The cell membrane is a phospholipid bilayer with embedded proteins that regulates what enters and exits the cell through selective permeability.' },
    { question: 'What are the differences between prokaryotic and eukaryotic cells?', hint: 'Consider: nucleus, organelles, size', answer: 'Prokaryotes lack a nucleus and membrane-bound organelles and are generally smaller; eukaryotes have a nucleus, organelles, and are larger.' },
    { question: 'Describe the role of mitochondria in cellular respiration.', hint: 'ATP production, electron transport chain', answer: 'Mitochondria generate ATP through aerobic respiration, using the electron transport chain and oxidative phosphorylation.' },
    { question: 'How does osmosis differ from active transport?', hint: 'Energy requirements, direction of movement', answer: 'Osmosis is passive water movement across a membrane down a concentration gradient; active transport uses energy to move substances against a gradient.' },
    { question: 'What is the endoplasmic reticulum and what are its two types?', hint: 'Rough vs smooth, ribosomes', answer: 'The ER is a membrane network for protein and lipid synthesis. Rough ER has ribosomes for protein synthesis; smooth ER synthesises lipids and detoxifies compounds.' },
  ],
  Genetics: [
    { question: "Explain Mendel's Law of Segregation.", hint: 'Alleles separate during gamete formation', answer: 'Each organism carries two alleles for a trait; these separate during gamete formation so each gamete receives only one allele.' },
    { question: 'What is the difference between genotype and phenotype?', hint: 'Genetic makeup vs observable traits', answer: 'Genotype is the genetic composition; phenotype is the observable expression of those genes.' },
    { question: 'Define a Punnett square and its purpose.', hint: 'Predicting offspring genotypes', answer: 'A Punnett square is a grid used to predict the probability of offspring genotypes from parental allele combinations.' },
    { question: 'What is a dominant allele?', hint: 'Expressed when at least one copy is present', answer: 'A dominant allele is expressed in the phenotype when at least one copy is present in the genotype.' },
    { question: 'Explain incomplete dominance with an example.', hint: 'Blended phenotype in heterozygotes', answer: 'In incomplete dominance, heterozygotes show a blended phenotype, e.g. red × white flowers producing pink offspring.' },
  ],
  Derivatives: [
    { question: 'State the limit definition of the derivative.', hint: "f'(x) = lim(h→0) [f(x+h)−f(x)]/h", answer: "f'(x) = lim(h→0) [f(x+h) − f(x)] / h, provided the limit exists." },
    { question: 'What is the power rule for differentiation?', hint: 'd/dx x^n = nx^(n-1)', answer: 'd/dx [x^n] = n·x^(n−1) for any real n.' },
    { question: 'When do you use the chain rule?', hint: 'Composite functions', answer: 'Use the chain rule when differentiating a composite function: (f∘g)′(x) = f′(g(x))·g′(x).' },
    { question: 'What does the derivative represent geometrically?', hint: 'Slope of tangent line', answer: 'The derivative at a point is the slope of the tangent line to the curve at that point.' },
    { question: 'Find the derivative of sin(x).', hint: 'cos(x)', answer: 'd/dx [sin(x)] = cos(x).' },
  ],
  Integrals: [
    { question: 'What is the fundamental theorem of calculus?', hint: 'Links differentiation and integration', answer: 'It connects differentiation and integration: if F′(x) = f(x), then ∫ₐᵇ f(x) dx = F(b) − F(a).' },
    { question: 'When do you use u-substitution?', hint: 'Composite functions in integrals', answer: 'Use u-substitution when the integrand contains a function and its derivative (or a constant multiple of it).' },
    { question: 'What is the integral of 1/x?', hint: 'ln|x| + C', answer: '∫ (1/x) dx = ln|x| + C, for x ≠ 0.' },
    { question: 'Explain definite vs indefinite integrals.', hint: 'Bounds vs +C', answer: 'Indefinite integrals find antiderivatives (+C); definite integrals compute net area between bounds and yield a number.' },
    { question: 'What is integration by parts?', hint: '∫u dv = uv − ∫v du', answer: 'Integration by parts: ∫ u dv = uv − ∫ v du, useful when the integrand is a product of functions.' },
  ],
};

function getQuizQuestions(topicName, courseCode) {
  return (QUIZ_BANK[topicName] || defaultQuiz(topicName, courseCode)).slice(0, 5);
}

function defaultQuiz(topicName) {
  return Array.from({ length: 5 }, (_, i) => ({
    question: `Question ${i + 1}: Explain a key concept in ${topicName}.`,
    hint: 'Draw on your notes and what you already know.',
    answer: `[Write the core explanation for this concept from your ${topicName} notes.]`,
  }));
}

function getFlashcards(topicName) {
  return [
    { front: `What is the definition of ${topicName}?`, back: `[Complete this from your own work on ${topicName}]` },
    { front: `What are the key principles of ${topicName}?`, back: `[List the 3–5 most important concepts from your ${topicName} notes]` },
    { front: `Give a real-world example of ${topicName}.`, back: `[Think of a practical application from your own work on ${topicName}]` },
    { front: `What is the most important formula or rule in ${topicName}?`, back: `[Write the key formula and explain when to use it]` },
    { front: `How does ${topicName} relate to other topics in this area?`, back: '[Identify connections to prerequisite or related concepts]' },
  ];
}

function MasteryRing({ pct, size = 48 }) {
  const stroke = size > 60 ? 6 : 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = masteryPctColor(pct);
  const cx = size / 2;
  return (
    <div className="cs-mastery-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--border-dim)" strokeWidth={stroke} opacity="0.35" />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: 'stroke-dasharray 0.6s var(--ease)' }}
        />
      </svg>
      <span
        className="cs-mastery-pct font-mono"
        style={{ color, fontSize: size >= 100 ? 18 : size >= 72 ? 15 : 12 }}
      >
        {pct}%
      </span>
    </div>
  );
}

function CourseRadar({ categories }) {
  const n = categories.length;
  const step = (2 * Math.PI) / n;
  const rings = [0.25, 0.5, 0.75, 1];
  const pts = categories.map((c, i) => {
    const angle = i * step - Math.PI / 2;
    const r = (c.score / 100) * 85;
    return `${110 + Math.cos(angle) * r},${110 + Math.sin(angle) * r}`;
  }).join(' ');

  return (
    <svg width={220} height={220} viewBox="0 0 220 220" className="cs-radar-svg">
      {rings.map((ring, ri) => {
        const ringPts = Array.from({ length: n }, (_, i) => {
          const angle = i * step - Math.PI / 2;
          return `${110 + Math.cos(angle) * 85 * ring},${110 + Math.sin(angle) * 85 * ring}`;
        }).join(' ');
        return <polygon key={ri} points={ringPts} fill="none" stroke="var(--border-dim)" strokeWidth="1" />;
      })}
      {categories.map((_, i) => {
        const angle = i * step - Math.PI / 2;
        return (
          <line
            key={i}
            x1={110}
            y1={110}
            x2={110 + Math.cos(angle) * 85}
            y2={110 + Math.sin(angle) * 85}
            stroke="var(--border-dim)"
            strokeWidth="0.5"
          />
        );
      })}
      <polygon points={pts} fill="rgba(20, 184, 166, 0.15)" stroke="var(--gold)" strokeWidth="2" />
      {categories.map((c, i) => {
        const angle = i * step - Math.PI / 2;
        const lx = 110 + Math.cos(angle) * 100;
        const ly = 110 + Math.sin(angle) * 100;
        return (
          <text key={c.name} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="var(--mist)" fontSize="9">
            {c.name.length > 12 ? `${c.name.slice(0, 10)}…` : c.name}
          </text>
        );
      })}
    </svg>
  );
}

function CoursesHome({ courses, weakTopics, allTopics, openCourse, openTopic, setPage, plan }) {
  const avgMastery = allTopics.length > 0 ? Math.round(allTopics.reduce((a, t) => a + t.masteryLevel, 0) / allTopics.length) : 0;
  const priority = weakTopics.slice(0, 3);

  return (
    <>
      <header className="cs-header">
        <div>
          <p className="cs-kicker">Courses</p>
          <h1 className="cs-title">Your courses</h1>
          <p className="cs-sub">
            {courses.length} / {plan.maxCourses} course{plan.maxCourses === 1 ? '' : 's'} · {allTopics.length} topics ·
            <span style={{ color: avgMastery >= 70 ? 'var(--verdigris)' : avgMastery >= 50 ? 'var(--gold)' : 'var(--crimson)' }}>
              {' '}
              {avgMastery}% average mastery
            </span>
          </p>
        </div>
      </header>

      {priority.length > 0 && (
        <div className="cs-action-banner">
          <div className="cs-action-left">
            <p className="cs-action-title">Priority focus</p>
            <p className="cs-action-desc">These topics are below 60% mastery. Work them first to build momentum.</p>
          </div>
          <div className="cs-action-topics">
            {priority.map((t) => (
              <button
                key={t.topicId}
                className="cs-action-topic-btn"
                onClick={() => {
                  const course = courses.find((c) => c.courseId === t.courseId);
                  if (course) openTopic(course, t);
                }}
              >
                <span className="cs-action-topic-name">{t.name}</span>
                <span className="cs-action-topic-score" style={{ color: t.masteryLevel < 40 ? 'var(--crimson)' : 'var(--gold)' }}>
                  {t.masteryLevel}%
                </span>
                <span className="cs-action-topic-course">{t.courseCode}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="cs-empty">
          <p className="cs-empty-icon">📚</p>
          <h3>No courses yet</h3>
          <p>
            New accounts pick focus courses during setup. You can also log past semesters in Semester journey — those courses appear here.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setPage('semester-journey')} style={{ marginTop: 16 }}>
            Open semester journey
          </button>
        </div>
      ) : (
        <div className="cs-courses-grid">
          {courses.map((c) => {
            const pct = c.topics.length > 0 ? Math.round(c.topics.reduce((a, t) => a + t.masteryLevel, 0) / c.topics.length) : 0;
            const weak = c.topics.filter((t) => t.masteryLevel < 60).length;
            return (
              <button key={c.courseId} className="cs-course-card" onClick={() => openCourse(c)}>
                <div className="cs-card-top">
                  <span className="cs-card-code">{c.code}</span>
                  <MasteryRing pct={pct} size={48} />
                </div>
                <h3 className="cs-card-name">{c.name}</h3>
                <div className="cs-card-bottom">
                  <span>{c.topics.length} topics</span>
                  {weak > 0 && <span className="cs-card-weak">{weak} need work</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="cs-plan-banner-wrap">
        <PlanBanner />
      </div>
    </>
  );
}

function TrendBadge({ delta }) {
  if (delta === undefined || delta === null) return null;
  const t = trendLabel(delta);
  if (t.cls === 'trend-flat') return null;
  return (
    <span className={`cs-trend-badge ${t.cls}`} title={`${t.label} vs last semester`}>
      {t.cls === 'trend-up' ? '▲' : '▼'} {Math.abs(delta)}pts
    </span>
  );
}

function CourseDetail({ course, openTopic, goHome, deleteCourse, radarData, deltaMap }) {
  const avg = course.topics.length > 0 ? Math.round(course.topics.reduce((a, t) => a + t.masteryLevel, 0) / course.topics.length) : 0;
  const radar = radarData.find((r) => r.courseId === course.courseId);

  return (
    <>
      <button className="cs-back-btn" onClick={goHome}>← All courses</button>
      <header className="cs-detail-header">
        <div>
          <span className="cs-card-code">{course.code}</span>
          <h1 className="cs-title">{course.name}</h1>
          <p className="cs-sub">{course.topics.length} topics · {avg}% mastery</p>
        </div>
        <MasteryRing pct={avg} size={72} />
      </header>

      {radar && radar.categories.length >= 3 && (
        <div className="cs-detail-radar">
          <CourseRadar categories={radar.categories} />
        </div>
      )}

      <section className="cs-topics-section">
        <p className="cs-section-label">Topics (click to study)</p>
        <div className="cs-topics-list">
          {course.topics.map((t) => {
            const d = deltaMap?.[`${course.courseId}:${t.topicId}`];
            return (
            <button key={t.topicId} className="cs-topic-row" onClick={() => openTopic(course, t)}>
              <div className="cs-topic-info">
                <span className="cs-topic-name-lg">
                  {t.name}
                  {d !== undefined && <TrendBadge delta={d} />}
                </span>
                {t.lastStudied && (
                  <span className="cs-topic-last">Last studied: {new Date(t.lastStudied).toLocaleDateString()}</span>
                )}
              </div>
              <div className="cs-topic-progress">
                <div className="cs-topic-mastery-bar" role="progressbar" aria-valuenow={t.masteryLevel} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="cs-topic-mastery-fill"
                    style={{
                      width: `${t.masteryLevel}%`,
                      background: masteryPctColor(t.masteryLevel),
                    }}
                  />
                </div>
                <span
                  className="cs-topic-pct font-mono"
                  style={{ color: masteryPctColor(t.masteryLevel) }}
                >
                  {t.masteryLevel}%
                </span>
              </div>
              <span className="cs-topic-arrow">→</span>
            </button>
            );
          })}
        </div>
      </section>

      <div className="cs-detail-actions">
        <button
          className="btn btn-danger"
          onClick={() => {
            deleteCourse(course.courseId);
            goHome();
          }}
        >
          Remove course
        </button>
      </div>
    </>
  );
}

function SelfRatePanel({ topic, course, updateTopicMastery, earnXP, onDone }) {
  const [value, setValue] = useState(topic.masteryLevel);
  const [done, setDone] = useState(false);

  return (
    <div className="cs-self-rate">
      <h2 className="cs-quiz-done-title">Rate Your Confidence</h2>
      <p className="cs-sub">
        How well do you understand <strong>{topic.name}</strong> right now?
      </p>
      <div className="cs-rate-slider-wrap">
        <div className="cs-rate-value-track" aria-hidden="true">
          <span className="cs-rate-pct font-mono" style={{ left: `${value}%` }}>{value}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="cs-rate-slider"
          aria-valuetext={`${value} percent`}
        />
        <div className="cs-rate-labels">
          <span>0% (lost)</span>
          <span>100% (expert)</span>
        </div>
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          updateTopicMastery(course.courseId, topic.name, value);
          earnXP(15);
          setDone(true);
          setTimeout(onDone, 1500);
        }}
        disabled={done}
      >
        {done ? '✓ Updated' : 'Update Mastery'}
      </button>
    </div>
  );
}

function TopicStudy({ course, topic, updateTopicMastery, earnXP, addCards, cards, goBack }) {
  const [mode, setMode] = useState('choose');
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [scores, setScores] = useState([]);
  const [quizDone, setQuizDone] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME_SEC);
  const [timerRunning, setTimerRunning] = useState(false);

  const existingCards = useMemo(
    () => cards.filter((c) => c.subject === topic.name || c.subject === course.code),
    [cards, topic.name, course.code],
  );

  function startQuiz() {
    setQuestions(getQuizQuestions(topic.name, course.code));
    setQIndex(0);
    setScores([]);
    setQuizDone(false);
    setAnswerRevealed(false);
    setTimeLeft(QUIZ_TIME_SEC);
    setTimerRunning(false);
    setMode('quiz');
  }

  useEffect(() => {
    if (mode !== 'quiz' || quizDone || answerRevealed || !timerRunning) return undefined;
    if (timeLeft <= 0) {
      setAnswerRevealed(true);
      setTimerRunning(false);
      return undefined;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [mode, quizDone, answerRevealed, timeLeft, timerRunning]);

  useEffect(() => {
    if (mode === 'quiz' && !quizDone) {
      setAnswerRevealed(false);
      setTimeLeft(QUIZ_TIME_SEC);
      setTimerRunning(false);
    }
  }, [qIndex, mode, quizDone]);

  function answer(val) {
    if (!answerRevealed) return;
    const next = [...scores, val];
    if (qIndex < questions.length - 1) {
      setScores(next);
      setQIndex((i) => i + 1);
    } else {
      const avg = next.reduce((a, b) => a + b, 0) / next.length;
      const newMastery = Math.round(topic.masteryLevel * 0.4 + avg * 0.6);
      updateTopicMastery(course.courseId, topic.name, newMastery);
      earnXP(40);
      setScores(next);
      setQuizDone(true);
    }
  }

  const afterMastery = quizDone
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 0.6 + topic.masteryLevel * 0.4)
    : topic.masteryLevel;

  if (mode === 'choose') {
    return (
      <>
        <button className="cs-back-btn" onClick={goBack} aria-label="Back">←</button>
        <div className="cs-study-header">
          <div>
            <span className="cs-card-code">{course.code}</span>
            <h1 className="cs-title">{topic.name}</h1>
            <p className="cs-sub">
              Current mastery:{' '}
              <strong style={{ color: masteryPctColor(topic.masteryLevel) }}>
                {topic.masteryLevel}%
              </strong>
            </p>
          </div>
          <MasteryRing pct={topic.masteryLevel} size={80} />
        </div>
        <div className="cs-study-options">
          <button className="cs-study-option" onClick={startQuiz}>
            <span className="cs-option-icon">🧠</span>
            <span className="cs-option-title">Self-Assessment Quiz</span>
            <span className="cs-option-desc">5 questions to measure your understanding. Your mastery score will update based on your answers.</span>
            <span className="cs-option-reward">Updates mastery</span>
          </button>
          <button
            className="cs-study-option"
            onClick={() => {
              addCards(getFlashcards(topic.name), topic.name);
              setMode('cards-added');
            }}
          >
            <span className="cs-option-icon">🃏</span>
            <span className="cs-option-title">Generate Flashcards</span>
            <span className="cs-option-desc">Create flashcards for this topic. Review them with spaced repetition in Flashcards.</span>
            <span className="cs-option-reward">5 cards added to your deck</span>
          </button>
          {existingCards.length > 0 && (
            <button className="cs-study-option" onClick={() => setMode('review-info')}>
              <span className="cs-option-icon">📚</span>
              <span className="cs-option-title">Review Existing Cards ({existingCards.length})</span>
              <span className="cs-option-desc">You have {existingCards.length} flashcards for this topic. Head to Flashcards to review them.</span>
              <span className="cs-option-reward">Opens Flashcard session</span>
            </button>
          )}
          <button className="cs-study-option" onClick={() => setMode('self-rate')}>
            <span className="cs-option-icon">✏️</span>
            <span className="cs-option-title">Manual Confidence Rating</span>
            <span className="cs-option-desc">Rate your confidence after studying and update your mastery score.</span>
            <span className="cs-option-reward">Quick update</span>
          </button>
        </div>
      </>
    );
  }

  if (mode === 'quiz') {
    if (quizDone) {
      return (
        <>
          <button className="cs-back-btn" onClick={goBack} aria-label="Back">←</button>
          <div className="cs-quiz-results">
            <h2 className="cs-quiz-done-title">Assessment Complete</h2>
            <MasteryRing pct={afterMastery} size={100} />
            <div className="cs-quiz-stats">
              <div className="cs-quiz-stat">
                <span className="cs-quiz-stat-val">{topic.masteryLevel}%</span>
                <span className="cs-quiz-stat-lbl">Before</span>
              </div>
              <span className="cs-quiz-arrow">→</span>
              <div className="cs-quiz-stat">
                <span className="cs-quiz-stat-val" style={{ color: 'var(--gold)' }}>{afterMastery}%</span>
                <span className="cs-quiz-stat-lbl">After</span>
              </div>
            </div>
            <p className="cs-quiz-feedback">
              {afterMastery >= 70
                ? 'Strong understanding! Keep reviewing to maintain it.'
                : afterMastery >= 50
                  ? 'Getting there. Focus on the areas you rated lower.'
                  : 'This needs more work. Try generating flashcards and studying daily.'}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-primary" onClick={() => setMode('choose')}>Study More</button>
              <button className="btn btn-outline" onClick={goBack}>Back to course</button>
            </div>
          </div>
        </>
      );
    }

    const q = questions[qIndex];
    return (
      <>
        <button className="cs-back-btn" onClick={() => setMode('choose')}>← Cancel Quiz</button>
        <div className="cs-quiz-wrap">
          <div className="cs-quiz-progress">
            <span>{qIndex + 1} / {questions.length}</span>
            <div className="cs-quiz-prog-bar">
              <div className="cs-quiz-prog-fill" style={{ width: `${((qIndex + 1) / questions.length) * 100}%` }} />
            </div>
          {!answerRevealed && (
            <div className="cs-quiz-timer-row">
              <span className="cs-quiz-timer font-mono" aria-live="polite">{timeLeft}s</span>
              <div className="cs-quiz-timer-actions">
                {!timerRunning ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setTimerRunning(true)}>
                    Start
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setTimerRunning(false)}
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>
          )}
          </div>
          <div className="cs-quiz-question">
            <p className="cs-quiz-q">{q.question}</p>
            {q.hint && !answerRevealed && <p className="cs-quiz-hint">{q.hint}</p>}
            {answerRevealed && (
              <div className="cs-quiz-answer">
                <p className="cs-quiz-answer-label">Answer</p>
                <p className="cs-quiz-answer-text">{q.answer}</p>
              </div>
            )}
          </div>
          {!answerRevealed ? (
            <p className="cs-quiz-prompt">
              {timerRunning
                ? `Think through your answer — ${timeLeft}s remaining.`
                : 'Press Start when you are ready to begin the think time.'}
            </p>
          ) : (
            <>
              <p className="cs-quiz-prompt">How well could you answer this?</p>
              <div className="cs-confidence-btns">
                {[
                  { val: 20, label: 'No idea', color: '#EF4444' },
                  { val: 40, label: 'Vaguely', color: '#F97316' },
                  { val: 60, label: 'Partially', color: '#F59E0B' },
                  { val: 80, label: 'Mostly', color: '#84CC16' },
                  { val: 100, label: 'Perfectly', color: '#10B981' },
                ].map((opt) => (
                  <button key={opt.val} className="cs-conf-btn" onClick={() => answer(opt.val)} style={{ borderColor: opt.color }}>
                    <span className="cs-conf-label">{opt.label}</span>
                    <span className="cs-conf-val" style={{ color: opt.color }}>{opt.val}%</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </>
    );
  }

  if (mode === 'self-rate') {
    return (
      <>
        <button className="cs-back-btn" onClick={() => setMode('choose')}>← Back</button>
        <SelfRatePanel topic={topic} course={course} updateTopicMastery={updateTopicMastery} earnXP={earnXP} onDone={() => setMode('choose')} />
      </>
    );
  }

  if (mode === 'cards-added') {
    return (
      <>
        <button className="cs-back-btn" onClick={() => setMode('choose')}>← Back</button>
        <div className="cs-quiz-results">
          <h2 className="cs-quiz-done-title">Flashcards Created!</h2>
          <p className="cs-quiz-feedback">
            5 new flashcards for &quot;{topic.name}&quot; have been added to your deck. Review them in Flashcards to build mastery through spaced repetition.
          </p>
          <div className="cs-cards-added-actions">
            <button className="btn btn-primary" onClick={() => setMode('choose')}>Continue Studying</button>
          </div>
        </div>
      </>
    );
  }

  if (mode === 'review-info') {
    return (
      <>
        <button className="cs-back-btn" onClick={() => setMode('choose')}>← Back</button>
        <div className="cs-quiz-results">
          <h2 className="cs-quiz-done-title">Review Cards</h2>
          <p className="cs-quiz-feedback">
            You have {existingCards.length} cards for this topic. Head to Flashcards to review them with spaced repetition. Your mastery will improve as you review.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={goBack}>Got it</button>
        </div>
      </>
    );
  }

  return null;
}

export default function Courses({ setPage }) {
  const { courses, deleteCourse, updateTopicMastery, radarData, weakTopics, allTopics } = useCourses();
  const { cards, addCards } = useFlashcards();
  const { earnXP } = useGame();
  const { plan } = usePlanCapacity();
  const { getDeltas } = useSemesters();

  const deltaMap = useMemo(() => {
    const deltas = getDeltas(courses);
    const m = {};
    deltas.forEach((d) => { m[`${d.courseId}:${d.topicId}`] = d.delta; });
    return m;
  }, [getDeltas, courses]);
  const [view, setView] = useState('home');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const openCourse = (c) => {
    setSelectedCourse(c);
    setView('course-detail');
  };

  const openTopic = (course, topic) => {
    setSelectedCourse(course);
    setSelectedTopic(topic);
    setView('topic-study');
  };

  return (
    <main className="page cs-page anim-fade-in">
      <div className="cs-wrap">
        {view === 'home' && (
          <CoursesHome
            courses={courses}
            weakTopics={weakTopics}
            allTopics={allTopics}
            openCourse={openCourse}
            openTopic={openTopic}
            setPage={setPage}
            plan={plan}
          />
        )}
        {view === 'course-detail' && selectedCourse && (
          <CourseDetail
            course={selectedCourse}
            openTopic={openTopic}
            goHome={() => {
              setView('home');
              setSelectedCourse(null);
              setSelectedTopic(null);
            }}
            deleteCourse={deleteCourse}
            radarData={radarData}
            deltaMap={deltaMap}
          />
        )}
        {view === 'topic-study' && selectedCourse && selectedTopic && (
          <TopicStudy
            course={selectedCourse}
            topic={selectedTopic}
            updateTopicMastery={updateTopicMastery}
            earnXP={earnXP}
            addCards={addCards}
            cards={cards}
            goBack={() => openCourse(selectedCourse)}
          />
        )}
      </div>
    </main>
  );
}
