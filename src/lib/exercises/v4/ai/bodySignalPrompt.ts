export class BodySignalPrompt {
  public static buildPrompt(signalsFormatted: string): string {
    return `A person completed a body signal inventory across 6 physical systems:

${signalsFormatted}

Write 2-3 plain sentences reflecting on what these physical signals suggest together.

Consider:
- Are signals concentrated in spatial tension (jaw, neck, stomach) or temporal rhythms (sleep, appetite, fatigue)?
- Is there a system marked as steady while others show distress?
- Address the person as "you".

Rules:
- No markdown, no bold, no asterisks.
- Plain, restrained, observational tone.
- Do NOT provide medical or clinical advice.

Return only 2-3 plain sentences.`;
  }
}
