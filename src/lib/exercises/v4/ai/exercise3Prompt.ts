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
      ? snapshotContext.journalEntries.map((e, idx) => `${idx + 1}. "${e.content}"`).join('\n')
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

    return `A person answered 5 questions about the last 3 weeks. Their self-perception answers:

${qFormatted}

Their historical journal entries from this period:
${entriesFormatted}

Prior baseline assessment snapshots:
- Exercise 0 (OCEAN Baseline): ${ex0Summary}
- Exercise 1 (Word Association): ${ex1Summary}
- Exercise 2 (Inkblot Projective Test): ${ex2Summary} (Primary Defense Lens: ${ex2Lens})

Weekly report snapshots:
${weeklyFormatted}

Compare their self-descriptions to what the entry and assessment snapshots show. Score each question 0 (aligned) or 1 (gap). A gap is when the self-described behaviour contradicts or is absent from entry evidence. For Q3, check if entries show additional avoidances not named.

FRAMING RULE: Never write "You said X but actually did Y." Write "You described yourself as someone who X. Your entries show Y more often."

Write 3 plain sentences to them using "you". Name the most significant gap with specific reference to their words and the entries.

Rules:
- Address the user as "you" / "your" throughout.
- Quote their actual words briefly.
- No markdown formatting, no bold text, no asterisks, no jargon.
- Exactly three sentences in prose.

After your 3 sentences, on a new line return ONLY this JSON structure:
\`\`\`json
{
  "gap_score": 0,
  "gap_locations": [1, 3],
  "gap_severity": "low"
}
\`\`\`
Note: "gap_severity" MUST be one of: "low", "moderate", "significant".`;
  }
}
