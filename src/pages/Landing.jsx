import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Bot,
  ChartLine,
  Check,
  FolderGit2,
  Layers,
  Minus,
} from 'lucide-react';
import { ONBOARDING_QUESTIONS } from '../data/constants.js';
import { getPlanSummary } from '../utils/planCapacity.js';
import { setPreAccountPrefs } from '../utils/preAccountPrefs.js';

const FEATURES = [
  { icon: BookOpen, title: 'Your courses', desc: 'Add what you need to recover. Every tool orbits the courses you define.' },
  { icon: Layers, title: 'Flashcards & recall', desc: 'Spaced repetition built from your topics, not generic decks.' },
  { icon: Bot, title: 'AI study buddy', desc: 'Guided sessions with study methods matched to how you learn.' },
  { icon: Activity, title: 'Wellness tracking', desc: 'Daily check-ins tie energy, focus, and study hours together.' },
  { icon: ChartLine, title: 'Learning reports', desc: 'Actionable reports on weak topics, recall queues, and course gaps.' },
  { icon: FolderGit2, title: 'Portfolio projects', desc: 'Course-tailored work that proves understanding where it matters.' },
];

const TIERS = [
  { window: '2-3 weeks', courses: '1 course', tools: 'Flashcards, AI buddy' },
  { window: '1 month', courses: '2 courses', tools: '+ Wellness, reports' },
  { window: '2 months', courses: '4 courses', tools: '+ Projects, study groups' },
  { window: '3 months', courses: '6 courses', tools: 'Full toolkit' },
];

const WITHOUT = [
  'Passive drift between semesters',
  'Skills decay without structure',
  'No record of what you recovered',
  'Random study with no recall system',
];

const WITH = [
  'Daily output on your own courses',
  'Tools scaled to your time window',
  'Topic mastery and flashcard tracking',
  'Reports that tell you what to study next',
];

const DURATION_OPTS = ONBOARDING_QUESTIONS[0].opts;
const INTENTION_OPTS = ONBOARDING_QUESTIONS[6].opts;
const PATH_OPTS = [
  'Just starting (Level 100, Semester 1)',
  'I am already in my programme',
];

