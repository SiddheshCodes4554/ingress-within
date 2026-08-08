export class RelationshipMapPrompt {
  public static buildPrompt(rosterFormatted: string): string {
    return `A person mapped the people taking up the most mental space in their life right now, in the order they came to mind:

${rosterFormatted}

Write 2–3 plain sentences reflecting on the shape of this map.

Consider:
- the balance of gives-energy vs takes-energy across the roster
- any person flagged as ambivalent, where their feeling word and gives/takes answer seem to be in tension (name the specific contradiction if there is one)
- which person seems to be carrying the most weight based on the combination of feeling word, energy direction, and stated frequency
- the fact that the person named first often, but not always, came to mind least deliberately

Address the user as 'you'.
Never say 'this person'.
No markdown. No bold. No asterisks. No jargon.
Do not be warm. Do not be encouraging. Do not soften the observation. Do not give advice. Do not diagnose.
Keep the reflection specific to this map.

Return ONLY a valid JSON object matching this structure:
{
  "reflection_text": "Your 2-3 plain sentence reflection here.",
  "highest_drain_person": "The exact name of the person carrying the most weight from the roster above."
}`;
  }
}
