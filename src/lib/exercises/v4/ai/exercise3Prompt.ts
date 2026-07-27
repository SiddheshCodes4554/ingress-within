import { Exercise3SnapshotContext } from '../snapshots/exercise3SnapshotLoader';

export interface Exercise3ResponseItem {
  question_id: string;
  prompt: string;
  response: string;
}

export class Exercise3Prompt {
  /**
   * Constructs the prompt for Exercise 3 (Self Perception Test) AI Analysis.
   */
  public static buildPrompt(rawResponses: Exercise3ResponseItem[], snapshotContext: Exercise3SnapshotContext): string {
    const qFormatted = rawResponses.map((r, idx) => {
      const qNum = idx + 1;
      return `Q${qNum} (${r.prompt}): ${r.response}`;
    }).join('\n\n');

    // Format journal entries evidence
    const entriesFormatted = snapshotContext.journalEntries.length > 0
      ? snapshotContext.journalEntries.slice(0, 15).map((e, idx) => `Log ${idx + 1}: "${e.content}"`).join('\n')
      : '(No previous journal entries stored)';

    // Format prior exercise results evidence
    const ex0Summary = snapshotContext.ex0Result?.summary || snapshotContext.ex0Result?.analysis?.summary || 'Not completed';
    const ex1Summary = snapshotContext.ex1Result?.summary || snapshotContext.ex1Result?.analysis?.summary || 'Not completed';
    const ex2Summary = snapshotContext.ex2Result?.summary || snapshotContext.ex2Result?.analysis?.summary || 'Not completed';
    const ex2Lens = snapshotContext.ex2Result?.analysis?.default_lens_label || 'unknown';

    // Format weekly reports evidence
    const weeklyFormatted = snapshotContext.weeklyReports.length > 0
      ? snapshotContext.weeklyReports.map((w, idx) => `Week ${idx + 1}: ${w.summary || w.title || 'Summary recorded'}`).join('\n')
      : '(No weekly reports stored)';

    return `A person answered 5 questions about their self-perception over the last 3 weeks:

${qFormatted}

Their historical journal entries from this period:
${entriesFormatted}

Prior baseline assessment snapshots:
- Exercise 0 (OCEAN Baseline): ${ex0Summary}
- Exercise 1 (Word Association): ${ex1Summary}
- Exercise 2 (Inkblot Projective Test): ${ex2Summary} (Primary Defense Lens: ${ex2Lens})

Weekly report snapshots:
${weeklyFormatted}

COMPARE their self-descriptions to what their entries and assessment snapshots show. Score each question 0 (aligned) or 1 (gap). A gap is when the self-described behaviour contradicts or is absent from entry evidence.

FRAMING RULE: Never write "You said X but actually did Y." Write "You described yourself as someone who X. Your entries show Y more often."

Write EXACLTY 3 crisp, insightful, empathetic sentences to them using "you":
- Sentence 1: Acknowledge how they described themselves with a brief reference to their response.
- Sentence 2: Highlight the specific evidence from their journal entries or assessments that contrasts with this self-description.
- Sentence 3: State the core pattern or psychological insight directly and concisely.

Rules:
- Address the user as "you" / "your" throughout.
- Keep sentences concise, clear, and readable. Total prose under 90 words.
- No markdown formatting, no bold text, no asterisks, no jargon.
- Exactly three sentences in prose.

After your 3 sentences, on a new line return ONLY this JSON structure:
\`\`\`json
{
  "gap_score": 2,
  "gap_locations": [1, 3],
  "gap_severity": "moderate"
}
\`\`\`
Note: "gap_severity" MUST be one of: "low", "moderate", "significant". "gap_score" MUST equal the count of items in gap_locations (0 to 5).`;
  }
}
