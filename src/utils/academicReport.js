const DAY_MS = 86400000;

function daysSince(isoDate) {
  if (!isoDate) return null;
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / DAY_MS);
}

function formatDaysAgo(isoDate) {
  const d = daysSince(isoDate);
  if (d === null) return 'never studied';
  if (d === 0) return 'today';
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}

function earliestDate(dates) {
  const valid = dates.filter(Boolean).map((d) => new Date(d).getTime()).filter((t) => !Number.isNaN(t));
  if (valid.length === 0) return null;
  return new Date(Math.min(...valid)).toISOString();
}

function daysActiveSinceStart({ profile, habitLogs, streak }) {
  const start = earliestDate([
    profile?.startedAt,
    habitLogs[0]?.date ? `${habitLogs[0].date}T12:00:00` : null,
    streak?.lastActiveDate,
  ]);
  const days = start ? daysSince(start) : null;
  return { startDate: start, daysSinceStart: days !== null ? Math.max(days, 1) : null };
}

export function buildAcademicSummary({
  kpis,
  priorityTopics,
  staleTopics,
  courseRows,
  recall,
  streak,
  metrics,
  daysSinceStart,
  totalStudyHours,
  avgFocus,
}) {
  const parts = [];

  if (daysSinceStart !== null) {
    parts.push(
      `Over ${daysSinceStart} day${daysSinceStart === 1 ? '' : 's'} on Acad, you have built a ${streak.current ?? 0}-day streak and completed ${metrics.tasksCompleted ?? 0} daily task${metrics.tasksCompleted === 1 ? '' : 's'}.`,
    );
  } else {
    parts.push(
      `You are early in your Acad journey with a ${streak.current ?? 0}-day streak and ${metrics.tasksCompleted ?? 0} task${metrics.tasksCompleted === 1 ? '' : 's'} completed so far.`,
    );
  }

  if (kpis.avgMastery > 0) {
    parts.push(
      `Average topic mastery sits at ${kpis.avgMastery}%${kpis.weakTopics > 0 ? `, with ${kpis.weakTopics} topic${kpis.weakTopics === 1 ? '' : 's'} still below 60%` : ', with no topics currently below 60%'}.`,
    );
  }

  if (totalStudyHours > 0) {
    parts.push(
      `You have logged ${totalStudyHours.toFixed(1)} hours of study${avgFocus ? ` at an average focus of ${avgFocus}/5` : ''}.`,
    );
  }

  if (recall.due > 0) {
    parts.push(
      `${recall.due} flashcard${recall.due === 1 ? '' : 's'} ${recall.due === 1 ? 'is' : 'are'} due — clearing the queue should be your next move.`,
    );
  } else if (recall.mastered > 0) {
    parts.push(`${recall.mastered} card${recall.mastered === 1 ? '' : 's'} reached mastered status in your recall pipeline.`);
  }

  const topWeak = priorityTopics[0];
  if (topWeak) {
    parts.push(
      `${topWeak.name} (${topWeak.courseCode}) at ${topWeak.masteryLevel}% is your highest-priority gap right now.`,
    );
  }

  const stale = staleTopics[0];
  if (stale && (!topWeak || stale.topicId !== topWeak.topicId)) {
    parts.push(`${stale.name} has not been revisited recently and may need a refresh.`);
  }

  const strugglingCourse = courseRows.find((c) => c.below60 > 0);
  if (strugglingCourse && strugglingCourse.below60 >= 2) {
    parts.push(
      `${strugglingCourse.code} has ${strugglingCourse.below60} topics below 60% — weight this course in your next study block.`,
    );
  }

  if (parts.length <= 1 && kpis.avgMastery >= 70) {
    parts.push('Overall momentum is strong. Maintain your recall rhythm and push depth on topics already above 70%.');
  }

  return parts.join(' ');
}

