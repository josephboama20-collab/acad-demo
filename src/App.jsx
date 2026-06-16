import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext.jsx';
import { usePlanCapacity } from './hooks/usePlanCapacity.js';
import Nav from './components/Nav.jsx';
import AppNotifications from './components/AppNotifications.jsx';
import StagingBanner from './components/StagingBanner.jsx';
import Loader from './components/Loader.jsx';
import Modal from './components/Modal.jsx';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Projects from './pages/Projects.jsx';
import Forge from './pages/Forge.jsx';
import Reports from './pages/Reports.jsx';
import Flashcards from './pages/Flashcards.jsx';
import AIBuddy from './pages/AIBuddy.jsx';
import HabitTracker from './pages/HabitTracker.jsx';
import StudyGroups from './pages/StudyGroups.jsx';
import StudyRoom from './pages/StudyRoom.jsx';
import Courses from './pages/Courses.jsx';
import AccountSettings from './pages/AccountSettings.jsx';
import ManagePlan from './pages/ManagePlan.jsx';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';

export default function App() {
  const { user, signOut, isCloudMode } = useAuth();
  const { enabledTools } = usePlanCapacity();
  const [page, setPage] = useState(() => (user ? 'dashboard' : 'landing'));
  const [authMode, setAuthMode] = useState('signup');
  const [forgeProject, setForgeProject] = useState(null);
  const [studyRoomEntry, setStudyRoomEntry] = useState(null);
  const [studyRoomLocked, setStudyRoomLocked] = useState(false);
  const [booting, setBooting] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [signoutConfirm, setSignoutConfirm] = useState(false);

  function navigate(next, arg) {
    if (studyRoomLocked && next !== 'study-room') {
      return;
    }
    if (next === 'signout-confirm') {
      setSignoutConfirm(true);
      return;
    }
    if (next === 'auth' && arg) setAuthMode(arg);
    if (next === 'forge' && arg) {
      setForgeProject(arg);
      setPage('forge');
      window.scrollTo(0, 0);
      return;
    }
    if (next === 'challenges') {
      setPage('study-groups');
      window.scrollTo(0, 0);
      return;
    }
    if (next === 'study-room') {
      if (arg && typeof arg === 'object') {
        setStudyRoomEntry({ code: String(arg.code), config: arg.config || null });
      } else if (arg) {
        setStudyRoomEntry({ code: String(arg), config: null });
      } else {
        setStudyRoomEntry(null);
      }
      setPage('study-room');
      window.scrollTo(0, 0);
      return;
    }
    if (user && next !== 'landing' && next !== 'auth' && next !== 'onboarding' && next !== 'settings' && next !== 'manage-plan' && !enabledTools.includes(next)) {
      setPage('dashboard');
      window.scrollTo(0, 0);
      return;
    }
    setPage(next);
    window.scrollTo(0, 0);
  }

  useEffect(() => {
    if (!user) return;
    const gated = ['dashboard', 'courses', 'flashcards', 'ai-buddy', 'habit-tracker', 'reports', 'study-groups', 'study-room', 'projects', 'forge', 'settings', 'manage-plan'];
    if (gated.includes(page) && page !== 'settings' && page !== 'manage-plan' && !enabledTools.includes(page) && page !== 'study-room') {
      setPage('dashboard');
    }
  }, [user, page, enabledTools]);

  if (booting) return <Loader label="Loading" onDone={() => setBooting(false)} />;
  if (signingOut) {
    return (
      <Loader
        label="Signing out…"
        onDone={async () => {
          await signOut();
          setSigningOut(false);
          setPage('landing');
        }}
      />
    );
  }

  return (
    <div className={`app${studyRoomLocked ? ' app--study-locked' : ''}`}>
      <StagingBanner />
      {!studyRoomLocked && page !== 'study-room' && <Nav page={page} setPage={navigate} />}
      {user && page !== 'onboarding' && page !== 'landing' && page !== 'auth' && page !== 'study-room' && <AppNotifications />}
      {page === 'landing' && <Landing setPage={navigate} />}
      {page === 'auth' && <Auth setPage={navigate} initialMode={authMode} />}
      {page === 'onboarding' && <Onboarding setPage={navigate} />}
      {page === 'dashboard' && <Dashboard setPage={navigate} />}
      {page === 'projects' && enabledTools.includes('projects') && <Projects setPage={navigate} />}
      {page === 'forge' && (enabledTools.includes('forge') || enabledTools.includes('projects')) && (
        <Forge setPage={navigate} project={forgeProject} />
      )}
      {page === 'reports' && enabledTools.includes('reports') && <Reports setPage={navigate} />}
      {page === 'flashcards' && enabledTools.includes('flashcards') && <Flashcards setPage={navigate} />}
      {page === 'ai-buddy' && enabledTools.includes('ai-buddy') && <AIBuddy setPage={navigate} />}
      {page === 'habit-tracker' && enabledTools.includes('habit-tracker') && <HabitTracker />}
      {page === 'study-groups' && enabledTools.includes('study-groups') && <StudyGroups setPage={navigate} />}
      {page === 'study-room' && enabledTools.includes('study-groups') && (
        <StudyRoom
          setPage={navigate}
          initialCode={studyRoomEntry?.code || null}
          initialConfig={studyRoomEntry?.config || null}
          onLeave={() => {
            setStudyRoomEntry(null);
            setStudyRoomLocked(false);
          }}
          onLockChange={setStudyRoomLocked}
        />
      )}
      {page === 'courses' && enabledTools.includes('courses') && <Courses setPage={navigate} />}
      {page === 'settings' && user && <AccountSettings setPage={navigate} />}
      {page === 'manage-plan' && user && <ManagePlan setPage={navigate} />}
      {page === 'privacy' && <Privacy setPage={navigate} />}
      {page === 'terms' && <Terms setPage={navigate} />}
      {signoutConfirm && (
        <Modal
          title="Sign out of Acad"
          body={
            isCloudMode
              ? 'You will be signed out on this device. Your data remains in your cloud account — sign in again to continue.'
              : 'Your profile and progress stay on this device. Sign back in with the same email to continue.'
          }
          confirmLabel="Sign out"
          confirmClass="btn-danger"
          onConfirm={() => {
            setSignoutConfirm(false);
            setSigningOut(true);
          }}
          onCancel={() => setSignoutConfirm(false)}
        />
      )}
    </div>
  );
}
