import ugGhana from './ug-ghana.json' with { type: 'json' };

function normalizeText(value: string) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function matchesUniversity(universityName: string) {
  const uni = normalizeText(universityName);
  if (!uni) return false;
  return uni.includes('university of ghana') || uni === 'ug' || uni.startsWith('ug ');
}

function matchesProgramme(programName: string, programmeDef: { matchPatterns: string[]; excludePatterns?: string[] }) {
  const prog = normalizeText(programName);
  if (!prog) return false;
  if (programmeDef.excludePatterns?.some((p) => prog.includes(normalizeText(p)))) return false;
  return programmeDef.matchPatterns.some((p) => prog.includes(normalizeText(p)));
}

export function findCatalogueMatch(params: Record<string, unknown>) {
  const universityName = String(params.universityName ?? '');
  const programName = String(params.programName ?? '');
  const country = normalizeText(String(params.country ?? ''));

  if (country !== 'ghana' && !matchesUniversity(universityName)) return null;
  if (!matchesUniversity(universityName)) return null;

  for (const [catalogueKey, programme] of Object.entries(ugGhana.programmes)) {
    if (matchesProgramme(programName, programme as { matchPatterns: string[]; excludePatterns?: string[] })) {
      return { catalogueKey, programme };
    }
  }
  return null;
}

export function buildProfileFromCatalogue(params: Record<string, unknown>, match: { programme: Record<string, unknown> }) {
  const programme = match.programme;
  return {
    source: 'catalogue',
    institutionName: params.universityName || ugGhana.institutionName,
    programName: programme.programName || params.programName,
    departmentName: params.departmentName || programme.departmentName,
    gradingScale: ugGhana.gradingScale,
    programStructure: { durationYears: 4, levels: [100, 200, 300, 400], semestersPerYear: 2 },
    curriculum: JSON.parse(JSON.stringify(programme.curriculum)),
    adaptationNotes: programme.adaptationNotes,
  };
}

export function mergeCatalogueWithAi(catalogueProfile: Record<string, unknown>, aiProfile: Record<string, unknown>) {
  if (!catalogueProfile) return aiProfile;
  if (!aiProfile?.curriculum) return catalogueProfile;

  const mergedCurriculum = JSON.parse(JSON.stringify(catalogueProfile.curriculum || {})) as Record<string, Record<string, Array<{ code: string }>>>;
  const catalogueCodes = new Set<string>();

  Object.values(mergedCurriculum).forEach((sems) => {
    Object.values(sems || {}).forEach((courses) => {
      (courses || []).forEach((c) => catalogueCodes.add(c.code));
    });
  });

  const aiCurriculum = aiProfile.curriculum as Record<string, Record<string, Array<{ code: string; type?: string }>>>;
  Object.entries(aiCurriculum || {}).forEach(([level, sems]) => {
    if (!mergedCurriculum[level]) mergedCurriculum[level] = {};
    Object.entries(sems || {}).forEach(([sem, courses]) => {
      const existing = mergedCurriculum[level][sem] || [];
      const existingCodes = new Set(existing.map((c) => c.code));
      const extras = (courses || []).filter((c) => c.code && !catalogueCodes.has(c.code) && !existingCodes.has(c.code));
      if (extras.length) {
        mergedCurriculum[level][sem] = [...existing, ...extras.map((c) => ({ ...c, type: c.type || 'elective' }))];
      } else if (!existing.length && courses?.length) {
        mergedCurriculum[level][sem] = courses;
      }
    });
  });

  return {
    ...catalogueProfile,
    gradingScale: catalogueProfile.gradingScale || aiProfile.gradingScale,
    adaptationNotes: catalogueProfile.adaptationNotes || aiProfile.adaptationNotes,
    curriculum: mergedCurriculum,
    source: 'catalogue',
  };
}

export const PROMPT_RULES_UG = `University of Ghana rules (when applicable):
- BSc Computer Science core courses use the CSCD prefix (e.g. CSCD 101, CSCD 216). Do NOT use CPS, CSCI, COMPSCI, or DCIT for Computer Science.
- BSc Information Technology uses CSIT; do not mix CSIT with CSCD unless the student is in a combined programme.
- General university requirements use UGRC (e.g. UGRC 150, UGRC 110, UGRC 210). Do NOT substitute GESS, GNS, or GES codes for UGRC.
- Use only course codes and titles from the official UG handbook when you know them. Do not invent codes.
- If unsure about a course, omit it rather than guessing.`;
