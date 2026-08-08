export class TriggerMappingPrompt {
  public static buildPrompt(entriesFormatted: string, userAnswersFormatted: string): string {
    return `ANALYSIS API PROMPT — TRIGGER MAPPING

A person completed Trigger Mapping based on 5 high-intensity journal entries from their history:

[5 HIGH-INTENSITY ENTRIES]:
${entriesFormatted}

[USER RESPONSES TO THE 5 MOMENTS + SYNTHESIS]:
${userAnswersFormatted}

TASK:
1. Identify the situational architecture of reactive states across these moments — what specific environmental or relational conditions trigger reactive emotional states?
2. Highlight agency decision points — specific moments in each situation where choice was possible, even if it felt automatic at the time.

Strict Rules:
- Plain, grounded language using 'you'.
- No clinical jargon, no diagnosis.
- Banned phrases: 'points to', 'suggests that', 'speaks to', 'the weight of', 'sits with you', 'ongoing tension'.

Return ONLY this JSON on a new line:
{
  "reflection_text": "2-3 sentences identifying the situational architecture of triggers and agency decision points.",
  "trigger_architecture": "One clear paragraph describing the trigger pattern across the 5 moments.",
  "decision_points": ["Decision point for Entry 1", "Decision point for Entry 2", "Decision point for Entry 3", "Decision point for Entry 4", "Decision point for Entry 5"]
}`;
  }
}
