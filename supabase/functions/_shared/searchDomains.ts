/** Institution → allowed search domains for site-limited SearxNG queries. */

function normalizeText(value: string) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const INSTITUTION_DOMAINS: Array<{
  match: (universityName: string, country: string) => boolean;
  domains: string[];
}> = [
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

const COUNTRY_FALLBACK_DOMAINS: Record<string, string[]> = {
  ghana: ['ug.edu.gh'],
};

export function getInstitutionSearchDomains(params: {
  universityName?: string;
  country?: string;
}): string[] {
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
