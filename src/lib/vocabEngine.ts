/**
 * Ingress Within - Emotional Vocabulary Intelligence Engine
 * Deterministic Vocabulary Extraction Utility (v3.0)
 */

export const STOP_WORDS = new Set([
  // Articles
  'a', 'an', 'the',
  // Pronouns
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was',
  'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
  // Prepositions & Conjunctions
  'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against',
  'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
  'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'd', 'll', 'm', 'o',
  're', 've', 'y', 'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven', 'isn', 'ma', 'mightn', 'mustn',
  'needn', 'shan', 'shouldn', 'wasn', 'weren', 'won', 'wouldn',
  // Fillers & Conversational Words
  'really', 'very', 'just', 'maybe', 'actually', 'basically', 'literally', 'like', 'get', 'got', 'go', 'going',
  'thing', 'things', 'someone', 'something', 'anything', 'nothing', 'everyone', 'everything', 'somewhere', 'anywhere',
  'everywhere', 'nowhere', 'somehow', 'anyhow', 'etc', 'hey', 'hi', 'hello', 'yes', 'no', 'yeah', 'okay', 'ok',
  'well', 'back', 'much', 'many', 'lot', 'lots', 'feel', 'feeling', 'feelings', 'felt', 'think', 'thinking', 'thought',
  'thoughts', 'know', 'knowing', 'knew', 'want', 'wanting', 'wanted', 'make', 'making', 'made', 'take', 'taking', 'took',
  'even', 'still', 'also', 'another', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'always', 'never', 'sometimes', 'often', 'usually', 'feels', 'say', 'saying', 'said', 'tells', 'tell', 'told', 'today',
  'yesterday', 'tomorrow', 'day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years', 'people', 'person', 'someone'
]);

export const LEMMA_EXCEPTIONS: Record<string, string> = {
  'felt': 'feel',
  'thought': 'think',
  'wrote': 'write',
  'written': 'write',
  'crying': 'cry',
  'cried': 'cry',
  'worried': 'worry',
  'worries': 'worry',
  'worrying': 'worry',
  'anxieties': 'anxiety',
  'expectations': 'expectation',
  'sadness': 'sadness',
  'sadnesses': 'sadness',
  'happiness': 'happiness',
  'stressed': 'stress',
  'stresses': 'stress',
  'stressful': 'stress',
  'pressures': 'pressure',
  'pressured': 'pressure',
  'overwhelmed': 'overwhelm',
  'overwhelming': 'overwhelm',
  'burdens': 'burden',
  'burdened': 'burden',
  'angry': 'angry',
  'angrier': 'angry',
  'angriest': 'angry',
  'scared': 'scare',
  'scaring': 'scare',
  'lonely': 'lonely',
  'loneliness': 'loneliness',
  'guilty': 'guilt',
  'guilt': 'guilt',
  'frustrated': 'frustrate',
  'frustration': 'frustration',
  'exhausted': 'exhaust',
  'exhausting': 'exhaust'
};

/**
 * Normalizes and lemmatizes a word.
 */
export function lemmatize(w: string): string {
  let word = w.toLowerCase().trim();
  
  // Strip leading/trailing non-alphabetic characters
  word = word.replace(/^[^a-z]+|[^a-z]+$/g, '');
  
  if (word.length <= 2) return word;
  if (LEMMA_EXCEPTIONS[word]) return LEMMA_EXCEPTIONS[word];

  // Plurals and verbs suffixes rules
  if (word.endsWith('ying')) {
    return word.slice(0, -4) + 'y';
  }
  if (word.endsWith('ied')) {
    return word.slice(0, -3) + 'y';
  }
  if (word.endsWith('ies')) {
    return word.slice(0, -3) + 'y';
  }

  if (word.endsWith('ing')) {
    const stem = word.slice(0, -3);
    if (stem.length > 2) {
      if (stem.match(/([^aeiou])\1$/)) {
        return stem.slice(0, -1);
      }
      if (['te', 've', 'se', 'ke', 'me', 'ne', 'pe', 're', 'le', 'ce', 'de'].some(suffix => (stem + 'e').endsWith(suffix))) {
        return stem + 'e';
      }
      return stem;
    }
  }

  if (word.endsWith('ed')) {
    const stem = word.slice(0, -2);
    if (stem.length > 2) {
      if (stem.endsWith('e')) return stem;
      if (stem.match(/([^aeiou])\1$/)) {
        return stem.slice(0, -1);
      }
      if (['t', 'v', 's', 'k', 'm', 'n', 'p', 'r', 'l', 'c', 'd'].includes(stem[stem.length - 1])) {
        return stem + 'e';
      }
      return stem;
    }
  }

  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('is') && !word.endsWith('us') && !word.endsWith('as')) {
    if (word.endsWith('es')) {
      if (word.endsWith('sses') || word.endsWith('shes') || word.endsWith('ches') || word.endsWith('xes')) {
        return word.slice(0, -2);
      }
      return word.slice(0, -1);
    }
    return word.slice(0, -1);
  }

  return word;
}

/**
 * Extracts vocabulary words and logs ignored and raw words.
 */
export function extractVocabularyDeterministic(text: string): {
  rawWords: string[];
  ignoredWords: string[];
  extracted: { word: string; normalized_word: string }[];
} {
  const cleanedText = text
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/[^a-zA-Z'\s-]/g, ' ');

  const tokens = cleanedText.split(/\s+/).filter(Boolean);
  
  const rawWords: string[] = [];
  const ignoredWords: string[] = [];
  const extractedMap = new Map<string, string>(); // normalized_word -> original_word

  for (const token of tokens) {
    const rawWord = token.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
    if (!rawWord) continue;
    
    rawWords.push(rawWord);
    
    if (rawWord.length < 3) {
      ignoredWords.push(rawWord);
      continue;
    }

    // Ignore numbers
    if (/^\d+$/.test(rawWord)) {
      ignoredWords.push(rawWord);
      continue;
    }

    const normalized = lemmatize(rawWord);
    
    if (!normalized || normalized.length < 3) {
      ignoredWords.push(rawWord);
      continue;
    }

    if (STOP_WORDS.has(rawWord.toLowerCase()) || STOP_WORDS.has(normalized)) {
      ignoredWords.push(rawWord);
      continue;
    }

    // Deduplicate (first occurrence wins for display form)
    if (!extractedMap.has(normalized)) {
      extractedMap.set(normalized, rawWord);
    }
  }

  const extracted = Array.from(extractedMap.entries()).map(([norm, orig]) => ({
    word: orig,
    normalized_word: norm
  }));

  return {
    rawWords,
    ignoredWords,
    extracted
  };
}
