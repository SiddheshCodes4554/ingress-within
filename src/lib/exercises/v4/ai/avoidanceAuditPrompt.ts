export class AvoidanceAuditPrompt {
  public static buildPrompt(completionsFormatted: string): string {
    return `ANALYSIS API PROMPT — AVOIDANCE AUDIT

A person completed 6 sentence stems as part of an Avoidance Audit:
${completionsFormatted}

Context: several of these prompts ask about ordinary, common avoidances — procrastinated decisions, deferred phone calls, feelings people downplay day to day. Completions naming everyday reluctance, tiredness, or not wanting to deal with something are the expected, common kind of answer and are not on their own a sign of risk. Only treat something as a genuine concern if a completion is an unambiguous, explicit statement about self-harm, suicide, or wanting to die or disappear. If nothing meets that bar, proceed with the task normally.

1. ANALYSIS (label ANALYSIS:): 2 sentences directly to the person using 'you'. Read the 6 completions only. Name 2–3 specific completions by prompt number, quote their exact words, and say what you notice when you put them next to each other. The second sentence makes one plain claim based on those completions — specific enough it wouldn't apply to someone who wrote different things. Must quote actual words; no abstract endings; banned phrases: 'points to', 'suggests that', 'speaks to', 'the weight of', 'sits with you', 'ongoing tension'.

2. THREAD (label THREAD:): one sentence, referencing at least 2 prompt numbers, quoting their words, naming the specific thing running through them — not a category. If no real thread: write exactly 'No single thread identified.'

3. WORTH SITTING WITH (produced entirely inside the JSON, not as separate prose): 1–2 completions most worth a closer look individually, not as a thread. For each, write like a therapist explaining their thinking out loud: (1) contrast this completion against the pattern in the other 5, named specifically; (2) say plainly what's different about this one and why it's worth noticing; (3) extend to what this kind of pattern can look like day to day, framed as a general possibility, never a diagnosis of this specific person; (4) close with one line starting 'Worth noticing if...' that turns it into a question the person asks themselves.

Strict rules for all three parts: grounded in actual completions only; no poetic language — plain, like teaching someone; no diagnosis, no clinical labels; 'you' throughout, never 'this person'; no jargon (register, avoidant, deflect, ambivalent, suppress, tension, dynamic, narrative, threshold, insight, unresolved, acute, ongoing, present); no markdown; not warm, encouraging, or falsely reassuring.

After all three outputs, on a new line, return ONLY this JSON:
{
  "common_thread": "One sentence thread or No single thread identified.",
  "reflection_text": "2 sentences of analysis quoted directly to the person.",
  "worth_sitting_with": [
    {
      "prompt": 1,
      "note": "3-5 sentence note following the 4-part structure above"
    }
  ]
}`;
  }
}
