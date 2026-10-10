import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFlashcards } from '../contexts/FlashcardsContext.jsx';
import { useGame } from '../contexts/GameContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { generateFlashcardsFromText } from '../utils/ai.js';
import { RATING_LABELS } from '../data/constants.js';
import { readCssVar } from '../utils/themeColors.js';

function FlashcardsDashboard({ cards, dueCards, subjects, masteryMap, setTab }) {
  const { theme } = useTheme();
  const masteryColors = useMemo(
    () => ({
      learning: readCssVar('--mastery-learning'),
      reviewing: readCssVar('--mastery-reviewing'),
      mastered: readCssVar('--mastery-mastered'),
    }),
    [theme],
  );
  const total = cards.length;
  const masteryRate = total > 0 ? Math.round((masteryMap.mastered / total) * 100) : 0;
  const subjectCounts = useMemo(() => {
    const map = {};
    cards.forEach((c) => {
      map[c.subject] = (map[c.subject] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [cards]);
  const maxCount = subjectCounts[0]?.[1] || 1;

  if (total === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">No flashcards yet</p>
        <p className="empty-state-desc">Add cards from the Manage tab or generate them from a course topic.</p>
        <button type="button" className="btn btn-primary" onClick={() => setTab('manage')}>Add cards</button>
      </div>
    );
  }

  return (
    <>
      <div className="fc-dash-grid">
        <div className="fc-kpi">
          <div className="fc-kpi-val gold">{dueCards.length}</div>
          <div className="fc-kpi-lbl">Due Today</div>
        </div>
        <div className="fc-kpi">
          <div className="fc-kpi-val">{total}</div>
          <div className="fc-kpi-lbl">Total Cards</div>
        </div>
        <div className="fc-kpi">
          <div className="fc-kpi-val">{masteryMap.mastered}</div>
          <div className="fc-kpi-lbl">Mastered</div>
        </div>
        <div className="fc-kpi">
          <div className="fc-kpi-val">{masteryRate}%</div>
          <div className="fc-kpi-lbl">Mastery Rate</div>
        </div>
      </div>

      <div className="fc-charts-row">
        <div className="fc-mastery-card">
          <div className="fc-mastery-head">
            <p className="fc-mastery-title">Mastery distribution</p>
            <span className="fc-mastery-rate font-mono">{masteryRate}% mastered · {total} cards</span>
          </div>
          <div className="fc-mastery-breakdown fc-mastery-breakdown-full">
            {[
              ['learning', 'Learning', masteryColors.learning],
              ['reviewing', 'Reviewing', masteryColors.reviewing],
              ['mastered', 'Mastered', masteryColors.mastered],
            ].map(([key, label, color]) => {
              const count = masteryMap[key];
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={key} className="fc-mastery-row">
                  <span className="fc-mastery-dot" style={{ background: color }} aria-hidden="true" />
                  <span className="fc-mastery-label">{label}</span>
                  <div className="fc-mastery-bar" role="presentation">
                    <div className="fc-mastery-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="fc-mastery-count font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="fc-subjects-box">
          <p className="fc-subjects-title">Cards by Subject</p>
          {subjectCounts.map(([name, count]) => (
            <div key={name} className="fc-subject-row">
              <span className="fc-subj-name">{name}</span>
              <div className="fc-subj-bar">
                <div className="fc-subj-fill" style={{ width: `${(count / maxCount) * 100}%` }} />
              </div>
              <span className="fc-subj-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="fc-overview-actions">
        <button
          className="btn btn-primary"
          onClick={() => setTab('session')}
          disabled={dueCards.length === 0}
          id="btn-fc-start-session"
        >
          {dueCards.length > 0
            ? `Study ${dueCards.length} Due Card${dueCards.length === 1 ? '' : 's'}`
            : 'No Cards Due Today'}
        </button>
        <button className="btn btn-outline" onClick={() => setTab('manage')} id="btn-fc-manage">
          Manage Cards
        </button>
      </div>
    </>
  );
}

function StudySession({ dueCards, reviewCard, earnXP, advanceChallenge, unlockAchievement }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [complete, setComplete] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const queue = useMemo(() => [...dueCards].slice(0, 20), [dueCards]);
  const card = queue[index];

  const flip = useCallback(() => setFlipped((f) => !f), []);

  const rate = useCallback(
    (rating) => {
      if (!card || !flipped) return;
      reviewCard(card.cardId, rating);
      earnXP(rating >= 3 ? 15 : 5);
      advanceChallenge('fc_review', 1);
      if (rating === 5) unlockAchievement('first_card');
      setReviewed((n) => n + 1);
      setFlipped(false);
      if (index + 1 >= queue.length) setComplete(true);
      else setIndex((i) => i + 1);
    },
    [card, flipped, index, queue.length, reviewCard, earnXP, advanceChallenge, unlockAchievement],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        flip();
      }
      if (flipped && e.key >= '1' && e.key <= '5') rate(Number(e.key));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flip, rate, flipped]);

  if (queue.length === 0) {
    return (
      <div className="fc-all-done">
        <div className="fc-all-done-icon">✦</div>
        <h3>All Caught Up</h3>
        <p>No cards are due for review today. Come back tomorrow to maintain your retention.</p>
      </div>
    );
  }

  if (complete) {
    return (
      <div className="fc-session-complete anim-fade-up">
        <h2>Session Complete</h2>
        <p>
          You reviewed {reviewed} card{reviewed === 1 ? '' : 's'} in this session. Your intervals have been updated.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            setIndex(0);
            setComplete(false);
            setReviewed(0);
          }}
          id="btn-fc-restart"
        >
          Review Again
        </button>
      </div>
    );
  }

  const progress = ((index + 1) / queue.length) * 100;

  return (
    <div className="fc-session-wrap">
      <div className="fc-session-header">
        <span className="fc-session-count font-mono">
          {index + 1} / {queue.length}
        </span>
        <div className="fc-prog-bar">
          <div className="fc-prog-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className={`fc-mastery-chip ${card?.masteryLevel}`}>{card?.masteryLevel}</span>
      </div>

      <div
        className="fc-card-scene"
        onClick={flip}
        role="button"
        aria-label="Flashcard. Click to flip."
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && flip()}
      >
        <div className={`fc-card-inner${flipped ? ' flipped' : ''}`}>
          <div className="fc-card-face">
            <span className="fc-card-face-lbl">Question</span>
            <p className="fc-card-text">{card?.front}</p>
            <span className="fc-card-subject">{card?.subject}</span>
          </div>
          <div className="fc-card-face back">
            <span className="fc-card-face-lbl">Answer</span>
            <p className="fc-card-back-text">{card?.back}</p>
          </div>
        </div>
      </div>

      <p className="fc-flip-hint">{flipped ? 'Rate your recall below' : 'Space or click to reveal the answer'}</p>

      {flipped && (
        <div className="fc-ratings" role="group" aria-label="Rate your recall">
          {RATING_LABELS.map((label, i) => (
            <button
              key={i}
              className={`fc-rating-btn r${i + 1}`}
              onClick={() => rate(i + 1)}
              id={`btn-fc-rate-${i + 1}`}
              aria-label={`Rate ${i + 1}: ${label}`}
            >
              <span className="r-num">{i + 1}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      <p className="fc-session-shortcuts">Shortcuts: Space = flip · 1–5 = rate (after flip)</p>
    </div>
  );
}

function ManageCards({ cards, subjects, addCard, addCards, deleteCard }) {
  const subjectOptions = useMemo(() => [...new Set(subjects)].sort(), [subjects]);
  const defaultSubject = subjectOptions[0] || '';

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [customSubject, setCustomSubject] = useState('');
  const [genText, setGenText] = useState('');
  const [genSubject, setGenSubject] = useState(defaultSubject);
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState('');

  useEffect(() => {
    if (subjectOptions.length === 0) return;
    if (!subjectOptions.includes(subject)) setSubject(subjectOptions[0]);
    if (!subjectOptions.includes(genSubject)) setGenSubject(subjectOptions[0]);
  }, [subjectOptions, subject, genSubject]);

  function handleAdd() {
    const sub = (subjectOptions.length > 0 ? subject : customSubject).trim();
    if (!front.trim() || !back.trim() || !sub) return;
    addCard(front.trim(), back.trim(), sub);
    setFront('');
    setBack('');
    setCustomSubject('');
  }

  async function handleGenerate() {
    if (!genText.trim()) return;
    setGenerating(true);
    setGenMsg('Generating flashcards…');
    try {
      const batch = await generateFlashcardsFromText(genText, genSubject);
      addCards(batch, genSubject);
      setGenText('');
      setGenMsg(`✓ Added ${batch.length} cards to "${genSubject}"`);
    } catch {
      setGenMsg('Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fc-manage-grid">
      <div>
        <div className="fc-add-box" style={{ marginBottom: 12 }}>
          <p className="fc-add-title">Add New Card</p>
          <div className="form-group">
            <label className="form-label">Subject</label>
            {subjectOptions.length > 0 ? (
              <select className="form-input" value={subject} onChange={(e) => setSubject(e.target.value)} id="fc-select-subject">
                {subjectOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="form-input"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Course code from a logged semester"
                id="fc-input-custom-subject"
              />
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Front (Question)</label>
            <textarea
              className="fc-textarea"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Enter the question…"
              id="fc-input-front"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Back (Answer)</label>
            <textarea
              className="fc-textarea"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Enter the answer…"
              id="fc-input-back"
            />
          </div>
          <button className="btn btn-primary" onClick={handleAdd} disabled={!front.trim() || !back.trim()} id="btn-fc-add-card">
            Add Card
          </button>
        </div>

        <div className="fc-add-box">
          <p className="fc-add-title">Generate from Text</p>
          <div className="fc-gen-info">Paste study material to create cards for a logged course. Full AI generation ships in a later release.</div>
          {subjectOptions.length > 0 ? (
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select
                className="form-input"
                value={genSubject}
                onChange={(e) => setGenSubject(e.target.value)}
                id="fc-select-gen-subject"
              >
                {subjectOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="fc-gen-info" style={{ marginBottom: 12 }}>Log a semester with courses first — subjects come from your course list.</p>
          )}
          <div className="form-group">
            <label className="form-label">Study Material</label>
            <textarea
              className="fc-textarea"
              style={{ minHeight: 100 }}
              value={genText}
              onChange={(e) => setGenText(e.target.value)}
              placeholder="Paste notes, textbook excerpts, or any study material…"
              id="fc-input-gen-text"
            />
          </div>
          {genMsg && (
            <p style={{ fontSize: 10.5, color: 'var(--slate)', marginBottom: 8 }}>
              {genMsg}
            </p>
          )}
          <button
            className="btn btn-outline"
            onClick={handleGenerate}
            disabled={generating || !genText.trim() || subjectOptions.length === 0}
            id="btn-fc-generate"
          >
            {generating ? 'Generating…' : 'Generate Cards'}
          </button>
        </div>
      </div>

      <div>
        <p className="fc-subjects-title" style={{ marginBottom: 10 }}>
          All Cards ({cards.length})
        </p>
        <div className="fc-card-list">
          {cards.map((c) => (
            <div key={c.cardId} className="fc-list-item">
              <span className={`fc-mastery-chip ${c.masteryLevel}`}>{c.masteryLevel[0].toUpperCase()}</span>
              <span className="fc-list-q" title={c.front}>
                {c.front}
              </span>
              <span className="tag tag-mist" style={{ fontSize: 8, flexShrink: 0 }}>
                {c.subject}
              </span>
              <button
                className="fc-list-del"
                onClick={() => deleteCard(c.cardId)}
                aria-label={`Delete card: ${c.front}`}
                title="Delete"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Flashcards({ setPage }) {
  const { cards, dueCards, subjects, masteryMap, addCard, addCards, reviewCard, deleteCard } = useFlashcards();
  const { earnXP, advanceChallenge, unlockAchievement } = useGame();
  const [tab, setTab] = useState('dashboard');

  return (
    <main className="page fc-page anim-fade-in">
      <div className="fc-wrap">
        <header className="fc-header">
          <div>
            <p className="fc-kicker">Flashcards</p>
            <h1 className="fc-title">Review deck</h1>
            <p className="fc-sub">
              SM-2 spaced repetition · {cards.length} cards · {dueCards.length} due today
            </p>
          </div>
          <div className="fc-tabs" role="tablist">
            {['dashboard', 'session', 'manage'].map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={`fc-tab${tab === t ? ' active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'dashboard' ? 'Overview' : t === 'session' ? 'Study' : 'Manage'}
              </button>
            ))}
          </div>
        </header>

        {tab === 'dashboard' && (
          <FlashcardsDashboard
            cards={cards}
            dueCards={dueCards}
            subjects={subjects}
            masteryMap={masteryMap}
            setTab={setTab}
          />
        )}
        {tab === 'session' && (
          <StudySession
            dueCards={dueCards}
            reviewCard={reviewCard}
            earnXP={earnXP}
            advanceChallenge={advanceChallenge}
            unlockAchievement={unlockAchievement}
          />
        )}
        {tab === 'manage' && (
          <ManageCards
            cards={cards}
            subjects={subjects}
            addCard={addCard}
            addCards={addCards}
            deleteCard={deleteCard}
          />
        )}
      </div>
    </main>
  );
}
