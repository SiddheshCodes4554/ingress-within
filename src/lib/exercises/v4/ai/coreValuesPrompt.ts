export class CoreValuesPrompt {
  public static buildPrompt(params: {
    selectedValues: string[];
    selectionOrder: string[];
    reorderDelta: number;
  }): string {
    const rankedFormatted = params.selectedValues.map((val, idx) => `${idx + 1}. ${val}`).join('\n');
    const selectionFormatted = params.selectionOrder.join(', ');

    return `A person selected and ranked their top 5 values, in order of importance:

${rankedFormatted}

The order they selected these values in, before ranking (their first instinct):
${selectionFormatted}

Reorder delta:
${params.reorderDelta}
(0 = they confirmed their instinctive order; higher = they deliberately reordered)

Write 2–3 plain sentences reflecting on this specific combination and order.

Consider:
- Is there tension or a real trade-off between any of the top values?
- Examples include Freedom vs Security, Peace vs Justice, Autonomy vs Belonging.
- Did the final order differ from their first instinct?
- If so, what might that reordering suggest?

Address the person as "you".

Tone:
- plain
- observational
- specific
- restrained

Do NOT be:
- warm
- encouraging
- clinical
- therapeutic
- motivational

Do NOT provide advice.

Do NOT generalize beyond what the selected values support.

No markdown.
No bold.
No asterisks.

Return only 2–3 plain sentences.`;
  }
}
