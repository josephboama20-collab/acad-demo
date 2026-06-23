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

function formatEdgeError(status, message, error) {
  if (status === 503) {
    return 'AI is not configured on the server (missing OpenAI key in Supabase secrets).';
  }
  if (status === 401) return 'Your session expired — sign in again and retry.';
  if (status === 502) return 'AI could not generate a valid programme profile. Try again in a moment.';
  const detail = error?.context?.body;
  if (typeof detail === 'string' && detail.includes('AI not configured')) {
    return 'AI is not configured on the server (missing OpenAI key in Supabase secrets).';
  }
  return message || 'Could not reach the AI service.';
}

/** Build learn params from a stored academic profile (Settings re-learn). */
export function buildLearnParamsFromProfile(academicProfile) {
  if (!academicProfile) return null;
  const trackType = academicProfile.trackType === 'combined' ? 'Combined major' : 'Single major';
  return {
    universityName: academicProfile.institutionName || '',
    programName: academicProfile.programName || '',
    departmentName: academicProfile.departmentName || null,
    country: academicProfile.country || '',
    trackType,
    secondaryProgram: academicProfile.secondaryProgram || null,
    studentPath: academicProfile.studentPath || 'continuing',
    currentLevel: academicProfile.currentLevel || 100,
    currentSemester: academicProfile.currentSemester || 1,
  };
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
  if (!isCloudEnabled() || !supabase) {
    return { profile: null, error: 'Cloud AI is not enabled in this build.', status: null };
  }

  const { data, error } = await supabase.functions.invoke('academic-profile', {
    body: { params },
  });

  if (error) {
    const status = error.context?.status ?? null;
    return { profile: null, error: formatEdgeError(status, error.message, error), status };
  }

  if (!data?.profile) {
    return { profile: null, error: data?.error || 'AI returned an empty profile.', status: 502 };
  }

  return { profile: data.profile, error: null, status: 200 };
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

function fallbackErrorMessage(edgeError, edgeStatus) {
  if (edgeStatus === 503 || edgeError?.includes('not configured')) {
    return `${edgeError} A basic estimated profile was created — review it, or re-learn from Settings once AI is connected.`;
  }
  if (edgeError) {
    return `${edgeError} A basic estimated profile was created — review and edit it on the next step.`;
  }
  return 'Could not reach AI. A basic profile was created — review and edit it on the next step.';
}

/**
 * AI learns university/programme structure from key parameters entered by the user.
 * @returns {{ profile, source: 'ai'|'fallback', error: string|null, status: number|null }}
 */
export async function learnAcademicProfile(params, { allowFallback = true } = {}) {
  const edge = await callAcademicProfileEdge(params);
  if (edge.profile) {
    return {
      profile: normalizeAcademicProfile(edge.profile, params),
      source: 'ai',
      error: null,
      status: edge.status,
    };
  }

  const deepseekProfile = await callAcademicProfileDeepSeek(params);
  if (deepseekProfile) {
    return { profile: deepseekProfile, source: 'ai', error: null, status: 200 };
  }

  const directProfile = await callAcademicProfileDirect(params);
  if (directProfile) {
    return { profile: directProfile, source: 'ai', error: null, status: 200 };
  }

  if (!allowFallback) {
    throw new Error(edge.error || 'AI is unavailable right now.');
  }

  return {
    profile: buildFallbackAcademicProfile(params),
    source: 'fallback',
    error: fallbackErrorMessage(edge.error, edge.status),
    status: edge.status,
  };
}

/** Human-readable progress hint for the onboarding AI step. */
export function getAiLearnProgressMessage(elapsedSeconds) {
  if (elapsedSeconds < 15) return 'Mapping your grading scale and programme structure…';
  if (elapsedSeconds < 45) return 'Still learning — this usually takes 30–60 seconds.';
  if (elapsedSeconds < 90) return 'Large programmes can take up to 90 seconds. Please wait…';
  return 'Taking longer than expected. You can keep waiting or tap Retry.';
}
