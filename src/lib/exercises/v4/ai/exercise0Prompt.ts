export class Exercise0Prompt {
  public static buildOceanSummaryPrompt(scores: {
    ocean_O: number;
    ocean_C: number;
    ocean_E: number;
    ocean_A: number;
    ocean_N: number;
  }): { system: string; user: string } {
    const system = `You are an expert psychological scientist describing a person's inner processing style in plain, direct language.

CRITICAL VOICE RULE:
Address the user directly using second-person pronouns ('You', 'Your'). NEVER refer to the user in third-person ('This person', 'They', 'The user'). Speak directly to 'You'.`;

    const user = `Here are the person's OCEAN assessment scores on a scale of 1-5 where 5 is highest:

Openness: ${scores.ocean_O} | Conscientiousness: ${scores.ocean_C} | Extraversion: ${scores.ocean_E} | Agreeableness: ${scores.ocean_A} | Neuroticism: ${scores.ocean_N}

Write 2-3 plain sentences directly to the user starting with "You..." describing how you tend to process your inner life. Do not use OCEAN terminology or clinical language. Do not mention scores or numbers.

End with one sentence that begins: "This space is designed for exactly that."

Example: "You tend to process things internally and find direct conflict uncomfortable. That means things often pile up quietly before they surface. This space is designed for exactly that."

Be accurate. Be plain. Speak directly to "You". Just describe what you see.`;

    return { system, user };
  }
}
