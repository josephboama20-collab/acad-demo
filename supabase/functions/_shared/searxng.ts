/**
 * SearxNG meta-search library — fetches site-limited web snippets before LLM calls
 * to ground academic profile inference without expensive AI web-search tools.
 */

import { getInstitutionSearchDomains } from './searchDomains.ts';

export interface SearxResult {
  title: string;
  url: string;
  content: string;
}

export interface SearchMeta {
  searchUsed: boolean;
  resultCount: number;
  query: string;
  sites: string[];
  contextChars: number;
  estimatedContextTokens: number;
  estimatedTokensSaved: number;
}

const DEFAULT_MAX_RESULTS = 5;
const DEFAULT_MAX_SNIPPET_CHARS = 200;

/** Rough token estimate (OpenAI-style ~4 chars per token). */
export function estimateTokens(text: string): number {
  return Math.ceil((text || '').length / 4);
}

export function getSearxngBaseUrl(): string | undefined {
  const url = Deno.env.get('SEARXNG_BASE_URL')?.trim();
  return url ? url.replace(/\/+$/, '') : undefined;
}

/** Build a query with optional site: limits to target official sources. */
export function buildSiteLimitedQuery(baseQuery: string, sites: string[]): string {
  const trimmed = baseQuery.trim();
  if (!sites.length) return trimmed;
  const siteClause = sites.map((s) => `site:${s}`).join(' OR ');
  return `${trimmed} (${siteClause})`;
}

/** Build an academic-profile search query from onboarding params. */
export function buildAcademicProfileQuery(params: Record<string, unknown>): {
  query: string;
  sites: string[];
} {
  const universityName = String(params.universityName ?? '');
  const programName = String(params.programName ?? '');
  const secondaryProgram = String(params.secondaryProgram ?? '');
  const trackType = String(params.trackType ?? '');

  const sites = getInstitutionSearchDomains({
    universityName,
    country: String(params.country ?? ''),
  });

  const focusProgram =
    trackType === 'Combined major' && secondaryProgram ? secondaryProgram : programName;

  const baseQuery = [
    focusProgram,
    'curriculum',
    'course codes',
    'undergraduate handbook',
    universityName,
  ]
    .filter(Boolean)
    .join(' ');

  return { query: buildSiteLimitedQuery(baseQuery, sites), sites };
}

/** Compress SearxNG hits into a compact LLM context block. */
export function formatSearchContext(
  results: SearxResult[],
  { maxResults = DEFAULT_MAX_RESULTS, maxSnippetChars = DEFAULT_MAX_SNIPPET_CHARS } = {},
): string {
  if (!results.length) return '';

  const lines = results.slice(0, maxResults).map((r, i) => {
    const snippet = (r.content || '')
      .slice(0, maxSnippetChars)
      .replace(/\s+/g, ' ')
      .trim();
    return `[${i + 1}] ${r.title}\nURL: ${r.url}${snippet ? `\n${snippet}` : ''}`;
  });

  return `Official web sources (use these snippets — do not invent course codes beyond them):\n\n${lines.join('\n\n')}`;
}

/** Compare token cost: AI web-search tool vs SearxNG-grounded prompt. */
export function estimateSearchTokenSavings(params: {
  basePrompt: string;
  searchContext: string;
  /** Typical tokens returned by AI-native web search / browsing tools. */
  aiWebSearchOverhead?: number;
}): {
  withoutSearxng: number;
  withAiWebSearch: number;
  withSearxng: number;
  tokensSavedVsAiWebSearch: number;
  percentSavedVsAiWebSearch: number;
} {
  const aiWebSearchOverhead = params.aiWebSearchOverhead ?? 2500;
  const withoutSearxng = estimateTokens(params.basePrompt);
  const withSearxng = estimateTokens(`${params.basePrompt}\n\n${params.searchContext}`);
  const withAiWebSearch = withoutSearxng + aiWebSearchOverhead;

  const tokensSavedVsAiWebSearch = Math.max(0, withAiWebSearch - withSearxng);

  return {
    withoutSearxng,
    withAiWebSearch,
    withSearxng,
    tokensSavedVsAiWebSearch,
    percentSavedVsAiWebSearch:
      withAiWebSearch > 0
        ? Math.round((tokensSavedVsAiWebSearch / withAiWebSearch) * 100)
        : 0,
  };
}

/** Call SearxNG JSON API. Returns empty array when unavailable or on error. */
export async function searchSearxNG(
  query: string,
  { limit = DEFAULT_MAX_RESULTS, language = 'en' } = {},
): Promise<SearxResult[]> {
  const baseUrl = getSearxngBaseUrl();
  if (!baseUrl || !query.trim()) return [];

  const url = new URL(`${baseUrl}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('categories', 'general');
  url.searchParams.set('language', language);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) return [];

    const data = await res.json();
    const raw = Array.isArray(data?.results) ? data.results : [];

    return raw.slice(0, limit).map((r: Record<string, unknown>) => ({
      title: String(r.title ?? ''),
      url: String(r.url ?? ''),
      content: String(r.content ?? r.snippet ?? ''),
    }));
  } catch {
    return [];
  }
}

/** Run site-limited search for academic profile learning. */
export async function searchForAcademicProfile(
  params: Record<string, unknown>,
): Promise<{ context: string; meta: SearchMeta }> {
  const { query, sites } = buildAcademicProfileQuery(params);
  const results = await searchSearxNG(query);
  const context = formatSearchContext(results);

  const basePromptPlaceholder = buildBaselinePromptPlaceholder(params);
  const savings = estimateSearchTokenSavings({
    basePrompt: basePromptPlaceholder,
    searchContext: context,
  });

  return {
    context,
    meta: {
      searchUsed: Boolean(getSearxngBaseUrl()) && results.length > 0,
      resultCount: results.length,
      query,
      sites,
      contextChars: context.length,
      estimatedContextTokens: estimateTokens(context),
      estimatedTokensSaved: context ? savings.tokensSavedVsAiWebSearch : 0,
    },
  };
}

function buildBaselinePromptPlaceholder(params: Record<string, unknown>): string {
  return [
    'You are Acad academic intelligence engine.',
    'Build structured academic profile from student parameters.',
    String(params.universityName ?? ''),
    String(params.programName ?? ''),
    String(params.country ?? ''),
    'Infer grading scale semester structure core courses.',
    'Return valid JSON with curriculum course codes.',
  ].join(' ');
}
