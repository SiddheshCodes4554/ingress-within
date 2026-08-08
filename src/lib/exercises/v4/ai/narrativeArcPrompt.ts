export class NarrativeArcPrompt {
  public static buildPrompt(answersFormatted: string): string {
    return `ANALYSIS API PROMPT — NARRATIVE ARC EXERCISE (MONTH 3 / STABILITY EMPHASIS)

A person completed the Month-3 Narrative Arc Exercise:

${answersFormatted}

TASK:
For high-intensity or flexible emotional profiles, the central question is not whether change is happening — it likely is — but whether the person can accurately perceive the stable structures beneath high-intensity emotional variability over the past 3 months.

Read the 4 answers and provide:
1. REFLECTION TEXT: 2–3 plain sentences directly to the person using 'you'. Contrast perceived emotional change against what has stayed constant underneath. Point out the stable structures and deliberate choice moments.
2. STABLE STRUCTURES: One clear paragraph identifying what persisted across emotional intensity variation.

Strict Rules:
- Plain, grounded language using 'you'.
- No clinical jargon, no diagnosis.
- Banned phrases: 'points to', 'suggests that', 'speaks to', 'the weight of', 'sits with you', 'ongoing tension'.

Return ONLY this JSON on a new line:
{
  "reflection_text": "2-3 plain sentences directly to the person.",
  "stable_structures": "One clear paragraph identifying stable structures beneath emotional variability."
}`;
  }
}
