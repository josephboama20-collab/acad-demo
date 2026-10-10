/**
 * Meta-search helpers (SearxNG) - site-limited query building and token estimates.
 * Server-side fetch lives in supabase/functions/_shared/searxng.ts (keep logic in sync).
 */

const INSTITUTION_DOMAINS = [
  {
    match: (uni) => {
      const n = normalizeText(uni);
      return n.includes('university of ghana') || n === 'ug' || n.startsWith('ug ');
    },
    domains: ['ug.edu.gh', 'balme.ug.edu.gh'],
  },
  {
    match: (uni) => normalizeText(uni).includes('kwame nkrumah'),
    domains: ['knust.edu.gh'],
  },
  {
    match: (uni) => normalizeText(uni).includes('university of cape coast'),
    domains: ['ucc.edu.gh'],
  },
];

const COUNTRY_FALLBACK_DOMAINS = {
  ghana: ['ug.edu.gh'],
};

function normalizeText(value) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function getInstitutionSearchDomains(params) {
  const universityName = String(params.universityName ?? '');
  const country = normalizeText(String(params.country ?? ''));

  for (const entry of INSTITUTION_DOMAINS) {
    if (entry.match(universityName, country)) return [...entry.domains];
  }

  if (country && COUNTRY_FALLBACK_DOMAINS[country]) {
    return [...COUNTRY_FALLBACK_DOMAINS[country]];
  }

  return [];
}

export function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

export function buildSiteLimitedQuery(baseQuery, sites) {
  const trimmed = baseQuery.trim();
  if (!sites?.length) return trimmed;
  const siteClause = sites.map((s) => `site:${s}`).join(' OR ');
  return `${trimmed} (${siteClause})`;
}

export function buildAcademicProfileQuery(params) {
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

export function formatSearchContext(results, { maxResults = 5, maxSnippetChars = 200 } = {}) {
  if (!results?.length) return '';

  const lines = results.slice(0, maxResults).map((r, i) => {
    const snippet = (r.content || '')
      .slice(0, maxSnippetChars)
      .replace(/\s+/g, ' ')
      .trim();
    return `[${i + 1}] ${r.title}\nURL: ${r.url}${snippet ? `\n${snippet}` : ''}`;
  });

  return `Official web sources (use these snippets - do not invent course codes beyond them):\n\n${lines.join('\n\n')}`;
}

export function estimateSearchTokenSavings({ basePrompt, searchContext, aiWebSearchOverhead = 2500 }) {
  const withoutSearxng = estimateTokens(basePrompt);
  const withSearxng = estimateTokens(`${basePrompt}\n\n${searchContext}`);
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

/** Fetch from a SearxNG instance (Node / test script). */
export async function searchSearxNG(baseUrl, query, { limit = 5, language = 'en', timeoutMs = 8000 } = {}) {
  if (!baseUrl?.trim() || !query?.trim()) return [];

  const url = new URL(`${baseUrl.replace(/\/+$/, '')}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('categories', 'general');
  url.searchParams.set('language', language);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`SearxNG HTTP ${res.status}`);

    const data = await res.json();
    const raw = Array.isArray(data?.results) ? data.results : [];

    return raw.slice(0, limit).map((r) => ({
      title: String(r.title ?? ''),
      url: String(r.url ?? ''),
      content: String(r.content ?? r.snippet ?? ''),
    }));
  } finally {
    clearTimeout(timer);
  }
}
