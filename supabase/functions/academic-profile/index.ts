import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callOpenAI, getOpenAIApiKey } from '../_shared/openai.ts';
import { searchForAcademicProfile } from '../_shared/searxng.ts';
import {
  buildProfileFromCatalogue,
  findCatalogueMatch,
  mergeCatalogueWithAi,
  PROMPT_RULES_UG,
} from '../_shared/ugCatalogue.ts';

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

function buildLearnPrompt(params: Record<string, unknown>, searchContext = '') {
  const universityName = params.universityName ?? '';
  const programName = params.programName ?? '';
  const country = params.country ?? 'not specified';
  const trackType = params.trackType ?? 'Single major';
  const secondaryProgram = params.secondaryProgram ?? '';
  const studentPath = params.studentPath === 'new' ? 'Just starting Level 100 Semester 1' : `Continuing at Level ${params.currentLevel} Semester ${params.currentSemester}`;
  const departmentName = params.departmentName ?? '';
  const ghanaRules = String(country).toLowerCase().includes('ghana') ? `\n\n${PROMPT_RULES_UG}` : '';
  const groundedBlock = searchContext
    ? `\n\n${searchContext}\n\nUse ONLY the snippets above for course codes and titles. If a detail is missing, omit it rather than guessing.`
    : '\n\nNo web snippets available — infer from well-established public programme knowledge only. Do not invent course codes.';

  return `You are Acad's academic intelligence engine. Build a structured academic profile from the student parameters and any provided web snippets.

Student parameters:
- University: ${universityName}
- Programme: ${programName}
${departmentName ? `- Department/Faculty: ${departmentName}` : ''}
- Country/region: ${country}
- Structure: ${trackType}${secondaryProgram ? ` (combined with ${secondaryProgram})` : ''}
- Journey: ${studentPath}
${groundedBlock}

Infer grading scale, semester structure, and core courses per level/semester.${ghanaRules}

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

    const { params } = await req.json();
    const learnParams = params || {};

    const catalogueMatch = findCatalogueMatch(learnParams);
    if (catalogueMatch) {
      const catalogueBase = buildProfileFromCatalogue(learnParams, catalogueMatch);
      const needsAiMerge = learnParams.trackType === 'Combined major' && learnParams.secondaryProgram;

      if (!needsAiMerge) {
        return new Response(JSON.stringify({ profile: catalogueBase }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const openaiKey = getOpenAIApiKey();
    if (!openaiKey) {
      if (catalogueMatch) {
        const catalogueBase = buildProfileFromCatalogue(learnParams, catalogueMatch);
        return new Response(JSON.stringify({ profile: catalogueBase }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 503, headers: corsHeaders });
    }

    const needsWebGrounding = !catalogueMatch;
    const { context: searchContext, meta: searchMeta } = needsWebGrounding
      ? await searchForAcademicProfile(learnParams)
      : { context: '', meta: { searchUsed: false, resultCount: 0, query: '', sites: [], contextChars: 0, estimatedContextTokens: 0, estimatedTokensSaved: 0 } };

    const prompt = buildLearnPrompt(learnParams, searchContext);
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
      if (catalogueMatch) {
        const catalogueBase = buildProfileFromCatalogue(learnParams, catalogueMatch);
        return new Response(JSON.stringify({ profile: catalogueBase, meta: { search: searchMeta } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI request failed', detail: error, meta: { search: searchMeta } }), {
        status: 502,
        headers: corsHeaders,
      });
    }

    const aiProfile = parseJsonFromText(text);
    if (!aiProfile) {
      if (catalogueMatch) {
        const catalogueBase = buildProfileFromCatalogue(learnParams, catalogueMatch);
        return new Response(JSON.stringify({ profile: catalogueBase, meta: { search: searchMeta } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Could not parse AI profile', meta: { search: searchMeta } }), { status: 502, headers: corsHeaders });
    }

    if (catalogueMatch) {
      const catalogueBase = buildProfileFromCatalogue(learnParams, catalogueMatch);
      const merged = mergeCatalogueWithAi(catalogueBase, { ...aiProfile, source: 'catalogue' });
      return new Response(JSON.stringify({ profile: merged, meta: { search: searchMeta } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ profile: { ...aiProfile, source: 'ai' }, meta: { search: searchMeta } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
