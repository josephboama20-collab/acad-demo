import { useState, useRef, useCallback } from 'react';
import {
  BookOpen,
  Bot,
  GraduationCap,
  Activity,
  Layers,
  FolderGit2,
  ChartLine,
  Users,
  House,
  Flame,
  X,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

const PAGE_GUIDES = {
  dashboard: {
    title: 'Your Dashboard',
    steps: [
      { title: 'Daily Task', body: 'Your one focused task for the day. Complete it to build your streak and mastery over time.' },
      { title: 'Comeback Plan', body: 'Your personalised study window. The countdown sets your pace — log past semesters anytime.' },
      { title: 'Activity Map', body: 'Every active day adds a cell here. Longer streaks unlock more tools and deeper insights.' },
      { title: 'KPIs', body: 'Quick metrics — your streak, completion rate, tasks finished, and active projects.' },
      { title: 'Setup Checklist', body: 'Tick these off as you go. Acad adapts as you add more semesters and tools.' },
    ],
  },
  courses: {
    title: 'Your Courses',
    steps: [
      { title: 'Course List', body: 'All your logged courses across semesters. Tap a course to see topics, notes, and flashcards.' },
      { title: 'Weak Topics', body: 'Acad flags topics that need attention based on your grades and flashcard performance.' },
      { title: 'Uploaded Notes', body: 'Upload PDFs, slides, or text notes — Acad extracts topics and creates flashcards for you.' },
      { title: 'Mastery Levels', body: 'Each topic gets a mastery % that updates as you study. Target 80%+ to stay sharp.' },
    ],
  },
  'semester-journey': {
    title: 'Semester Journey',
    steps: [
      { title: 'Timeline', body: 'Your full academic history — every semester you log compounds into trend analysis.' },
      { title: 'Add Semester', body: 'Log completed semesters only. Each one sharpens your GPA tracking and grade trends.' },
      { title: 'Grade History', body: 'Watch how your grades evolve. More data means Acad can spot patterns and suggest focus areas.' },
    ],
  },
  flashcards: {
    title: 'Flashcards',
    steps: [
      { title: 'Spaced Repetition', body: 'Cards appear at optimal intervals. Answer honestly — Acad learns what you know.' },
      { title: 'Rating', body: 'Rate each card 1-5. Low-rated cards show up more often until you master them.' },
      { title: 'Due Cards', body: 'Only study what is due today. Consistent daily sessions beat cramming with spaced repetition.' },
    ],
  },
  'ai-buddy': {
    title: 'AI Buddy',
    steps: [
      { title: 'Chat', body: 'Ask your AI study buddy anything about your courses, grades, or study strategy.' },
      { title: 'Context', body: 'The buddy sees your course history and grades — better answers come from more logged semesters.' },
    ],
  },
  'habit-tracker': {
    title: 'Wellness Tracker',
    steps: [
      { title: 'Habit Logging', body: 'Track sleep, exercise, focus hours, and mood. Wellness data refines your cognitive load estimate.' },
      { title: 'Trends', body: 'Patterns emerge over weeks. Correlation with grades helps you find your ideal routine.' },
    ],
  },
  projects: {
    title: 'Projects',
    steps: [
      { title: 'Active Projects', body: 'Long-form work tracked alongside your coursess. Set milestones and track progress.' },
      { title: 'Unlock', body: 'Projects unlock after building a consistent streak and completing key setup steps.' },
    ],
  },
  reports: {
    title: 'Reports',
    steps: [
      { title: 'Grade Trends', body: 'Visual trends across semesters. More semesters = richer charts and predictions.' },
      { title: 'Topic Mastery', body: 'See which topics need work and which you have mastered across all courses.' },
      { title: 'Conditioning Score', body: 'Your overall academic readiness score. It improves with consistency and logged data.' },
    ],
  },
};

export default function TutorialOverlay({ page, isNewAccount, onDismiss, setPage }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [active, setActive] = useState(isNewAccount);
  const guide = PAGE_GUIDES[page];

  const start = useCallback(() => {
    setCurrentStep(0);
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    onDismiss?.();
  }, [onDismiss]);

  if (!guide) return null;

  const step = guide.steps[currentStep];
  const isLast = currentStep === guide.steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <>
      {!active && (
        <button
          type="button"
          className="btn btn-ghost btn-sm tutorial-trigger"
          onClick={start}
          aria-label="Start page tutorial"
          id="btn-tutorial-trigger"
        >
          <HelpCircle size={14} strokeWidth={2} />
          <span>Guide</span>
        </button>
      )}

      {active && (
        <div className="tutorial-overlay" role="dialog" aria-label={`${guide.title} tutorial`}>
          <div className="tutorial-backdrop" onClick={stop} />
          <div className="tutorial-sheet anim-fade-up">
            <div className="tutorial-header">
              <h3 className="tutorial-title">{guide.title}</h3>
              <button type="button" className="btn btn-ghost btn-sm tutorial-close" onClick={stop} aria-label="Close tutorial">
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="tutorial-step-meta">
              <span className="tutorial-step-counter">{currentStep + 1} of {guide.steps.length}</span>
            </div>
            <div className="tutorial-body" key={currentStep}>
              <h4 className="tutorial-step-title">{step.title}</h4>
              <p className="tutorial-step-body">{step.body}</p>
            </div>
            <div className="tutorial-progress" role="progressbar" aria-valuenow={Math.round(((currentStep + 1) / guide.steps.length) * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="tutorial-progress-fill" style={{ width: `${((currentStep + 1) / guide.steps.length) * 100}%` }} />
            </div>
            <div className="tutorial-nav">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={isFirst}
              >
                <ChevronLeft size={16} strokeWidth={2} />
                Back
              </button>
              <div className="tutorial-dots">
                {guide.steps.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`tutorial-dot${i === currentStep ? ' active' : ''}`}
                    onClick={() => setCurrentStep(i)}
                    aria-label={`Step ${i + 1}`}
                  />
                ))}
              </div>
              {isLast ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={stop}>
                  Got it
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setCurrentStep((s) => Math.min(guide.steps.length - 1, s + 1))}
                >
                  Next
                  <ChevronRight size={16} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
