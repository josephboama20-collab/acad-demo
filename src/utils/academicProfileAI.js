import { isCloudEnabled, supabase } from '../lib/supabase.js';
import { normalizeAcademicProfile } from './academicProfileUtils.js';
import { callDeepSeek } from './llmClient.js';

const PROFILE_SCHEMA_HINT = `Return ONLY valid JSON (no markdown fences) matching this shape:
{
  "institutionName": "string",
  "programName": "string",
  "departmentName": "string or null",
  "gradingScale": {
    "label": "string",
    "grades": [{ "letter": "A", "points": 4.0, "min": 80, "max": 100, "label": "Outstanding" }]
  },
  "programStructure": { "durationYears": 4, "levels": [100,200,300,400], "semestersPerYear": 2 },
  "curriculum": {
    "100": { "1": [{ "code": "CODE", "name": "Course title", "credits": 3, "type": "core|elective|ugrc" }] },
    "100": { "2": [] }
  },
  "adaptationNotes": "1-2 sentences on how to pace conditioning for this student"
}`;

function buildLearnPrompt(params) {
  const {
    universityName,
    programName,
    country,
    trackType,
    secondaryProgram,
    studentPath,
    currentLevel,
    currentSemester,
    departmentName,
  } = params;

  return `You are Acad's academic intelligence engine. Research and infer the academic structure for this student.

Student parameters:
- University: ${universityName}
- Programme: ${programName}
${departmentName ? `- Department/Faculty: ${departmentName}` : ''}
- Country/region: ${country || 'not specified'}
- Structure: ${trackType || 'Single major'}${secondaryProgram ? ` (combined with ${secondaryProgram})` : ''}
- Journey: ${studentPath === 'new' ? 'Just starting Level 100 Semester 1' : `Continuing at Level ${currentLevel} Semester ${currentSemester}`}

Tasks:
1. Infer the institution's typical undergraduate grading scale (letter grades + grade points).
2. Map the programme's year-by-year, semester-by-semester core course list as accurately as public curriculum data allows.
3. For combined majors, reflect both programmes' requirements where known.
4. Include realistic course codes and titles for each level/semester up to the student's current position (and one semester ahead if continuing).
5. Do NOT ask for transcript data. Use well-established public programme structures.

${PROFILE_SCHEMA_HINT}`;
}

function parseJsonFromText(text) {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

/** Offline fallback when AI is unavailable — still personalized to entered names. */
export function buildFallbackAcademicProfile(params) {
  const levels = [100, 200, 300, 400];
  const curriculum = {};
  const programLabel = params.programName || 'Programme';

  levels.forEach((level) => {
    curriculum[level] = {
      1: [
        { code: `${level}-S1-C1`, name: `${programLabel} — Core course 1`, credits: 3, type: 'core' },
        { code: `${level}-S1-C2`, name: `${programLabel} — Core course 2`, credits: 3, type: 'core' },
        { code: `${level}-S1-C3`, name: `${programLabel} — Core course 3`, credits: 3, type: 'core' },
      ],
      2: [
        { code: `${level}-S2-C1`, name: `${programLabel} — Core course 4`, credits: 3, type: 'core' },
        { code: `${level}-S2-C2`, name: `${programLabel} — Core course 5`, credits: 3, type: 'core' },
      ],
    };
  });

  const ghanaGrades = [
    { letter: 'A', points: 4.0, min: 80, max: 100, label: 'Outstanding' },
    { letter: 'B+', points: 3.5, min: 75, max: 79, label: 'Very Good' },
    { letter: 'B', points: 3.0, min: 70, max: 74, label: 'Good' },
    { letter: 'C+', points: 2.5, min: 65, max: 69, label: 'Fairly Good' },
    { letter: 'C', points: 2.0, min: 60, max: 64, label: 'Average' },
    { letter: 'D+', points: 1.5, min: 55, max: 59, label: 'Below Average' },
    { letter: 'D', points: 1.0, min: 50, max: 54, label: 'Marginal Pass' },
    { letter: 'E', points: 0.5, min: 45, max: 49, label: 'Unsatisfactory' },
    { letter: 'F', points: 0, min: 0, max: 44, label: 'Fail' },
  ];

  const usGrades = [
    { letter: 'A', points: 4.0, min: 90, max: 100, label: 'Excellent' },
    { letter: 'B', points: 3.0, min: 80, max: 89, label: 'Good' },
    { letter: 'C', points: 2.0, min: 70, max: 79, label: 'Average' },
    { letter: 'D', points: 1.0, min: 60, max: 69, label: 'Pass' },
    { letter: 'F', points: 0, min: 0, max: 59, label: 'Fail' },
  ];

  const country = (params.country || '').toLowerCase();
  const grades = country.includes('ghana') ? ghanaGrades : usGrades;

  return normalizeAcademicProfile(
    {
      source: 'fallback',
      institutionName: params.universityName,
      programName: params.programName,
      departmentName: params.departmentName,
      gradingScale: { label: `${params.country || 'Generic'} grading (estimated)`, grades },
      programStructure: { durationYears: 4, levels, semestersPerYear: 2 },
      curriculum,
      adaptationNotes: 'Profile estimated offline. Connect AI for a precise programme map.',
    },
    params,
  );
}

async function callAcademicProfileEdge(params) {
  if (!isCloudEnabled() || !supabase) return null;
  const { data, error } = await supabase.functions.invoke('academic-profile', {
    body: { params },
  });
  if (error) return null;
  return data?.profile ?? null;
}

async function callAcademicProfileDeepSeek(params) {
  const text = await callDeepSeek(
    [{ role: 'user', content: buildLearnPrompt(params) }],
    'You output only valid JSON academic profile data for student onboarding. No prose outside JSON.',
    4096,
  );
  const parsed = parseJsonFromText(text);
  if (!parsed) return null;
  return normalizeAcademicProfile({ ...parsed, source: 'ai' }, params);
}

async function callAcademicProfileDirect(params) {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: 'You output only valid JSON academic profile data for student onboarding. No prose outside JSON.',
        messages: [{ role: 'user', content: buildLearnPrompt(params) }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.content?.[0]?.text ?? '';
    const parsed = parseJsonFromText(text);
    if (!parsed) return null;
    return normalizeAcademicProfile({ ...parsed, source: 'ai' }, params);
  } catch {
    return null;
  }
}

/**
 * AI learns university/programme structure from key parameters entered by the user.
 */
export async function learnAcademicProfile(params) {
  const edgeProfile = await callAcademicProfileEdge(params);
  if (edgeProfile) {
    return normalizeAcademicProfile(edgeProfile, params);
  }

  const deepseekProfile = await callAcademicProfileDeepSeek(params);
  if (deepseekProfile) return deepseekProfile;

  const directProfile = await callAcademicProfileDirect(params);
  if (directProfile) return directProfile;

  return buildFallbackAcademicProfile(params);
}
