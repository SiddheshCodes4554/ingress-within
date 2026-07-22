export interface PromptConfig {
  exercise_id: string;
  prompt_version: string;
  provider: 'gemini' | 'groq' | 'claude';
  model: string;
  temperature: number;
  max_tokens: number;
  json_schema_version: string;
  system_prompt: string;
  user_prompt_template: string;
}

const REGISTRY: Record<string, Record<string, PromptConfig>> = {
  exercise_0: {
    v1: {
      exercise_id: 'exercise_0',
      prompt_version: 'v1',
      provider: 'gemini',
      model: 'gemini-3.1-flash-lite',
      temperature: 0.1,
      max_tokens: 1000,
      json_schema_version: '1.0',
      system_prompt: 'You are a clinical psychologist evaluating an OCEAN assessment. Generate a structured clinical narrative of how they process their inner life.',
      user_prompt_template: 'OCEAN SCORES:\nOpenness: {{context.O}} | Conscientiousness: {{context.C}} | Extraversion: {{context.E}} | Agreeableness: {{context.A}} | Neuroticism: {{context.N}}\n\nFormat your output as a strict JSON object with the following schema:\n{\n  "analysis": "2-3 plain sentences describing how this person processes their inner life. Do not use OCEAN terminology. Do not mention scores or numbers. Start with \"You tend to...\". Just describe what you see.",\n  "summary": "A single sentence that begins with \"This space is designed for exactly that.\"",\n  "scores": {\n    "clarity": 1-10 integer,\n    "intensity": 1-10 integer,\n    "reactivity": 1-10 integer\n  },\n  "branch": "CBT pathway suggestion or null",\n  "lens": "Primary cognitive framework identified or null",\n  "gap_score": 0.0-10.0 number\n}'
    },
    v2: {
      exercise_id: 'exercise_0',
      prompt_version: 'v2',
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 1500,
      json_schema_version: '1.1',
      system_prompt: 'You are a Senior CBT therapist specializing in cognitive distortions.',
      user_prompt_template: 'Analyze the user answers: \n{{context.responses}}\nReturn JSON.'
    }
  },
  exercise_1: {
    v1: {
      exercise_id: 'exercise_1',
      prompt_version: 'v1',
      provider: 'gemini',
      model: 'gemini-3.1-flash-lite',
      temperature: 0.15,
      max_tokens: 1200,
      json_schema_version: '1.0',
      system_prompt: 'You are a clinical psychologist analyzing a word association exercise. Propose a structured reflection and identify underlying register parameters.',
      user_prompt_template: 'Personality context: {{context.personality_context}}\n\nA person completed a word association exercise. Their 12 stimulus words and responses:\n\n{{context.responses}}\n\nDo two things:\n\nWrite 2 short sentences to them using "you".\n\nBoth sentences must reference specific words and responses from the list above. Do not make general observations. Do not summarise mood or feeling in the abstract. Every claim must be grounded in a specific word they were shown and what they said.\n\nFirst sentence: name 2-3 specific responses and say what you notice about them together.\n\nSecond sentence: pick the single most interesting word-response pair. Name both. Say in one plain clause what it suggests.\n\nStrict rules:\n- Must reference actual words from the list. No abstract observations.\n- No poetic or metaphorical language. Say it plainly.\n- No sentence like "you seem to be carrying something" or "there is something unresolved" — these are vague. Be specific.\n- "You" throughout. Never "this person".\n- No jargon: register, avoidant, deflect, ambivalent, suppress, tension, dynamic, narrative, threshold, insight, unresolved, acute, ongoing, present.\n- No markdown, no bold, no asterisks.\n- Do not be warm or encouraging.\n\nAfter your sentences, on a new line return only this JSON:\n{\n  "dominant_register": "threat|withdrawal|self-questioning|avoidant|direct|ambivalent",\n  "emotional_register_gap": "match|partial|significant_gap",\n  "suppression_flag": false,\n  "revealing_pairs": [{"word": "STIMULUS_WORD", "response": "USER_RESPONSE", "note": "one sentence explanation"}]\n}'
    }
  },
  exercise_2: {
    v1: {
      exercise_id: 'exercise_2',
      prompt_version: 'v1',
      provider: 'gemini',
      model: 'gemini-3.1-flash-lite',
      temperature: 0.15,
      max_tokens: 1500,
      json_schema_version: '1.0',
      system_prompt: 'You are a clinical psychologist analyzing a 5-card projective inkblot exercise. Read all responses before writing.',
      user_prompt_template: 'Someone completed a 5-card projective exercise. Their responses across the five cards:\n\n{{context.responses}}\n\nRead all five cards before writing. Find the outlier — the one card where they responded differently from all the others. Then make one plain observation about what that shift tells you about this person.\n\nWrite 3 sentences:\n\nSentence 1: What most cards had in common. Quote 2-3 of their actual responses briefly to show it.\nSentence 2: Name the outlier card. Quote exactly what they said on that card. Say in one clause how it differs from the others.\nSentence 3: This is the only sentence that matters. Say something specific about this person based on that difference. Not what it "suggests". Not what it "might indicate". Say it directly — a plain statement about who they are or how they operate, based on what just happened across these five cards.\n\nRules:\n- "You" throughout. Never "this person".\n- Quote their actual words.\n- Sentence 3 must be a direct statement, not hedged. If you find yourself writing "suggests", "might", "could", "points to" — rewrite it as a plain claim.\n- No jargon: lens, register, projection, avoidant, suppress, dynamic, processing, contain, reframe.\n- No markdown, no bold, no asterisks.\n- Do not be warm. Do not soften sentence 3.\n- Three sentences only.\n\nAfter your 3 sentences, on a new line return only this JSON:\n{\n  "default_lens_label": "threat|withdrawal|direct|avoidant|mixed",\n  "lens_by_image": [],\n  "entry_confirmation": "yes|partial|absent",\n  "de_animation_flag": false,\n  "most_revealing_image": 3,\n  "performance_flag": false\n}'
    }
  },
  exercise_3: {
    v1: {
      exercise_id: 'exercise_3',
      prompt_version: 'v1',
      provider: 'gemini',
      model: 'gemini-3.1-flash-lite',
      temperature: 0.1,
      max_tokens: 2000,
      json_schema_version: '1.0',
      system_prompt: 'You are a clinical psychologist compiling a cycle-end longitudinal progress report.',
      user_prompt_template: 'RESPONSES:\n{{context.responses}}\n\nENTRIES FOR CYCLE:\n{{context.entries}}\n\nKNOWLEDGE PROFILE:\n{{context.knowledge}}\n\nPATTERNS:\n{{context.patterns}}\n\nWEEKLY SUMMARIES:\n{{context.weeklySummaries}}\n\nProvide evaluation in strict JSON format.'
    }
  },
  cbt_reframing: {
    v1: {
      exercise_id: 'cbt_reframing',
      prompt_version: 'v1',
      provider: 'gemini',
      model: 'gemini-3.1-flash-lite',
      temperature: 0.1,
      max_tokens: 1000,
      json_schema_version: '1.0',
      system_prompt: 'You are a CBT therapist reframing cognitive distortions.',
      user_prompt_template: 'Analyze answers: \n{{context.responses}}\nReturn JSON.'
    }
  }
};

export class ExercisePromptRegistry {
  /**
   * Retrieves the configured prompt parameters for a given exercise and version.
   * Falls back to v1 or default parameters if not found.
   */
  public static getPromptConfig(exerciseId: string, version: string = 'v1'): PromptConfig {
    const exerciseConfigs = REGISTRY[exerciseId];
    if (!exerciseConfigs) {
      console.warn(`[PromptRegistry] Configuration missing for exercise "${exerciseId}". Using exercise_0 default.`);
      return REGISTRY['exercise_0']['v1'];
    }

    const config = exerciseConfigs[version] || exerciseConfigs['v1'];
    if (!config) {
      throw new Error(`Prompt configuration not found for exercise: ${exerciseId}, version: ${version}`);
    }

    return config;
  }
}