export function buildAcademicReport({
  courses = [],
  weakTopics = [],
  allTopics = [],
  dueCards = [],
  cards = [],
  masteryMap = {},
  habitLogs = [],
  streak = {},
  metrics = {},
  plan = {},
  profile = {},
}) {
  const avgMastery =
    allTopics.length > 0
      ? Math.round(allTopics.reduce((a, t) => a + t.masteryLevel, 0) / allTopics.length)
      : 0;

  const totalStudyHours = habitLogs.reduce((a, l) => a + (l.studyHours || 0), 0);
  const avgFocus =
    habitLogs.length > 0
      ? (habitLogs.reduce((a, l) => a + l.focusRating, 0) / habitLogs.length).toFixed(1)
      : null;

  const { startDate, daysSinceStart } = daysActiveSinceStart({ profile, habitLogs, streak });

  const staleTopics = allTopics
    .filter((t) => {
      const days = daysSince(t.lastStudied);
      return days === null || days >= 7;
    })
    .sort((a, b) => (a.masteryLevel ?? 0) - (b.masteryLevel ?? 0))
    .slice(0, 6);

  const priorityTopics = [...weakTopics]
    .sort((a, b) => a.masteryLevel - b.masteryLevel)
    .slice(0, 5);

  const courseRows = courses.map((c) => {
    const topics = c.topics || [];
    const avg =
      topics.length > 0
        ? Math.round(topics.reduce((a, t) => a + t.masteryLevel, 0) / topics.length)
        : 0;
    const below60 = topics.filter((t) => t.masteryLevel < 60).length;
    const highImportanceWeak = topics.filter(
      (t) => t.importance === 'high' && t.masteryLevel < 55,
    ).length;
    return {
      courseId: c.courseId,
      code: c.code,
      name: c.name,
      avg,
      below60,
      highImportanceWeak,
      topicCount: topics.length,
    };
  });

  const learningCards = cards.filter((c) => c.masteryLevel === 'learning').length;
  const reviewingCards = cards.filter((c) => c.masteryLevel === 'reviewing').length;

  const actions = [];

  if (dueCards.length > 0) {
    actions.push({
      priority: 'high',
      text: `Clear ${dueCards.length} due flashcard${dueCards.length === 1 ? '' : 's'} before starting new topics — spaced repetition only works if reviews stay current.`,
    });
  }

  priorityTopics.slice(0, 3).forEach((t) => {
    actions.push({
      priority: t.masteryLevel < 40 ? 'high' : 'medium',
      text: `${t.name} (${t.courseCode}) is at ${t.masteryLevel}% mastery. Run a recall block on this topic in Courses or generate flashcards.`,
    });
  });

  staleTopics.slice(0, 2).forEach((t) => {
    if (!priorityTopics.find((p) => p.topicId === t.topicId)) {
      actions.push({
        priority: 'medium',
        text: `${t.name} (${t.courseCode}) was last touched ${formatDaysAgo(t.lastStudied)}. Revisit before it slips further.`,
      });
    }
  });

  if (habitLogs.length >= 5 && avgFocus && Number(avgFocus) < 3 && totalStudyHours >= 5) {
    actions.push({
      priority: 'medium',
      text: `Focus has averaged ${avgFocus}/5 across ${habitLogs.length} logs. Split sessions into 25-minute blocks when focus drops below 3.`,
    });
  }

  if (streak.current > 0 && streak.current < 5) {
    actions.push({
      priority: 'low',
      text: `Streak is ${streak.current} day${streak.current === 1 ? '' : 's'}. Three more active days builds the habit loop your courses depend on.`,
    });
  }

  courseRows
    .filter((c) => c.highImportanceWeak > 0)
    .forEach((c) => {
      actions.push({
        priority: 'high',
        text: `${c.code}: ${c.highImportanceWeak} high-importance topic${c.highImportanceWeak === 1 ? '' : 's'} still below 55%. Weight these in your next study block.`,
      });
    });

  if (plan.slotsLeft > 0 && courses.length > 0 && courses.length < plan.maxCourses) {
    actions.push({
      priority: 'low',
      text: `You have ${plan.slotsLeft} open course slot${plan.slotsLeft === 1 ? '' : 's'} on your ${plan.durationLabel} plan. Add only if you can sustain parallel recall for every topic.`,
    });
  }

  if (actions.length === 0 && allTopics.length > 0) {
    actions.push({
      priority: 'low',
      text: 'Maintain current recall rhythm. Keep daily reviews under 20 minutes and add depth to your strongest topics.',
    });
  }

  const kpis = {
    dueCards: dueCards.length,
    weakTopics: weakTopics.length,
    avgMastery,
    totalStudyHours,
    streak: streak.current ?? 0,
    tasksCompleted: metrics.tasksCompleted ?? 0,
    learningCards,
    reviewingCards,
    masteredCards: masteryMap.mastered ?? 0,
    daysSinceStart,
  };

  const summary = buildAcademicSummary({
    kpis,
    priorityTopics,
    staleTopics,
    courseRows,
    recall: { due: dueCards.length, learning: learningCards, reviewing: reviewingCards, mastered: masteryMap.mastered ?? 0 },
    streak,
    metrics,
    daysSinceStart,
    totalStudyHours,
    avgFocus,
  });

  return {
    kpis,
    summary,
    startDate,
    priorityTopics,
    staleTopics,
    courseRows,
    recall: { due: dueCards.length, learning: learningCards, reviewing: reviewingCards, mastered: masteryMap.mastered ?? 0 },
    actions: actions.slice(0, 6),
  };
}

export { formatDaysAgo, daysSince };
