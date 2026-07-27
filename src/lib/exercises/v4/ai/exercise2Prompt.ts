export interface Exercise2ResponseItem {
  image_id: number;
  step: number;
  question?: string;
  response: string;
}

export class Exercise2Prompt {
  /**
   * Constructs the prompt for Exercise 2 (Inkblot Projective Test) AI Analysis.
   */
  public static buildPrompt(rawResponses: Exercise2ResponseItem[]): string {
    const byImage = [1, 2, 3, 4, 5].map(id => {
      const cardResps = rawResponses.filter(r => r.image_id === id);
      const s1 = cardResps.find(r => r.step === 1)?.response || '(none)';
      const s2 = cardResps.find(r => r.step === 2)?.response || '(none)';
      const s3 = cardResps.find(r => r.step === 3)?.response || '(none)';
      return `Card ${id}: "${s1}" / "${s2}" / "${s3}"`;
    }).join('\n');

    return `Someone completed a 5-card projective exercise. Their responses:

${byImage}

Read all five before writing. Find the outlier — the one card where they responded differently from all the others. Then make one plain observation about what that shift tells you about this person.

Write 3 sentences:

Sentence 1: What most cards had in common. Quote 2-3 of their actual responses briefly to show it.
Sentence 2: Name the outlier card. Quote exactly what they said on that card. Say in one clause how it differs from the others.
Sentence 3: This is the sentence that matters. Say something specific about this person based on that difference. Not what it "suggests". Not what it "might indicate". Say it directly — a plain statement about who they are or how they operate, based on what just happened across these five cards.

Rules:
- Address the user as "You" / "Your" throughout. NEVER use third-person pronouns ("this person", "he", "she", "the user", "they").
- Quote their actual words.
- Sentence 3 must be a direct statement, not hedged. If you find yourself writing "suggests", "might", "could", "points to" — rewrite it as a plain claim.
- No jargon: lens, register, projection, avoidant, suppress, dynamic, processing, contain, reframe.
- No markdown formatting, no bold, no asterisks.
- Do not be overly warm. Do not soften sentence 3.
- Exactly three sentences in prose.

After your 3 sentences, on a new line return ONLY this JSON structure:
\`\`\`json
{
  "default_lens_label": "threat",
  "lens_by_image": [
    {"image_index": 1, "lens": "threat"},
    {"image_index": 2, "lens": "withdrawal"},
    {"image_index": 3, "lens": "direct"},
    {"image_index": 4, "lens": "threat"},
    {"image_index": 5, "lens": "avoidant"}
  ],
  "entry_confirmation": "partial",
  "de_animation_flag": false,
  "most_revealing_image": 3,
  "performance_flag": false
}
\`\`\`
Note: "default_lens_label" MUST be one of: "threat", "withdrawal", "direct", "avoidant", "mixed".`;
  }
}
