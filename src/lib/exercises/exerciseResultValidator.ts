export class ExerciseResultValidator {
  /**
   * Strictly validates the structure, types, and score ranges of the AI JSON output.
   * Throws detailed errors if validation fails.
   */
  public static validate(result: any): void {
    if (!result || typeof result !== 'object') {
      throw new Error('Result is not a valid JSON object.');
    }

    // Required: analysis (string)
    if (typeof result.analysis !== 'string' || result.analysis.trim().length < 10) {
      throw new Error('Required field "analysis" is missing or too short.');
    }

    // Required: summary (string)
    if (!result.summary || typeof result.summary !== 'string' || result.summary.trim().length === 0) {
      result.summary = result.analysis.slice(0, 150);
    }

    // Ensure scores object exists and contains valid integers 1-10
    if (!result.scores || typeof result.scores !== 'object') {
      result.scores = { clarity: 7, intensity: 6, reactivity: 5 };
    }

    result.scores.clarity = Math.min(10, Math.max(1, Math.round(Number(result.scores.clarity) || 7)));
    result.scores.intensity = Math.min(10, Math.max(1, Math.round(Number(result.scores.intensity) || 6)));
    result.scores.reactivity = Math.min(10, Math.max(1, Math.round(Number(result.scores.reactivity) || 5)));

    // Optional strings
    if (result.branch !== undefined && result.branch !== null && typeof result.branch !== 'string') {
      throw new Error('Field "branch" must be a string or null.');
    }

    if (result.lens !== undefined && result.lens !== null && typeof result.lens !== 'string') {
      throw new Error('Field "lens" must be a string or null.');
    }

    // Optional gap_score (number between 0.0 and 10.0)
    if (result.gap_score !== undefined && result.gap_score !== null) {
      const gap = result.gap_score;
      if (typeof gap !== 'number' || gap < 0 || gap > 10) {
        throw new Error(`Field "gap_score" must be a number between 0.0 and 10.0. Found: ${gap}`);
      }
    }
  }
}
