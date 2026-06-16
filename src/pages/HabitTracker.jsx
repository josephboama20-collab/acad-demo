import { useMemo, useState } from 'react';
import { Star, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useHabits, MOOD_OPTIONS } from '../contexts/HabitsContext.jsx';
import { useGame } from '../contexts/GameContext.jsx';

function energyLabel(level) {
  if (level <= 2) return 'Low energy';
  if (level === 3) return 'Moderate';
  if (level === 4) return 'High energy';
  return 'Very high energy';
}

function StarRating({ label, value, onChange, id }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="ht-stars" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`ht-star${n <= value ? ' filled' : ''}`}
            onClick={() => onChange(n)}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            id={`${id}-${n}`}
          >
            <Star size={18} fill={n <= value ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderField({ label, min, max, step, value, onChange, id }) {
  return (
    <div className="ht-slider-wrap">
      <label htmlFor={id} className="form-label">{label}</label>
      <input
        id={id}
        type="range"
        className="ht-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}

function studyCellColor(hours) {
  if (hours === 0) return 'var(--border-dim)';
  if (hours < 2) return 'color-mix(in srgb, var(--gold-dim) 45%, transparent)';
  if (hours < 4) return 'var(--gold-dim)';
  return 'var(--gold)';
}

function StudyCalendar({ logs }) {
  const cells = useMemo(() => {
    const byDate = {};
    logs.forEach((l) => {
      byDate[l.date] = l.studyHours;
    });
    const out = [];
    for (let n = 41; n >= 0; n--) {
      const d = new Date();
      d.setDate(d.getDate() - n);
      const key = d.toISOString().split('T')[0];
      out.push({ date: key, hours: byDate[key] ?? 0 });
    }
    return out;
  }, [logs]);

  return (
    <div className="ht-chart-box">
      <p className="ht-chart-title">Study activity (6 weeks)</p>
      <div className="ht-calendar" role="img" aria-label="Study activity calendar heatmap">
        {cells.map((c) => (
          <div
            key={c.date}
            className="ht-cal-cell"
            style={{ background: studyCellColor(c.hours) }}
            title={`${c.date}: ${c.hours}h studied`}
          />
        ))}
      </div>
      <div className="ht-cal-legend">
        {[
          ['var(--border-dim)', 'None'],
          ['color-mix(in srgb, var(--gold-dim) 45%, transparent)', 'Moderate'],
          ['var(--gold-dim)', 'High'],
          ['var(--gold)', 'Very high'],
        ].map(([bg, label]) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="ht-cal-legend-swatch" style={{ background: bg }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function HabitTracker() {
  const { profile } = useAuth();
  const { logs, todayLog, insights, addLog } = useHabits();
  const { earnXP, advanceChallenge, unlockAchievement } = useGame();
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [focus, setFocus] = useState(3);
  const [mood, setMood] = useState('happy');
  const [studyHours, setStudyHours] = useState(2);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const totalStudyHours = logs.reduce((a, l) => a + l.studyHours, 0);
  const daysLogged = logs.length;
  const avgFocus = logs.length > 0 ? (logs.reduce((a, l) => a + l.focusRating, 0) / logs.length).toFixed(1) : 'n/a';
  const avgProductivity = logs.length > 0 ? Math.round(logs.reduce((a, l) => a + l.productivityScore, 0) / logs.length) : 0;
  const daysOnAcad = useMemo(() => {
    if (!profile?.startedAt) return null;
    const start = new Date(profile.startedAt).getTime();
    if (Number.isNaN(start)) return null;
    return Math.max(1, Math.floor((Date.now() - start) / 86400000));
  }, [profile?.startedAt]);

  function handleSubmit(e) {
    e.preventDefault();
    const moodScore = MOOD_OPTIONS.find((m) => m.key === mood)?.score ?? 2;
    addLog({
      date: new Date().toISOString().split('T')[0],
      energyLevel: energy,
      stressLevel: stress,
      focusRating: focus,
      mood,
      studyHours,
      notes,
      productivityScore: Math.min(100, Math.round(40 + energy * 6 + focus * 6 + studyHours * 4 - stress * 3 + moodScore * 3)),
    });
    earnXP(30);
    advanceChallenge('habit_7', 1);
    unlockAchievement('habit_first');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  }

  return (
    <main className="page fc-page ht-page anim-fade-in">
      <div className="fc-wrap">
        <header className="fc-header">
          <div>
            <p className="fc-kicker">Wellness</p>
            <h1 className="fc-title">Habit tracker</h1>
            <p className="fc-sub">
              {daysLogged} day{daysLogged === 1 ? '' : 's'} logged
              {daysOnAcad !== null ? ` · ${daysOnAcad} day${daysOnAcad === 1 ? '' : 's'} on Acad` : ''}
              {' · '}{totalStudyHours.toFixed(1)}h total study · {avgProductivity}% productivity
            </p>
          </div>
        </header>

        <div className="ht-week-kpis">
          <div className="ht-week-kpi"><span className="ht-week-val font-mono">{totalStudyHours.toFixed(1)}h</span><span className="ht-week-lbl">Total study</span></div>
          <div className="ht-week-kpi"><span className="ht-week-val font-mono">{avgFocus}</span><span className="ht-week-lbl">Avg focus</span></div>
          <div className="ht-week-kpi"><span className="ht-week-val font-mono">{avgProductivity}%</span><span className="ht-week-lbl">Productivity</span></div>
          <div className="ht-week-kpi"><span className="ht-week-val font-mono">{daysLogged}</span><span className="ht-week-lbl">Days logged</span></div>
        </div>

        <div className="ht-checkin">
          <div className="ht-checkin-title">
            Today&apos;s Check-in
            {todayLog && <span className="ht-done-badge">✓ Logged</span>}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="ht-form-grid">
              <div className="ht-energy-field">
                <label className="form-label">Energy Level</label>
                <div className="ht-energy-btns" role="radiogroup" aria-label="Energy level">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" className={`ht-energy-btn${energy === n ? ' active' : ''}`} onClick={() => setEnergy(n)} aria-label={`Energy ${n}`}>
                      <Zap size={16} fill={n <= energy ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
                <span className="ht-energy-desc">{energyLabel(energy)}</span>
              </div>
              <StarRating label="Focus Rating" value={focus} onChange={setFocus} id="ht-focus" />
              <StarRating label="Stress Level" value={stress} onChange={setStress} id="ht-stress" />
            </div>
            <div className="ht-form-grid">
              <SliderField label={`Study hours: ${studyHours}h`} min={0} max={12} step={0.5} value={studyHours} onChange={setStudyHours} id="ht-study" />
              <div>
                <label className="form-label">Mood</label>
                <div className="ht-mood-row">
                  {MOOD_OPTIONS.map((opt) => (
                    <button key={opt.key} type="button" className={`ht-mood-btn${mood === opt.key ? ' active' : ''}`} onClick={() => setMood(opt.key)} aria-label={opt.key} id={`btn-ht-mood-${opt.key}`}>
                      {opt.emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Notes (optional)</label>
                <input className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did you study today?" id="ht-notes" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" id="btn-ht-submit">{submitted ? '✓ Logged' : 'Log Today'}</button>
          </form>
        </div>

        {insights.length > 0 && (
          <section className="ht-insights" aria-label="Wellness insights">
            <p className="ht-insights-title">Productivity Insights (last 30 days)</p>
            <div className="ht-insight-cards">
              {insights.map((item, i) => (
                <div key={i} className="ht-insight-card">
                  <span className="ht-insight-icon">{item.icon}</span>
                  <p className="ht-insight-text">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {insights.length === 0 && logs.length < 14 && (
          <div className="ht-no-insights">
            Insights will appear after <strong style={{ color: 'var(--parchment)' }}>14 days</strong> of logged data. You have {logs.length} log{logs.length === 1 ? '' : 's'} so far.
          </div>
        )}

        <div className="ht-charts-grid ht-charts-single">
          <StudyCalendar logs={logs} />
        </div>
      </div>
    </main>
  );
}
