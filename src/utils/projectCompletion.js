import { getMilestoneProgress, loadForgeWorkspace } from './forgeStorage.js';
import { resolveProjectMilestones } from './projects.js';

export function getProjectCompletion(project) {
  const defs = resolveProjectMilestones(project);
  const progress = getMilestoneProgress(project);
  const total = defs.length;
  const done = defs.filter((_, i) => progress[i]).length;
  return {
    total,
    done,
    pct: total > 0 ? Math.round((done / total) * 100) : 0,
    isComplete: total > 0 && done === total,
    milestones: defs.map((m, i) => ({ ...m, done: Boolean(progress[i]) })),
  };
}

export function getCompletedProjects(projects) {
  return (projects || []).filter((p) => getProjectCompletion(p).isComplete);
}

export function partitionProjects(projects) {
  const inProgress = [];
  const completed = [];
  (projects || []).forEach((p) => {
    if (getProjectCompletion(p).isComplete) completed.push(p);
    else inProgress.push(p);
  });
  return { inProgress, completed };
}
