/**
 * AI-curated external learning resources per topic and course.
 */
const RESOURCE_BANK = {
  'Cell Biology': [
    { title: 'Khan Academy Cell structure', url: 'https://www.khanacademy.org/science/biology/structure-of-a-cell', type: 'Video series', provider: 'Khan Academy' },
    { title: 'OpenStax Biology Ch. 4 Cells', url: 'https://openstax.org/books/biology-2e/pages/4-introduction', type: 'Textbook', provider: 'OpenStax' },
    { title: 'MIT OCW Intro to Biology', url: 'https://ocw.mit.edu/courses/7-01sc-fundamentals-of-biology-fall-2011/', type: 'Course', provider: 'MIT OpenCourseWare' },
  ],
  Genetics: [
    { title: 'Khan Academy Heredity', url: 'https://www.khanacademy.org/science/biology/classical-genetics', type: 'Video series', provider: 'Khan Academy' },
    { title: 'Nature Scitable Genetics', url: 'https://www.nature.com/scitable/topic/genetics-5/', type: 'Articles', provider: 'Nature' },
    { title: 'Coursera Introduction to Genetics', url: 'https://www.coursera.org/learn/genetics-evolution', type: 'Course', provider: 'Coursera' },
  ],
  Derivatives: [
    { title: 'Khan Academy Differential Calculus', url: 'https://www.khanacademy.org/math/calculus-1/cs1-derivatives-definition-and-basic-rules', type: 'Video series', provider: 'Khan Academy' },
    { title: 'Paul\'s Online Math Notes Derivatives', url: 'https://tutorial.math.lamar.edu/classes/calci/derivativesintro.aspx', type: 'Notes', provider: 'Paul Dawkins' },
    { title: '3Blue1Brown Essence of Calculus', url: 'https://www.3blue1brown.com/topics/calculus', type: 'Visual explainer', provider: '3Blue1Brown' },
  ],
  Integrals: [
    { title: 'Khan Academy Integral Calculus', url: 'https://www.khanacademy.org/math/calculus-2/cs2-integration-techniques', type: 'Video series', provider: 'Khan Academy' },
    { title: 'Paul\'s Online Math Notes Integrals', url: 'https://tutorial.math.lamar.edu/classes/calci/integralsintro.aspx', type: 'Notes', provider: 'Paul Dawkins' },
    { title: 'MIT OCW Single Variable Calculus', url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/', type: 'Course', provider: 'MIT OpenCourseWare' },
  ],
};

function defaultResources(topicName, courseCode) {
  const q = encodeURIComponent(`${courseCode} ${topicName} study guide`);
  return [
    { title: `${topicName} OpenStax search`, url: `https://openstax.org/search?q=${q}`, type: 'Textbook', provider: 'OpenStax' },
    { title: `${topicName} Khan Academy`, url: `https://www.khanacademy.org/search?page_search_query=${q}`, type: 'Video series', provider: 'Khan Academy' },
    { title: `${topicName} MIT OCW`, url: `https://ocw.mit.edu/search/?q=${q}`, type: 'Course', provider: 'MIT OpenCourseWare' },
  ];
}

export function getLearningResources(topicName, courseCode) {
  return RESOURCE_BANK[topicName] || defaultResources(topicName, courseCode);
}
