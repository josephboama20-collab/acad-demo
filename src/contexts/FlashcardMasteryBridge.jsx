import { useCallback } from 'react';
import { useCourses } from './CoursesContext.jsx';
import { FlashcardsProvider } from './FlashcardsContext.jsx';

export function FlashcardMasteryBridge({ children }) {
  const { courses, updateTopicMastery } = useCourses();

  const onCardReviewed = useCallback(
    (card, rating) => {
      const subject = card.subject;
      for (const course of courses) {
        const topic = course.topics.find((t) => t.name === subject || course.code === subject);
        if (topic) {
          const delta = rating >= 4 ? 5 : rating === 3 ? 2 : -3;
          const next = Math.min(100, Math.max(0, topic.masteryLevel + delta));
          updateTopicMastery(course.courseId, topic.name, next);
          break;
        }
      }
    },
    [courses, updateTopicMastery],
  );

  return <FlashcardsProvider onCardReviewed={onCardReviewed}>{children}</FlashcardsProvider>;
}
