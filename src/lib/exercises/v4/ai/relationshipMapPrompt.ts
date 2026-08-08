export class RelationshipMapPrompt {
  public static buildPrompt(rosterFormatted: string): string {
    return `A person mapped the people taking up the most mental space in their life right now, in the order they came to mind:

${rosterFormatted}

Context: the feeling words above are one-word gut reactions to a person, not clinical statements. Words like tired, done, numb, over it, or complicated are ordinary ways people describe a difficult relationship and are not on their own a sign of risk, even if they sound heavy. Only treat something as a genuine concern if a response is an unambiguous, explicit statement about self-harm, suicide, or wanting to die or disappear — not a word that merely sounds negative. If nothing meets that bar, proceed with the reflection normally.

Write 2-3 plain sentences reflecting on the shape of this map. Consider: the balance of gives-energy vs takes-energy across the roster; any person flagged as ambivalent, where their one-word feeling and their gives/takes answer seem to be in tension (name the specific contradiction if there is one, e.g. "you called it complicated but marked them as giving you energy"); and which person seems to be carrying the most weight, based on the combination of their feeling word, energy direction, and how often they said this person comes to mind. The person named first is often — not always — the one who came to mind least deliberately.

Rules:
- "you" throughout. Never "this person".
- No markdown, no bold, no asterisks.
- No jargon.
- Do not be warm or encouraging. Do not soften.

Return only 2-3 plain sentences.`;
  }
}
