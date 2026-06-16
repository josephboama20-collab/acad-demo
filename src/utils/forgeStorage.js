import { loadJSON, saveJSON, STORAGE_KEYS } from './storage.js';

function allWorkspaces() {
  return loadJSON(STORAGE_KEYS.forgeWork) ?? {};
}

export function loadForgeWorkspace(projectTitle) {
  if (!projectTitle) return { draft: '', milestones: {} };
  const ws = allWorkspaces()[projectTitle];
  return {
    draft: ws?.draft ?? '',
    milestones: ws?.milestones ?? {},
  };
}

/** Merge saved workspace progress with project milestone `done` flags. */
export function getMilestoneProgress(project) {
  const fromWorkspace = loadForgeWorkspace(project?.title).milestones ?? {};
  const fromProject = {};
  if (Array.isArray(project?.milestones)) {
    project.milestones.forEach((m, i) => {
      if (m.done) fromProject[i] = true;
    });
  }
  return { ...fromProject, ...fromWorkspace };
}

export function saveForgeWorkspace(projectTitle, { draft, milestones }) {
  if (!projectTitle) return;
  const all = allWorkspaces();
  all[projectTitle] = {
    draft,
    milestones,
    updatedAt: new Date().toISOString(),
  };
  saveJSON(STORAGE_KEYS.forgeWork, all);
}
