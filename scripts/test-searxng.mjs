/**
 * Tests SearxNG meta-search library — query building, context compression, token savings.
 * Run: node scripts/test-searxng.mjs
 * Live search (optional): SEARXNG_BASE_URL=https://searx.be node scripts/test-searxng.mjs
 */
import {
  buildAcademicProfileQuery,
  buildSiteLimitedQuery,
  estimateSearchTokenSavings,
  estimateTokens,
  formatSearchContext,
  getInstitutionSearchDomains,
  searchSearxNG,
} from '../src/utils/metaSearch.js';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed += 1;
  } else {
    failed += 1;
    console.error('FAIL:', msg);
  }
}

const ugParams = {
  universityName: 'University of Ghana',
  programName: 'BSc Computer Science',
  country: 'Ghana',
};

// --- Unit tests (no network) ---

const ugSites = getInstitutionSearchDomains(ugParams);
assert(ugSites.includes('ug.edu.gh'), 'UG maps to ug.edu.gh');
assert(ugSites.includes('balme.ug.edu.gh'), 'UG maps to balme.ug.edu.gh');

const limited = buildSiteLimitedQuery('BSc Computer Science curriculum', ugSites);
assert(limited.includes('site:ug.edu.gh'), 'site limit includes ug.edu.gh');
assert(limited.includes(' OR site:balme.ug.edu.gh'), 'site limit OR-joins domains');

const { query, sites } = buildAcademicProfileQuery(ugParams);
assert(sites.length === 2, 'academic query returns 2 UG sites');
assert(query.includes('course codes'), 'query mentions course codes');
assert(query.includes('site:ug.edu.gh'), 'academic query is site-limited');

const mockResults = [
  {
    title: 'BSc Computer Science Handbook',
    url: 'https://balme.ug.edu.gh/handbook/cs',
    content: 'CSCD 101 Introduction to Computer Science I. CSCD 102 Introduction to Computer Science II.',
  },
  {
    title: 'College of Basic and Applied Sciences',
    url: 'https://ug.edu.gh/academics',
    content: 'Undergraduate programmes include Computer Science with core CSCD courses.',
  },
];

const context = formatSearchContext(mockResults);
assert(context.includes('CSCD 101'), 'context includes course code from snippet');
assert(context.includes('balme.ug.edu.gh'), 'context includes source URL');
assert(estimateTokens(context) < 200, 'compressed context stays under ~200 tokens');

const basePrompt = `You are Acad's academic intelligence engine. Build a structured academic profile from the student parameters and any provided web snippets.

Student parameters:
- University: ${ugParams.universityName}
- Programme: ${ugParams.programName}
- Country/region: ${ugParams.country}
- Structure: Single major
- Journey: Just starting Level 100 Semester 1

Infer grading scale, semester structure, and core courses per level/semester.
University of Ghana rules: BSc Computer Science uses CSCD prefix. Use UGRC for general requirements.
Return ONLY valid JSON academic profile data with institutionName, programName, gradingScale, programStructure, curriculum, adaptationNotes.`;

const savings = estimateSearchTokenSavings({ basePrompt, searchContext: context });
assert(savings.withAiWebSearch > savings.withSearxng, 'SearxNG uses fewer tokens than AI web search');
assert(savings.tokensSavedVsAiWebSearch > 500, 'saves at least 500 tokens vs AI web search');
assert(savings.percentSavedVsAiWebSearch > 50, 'saves more than 50% vs AI web search');

console.log('\n--- Token savings estimate (BSc CS @ UG) ---');
console.log(`  Pure LLM prompt (no web):     ~${savings.withoutSearxng} input tokens`);
console.log(`  AI native web-search tool:    ~${savings.withAiWebSearch} input tokens (+ tool fees)`);
console.log(`  SearxNG + grounded prompt:    ~${savings.withSearxng} input tokens`);
console.log(`  Estimated savings:            ~${savings.tokensSavedVsAiWebSearch} tokens (${savings.percentSavedVsAiWebSearch}%) per profile learn`);

// --- Optional live SearxNG test ---
const baseUrl = process.env.SEARXNG_BASE_URL?.trim();

if (baseUrl) {
  console.log(`\n--- Live SearxNG test (${baseUrl}) ---`);
  try {
    const liveResults = await searchSearxNG(baseUrl, query, { limit: 3 });
    assert(liveResults.length > 0, 'live search returns results');
    if (liveResults.length) {
      console.log(`  Found ${liveResults.length} result(s). First: ${liveResults[0].title}`);
      console.log(`  URL: ${liveResults[0].url}`);
      const liveContext = formatSearchContext(liveResults);
      const liveSavings = estimateSearchTokenSavings({ basePrompt, searchContext: liveContext });
      console.log(`  Live context: ~${estimateTokens(liveContext)} tokens`);
      console.log(`  Live savings vs AI web search: ~${liveSavings.tokensSavedVsAiWebSearch} tokens (${liveSavings.percentSavedVsAiWebSearch}%)`);
    }
  } catch (e) {
    console.warn(`  Live search unavailable (${e.message}) — unit tests still validate library logic.`);
    console.warn('  Deploy your own SearxNG instance and set SEARXNG_BASE_URL in Supabase secrets.');
  }
} else {
  console.log('\n--- Live SearxNG test skipped (set SEARXNG_BASE_URL to run) ---');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
