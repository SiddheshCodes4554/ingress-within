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
    if (typeof result.summary !== 'string' || result.summary.trim().length === 0) {
      throw new Error('Required field "summary" is missing.');
    }

    // Required: scores (object)
    if (!result.scores || typeof result.scores !== 'object') {
      throw new Error('Required object "scores" is missing.');
    }

    const { clarity, intensity, reactivity } = result.scores;
    const validateScore = (name: string, val: any) => {
      if (typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 10) {
        throw new Error(`Score "${name}" must be an integer between 1 and 10. Found: ${val}`);
      }
    };

    validateScore('clarity', clarity);
    validateScore('intensity', intensity);
    validateScore('reactivity', reactivity);

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
