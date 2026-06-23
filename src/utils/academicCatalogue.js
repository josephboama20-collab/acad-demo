import ugGhana from '../data/catalogues/ug-ghana.json';

function normalizeText(value) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function matchesUniversity(universityName, catalogue) {
  const uni = normalizeText(universityName);
  if (!uni) return false;
  if (uni.includes('university of ghana')) return catalogue.institutionKey === 'university-of-ghana';
  if (uni === 'ug' || uni.startsWith('ug ')) return catalogue.institutionKey === 'university-of-ghana';
  return false;
}

function matchesProgramme(programName, programmeDef) {
  const prog = normalizeText(programName);
  if (!prog) return false;
  if (programmeDef.excludePatterns?.some((p) => prog.includes(normalizeText(p)))) return false;
  return programmeDef.matchPatterns.some((p) => prog.includes(normalizeText(p)));
}

/** @returns {{ catalogueKey: string, programme: object } | null} */
export function findCatalogueMatch(params) {
  const { universityName, programName, country } = params || {};
  if (normalizeText(country) !== 'ghana' && !matchesUniversity(universityName, ugGhana)) {
    return null;
  }
  if (!matchesUniversity(universityName, ugGhana)) return null;

  for (const [catalogueKey, programme] of Object.entries(ugGhana.programmes)) {
    if (matchesProgramme(programName, programme)) {
      return { catalogueKey, programme };
    }
  }
  return null;
}

export function buildProfileFromCatalogue(params, match) {
  const { programme } = match;
  return {
    source: 'catalogue',
    institutionName: params.universityName || ugGhana.institutionName,
    programName: programme.programName || params.programName,
    departmentName: params.departmentName || programme.departmentName,
    gradingScale: ugGhana.gradingScale,
    programStructure: { durationYears: 4, levels: [100, 200, 300, 400], semestersPerYear: 2 },
    curriculum: structuredClone(programme.curriculum),
    adaptationNotes: programme.adaptationNotes,
  };
}

/** Prefer catalogue courses; append AI-only courses for semesters catalogue does not cover. */
export function mergeCatalogueWithAi(catalogueProfile, aiProfile) {
  if (!catalogueProfile) return aiProfile;
  if (!aiProfile?.curriculum) return catalogueProfile;

  const mergedCurriculum = structuredClone(catalogueProfile.curriculum || {});
  const catalogueCodes = new Set();

  Object.values(mergedCurriculum).forEach((sems) => {
    Object.values(sems || {}).forEach((courses) => {
      (courses || []).forEach((c) => catalogueCodes.add(c.code));
    });
  });

  Object.entries(aiProfile.curriculum || {}).forEach(([level, sems]) => {
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
