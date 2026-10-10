/**
 * Curated suggestions for fast, correctly-capitalized onboarding entry.
 * These power the university/programme autocomplete datalists. Users can still
 * type any value - these just make common entries one tap away and improve
 * AI mapping accuracy (proper official names).
 */

export const KNOWN_UNIVERSITIES = [
  'University of Ghana',
  'Kwame Nkrumah University of Science and Technology',
  'University of Cape Coast',
  'University of Education, Winneba',
  'University for Development Studies',
  'University of Professional Studies, Accra',
  'Ghana Institute of Management and Public Administration',
  'Ashesi University',
  'Central University',
  'Ghana Communication Technology University',
  'University of Mines and Technology',
  'Ho Technical University',
  'Accra Technical University',
  'Kumasi Technical University',
  'University of Lagos',
  'University of Ibadan',
  'Covenant University',
  'University of Nairobi',
  'University of Cape Town',
  'University of Oxford',
  'University of Cambridge',
  'Massachusetts Institute of Technology',
  'Harvard University',
];

export const COMMON_PROGRAMMES = [
  'BSc Computer Science',
  'BSc Information Technology',
  'BSc Computer Engineering',
  'BSc Electrical and Electronic Engineering',
  'BSc Mechanical Engineering',
  'BSc Civil Engineering',
  'BSc Biomedical Engineering',
  'BSc Mathematics',
  'BSc Statistics',
  'BSc Physics',
  'BSc Chemistry',
  'BSc Biological Sciences',
  'BSc Biochemistry',
  'BSc Nursing',
  'BSc Economics',
  'BSc Business Administration',
  'BSc Accounting',
  'BSc Banking and Finance',
  'BSc Actuarial Science',
  'BSc Agriculture',
  'BSc Psychology',
  'BA Economics',
  'BA Political Science',
  'BA Sociology',
  'BA English',
  'BA Information Studies',
  'LLB Law',
  'Doctor of Pharmacy (PharmD)',
  'Bachelor of Medicine, Bachelor of Surgery (MBChB)',
];

const UG_PROGRAMMES = [
  'BSc Computer Science',
  'BSc Information Technology',
  'BSc Mathematics',
  'BSc Statistics',
  'BSc Economics',
  'BSc Business Administration',
  'BSc Accounting',
  'LLB Law',
  'Bachelor of Medicine, Bachelor of Surgery (MBChB)',
];

const KNUST_PROGRAMMES = [
  'BSc Computer Science',
  'BSc Computer Engineering',
  'BSc Electrical and Electronic Engineering',
  'BSc Mechanical Engineering',
  'BSc Civil Engineering',
  'BSc Architecture',
  'BSc Biomedical Engineering',
  'BSc Agriculture',
];

function normalizeUni(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Programme list tailored to the selected university when known. */
export function getProgrammeSuggestions(universityName) {
  const uni = normalizeUni(universityName);
  if (uni.includes('university of ghana') || uni === 'ug') return UG_PROGRAMMES;
  if (uni.includes('kwame nkrumah') || uni.includes('knust')) return KNUST_PROGRAMMES;
  return COMMON_PROGRAMMES;
}

/** Top quick-pick chips shown before the user types. */
export function getProgrammeQuickPicks(universityName, max = 4) {
  return getProgrammeSuggestions(universityName).slice(0, max);
}
