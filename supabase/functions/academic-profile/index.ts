import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callOpenAI, getOpenAIApiKey } from '../_shared/openai.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROFILE_MODEL = 'gpt-4.1-mini';

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
    "100": { "1": [{ "code": "CODE", "name": "Course title", "credits": 3, "type": "core" }] }
  },
  "adaptationNotes": "string"
}`;

function buildLearnPrompt(params: Record<string, unknown>) {
  const universityName = params.universityName ?? '';
  const programName = params.programName ?? '';
  const country = params.country ?? 'not specified';
  const trackType = params.trackType ?? 'Single major';
  const secondaryProgram = params.secondaryProgram ?? '';
  const studentPath = params.studentPath === 'new' ? 'Just starting Level 100 Semester 1' : `Continuing at Level ${params.currentLevel} Semester ${params.currentSemester}`;
  const departmentName = params.departmentName ?? '';

  return `You are Acad's academic intelligence engine. Infer the academic structure for this student from public programme knowledge.

Student parameters:
- University: ${universityName}
- Programme: ${programName}
${departmentName ? `- Department/Faculty: ${departmentName}` : ''}
- Country/region: ${country}
- Structure: ${trackType}${secondaryProgram ? ` (combined with ${secondaryProgram})` : ''}
- Journey: ${studentPath}

Infer grading scale, semester structure, and core courses per level/semester. Be accurate to known public curricula.

${PROFILE_SCHEMA_HINT}`;
}

function parseJsonFromText(text: string) {
  try {
    return JSON.parse(text.trim());
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const openaiKey = getOpenAIApiKey();
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 503, headers: corsHeaders });
    }

    const { params } = await req.json();
    const prompt = buildLearnPrompt(params || {});
    const system = 'You output only valid JSON academic profile data. No markdown fences or prose.';

    const { text, error } = await callOpenAI({
      apiKey: openaiKey,
      model: PROFILE_MODEL,
      maxTokens: 2048,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    });

    if (!text) {
      return new Response(JSON.stringify({ error: 'AI request failed', detail: error }), {
        status: 502,
        headers: corsHeaders,
      });
    }

    const profile = parseJsonFromText(text);
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Could not parse AI profile' }), { status: 502, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ profile: { ...profile, source: 'ai' } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
