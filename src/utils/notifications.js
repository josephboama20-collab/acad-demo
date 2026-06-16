import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCourses } from '../contexts/CoursesContext.jsx';
import { useFlashcards } from '../contexts/FlashcardsContext.jsx';
import { useHabits } from '../contexts/HabitsContext.jsx';
import { canAccessProjects } from './projectEligibility.js';

export function buildAppNotifications({ streak, metrics, profile, logs, todayLog, insights, dueCards, weakTopics, courses }) {
  const items = [];
  const hour = new Date().getHours();

  if (!todayLog && logs !== null) {
    items.push({
      id: 'wellness-checkin',
      type: 'reminder',
      title: 'Daily check-in pending',
      body: hour < 12 ? 'Start your day with a quick wellness log.' : 'Log how today felt before you wrap up.',
    });
  }

  if (streak?.current >= 3) {
    items.push({
      id: 'streak',
      type: 'alert',
      title: `${streak.current}-day streak active`,
      body: 'Keep showing up. Consistency is what unlocks deeper tools like portfolio projects.',
    });
  }

  if (dueCards?.length > 0) {
    items.push({
      id: 'cards-due',
      type: 'reminder',
      title: `${dueCards.length} flashcard${dueCards.length === 1 ? '' : 's'} due`,
      body: 'Review due cards to protect your retention streak.',
    });
  }

  if (weakTopics?.length > 0) {
    const top = weakTopics[0];
    items.push({
      id: 'weak-topic',
      type: 'suggestion',
      title: `Focus: ${top.name}`,
      body: `${top.masteryLevel}% mastery in ${top.courseCode}. Work this topic first.`,
    });
  }

  if (courses?.length === 0) {
    items.push({
      id: 'add-courses',
      type: 'suggestion',
      title: 'Add your courses',
      body: 'Everything on Acad orbits the courses you add. Start there.',
    });
  }

  if (logs && logs.length > 0 && logs.length < 14) {
    items.push({
      id: 'insights-soon',
      type: 'suggestion',
      title: 'Wellness insights unlocking soon',
      body: `${14 - logs.length} more log${14 - logs.length === 1 ? '' : 's'} until productivity patterns appear.`,
    });
  }

  if (insights?.length > 0) {
    items.push({
      id: 'insight-top',
      type: 'suggestion',
      title: 'Pattern detected',
      body: insights[0].text,
    });
  }

  if (!canAccessProjects(streak, metrics, profile)) {
    items.push({
      id: 'projects-locked',
      type: 'reminder',
      title: 'Portfolio projects locked',
      body: 'Build your streak and complete daily tasks to unlock course-tailored projects.',
    });
  }

  return items;
}

export function useAppNotifications() {
  const { streak, metrics, profile } = useAuth();
  const { logs, todayLog, insights } = useHabits();
  const { dueCards } = useFlashcards();
  const { weakTopics, courses } = useCourses();

  return useMemo(
    () => buildAppNotifications({ streak, metrics, profile, logs, todayLog, insights, dueCards, weakTopics, courses }),
    [streak, metrics, profile, logs, todayLog, insights, dueCards, weakTopics, courses],
  );
}
