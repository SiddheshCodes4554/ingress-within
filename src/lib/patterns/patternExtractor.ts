import { supabase } from '../db';
import { aiProvider } from '../ai/factory';
import { decrypt } from '../encryption';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RawPatternCandidate {
  pattern_name: string;
  pattern_category: 'emotional' | 'linguistic' | 'behavioural' | 'relational';
  supporting_phrase: string;
  supporting_sentence: string;
  confidence: number; // 0.0–1.0
  reasoning: string;
}

export interface ExtractionResult {
  candidates: RawPatternCandidate[];
  provider: string;
  model: string;
  promptVersion: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONFIDENCE_PUBLISH_THRESHOLD = 0.65; // Only patterns above this go into snapshots
const EXTRACTOR_VERSION = '1.0';
const PROMPT_VERSION = '1.0';

// Canonical pattern names the system recognises.
// The AI may propose new names, but must map to these where applicable.
const KNOWN_PATTERNS = [
  'Avoidance',
  'Conflict aversion',
  'Low self-agency',
  'Emotional suppression',
  'Saying "fine"',
  'Calling it "overthinking"',
  'Perfectionism as deflection',
  'People pleasing',
  'Externalising blame',
  'Catastrophising',
  'Minimising feelings',
  'Rumination',
  'Hypervigilance to others',
  'Self-criticism',
  'Emotional numbing',
];

// ─── Extractor ────────────────────────────────────────────────────────────────

/**
 * Extracts pattern candidates from a single journal entry or source text.
 * Called only from the patternWorker — never from API GET routes.
 *
 * AI may infer candidates, but each must be grounded in the actual text.
 * The confidence threshold filters weak/speculative patterns.
 */
export async function extractPatternsFromEntry(options: {
  entryText: string;
  userId: string;
  cycleId: string;
  entryId: string;
  sourceType: 'journal' | 'thread' | 'vocab' | 'weekly_report';
  historicalPatterns?: string[]; // names already seen for this user — for continuity
}): Promise<ExtractionResult> {
  const { entryText, userId, cycleId, entryId, sourceType, historicalPatterns = [] } = options;

  console.log(`[Pattern Extractor] Extracting patterns from ${sourceType} entry ${entryId}`);

  const provider = aiProvider;
  const providerName = process.env.AI_PROVIDER || 'groq';
  const modelName = process.env.AI_MODEL || 'llama3-70b-8192';

  const historicalContext = historicalPatterns.length > 0
    ? `Known patterns already tracked for this user: ${historicalPatterns.join(', ')}.`
    : 'No prior patterns established yet for this user.';

  const prompt = buildExtractionPrompt(entryText, historicalContext, sourceType);

  let rawResponse = '';
  let candidates: RawPatternCandidate[] = [];

  try {
    rawResponse = await provider.callRaw(prompt);
    candidates = parseExtractionResponse(rawResponse, entryText);
  } catch (err: any) {
    console.error(`[Pattern Extractor] AI call failed for entry ${entryId}:`, err.message);
    // Return empty — the system will try again on the next entry
    return { candidates: [], provider: providerName, model: modelName, promptVersion: PROMPT_VERSION };
  }

  // Filter by confidence threshold
  const publishable = candidates.filter(c => c.confidence >= CONFIDENCE_PUBLISH_THRESHOLD);

  console.log(`[Pattern Extractor] Found ${candidates.length} candidates, ${publishable.length} above threshold (${CONFIDENCE_PUBLISH_THRESHOLD})`);

  // Persist ALL candidates (even below threshold) for audit trail
  if (candidates.length > 0) {
    const rows = candidates.map(c => ({
      user_id: userId,
      cycle_id: cycleId,
      entry_id: entryId,
      source_type: sourceType,
      pattern_name: normalisePatternName(c.pattern_name),
      pattern_category: c.pattern_category,
      supporting_phrase: c.supporting_phrase?.slice(0, 500) || null,
      supporting_sentence: c.supporting_sentence?.slice(0, 1000) || null,
      confidence: Math.min(1, Math.max(0, c.confidence)),
      extractor_version: EXTRACTOR_VERSION,
      prompt_version: PROMPT_VERSION,
      provider: providerName,
      model: modelName,
      generated_at: new Date().toISOString(),
    }));

    const { error: insertErr } = await supabase
      .from('pattern_extractions')
      .insert(rows);

    if (insertErr) {
      console.error(`[Pattern Extractor] Failed to insert pattern_extractions:`, insertErr.message);
    }
  }

  // Return only publishable candidates
  return {
    candidates: publishable.map(c => ({
      ...c,
      pattern_name: normalisePatternName(c.pattern_name),
    })),
    provider: providerName,
    model: modelName,
    promptVersion: PROMPT_VERSION,
  };
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildExtractionPrompt(text: string, historicalContext: string, sourceType: string): string {
  return `You are a precise pattern-detection system for a mental health journaling application called Ingress Within. Your job is to identify recurring emotional, linguistic, and behavioural patterns in journal writing.

HISTORICAL CONTEXT:
${historicalContext}

KNOWN PATTERN TYPES (match these where applicable; you may propose new ones if genuinely distinct):
${KNOWN_PATTERNS.map(p => `- ${p}`).join('\n')}

JOURNAL ENTRY (${sourceType}):
"""
${text}
"""

INSTRUCTIONS:
1. Identify patterns ONLY grounded in the actual text. Never invent or project.
2. For each pattern found, extract the exact phrase or sentence that evidences it.
3. Assign a confidence score (0.00–1.00) based on:
   - How clearly the pattern is expressed in the text
   - Whether the text directly demonstrates the behaviour (not just mentions it)
   - 0.90+ = unmistakable, explicit evidence
   - 0.70–0.89 = clear but could have alternative interpretation
   - 0.50–0.69 = possible pattern, weak signal
   - Below 0.50 = speculative, do not include
4. Do NOT diagnose. Do NOT moralize. Observe only.
5. Limit to 5 patterns maximum.

RESPONSE FORMAT (JSON array only, no preamble):
[
  {
    "pattern_name": "Avoidance",
    "pattern_category": "behavioural",
    "supporting_phrase": "I didn't say anything",
    "supporting_sentence": "I didn't say anything. It felt easier. The moment passed.",
    "confidence": 0.88,
    "reasoning": "Writer describes choosing silence rather than engagement across multiple situations"
  }
]

If no patterns are found, return: []`;
}

// ─── Response Parser ──────────────────────────────────────────────────────────

function parseExtractionResponse(rawResponse: string, originalText: string): RawPatternCandidate[] {
  try {
    // Extract JSON array from response
    const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(item => (
        typeof item === 'object' &&
        typeof item.pattern_name === 'string' &&
        typeof item.pattern_category === 'string' &&
        typeof item.confidence === 'number' &&
        item.confidence >= 0 &&
        item.confidence <= 1
      ))
      .map(item => ({
        pattern_name: String(item.pattern_name).trim(),
        pattern_category: validateCategory(item.pattern_category),
        supporting_phrase: typeof item.supporting_phrase === 'string'
          ? item.supporting_phrase.trim()
          : '',
        supporting_sentence: typeof item.supporting_sentence === 'string'
          ? item.supporting_sentence.trim()
          : '',
        confidence: Number(item.confidence),
        reasoning: typeof item.reasoning === 'string' ? item.reasoning.trim() : '',
      }))
      .filter(c => {
        // Validate that the supporting phrase actually exists in the original text
        if (!c.supporting_phrase) return true; // Allow if no phrase specified
        const textLower = originalText.toLowerCase();
        const phraseLower = c.supporting_phrase.toLowerCase();
        return textLower.includes(phraseLower) || phraseLower.split(' ').some(w => textLower.includes(w));
      });

  } catch (err: any) {
    console.error(`[Pattern Extractor] Failed to parse AI response:`, err.message);
    return [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalisePatternName(name: string): string {
  const trimmed = name.trim();
  // Try to match to a known pattern (case-insensitive)
  const known = KNOWN_PATTERNS.find(
    p => p.toLowerCase() === trimmed.toLowerCase()
  );
  return known || trimmed;
}

function validateCategory(cat: string): 'emotional' | 'linguistic' | 'behavioural' | 'relational' {
  const valid = ['emotional', 'linguistic', 'behavioural', 'relational'];
  return valid.includes(cat) ? cat as any : 'behavioural';
}

/**
 * Fetch the list of pattern names already tracked for this user,
 * to give the AI historical continuity context.
 */
export async function getHistoricalPatternNames(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('pattern_extractions')
    .select('pattern_name')
    .eq('user_id', userId);

  if (error || !data) return [];

  const unique = [...new Set(data.map((r: any) => r.pattern_name))];
  return unique;
}