export default function Landing({ setPage }) {
  const [duration, setDuration] = useState(DURATION_OPTS[1]);
  const [intention, setIntention] = useState(INTENTION_OPTS[0]);
  const [studentPath, setStudentPath] = useState(PATH_OPTS[1]);

  const planPreview = useMemo(() => {
    const summary = getPlanSummary({ duration }, 1);
    const toolLabels = {
      flashcards: 'Flashcards',
      'ai-buddy': 'AI buddy',
      'habit-tracker': 'Wellness',
      reports: 'Reports',
      projects: 'Projects',
      'study-groups': 'Study groups',
    };
    return {
      maxCourses: summary.maxCourses,
      message: summary.message,
      tools: summary.enabledTools
        .filter((t) => !['dashboard', 'courses', 'semester-journey'].includes(t))
        .map((t) => toolLabels[t] || t),
    };
  }, [duration]);

  function savePrefsAndSignup() {
    setPreAccountPrefs({ duration, intention, studentPath });
    setPage('auth', 'signup');
  }

  return (
    <div className="page lp-page anim-fade-in">
      <section className="lp-hero">
        <div className="lp-hero-glow" aria-hidden="true" />
        <div className="lp-container">
          <div className="lp-hero-grid">
            <div className="lp-hero-copy">
              <p className="lp-kicker">Acad, academic comeback conditioning</p>
              <h1 className="lp-title">
                Plan your academic comeback.
                <span className="lp-title-accent"> On your terms. Your pace.</span>
              </h1>
              <p className="lp-lead">
                Built for focused breaks between commitments. Add the courses you need to recover,
                and Acad scales its tools to the time you actually have.
              </p>
              <div className="lp-cta-row">
                <button id="btn-gw-begin" type="button" className="btn btn-primary lp-cta-primary" onClick={savePrefsAndSignup}>
                  Start your plan
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                <button id="btn-gw-signin" type="button" className="btn btn-outline" onClick={() => setPage('auth', 'login')}>
                  Sign in
                </button>
              </div>
              <p className="lp-hero-note">
                Shorter windows mean fewer courses and leaner tools, by design, not limitation.
              </p>
            </div>

            <div className="lp-hero-panel" aria-hidden="true">
              <div className="lp-panel-head">
                <span className="lp-panel-dot" />
                <span className="lp-panel-label">Today&apos;s conditioning</span>
              </div>
              <div className="lp-panel-task">
                <p className="lp-panel-task-kicker">Daily task</p>
                <p className="lp-panel-task-title">Explain the spacing effect in your own words</p>
                <div className="lp-panel-timer font-mono">08:42</div>
                <div className="lp-panel-bar"><span style={{ width: '42%' }} /></div>
              </div>
              <div className="lp-panel-stats">
                <div><span className="font-mono">12</span><span>day streak</span></div>
                <div><span className="font-mono">68%</span><span>completion</span></div>
                <div><span className="font-mono">3</span><span>courses</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-section-tinted lp-planner">
        <div className="lp-container">
          <div className="lp-section-head">
            <p className="lp-kicker">Before you sign up</p>
            <h2 className="lp-section-title">Shape your comeback window</h2>
            <p className="lp-section-desc">
              Two quick choices — no account needed. The rest of setup happens inside Acad as you use it.
            </p>
          </div>
          <div className="lp-planner-grid">
            <div className="lp-planner-form card">
              <p className="form-label">How much time do you have?</p>
              <div className="lp-planner-opts" role="radiogroup" aria-label="Recovery window">
                {DURATION_OPTS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`ob-opt${duration === opt ? ' sel' : ''}`}
                    onClick={() => setDuration(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <p className="form-label" style={{ marginTop: 20 }}>What would feel like a win?</p>
              <div className="lp-planner-opts" role="radiogroup" aria-label="Primary intention">
                {INTENTION_OPTS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`ob-opt${intention === opt ? ' sel' : ''}`}
                    onClick={() => setIntention(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <p className="form-label" style={{ marginTop: 20 }}>Where are you academically?</p>
              <div className="lp-planner-opts" role="radiogroup" aria-label="Student path">
                {PATH_OPTS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`ob-opt${studentPath === opt ? ' sel' : ''}`}
                    onClick={() => setStudentPath(opt)}
                  >
                    {opt.startsWith('Just') ? 'Just starting' : 'Already in programme'}
                  </button>
                ))}
              </div>
            </div>
            <aside className="lp-planner-preview card">
              <p className="card-label">Your plan preview</p>
              <p className="lp-planner-preview-window">{duration}</p>
              <ul className="lp-planner-preview-list">
                <li><strong>{planPreview.maxCourses}</strong> focus course{planPreview.maxCourses === 1 ? '' : 's'}</li>
                <li>{planPreview.tools.join(' · ')}</li>
                <li>Advancing to a new semester unlocks when this window ends</li>
              </ul>
              <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={savePrefsAndSignup}>
                Create account with this plan
              </button>
            </aside>
          </div>
        </div>
      </section>

      <section className="lp-stats-strip">
        <div className="lp-container lp-stats-inner">
          {[
            ['10', 'min max daily task'],
            ['6', 'week standard cycle'],
            ['6', 'courses at full plan'],
            ['0', 'passive lectures'],
          ].map(([n, label]) => (
            <div key={label} className="lp-stat">
              <span className="lp-stat-n font-mono">{n}</span>
              <span className="lp-stat-lbl">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-head">
            <p className="lp-kicker">Platform</p>
            <h2 className="lp-section-title">Everything orbits your courses</h2>
            <p className="lp-section-desc">You bring the material. Acad provides the structure, recall, and feedback loop.</p>
          </div>
          <div className="lp-features">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <article key={title} className="lp-feature-card">
                <span className="lp-feature-icon" aria-hidden="true">
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <h3 className="lp-feature-title">{title}</h3>
                <p className="lp-feature-desc">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-section-tinted">
        <div className="lp-container">
          <div className="lp-section-head">
            <p className="lp-kicker">Plan scaling</p>
            <h2 className="lp-section-title">Tools unlock with your recovery window</h2>
            <p className="lp-section-desc">Three months unlocks the full stack. Two months, less. One month, tighter. Weeks-only? Essentials only.</p>
          </div>
          <div className="lp-tiers">
            {TIERS.map((tier, i) => (
              <article key={tier.window} className="lp-tier-card">
                <span className="lp-tier-step font-mono">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="lp-tier-window">{tier.window}</h3>
                <p className="lp-tier-courses">{tier.courses}</p>
                <p className="lp-tier-tools">{tier.tools}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-head">
            <p className="lp-kicker">The difference</p>
            <h2 className="lp-section-title">Structured comeback vs unstructured time off</h2>
          </div>
          <div className="lp-compare">
            <article className="lp-compare-card lp-compare-muted">
              <div className="lp-compare-head">
                <Minus size={18} aria-hidden="true" />
                <h3>Without a plan</h3>
              </div>
              <ul className="lp-compare-list">
                {WITHOUT.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="lp-compare-card lp-compare-highlight">
              <div className="lp-compare-head">
                <Check size={18} aria-hidden="true" />
                <h3>With Acad</h3>
              </div>
              <ul className="lp-compare-list">
                {WITH.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="lp-final-cta">
        <div className="lp-container lp-final-inner">
          <div>
            <h2 className="lp-final-title">Ready to structure your comeback?</h2>
            <p className="lp-final-desc">About five minutes after signup — then straight to your dashboard.</p>
          </div>
          <div className="lp-cta-row">
            <button id="btn-gw-create" type="button" className="btn btn-primary" onClick={savePrefsAndSignup}>
              Create account
            </button>
            <button id="btn-gw-signin" type="button" className="btn btn-outline" onClick={() => setPage('auth', 'login')}>
              Sign in
            </button>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-container lp-foot-inner">
          <span className="lp-foot-brand">
            <img src="/favicon.svg" alt="" width={20} height={20} aria-hidden="true" />
            Acad
          </span>
          <nav className="lp-foot-links" aria-label="Legal">
            <button type="button" className="lp-foot-link" onClick={() => setPage('privacy')}>Privacy</button>
            <button type="button" className="lp-foot-link" onClick={() => setPage('terms')}>Terms</button>
          </nav>
          <span className="lp-foot-copy">© {new Date().getFullYear()} Acad</span>
        </div>
      </footer>
    </div>
  );
}
