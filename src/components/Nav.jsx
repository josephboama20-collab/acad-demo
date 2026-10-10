import { useState } from 'react';
import {
  Activity,
  BookOpen,
  ChartLine,
  Flame,
  GraduationCap,
  Ellipsis,
  FolderGit2,
  House,
  Layers,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Users,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { usePlanCapacity } from '../hooks/usePlanCapacity.js';
import ThemeToggle from './ThemeToggle.jsx';

const NAV_ITEMS = [
  { key: 'dashboard', icon: House, label: 'Dashboard' },
  { key: 'courses', icon: BookOpen, label: 'Courses' },
  { key: 'semester-journey', icon: GraduationCap, label: 'Semester' },
  { key: 'flashcards', icon: Layers, label: 'Flashcards' },
  // [AI Buddy deactivated] { key: 'ai-buddy', icon: Bot, label: 'AI Buddy' },
  { key: 'habit-tracker', icon: Activity, label: 'Wellness' },
  { key: 'study-groups', icon: Users, label: 'Groups' },
  null,
  { key: 'projects', icon: FolderGit2, label: 'Projects' },
  { key: 'reports', icon: ChartLine, label: 'Reports' },
];

const MOBILE_TABS = ['dashboard', 'courses', 'flashcards', /* [AI Buddy deactivated] 'ai-buddy', */ 'study-groups'];

function NavMark() {
  return <img className="nav-mark-img" src="/favicon.svg" alt="" aria-hidden="true" width={28} height={28} />;
}

function DockButton({ item, active, onClick, danger }) {
  const Icon = item.icon;
  return (
    <button
      id={`btn-dock-${item.key}`}
      className={`dock-btn${active ? ' active' : ''}${danger ? ' danger' : ''}`}
      onClick={onClick}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      data-label={item.label}
    >
      <span className="dock-icon" aria-hidden="true"><Icon size={18} strokeWidth={2} /></span>
      <span className="dock-label" aria-hidden="true">{item.label}</span>
      <span className="dock-tooltip" aria-hidden="true">{item.label}</span>
    </button>
  );
}

function DockStreakRow({ streak }) {
  const label = streak === 1 ? '1 day streak' : `${streak} day streak`;
  return (
    <div className="dock-btn dock-meta dock-meta--static" role="status" aria-label={label}>
      <span className="dock-icon" aria-hidden="true">
        <Flame size={18} strokeWidth={2} />
      </span>
      <span className="dock-label" aria-hidden="true">{label}</span>
      <span className="dock-tooltip" aria-hidden="true">{label}</span>
    </div>
  );
}

export default function Nav({ page, setPage, authMode = 'signup', onShowTutorial }) {
  const { user, settings, streak } = useAuth();
  const { enabledTools } = usePlanCapacity();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState(() => {
    try {
      return localStorage.getItem('acad-nav-expanded') !== 'false';
    } catch {
      return true;
    }
  });
  const [tutorialMode, setTutorialMode] = useState(() => {
    try {
      return localStorage.getItem('acad-tutorial-mode') === '1';
    } catch {
      return false;
    }
  });

  const toggleTutorialMode = () => {
    setTutorialMode((v) => {
      const next = !v;
      try {
        localStorage.setItem('acad-tutorial-mode', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
    onShowTutorial?.();
  };

  if (settings.focusMode) return null;

  const go = (key, arg) => {
    setPage(key, arg);
    setDrawerOpen(false);
  };

  const toggleExpanded = () => {
    setExpanded((v) => {
      const next = !v;
      try {
        localStorage.setItem('acad-nav-expanded', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  if (page === 'onboarding') {
    return (
      <nav id="global-nav" className="nav-onboarding" aria-label="Global navigation">
        {/* Stay on onboarding - leaving mid-setup dumps users to the public landing and looks like a session loss */}
        <button id="btn-nav-logo-ob" className="nav-logo" aria-label="Acad" type="button" disabled>
          <NavMark />
        </button>
        <div style={{ marginLeft: 'auto' }}>
          <ThemeToggle variant="top" />
        </div>
      </nav>
    );
  }

  if (!user) {
    return (
      <nav id="global-nav" className="nav-top" aria-label="Global navigation">
        <button id="btn-nav-logo" className="nav-logo" onClick={() => go('landing')} aria-label="Acad home">
          <NavMark />
          <span className="nav-name">Acad</span>
        </button>
        <div className="nav-top-links">
          <ThemeToggle variant="top" />
          <button id="btn-nav-platform" className={`nav-top-link${page === 'landing' ? ' active' : ''}`} onClick={() => go('landing')}>Platform</button>
          <button id="btn-nav-signin" className={`nav-top-link${page === 'auth' && authMode === 'login' ? ' active' : ''}`} onClick={() => go('auth', 'login')}>Sign in</button>
          <button id="btn-nav-begin" className={`btn btn-primary${page === 'auth' && authMode === 'signup' ? ' nav-cta-active' : ''}`} style={{ padding: '7px 18px', fontSize: '10px' }} onClick={() => go('auth', 'signup')}>Begin</button>
        </div>
      </nav>
    );
  }

  const visibleNavItems = NAV_ITEMS.filter((item) => item === null || enabledTools.includes(item.key));
  const visibleMobileTabs = MOBILE_TABS.filter((key) => enabledTools.includes(key));

  return (
    <>
      <nav id="global-nav" className={`nav-dock${expanded ? ' expanded' : ''}`} aria-label="Global navigation">
        <div className="dock-header">
          <button id="btn-nav-logo" className="nav-logo" onClick={() => go('dashboard')} aria-label="Acad home">
            <NavMark />
            <span className="nav-name">Acad</span>
          </button>
          <button
            type="button"
            className="dock-toggle"
            onClick={toggleExpanded}
            aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
            aria-expanded={expanded}
            id="btn-dock-toggle"
          >
            {expanded ? (
              <PanelLeftClose size={18} strokeWidth={2} aria-hidden="true" />
            ) : (
              <PanelLeft size={18} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        </div>
        <div className="dock-items">
          {visibleNavItems.map((item, i) =>
            item === null ? (
              <div key={`sep-${i}`} className="dock-sep" role="separator" />
            ) : (
              <DockButton key={item.key} item={item} active={page === item.key || (item.key === 'study-groups' && page === 'study-room')} onClick={() => go(item.key)} />
            ),
          )}
        </div>
        <div className="dock-bottom">
          <ThemeToggle variant="dock-row" />
          {onShowTutorial && (
            <button
              id="btn-dock-tutorial"
              className={`dock-btn${tutorialMode ? ' active' : ''}`}
              onClick={toggleTutorialMode}
              aria-label={tutorialMode ? 'Tutorial mode on' : 'Page tutorial'}
              aria-pressed={tutorialMode}
              data-label="Guide"
            >
              <span className="dock-icon" aria-hidden="true"><HelpCircle size={18} strokeWidth={2} /></span>
              <span className="dock-label" aria-hidden="true">Guide</span>
              <span className="dock-tooltip" aria-hidden="true">Page tutorial</span>
            </button>
          )}
          {settings.showStreak !== false && <DockStreakRow streak={streak.current} />}
          <DockButton item={{ key: 'settings', icon: Settings, label: 'Settings' }} active={page === 'settings'} onClick={() => go('settings')} />
          <DockButton item={{ key: 'signout', icon: LogOut, label: 'Sign out' }} active={false} onClick={() => go('signout-confirm')} danger />
        </div>
      </nav>

      <nav id="mobile-nav" aria-label="Mobile navigation">
        {visibleMobileTabs.map((key) => {
          const item = NAV_ITEMS.find((n) => n && n.key === key);
          if (!item) return null;
          const Icon = item.icon;
          return (
            <button
              key={key}
              className={`mob-tab${page === key ? ' active' : ''}`}
              onClick={() => go(key)}
              aria-label={item.label}
              aria-current={page === key ? 'page' : undefined}
              id={`btn-mob-${key}`}
            >
              <span className="mob-icon"><Icon size={16} strokeWidth={2} /></span>
              <span className="mob-label">{item.label}</span>
            </button>
          );
        })}
        <button className={`mob-tab${drawerOpen ? ' active' : ''}`} onClick={() => setDrawerOpen((v) => !v)} aria-label="More navigation" aria-expanded={drawerOpen} id="btn-mob-more">
          <span className="mob-icon"><Ellipsis size={20} strokeWidth={2} /></span>
          <span className="mob-label">More</span>
        </button>
      </nav>

      {drawerOpen && (
        <div className="mob-drawer" role="dialog" aria-label="More navigation options">
          <div className="mob-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <div className="mob-drawer-sheet">
            <div className="mob-drawer-handle" />
            <div className="mob-drawer-grid">
              {[...visibleNavItems.filter(Boolean), { key: 'settings', icon: Settings, label: 'Settings' }, { key: 'tutorial', icon: HelpCircle, label: 'Page guide', action: 'tutorial' }, { key: 'signout', icon: LogOut, label: 'Sign out' }].map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.key} className={`mob-drawer-item${page === item.key ? ' active' : ''}`} onClick={() => {
                    if (item.action === 'tutorial') { onShowTutorial?.(); }
                    else { go(item.key === 'signout' ? 'signout-confirm' : item.key); }
                  }} id={`btn-drawer-${item.key}`}>
                    <span className="mob-drawer-icon"><Icon size={18} strokeWidth={2} /></span>
                    <span className="mob-drawer-label">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mob-drawer-meta">
              <ThemeToggle variant="dock-row" />
              <DockStreakRow streak={streak.current} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
