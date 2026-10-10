import { getProjectCompletion } from './projectCompletion.js';
import { loadForgeWorkspace } from './forgeStorage.js';

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function uniqueSkills(projects) {
  const skills = new Set();
  projects.forEach((p) => {
    if (p.skillFocus) skills.add(p.skillFocus);
    if (p.principle) skills.add(p.principle);
    if (p.topicName) skills.add(p.topicName);
  });
  return [...skills];
}

/**
 * Opens a print-ready portfolio PDF structured for employers, internships, and grad-school applications.
 */
export function exportCompletedProjectsPdf({ userName, userEmail, profile, projects }) {
  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const completed = projects.filter((p) => getProjectCompletion(p).isComplete);
  if (completed.length === 0) return false;

  const ap = profile?.academicProfile;
  const institution = ap?.institutionName || '';
  const programme = ap?.programName || '';
  const skills = uniqueSkills(completed);

  const summaryText = completed.length === 1
    ? 'One completed portfolio project demonstrating applied understanding in a focused academic area.'
    : `${completed.length} completed portfolio projects demonstrating applied understanding across ${skills.slice(0, 4).join(', ')}${skills.length > 4 ? ', and more' : ''}.`;

  const projectBlocks = completed
    .map((project, index) => {
      const { milestones } = getProjectCompletion(project);
      const ws = loadForgeWorkspace(project.title);
      const completedMilestones = milestones.filter((m) => m.done);
      const milestoneList = completedMilestones
        .map((m) => `<li>${escapeHtml(m.title)} <span class="muted">(${escapeHtml(m.week)})</span></li>`)
        .join('');

      const draftText = ws.draft ? escapeHtml(ws.draft.slice(0, 1400)) : '';
      const draftBlock = draftText
        ? `<div class="deliverable"><h4>Key deliverable excerpt</h4><p>${draftText}${ws.draft.length > 1400 ? '…' : ''}</p></div>`
        : '';

      return `
        <article class="project">
          <div class="project-head">
            <span class="project-num">Project ${index + 1}</span>
            <h2>${escapeHtml(project.title)}</h2>
          </div>
          <dl class="meta-grid">
            <div><dt>Course</dt><dd>${escapeHtml(project.courseCode || '—')}</dd></div>
            <div><dt>Focus area</dt><dd>${escapeHtml(project.topicName || project.skillFocus || '—')}</dd></div>
            <div><dt>Level</dt><dd>${escapeHtml(project.difficulty || '—')}</dd></div>
            <div><dt>Timeline</dt><dd>${escapeHtml(project.timeline || '—')}</dd></div>
          </dl>
          <div class="section">
            <h3>Problem & objective</h3>
            <p>${escapeHtml(project.objective || '')}</p>
          </div>
          <div class="section">
            <h3>Competency demonstrated</h3>
            <p><strong>${escapeHtml(project.principle || 'Applied learning')}</strong> — ${escapeHtml(project.why || project.portfolio || 'Structured work showing depth beyond exam recall.')}</p>
          </div>
          ${project.outcome ? `<div class="section"><h3>Outcome</h3><p>${escapeHtml(project.outcome)}</p></div>` : ''}
          <div class="section">
            <h3>Process completed</h3>
            <ul>${milestoneList}</ul>
          </div>
          ${draftBlock}
          ${project.portfolio ? `<p class="employer-note"><em>Relevance:</em> ${escapeHtml(project.portfolio)}</p>` : ''}
        </article>`;
    })
    .join('');

  const skillsList = skills.map((s) => `<li>${escapeHtml(s)}</li>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Portfolio — ${escapeHtml(userName || 'Acad Member')}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Segoe UI", system-ui, sans-serif; color: #111827; padding: 48px; max-width: 800px; margin: 0 auto; line-height: 1.55; }
    .cover { margin-bottom: 40px; padding-bottom: 28px; border-bottom: 2px solid #0f766e; page-break-after: avoid; }
    .cover-kicker { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #0f766e; font-weight: 600; }
    h1 { font-size: 30px; margin: 8px 0 6px; font-weight: 700; }
    .cover-meta { color: #4b5563; font-size: 13px; }
    .cover-meta span { display: block; margin-top: 2px; }
    .summary { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 16px 18px; margin-bottom: 32px; page-break-inside: avoid; }
    .summary h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #0f766e; margin-bottom: 8px; }
    .summary p { font-size: 14px; }
    .skills { margin-bottom: 36px; page-break-inside: avoid; }
    .skills h2 { font-size: 16px; margin-bottom: 10px; }
    .skills ul { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; padding: 0; }
    .skills li { background: #ecfdf5; color: #065f46; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .project { margin-bottom: 40px; padding-bottom: 28px; border-bottom: 1px solid #e5e7eb; page-break-inside: avoid; }
    .project-head { margin-bottom: 12px; }
    .project-num { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-weight: 600; }
    .project h2 { font-size: 20px; margin-top: 4px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-bottom: 16px; font-size: 13px; }
    .meta-grid dt { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
    .meta-grid dd { font-weight: 600; margin-top: 2px; }
    .section { margin-bottom: 14px; }
    .section h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #374151; margin-bottom: 6px; }
    .section p, .section ul { font-size: 14px; }
    ul { padding-left: 18px; }
    .muted { color: #9ca3af; font-weight: 400; }
    .deliverable { margin-top: 14px; padding: 14px 16px; background: #f9fafb; border-left: 3px solid #14b8a6; border-radius: 0 6px 6px 0; }
    .deliverable h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #0f766e; margin-bottom: 8px; }
    .deliverable p { font-size: 13px; white-space: pre-wrap; }
    .employer-note { font-size: 13px; color: #374151; margin-top: 12px; padding: 10px 12px; background: #fffbeb; border-radius: 6px; }
    .footer { margin-top: 32px; font-size: 11px; color: #9ca3af; text-align: center; }
    @media print {
      body { padding: 24px; }
      .project { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header class="cover">
    <p class="cover-kicker">Academic Portfolio</p>
    <h1>${escapeHtml(userName || 'Portfolio')}</h1>
    <div class="cover-meta">
      ${userEmail ? `<span>${escapeHtml(userEmail)}</span>` : ''}
      ${institution ? `<span>${escapeHtml(institution)}${programme ? ` · ${escapeHtml(programme)}` : ''}</span>` : ''}
      <span>Prepared ${date}</span>
    </div>
  </header>

  <section class="summary">
    <h2>Executive summary</h2>
    <p>${escapeHtml(summaryText)} These projects were completed as structured proof-of-understanding work — suitable for internship applications, employer portfolios, and graduate programme supplements.</p>
  </section>

  <section class="skills">
    <h2>Skills & competencies</h2>
    <ul>${skillsList}</ul>
  </section>

  <section aria-label="Completed projects">
    <h2 style="font-size:18px;margin-bottom:20px;">Completed projects</h2>
    ${projectBlocks}
  </section>

  <p class="footer">Generated from Acad · ${date} · Save as PDF via your browser print dialog</p>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
  return true;
}
