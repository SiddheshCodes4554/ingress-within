export class AvoidanceAuditPrompt {
  public static buildPrompt(completionsFormatted: string): string {
    return `A person completed an avoidance audit by completing six sentence stems:

${completionsFormatted}

Write 2-3 plain sentences reflecting on what these completions reveal as a common thread.

Consider:
- Is there an underlying fear of conflict, failure, or loss of control?
- Name the common thread observed across their responses.
- Address the person as "you".

Rules:
- Plain, observational, restrained tone.
- No markdown, no bold, no asterisks.
- Do NOT provide motivational advice or therapeutic instructions.

Return only 2-3 plain sentences.`;
  }
}
