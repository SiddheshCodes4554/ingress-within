import { FIXED_WORDS, SENSITIVITY_EXCLUSIONS, SequenceItem } from '../definitions/exercise1Catalog';

export class Exercise1Prompt {
  public static buildCall1Prompt(entries: string[]): { system: string; user: string } {
    const entryTexts = entries.map((e, i) => `Entry ${i + 1}: ${e}`).join('\n\n');
    const fixedSet = Object.values(FIXED_WORDS).join(', ');
    const exclusions = Array.from(SENSITIVITY_EXCLUSIONS).join(', ');

    const system = `You are an expert psychological scientist selecting stimulus words for a word association exercise based on journal entry analysis.`;

    const user = `Here are a person's journal entries:

${entryTexts || '(No entries available)'}

Select 2–3 single words that meet ALL of the following criteria:
1. The word appeared in at least 1 of the entries
2. The word carried visible emotional charge in the context it appeared — it was not neutral filler
3. The word is not in this list (fixed set): ${fixedSet}
4. The word is not a proper noun (no names, places, brands)
5. The word is common enough that it functions as a clear stimulus
6. The word is NOT in this sensitivity exclusion list: ${exclusions}

Return only the words as a comma-separated list. No explanation. No preamble. No punctuation other than the comma separator.

If fewer than 2 words meet all criteria, return exactly 2 words that meet criteria 2–5 and 6, even if they only appeared once. If no words meet all criteria, return: CHANGE, LOSS`;

    return { system, user };
  }

  public static buildCall2Prompt(
    sequence: SequenceItem[],
    responses: Array<{ position: number; word: string; response: string }>
  ): { system: string; user: string } {
    const respLines = sequence
      .map((s, i) => {
        const r = responses.find(res => res.word === s.word || res.position === s.position) || { response: '(no response)' };
        return `${s.position}. ${s.word} → ${r.response}`;
      })
      .join('\n');

    const system = `You are an expert psychological scientist analyzing rapid word association responses.

CRITICAL VOICE RULE:
Address the user directly using second-person pronouns ('You', 'Your'). NEVER use third-person ('This person', 'They', 'The user'). Speak directly to 'You'.`;

    const user = `Someone did a word association exercise. Here are their responses:

${respLines}

Write 2 short sentences directly to them using "you".

Both sentences must reference specific words and responses from the list above. Do not make general observations. Do not summarise mood or feeling in the abstract. Every claim must be grounded in a specific word they were shown and what they said.

First sentence: name 2-3 specific responses and say what you notice about them together.

Second sentence: pick the single most interesting word-response pair. Name both. Say in one plain clause what it suggests.

Strict rules:
- Must reference actual words from the list. No abstract observations.
- No poetic or metaphorical language. Say it plainly.
- No sentence like "you seem to be carrying something" or "there is something unresolved" — these are vague. Be specific.
- Address the user as "you" / "your" throughout. NEVER use third person ("this person", "they").
- No jargon: register, avoidant, deflect, ambivalent, suppress, tension, dynamic, narrative, threshold, insight, unresolved, acute, ongoing, present.
- No markdown, no bold, no asterisks.
- Do not be warm or encouraging.

Good example:
"SAFE got difficult, HOME got confusion, WAITING got forever — all three are things that should feel settled but you gave them all friction. The one that stands out is ENOUGH and you said peace, because that is the only word where you named something you want rather than something that is wrong."

Bad example:
"You seem to be carrying something that has not resolved yet — not acute, but present and ongoing."
(This is bad because it says nothing specific. It could apply to anyone.)

After your sentences, on a new line return only this JSON:
{"dominant_register": "threat", "emotional_register_gap": "partial", "suppression_flag": false, "revealing_pairs": [{"word": "HOME", "response": "confusion", "note": "shows friction around baseline security"}]}`;

    return { system, user };
  }

  public static parseCall2Output(raw: string): { text: string; structured: any } {
    let plainText = raw;
    let structured: any = null;

    // 1. Strip markdown code fences if present
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      plainText = raw.substring(0, raw.indexOf('```')).trim();
      try {
        structured = JSON.parse(fenceMatch[1].trim());
      } catch (_) {}
    } else {
      const jsonStart = raw.search(/\n?\s*\{/);
      if (jsonStart !== -1) {
        plainText = raw.substring(0, jsonStart).trim();
        try {
          structured = JSON.parse(raw.substring(jsonStart).trim());
        } catch (_) {}
      }
    }

    // 2. Clean plain text (strip asterisks, markdown headers)
    let cleanText = (plainText || raw)
      .split('**').join('')
      .split('*').join('')
      .replace(/^#+\s*/gm, '')
      .replace(/```[\s\S]*$/m, '')
      .replace(/\{[\s\S]*$/m, '')
      .trim();

    return { text: cleanText, structured };
  }
}
