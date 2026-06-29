/**
 * Ingress Within - Refined Emotional Vocabulary Intelligence Engine
 * Multi-stage text normalization, lemmatization and scoring utilities (v4.0)
 */

export const STOP_WORDS = new Set([
  // Articles
  'a', 'an', 'the',

  // Pronouns
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',

  // Helper Verbs & Modals
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
  'can', 'will', 'should', 'could', 'would', 'may', 'might', 'must', 'shall', 'cannot', 'don', 'ain', 'aren',
  'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven', 'isn', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren', 'won', 'wouldn',

  // Prepositions & Conjunctions
  'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against',
  'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
  'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y',

  // Generic Action Verbs (lexical noise)
  'go', 'went', 'goes', 'going', 'gone', 'get', 'gets', 'got', 'gotten', 'getting',
  'make', 'makes', 'made', 'making', 'take', 'takes', 'took', 'taken', 'taking',
  'use', 'uses', 'used', 'using', 'come', 'comes', 'came', 'coming',
  'run', 'runs', 'ran', 'running', 'work', 'works', 'worked', 'working',
  'try', 'tries', 'tried', 'trying', 'start', 'starts', 'started', 'starting',
  'stop', 'stops', 'stopped', 'stopping', 'seem', 'seems', 'seemed', 'seeming',
  'show', 'shows', 'showed', 'showing', 'find', 'finds', 'found', 'finding',
  'keep', 'keeps', 'kept', 'keeping', 'let', 'lets', 'letting',
  'put', 'puts', 'putting', 'bring', 'brings', 'brought', 'bringing',
  'carry', 'carries', 'carried', 'carrying', 'tell', 'tells', 'told', 'telling',
  'say', 'says', 'said', 'saying', 'think', 'thinks', 'thought', 'thinking',
  'know', 'knows', 'knew', 'knowing', 'want', 'wants', 'wanted', 'wanting',
  'look', 'looks', 'looked', 'looking', 'write', 'writes', 'wrote', 'written', 'writing',
  'feel', 'feels', 'felt', 'feeling', 'feelings',

  // Temporal & Frequency Words
  'today', 'yesterday', 'tomorrow', 'day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years',
  'time', 'times', 'now', 'then', 'always', 'never', 'sometimes', 'often', 'usually', 'seldom', 'rarely',
  'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'morning', 'afternoon', 'evening', 'night', 'nights',
  'hour', 'hours', 'minute', 'minutes', 'second', 'seconds', 'moment', 'moments', 'soon', 'later', 'early',
  'late', 'recently', 'first', 'second', 'last', 'past', 'future', 'present', 'ago', 'already', 'yet', 'still',
  'since', 'during', 'before', 'after', 'until', 'date', 'dates', 'clock', 'schedule',

  // Filler & Conversational Words
  'really', 'very', 'just', 'maybe', 'actually', 'basically', 'literally', 'like', 'probably', 'perhaps',
  'quite', 'rather', 'somewhat', 'somehow', 'well', 'back', 'much', 'many', 'lot', 'lots',
  'stuff', 'thing', 'things', 'someone', 'something', 'anything', 'nothing', 'everyone', 'everything',
  'somewhere', 'anywhere', 'everywhere', 'nowhere', 'hey', 'hi', 'hello', 'yes', 'no', 'yeah', 'okay', 'ok',
  'right', 'sure', 'mean', 'means', 'meant', 'meaning', 'people', 'person'
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

// Canonical emotional lemma merging map
export const EMOTIONAL_LEMMA_MAP: Record<string, string> = {
  // focus
  'focusing': 'focus',
  'focused': 'focus',
  'focuses': 'focus',
  // confident / confidence
  'confidence': 'confident',
  'confidently': 'confident',
  // anxious / anxiety
  'anxiety': 'anxious',
  'anxieties': 'anxious',
  'anxiously': 'anxious',
  // stress
  'stressed': 'stress',
  'stresses': 'stress',
  'stressful': 'stress',
  'stressing': 'stress',
  // sadness / sad
  'sadness': 'sad',
  'sadnesses': 'sad',
  'sadly': 'sad',
  'sadder': 'sad',
  'saddest': 'sad',
  // happiness / happy
  'happiness': 'happy',
  'happily': 'happy',
  'happier': 'happy',
  'happiest': 'happy',
  // loneliness / lonely
  'loneliness': 'lonely',
  'lonelily': 'lonely',
  // guilt / guilty
  'guilt': 'guilty',
  'guiltiness': 'guilty',
  'guiltily': 'guilty',
  // anger / angry
  'anger': 'angry',
  'angrier': 'angry',
  'angriest': 'angry',
  'angrily': 'angry',
  // fear / scared
  'fearful': 'fear',
  'fears': 'fear',
  'scared': 'scare',
  'scaring': 'scare',
  'scary': 'scare',
  // frustration / frustrate
  'frustrated': 'frustrate',
  'frustrating': 'frustrate',
  'frustration': 'frustrate',
  'frustrations': 'frustrate',
  // exhaustion / exhaust
  'exhausted': 'exhaust',
  'exhausting': 'exhaust',
  'exhaustion': 'exhaust',
  // depletion / deplete
  'depleted': 'deplete',
  'depleting': 'deplete',
  'depletion': 'deplete',
  // avoidance / avoid
  'avoided': 'avoid',
  'avoiding': 'avoid',
  'avoidance': 'avoid',
  'avoids': 'avoid',
  // pressure
  'pressures': 'pressure',
  'pressured': 'pressure',
  'pressuring': 'pressure',
  // overwhelm
  'overwhelmed': 'overwhelm',
  'overwhelming': 'overwhelm',
  'overwhelmingly': 'overwhelm',
  'overwhelms': 'overwhelm',
  // burden
  'burdens': 'burden',
  'burdened': 'burden',
  'burdening': 'burden',
  'burdensome': 'burden',
  // uncertainty / uncertain
  'uncertainty': 'uncertain',
  'uncertainties': 'uncertain',
  // confusion / confused
  'confused': 'confuse',
  'confusing': 'confuse',
  'confusion': 'confuse',
  // pain
  'painful': 'pain',
  'painfully': 'pain',
  'pains': 'pain',
  // hope
  'hopeful': 'hope',
  'hopefully': 'hope',
  'hopefulness': 'hope',
  // hopeless
  'hopelessness': 'hopeless',
  'hopelessly': 'hopeless'
};

// Core psychological and emotional affect words for deterministic rule matches
export const DETERMINISTIC_EMOTIONAL_WORDS = new Set([
  'sad', 'unhappy', 'grief', 'cry', 'pain', 'hurt', 'sorrow', 'depressed', 'depression', 'blue', 'heavy',
  'happy', 'joy', 'cheerful', 'excited', 'content', 'peace', 'peaceful', 'calm', 'relaxed', 'relieved', 'gratitude', 'grateful',
  'angry', 'rage', 'mad', 'furious', 'irritated', 'annoyed', 'frustrate', 'bitter', 'resent', 'resentful',
  'fear', 'anxious', 'worry', 'panic', 'dread', 'terrified', 'frightened', 'nervous',
  'shame', 'ashamed', 'guilty', 'embarrassed', 'regret', 'remorse',
  'lonely', 'isolated', 'abandoned', 'alone', 'empty',
  'overwhelm', 'exhaust', 'tired', 'weary', 'drained', 'depleted', 'fatigue', 'burden', 'pressure', 'stress', 'tense',
  'confuse', 'uncertain', 'doubt', 'lost', 'stuck', 'blocked', 'trapped', 'hopeless', 'helpless', 'powerless', 'defeated',
  'avoid', 'numb', 'hiding', 'withdrawn', 'numbness', 'distracted', 'escape',
  'focus', 'clear', 'mindful', 'grounded', 'motivated', 'inspired', 'confident', 'worth', 'worthy',
  'longing', 'yearning', 'craving', 'need', 'desire'
]);

/**
 * Normalizes, lemmatizes and merges a word.
 */
export function lemmatize(w: string): string {
  let word = w.toLowerCase().trim();
  
  // Strip leading/trailing non-alphabetic characters
  word = word.replace(/^[^a-z]+|[^a-z]+$/g, '');
  
  if (word.length <= 2) return word;
  
  // 1. Apply baseline lemmatization exceptions
  if (LEMMA_EXCEPTIONS[word]) {
    word = LEMMA_EXCEPTIONS[word];
  } else {
    // Baseline suffix stripping rules
    if (word.endsWith('ying')) {
      word = word.slice(0, -4) + 'y';
    } else if (word.endsWith('ied')) {
      word = word.slice(0, -3) + 'y';
    } else if (word.endsWith('ies')) {
      word = word.slice(0, -3) + 'y';
    } else if (word.endsWith('ing')) {
      const stem = word.slice(0, -3);
      if (stem.length > 2) {
        if (stem.match(/([^aeiou])\1$/)) {
          word = stem.slice(0, -1);
        } else if (['te', 've', 'se', 'ke', 'me', 'ne', 'pe', 're', 'le', 'ce', 'de'].some(suffix => (stem + 'e').endsWith(suffix))) {
          word = stem + 'e';
        } else {
          word = stem;
        }
      }
    } else if (word.endsWith('ed')) {
      const stem = word.slice(0, -2);
      if (stem.length > 2) {
        if (stem.endsWith('e')) {
          word = stem;
        } else if (stem.match(/([^aeiou])\1$/)) {
          word = stem.slice(0, -1);
        } else if (['t', 'v', 's', 'k', 'm', 'n', 'p', 'r', 'l', 'c', 'd'].includes(stem[stem.length - 1])) {
          word = stem + 'e';
        } else {
          word = stem;
        }
      }
    } else if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('is') && !word.endsWith('us') && !word.endsWith('as')) {
      if (word.endsWith('es')) {
        if (word.endsWith('sses') || word.endsWith('shes') || word.endsWith('ches') || word.endsWith('xes')) {
          word = word.slice(0, -2);
        } else {
          word = word.slice(0, -1);
        }
      } else {
        word = word.slice(0, -1);
      }
    }
  }

  // 2. Collapse/Merge to canonical emotional lemma
  if (EMOTIONAL_LEMMA_MAP[word]) {
    return EMOTIONAL_LEMMA_MAP[word];
  }

  return word;
}

/**
 * Extracts candidate vocabulary words, ignoring stop words/lexical noise.
 * Returns raw words, ignored list, and extracted lemmas map.
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
  const extractedMap = new Map<string, { original: string; raws: string[] }>();

  for (const token of tokens) {
    const rawWord = token.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
    if (!rawWord) continue;
    
    rawWords.push(rawWord);
    
    if (rawWord.length < 3) {
      ignoredWords.push(rawWord);
      continue;
    }

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

    // Accumulate under merged normalized lemma
    const existing = extractedMap.get(normalized);
    if (existing) {
      existing.raws.push(rawWord);
    } else {
      extractedMap.set(normalized, { original: rawWord, raws: [rawWord] });
    }
  }

  const extracted = Array.from(extractedMap.entries()).map(([norm, val]) => ({
    word: val.original,
    normalized_word: norm,
    raw_tokens: Array.from(new Set(val.raws)) // unique raw tokens matching this lemma
  }));

  return {
    rawWords,
    ignoredWords,
    extracted
  };
}
