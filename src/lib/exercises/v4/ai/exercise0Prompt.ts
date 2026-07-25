export class Exercise0Prompt {
  public static buildOceanSummaryPrompt(scores: {
    ocean_O: number;
    ocean_C: number;
    ocean_E: number;
    ocean_A: number;
    ocean_N: number;
  }): { system: string; user: string } {
    const system = `You are an expert psychological scientist describing a person's inner processing style in plain, direct language.`;

    const user = `You are reading a person's OCEAN personality assessment scores on a scale of 1-5 where 5 is highest.

Openness: ${scores.ocean_O} | Conscientiousness: ${scores.ocean_C} | Extraversion: ${scores.ocean_E} | Agreeableness: ${scores.ocean_A} | Neuroticism: ${scores.ocean_N}

Write 2-3 plain sentences describing how this person tends to process their inner life. Do not use OCEAN terminology or clinical language. Do not mention scores or numbers. Write it the way you would describe someone to a new person who is about to interact with them.

End with one sentence that begins: "This space is designed for exactly that."

Example: "You tend to process things internally and find direct conflict uncomfortable. That means things often pile up quietly before they surface. This space is designed for exactly that."

Be accurate. Be plain. Do not be warm or encouraging. Just describe what you see.`;

    return { system, user };
  }
}
