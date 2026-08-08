export class BodySignalPrompt {
  public static buildPrompt(signalsFormatted: string, questionsFormatted: string): string {
    return `ANALYSIS API PROMPT — BODY SIGNAL INVENTORY

A person completed a Body Signal Inventory — for each of 6 body systems, they either selected a signal they've been noticing, or selected a positive/steady option instead if nothing stood out, then completed 3 sentences about the pattern.

SELECTED SIGNALS (with location or timing where given; items marked POSITIVE are steady/positive selections, not something wrong):
${signalsFormatted}

SENTENCE COMPLETIONS:
${questionsFormatted}

Context: physical signals and their described locations or timing are the intended content of this exercise — jaw tension before hard conversations, stomach issues during stressful weeks, disrupted sleep during a difficult period, are the expected, common kind of answer and are not a sign of risk on their own. Only treat something as a genuine concern if a completion is an unambiguous, explicit statement about self-harm, suicide, or wanting to die or disappear. If nothing meets that bar, proceed with the task normally.

A separate note on POSITIVE selections: treat these as genuine, valid data — someone reporting their sleep or energy has felt steady is not being evasive or in denial, and should not be second-guessed, probed for what they might be avoiding, or treated as less interesting than a symptom would be. If every system is POSITIVE, say so plainly and do not manufacture a concern to analyse.

PART 1 — ANALYSIS (label ANALYSIS:): 2–3 plain sentences to the person using 'you'. Read only what's above — name the specific signals and their location/timing, say what the combination suggests. If Q3 already shows a connection they've made themselves, acknowledge it rather than re-explaining it as new. Banned phrases: 'points to', 'suggests that', 'speaks to', 'the weight of', 'sits with you', 'ongoing tension'.

PART 2 — WORTH SITTING WITH (produced entirely inside the JSON, not as prose): 1–2 signals or completions most worth a closer look. Same 4-part structure: (1) contrast against the rest of what they selected/wrote; (2) what's different and why it matters; (3) what this can look like day to day, framed as a possibility, never a diagnosis; (4) close with 'Worth noticing if...'. If nothing genuinely stands out — e.g. everything is POSITIVE — return an empty array rather than manufacturing something to say.

Strict rules for both parts: grounded only in this data; plain language, no jargon, no diagnosis; 'you' throughout; no markdown; not warm or falsely reassuring.

After both parts, on a new line, return ONLY this JSON:
{
  "reflection_text": "2-3 plain sentences directly to the person.",
  "worth_sitting_with": [
    {
      "label": "Short name, e.g. Jaw tension — before hard conversations",
      "note": "3-5 sentence note following the 4-part structure above"
    }
  ]
}`;
  }
}
