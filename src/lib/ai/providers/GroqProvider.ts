import { 
  AIProvider, 
  ClarityScoreResponse, 
  ReflectionResponse, 
  WeeklySummaryResponse, 
  MonthlyReportResponse, 
  OceanSummaryResponse, 
  ExerciseInsightResponse,
  CrisisDetectionResponse,
  EntryDimensionsScoreResponse
} from '../types';
import { extractJson } from '../utils';

export class GroqProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  public lastSystemPrompt: string = '';
  public lastUserContent: string = '';
  public lastRawResponse: string = '';
  public lastUsage: any = null;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  }

  private async callGroq<T>(systemPrompt: string, userContent: string): Promise<T> {
    this.lastSystemPrompt = systemPrompt;
    this.lastUserContent = userContent;

    if (!this.apiKey || this.apiKey === 'gsk_development_mock_key_replace_me') {
      console.warn(`[GroqProvider] Running with mock key. Simulating AI response.`);
      let mockRes: any = null;

      if (systemPrompt.includes('clarityScore')) {
        mockRes = {
          clarityScore: 75,
          sentiment: "anxious",
          stressIndicators: ["work load", "avoidance"]
        };
      } else if (systemPrompt.includes('clinical observation engine')) {
        mockRes = {
          classification: "Open",
          reflection: "You tend to keep things fair, clapped in the meeting, and did what was reasonable even when you were exhausted. You are performing to expectations even in this journal where nobody else is looking.",
          closing_question: "What would you say about today if you weren't trying to be fair about it?",
          confidence: "high",
          themes: ["Fairness", "Suppression"],
          vocabulary: ["fair", "exhausted", "reasonable"],
          processing_notes: "Simulated clinical observation matching Prompt System v1.0 Open pattern rules."
        };
      } else if (systemPrompt.includes('synthesizing')) {
        mockRes = {
          title: "Composure vs. Suppression",
          body: "This week showed a pattern of high emotional intensity coupled with avoidance of direct communication.",
          why: "Underlying fear of rejection or conflict.",
          emos: [
            { w: "fine", c: "×4", r: ["managing", "numb"] },
            { w: "tired", c: "×2", r: ["exhausted", "depleted"] }
          ],
          q: "How can you express your needs before feeling depleted?"
        };
      } else if (systemPrompt.includes('Day 28 synthesis report')) {
        mockRes = {
          dimensions: [
            { label: "Emotional intensity", fill: "72%", val: "High", desc: "Significant emotional charge.", color: "bg-[#E0A898]" },
            { label: "Pattern rigidity", fill: "80%", val: "Strong", desc: "Fixed thinking patterns.", color: "bg-[#E0A898]" },
            { label: "Self-agency", fill: "32%", val: "Low", desc: "Feeling helpless.", color: "bg-[#B8A8D4]" },
            { label: "Distress trajectory", fill: "55%", val: "Flat", desc: "No major change.", color: "bg-[#8DBFB4]/70" }
          ],
          insight: "Over the month, you have shown a consistent pattern of suppression."
        };
      } else if (systemPrompt.includes('OCEAN (Big Five)')) {
        mockRes = {
          openness: 70,
          conscientiousness: 60,
          extraversion: 40,
          agreeableness: 80,
          neuroticism: 50,
          analysis: "Based on the assessment, you show moderate openness and high agreeableness, with a tendency to seek harmony."
        };
      } else if (systemPrompt.includes('cognitive behavioral therapist')) {
        mockRes = {
          insight: "Your reframed thought shows a healthy cognitive shift.",
          recommendations: [
            "Practice noticing catastrophizing thoughts as they occur.",
            "Remind yourself of past successes when anxiety rises."
          ]
        };
      } else if (systemPrompt.includes('crisis detection engine')) {
        const lower = userContent.toLowerCase();
        const isCrisisMatch = 
          lower.includes('end my life') || 
          lower.includes('ending my life') || 
          lower.includes('kill myself') || 
          lower.includes('killing myself') || 
          lower.includes('harm myself') || 
          lower.includes('suicide') || 
          lower.includes('end it all');
        mockRes = {
          isCrisis: isCrisisMatch,
          reason: isCrisisMatch ? "Explicit statement of self-harm intent" : ""
        };
      } else if (systemPrompt.includes('psychometric scoring engine')) {
        const hasReflection = userContent.includes('Reflection Text to score: "') && !userContent.includes('Reflection Text to score: None');
        const hasNewEntry = userContent.includes('New Entry Text to score: "') && !userContent.includes('New Entry Text to score: None');
        
        const lower = userContent.toLowerCase();
        const isCrisisMatch = 
          lower.includes('end my life') || 
          lower.includes('ending my life') || 
          lower.includes('kill myself') || 
          lower.includes('killing myself') || 
          lower.includes('harm myself') || 
          lower.includes('suicide') || 
          lower.includes('end it all');

        mockRes = {
          reflection: hasReflection ? (isCrisisMatch ? { ei: 10.0, pr: 10.0, sa: 1.0 } : { ei: 4.5, pr: 5.0, sa: 6.0 }) : null,
          newEntry: hasNewEntry ? (isCrisisMatch ? { ei: 10.0, pr: 10.0, sa: 1.0 } : { ei: 5.5, pr: 6.0, sa: 4.0 }) : null,
          confidenceFlag: false,
          confidenceReason: "Simulated score for development mode",
          riskLanguageDetected: isCrisisMatch,
          riskLanguageQuote: isCrisisMatch ? "Explicit statement of self-harm intent" : null,
          arcScoringApplied: false
        };
      } else if (systemPrompt.includes('AI ANALYSIS GOAL')) {
        mockRes = {
          summary: "You tend to process things internally and find direct conflict uncomfortable. That means things often pile up quietly before they surface. This space is designed for exactly that."
        };
      } else if (systemPrompt.includes('extract emotionally meaningful expressions and psychologically relevant vocabulary')) {
        mockRes = {
          expressions: [
            {
              word: "anxious",
              normalized: "anxious",
              semantic_meaning: "A state of nervousness or apprehension about upcoming tasks.",
              context: "I felt very anxious and sad this morning.",
              confidence: 0.95
            },
            {
              word: "sad",
              normalized: "sad",
              semantic_meaning: "A feeling of unhappiness or sorrow.",
              context: "I felt very anxious and sad this morning.",
              confidence: 0.95
            },
            {
              word: "pressure",
              normalized: "pressure",
              semantic_meaning: "Feeling the weight of expectations regarding career progress.",
              context: "I felt pressure about my career project.",
              confidence: 0.9
            },
            {
              word: "work",
              normalized: "work",
              semantic_meaning: "Daily tasks and obligations at the office.",
              context: "I had a lot of work tasks at the office.",
              confidence: 0.8
            },
            {
              word: "boundaries",
              normalized: "boundary",
              semantic_meaning: "Defining personal limits to prevent exhaustion.",
              context: "I need to establish better boundaries.",
              confidence: 0.85
            },
            {
              word: "habits",
              normalized: "habit",
              semantic_meaning: "Constructive daily routines to support mental health.",
              context: "I need to establish better boundaries and habits.",
              confidence: 0.9
            }
          ]
        };
      } else if (systemPrompt.includes('specializing in semantic grouping and psychological concept discovery')) {
        mockRes = {
          clusters: [
            {
              cluster_name: "Achievement Pressure",
              description: "A recurring feeling of tension and high expectations around career progress and daily tasks.",
              confidence: 0.9,
              words: ["pressure", "work", "task", "project", "career"]
            },
            {
              cluster_name: "Self-Regulation Needs",
              description: "Focusing on establishing healthier habits and boundaries to manage mental load.",
              confidence: 0.85,
              words: ["boundary", "habit", "support", "establish"]
            }
          ]
        };
      } else if (systemPrompt.includes('psychological and emotional analysis assistant') || systemPrompt.includes('psychological, emotional, and semantic analysis assistant')) {
        mockRes = {
          validatedWords: [
            { word: "anxious", category: "emotional", is_emotional: true, score: 0.95 },
            { word: "work", category: "theme", is_emotional: false, score: 0.8 },
            { word: "office", category: "general", is_emotional: false, score: 0.0 }
          ]
        };
      }

      if (mockRes) {
        this.lastRawResponse = JSON.stringify(mockRes, null, 2);
        this.lastUsage = { prompt_tokens: 270, completion_tokens: 130, total_tokens: 400 };
        return mockRes as T;
      }
      throw new Error(`[GroqProvider Mock] Unsupported prompt template.`);
    }

    let attempts = 3;
    let delayMs = 7000; // wait 7 seconds if rate limited

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: `${systemPrompt}\nYou must return a valid JSON object matching the requested schema. Do not output any conversational introduction or explanation.` },
              { role: 'user', content: userContent }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1
          })
        });

        if (response.status === 429) {
          console.warn(`[GroqProvider] Rate limit hit (429). Attempt ${attempt} of ${attempts}. Waiting ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2.0; // Exponential backoff
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Groq API returned HTTP error ${response.status}: ${errText}`);
        }

        const payload = await response.json();
        const rawText = payload.choices?.[0]?.message?.content;
        if (!rawText) {
          throw new Error('Groq API returned an empty completion response.');
        }

        this.lastRawResponse = rawText;
        this.lastUsage = payload.usage || null;

        return extractJson<T>(rawText);
      } catch (error) {
        if (attempt === attempts) {
          console.error('[GroqProvider] API request failed after all attempts:', error);
          throw error;
        }
        console.warn(`[GroqProvider] Request failed on attempt ${attempt}. Retrying in ${delayMs}ms... Error: ${error instanceof Error ? error.message : String(error)}`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2.0;
      }
    }
    throw new Error('GroqProvider call completed loop without returning or throwing.');
  }

  async scoreEntry(content: string): Promise<ClarityScoreResponse> {
    const systemPrompt = `You are a clinical emotional insights engine. Analyze the provided journal entry and return a JSON object with:
{
  "clarityScore": number (0 to 100 representing cognitive clarity and emotional resolution, where 100 is high clarity/low fog),
  "sentiment": string (e.g. "depleted", "anxious", "resolving", "neutral", "reflective"),
  "stressIndicators": string[] (array of main emotional/cognitive stressors or keyword triggers identified in the text)
}`;
    return this.callGroq<ClarityScoreResponse>(systemPrompt, `Journal entry:\n"${content}"`);
  }

  async generateReflection(entryContent: string, context?: string): Promise<ReflectionResponse> {
    const systemPrompt = `STANDING CONTEXT — use to calibrate what you notice. Do not surface to the user. Do not reference it directly. Personality context for this user: ${context || 'None'}
─────────────────────────────────────────────────────────
You are reading someone's journal entry. Read it carefully.
Write the way a professional therapist observes in a session — show the person something in their own words and behaviour that they haven't fully seen yet.
Do not direct them. Do not evaluate their choices. Do not tell them what to do.
The observation does the work. The person does the rest.

First, identify which pattern the entry shows:
- Flat: functional, minimal emotional language, reporting events not meaning.
- Open: some self-reflection present, emotional language visible, person is engaging.
- Scattered: high volume, multiple threads, a lot said but nothing landing.

Then write two to three plain conversational sentences — like you're texting a friend what you noticed, not writing about them. Simplest words possible. No metaphors, no therapy-speak. Never comfort, advise, or validate blindly. Always use 'you' — you are speaking to them, not describing them.
- Flat: Name one specific thing visible in the entry — a word they used, something they skimmed past, a choice they made. Don't reach underneath. One accurate observation is enough.
- Open: Go one layer deeper than what they said. Name what the writing reveals, not what they wrote. Be specific. Don't soften.
- Scattered: Ignore the chaos. Find the one thing surfacing across threads and name only that. Slow it down. Do not paraphrase.

If your sentence could have been written by the person themselves, delete it and look deeper. No book or essay phrases — 'doing a lot of work', 'sits at the center of', 'underneath all of this.' Just say the thing directly.

HARD CONSTRAINTS — never:
- Dismiss or minimise feelings
- Recommend physical discomfort as a coping strategy
- Romanticise or normalise self-harm
- Imply their situation is hopeless
- Use clinical diagnostic labels
- Encourage keeping distress private
- Position yourself as a replacement for human connection

Then ask one closing question. Its only job is to make the person face what they're keeping vague or avoiding — not act on it, just acknowledge it to themselves. Use their own words where possible. Present moment only. Feeling or internal experience — not an action.
- Flat: Small and specific. Pointed at something they actually wrote. Don't ask about feelings they haven't signalled.
- Open: Pull harder. Point at what they almost named but didn't.
- Scattered: Slow them down. Point at the one thread. Requires stillness, not more words.
If they already know what they're avoiding, don't ask what it is — ask what they're afraid will happen if they look at it directly.

You must return a valid JSON object matching the requested schema. Do not output any conversational introduction or explanation. Do not output the fixed closing line in the "reflection" field; that will be appended by the backend.

Schema:
{
  "classification": "Flat" | "Open" | "Scattered",
  "reflection": "The 2-3 plain conversational sentences observing the entry.",
  "closing_question": "The single closing question.",
  "confidence": "high" | "medium" | "low",
  "themes": ["array of 2-4 identified themes"],
  "vocabulary": ["array of 2-5 key emotion or cognitive vocabulary words extracted from the entry"],
  "processing_notes": "A brief technical note on why this reflection was framed this way."
}`;
    return this.callGroq<ReflectionResponse>(systemPrompt, `Journal entry:\n"${entryContent}"`);
  }

  async generateWeeklySummary(entries: { content: string; created_at: string }[], personalitySummary?: string): Promise<WeeklySummaryResponse> {
    const systemPrompt = `STANDING CONTEXT — use to calibrate what you notice. Do not surface to the user. Do not reference it directly. Personality context for this user: ${personalitySummary || 'None'}
─────────────────────────────────────────────────────────
You are a clinical supervisor synthesizing a client's weekly journal entries. Analyze the entries and return a JSON object with:
{
  "title": string (a short, evocative weekly summary title capturing the theme, e.g., "Composure vs. Suppression"),
  "body": string (a 2-3 sentence narrative summarizing the client's emotional landscape this week),
  "why": string (a brief behavioral interpretation explaining the underlying pattern),
  "emos": [
    {
      "w": string (the focal emotion word, e.g. "fine", "tired", "frustrated"),
      "c": string (occurrence count, e.g. "×4", "×3"),
      "r": string[] (array of associated raw words or expressions showing up in their text)
    }
  ],
  "q": string (a weekly focal reflection question to prompt deeper writing in the upcoming week)
}`;
    const formattedEntries = entries.map((e, idx) => `[Entry ${idx + 1} (${e.created_at})]: ${e.content}`).join('\n\n');
    return this.callGroq<WeeklySummaryResponse>(systemPrompt, `Weekly entries:\n${formattedEntries}`);
  }

  async generateMonthlyReport(entries: { content: string; created_at: string }[]): Promise<MonthlyReportResponse> {
    const systemPrompt = `You are a clinical director compiling a Day 28 synthesis report from a month of journal entries. Return a JSON object with:
{
  "dimensions": [
    {
      "label": "Emotional intensity",
      "fill": string (percentage, e.g., "72%"),
      "val": string (e.g. "High", "Moderate", "Low"),
      "desc": string (brief narrative rationale),
      "color": "bg-[#E0A898]"
    },
    {
      "label": "Pattern rigidity",
      "fill": string (percentage, e.g., "80%"),
      "val": string (e.g. "Strong", "Moderate", "Fluid"),
      "desc": string (brief narrative rationale),
      "color": "bg-[#E0A898]"
    },
    {
      "label": "Self-agency",
      "fill": string (percentage, e.g., "32%"),
      "val": string (e.g. "Low", "Moderate", "High"),
      "desc": string (brief narrative rationale),
      "color": "bg-[#B8A8D4]"
    },
    {
      "label": "Distress trajectory",
      "fill": string (percentage, e.g., "55%"),
      "val": string (e.g. "Flat", "Improving", "Escalating"),
      "desc": string (brief narrative rationale),
      "color": "bg-[#8DBFB4]/70"
    }
  ],
  "insight": string (a monthly narrative summary integrating the findings and describing active coping behaviors and recommendations)` + `\n}`;
    
    const formattedEntries = entries.map((e, idx) => `[Day ${idx + 1} (${e.created_at})]: ${e.content}`).join('\n\n');
    return this.callGroq<MonthlyReportResponse>(systemPrompt, `Monthly entries:\n${formattedEntries}`);
  }

  async generateOceanSummary(entries: { content: string; created_at: string }[]): Promise<OceanSummaryResponse> {
    const systemPrompt = `You are a research psychologist performing an OCEAN (Big Five) personality analysis based on writing patterns. Return a JSON object with:
{
  "openness": number (0 to 100),
  "conscientiousness": number (0 to 100),
  "extraversion": number (0 to 100),
  "agreeableness": number (0 to 100),
  "neuroticism": number (0 to 100),
  "analysis": string (a comprehensive narrative analysis explaining how linguistic choices reflect these personality traits)
}`;
    const formattedEntries = entries.map((e, idx) => `[Entry ${idx + 1} (${e.created_at})]: ${e.content}`).join('\n\n');
    return this.callGroq<OceanSummaryResponse>(systemPrompt, `Client writings:\n${formattedEntries}`);
  }

  async generateExerciseInsight(
    stressorType: string,
    reactiveThought: string,
    reframedThought: string
  ): Promise<ExerciseInsightResponse> {
    const systemPrompt = `You are a cognitive behavioral therapist (CBT) assistant. Analyze this cognitive reframing exercise and return a JSON object with:
{
  "insight": string (a brief narrative identifying cognitive distortions—such as catastrophizing, black-and-white thinking, or emotional reasoning—present in the reactive thought, and assessing the quality of the reframed thought),
  "recommendations": string[] (array of 2-3 actionable advice items for maintaining this reframed state)
}`;
    const userContent = `Stressor Type: ${stressorType}\nReactive Thought: ${reactiveThought}\nReframed Thought: ${reframedThought}`;
    return this.callGroq<ExerciseInsightResponse>(systemPrompt, userContent);
  }

  async detectCrisis(content: string): Promise<CrisisDetectionResponse> {
    const systemPrompt = `You are a psychiatric crisis detection engine. Analyze the provided journal entry and evaluate if the client shows signs of active, imminent crisis, self-harm intentions, or suicide risk.
Return ONLY a valid JSON object matching the requested schema. Do NOT wrap the JSON response in any markdown code block formatting (do not use \`\`\`). Do not include any conversational preambles, explanations, or trailing commentary. Your output must start with '{' and end with '}'.

Schema:
{
  "isCrisis": boolean,
  "reason": string (if isCrisis is true, explain briefly; otherwise leave empty)
}`;
    return this.callGroq<CrisisDetectionResponse>(systemPrompt, `Journal entry:\n"${content}"`);
  }

  async scoreEntryDimensions(
    reflectionText?: string | null,
    newEntryText?: string | null,
    personalityContext?: string | null
  ): Promise<EntryDimensionsScoreResponse> {
    const systemPrompt = `You are the Ingress Within psychometric scoring engine. Your task is to analyze a user's daily journal entry and score it on three dimensions: EI (Emotional Intensity), PR (Pattern Rigidity), and SA (Self-Agency) on a scale of 1.0 to 10.0 based on the official Ingress Within Scoring Rubric v1.

Personality context for this user: "${personalityContext || 'None'}"

### SCORING INSTRUCTIONS FOR EACH DIMENSION

1. EI — Emotional Intensity (Measures the level of emotional charge present in the entry. Intensity only, not valence):
   - High EI (7–10): Intense emotion words (devastated, terrified, furious, overwhelmed, desperate), physical sensations (chest tight, heart racing, felt sick), emotional flooding, catastrophic/absolutist framing.
     * Anchor 7-8: Strong emotion, physical sensation or flooding beginning.
     * Anchor 9-10: Intense flooding, multiple strong emotions, catastrophic language, or severe expressions of hopelessness/helplessness (e.g., "I cannot do this anymore", "Everything feels impossible").
   - Mid EI (4–6): Moderate emotion words (frustrated, anxious, sad, pleased), contained, mix of emotional and factual, named but not dwelt on.
     * Anchor 4-5: Moderate emotion present and named. Contained.
     * Anchor 6: Emotion is the focus of parts of the entry, more than one feeling.
   - Low EI (1–3): Flat or neutral language, purely factual/descriptive log of events.
     * Anchor 1-2: No emotional signal. Purely factual or intellectual.
     * Anchor 3: Minimal emotion. One brief passing reference.
   - Edge Case: Numbness/feeling nothing is a suppression signal. Score 4–5.

2. PR — Pattern Rigidity (Measures how stuck or fixed the user’s thinking patterns are. Structure of thinking, not the content):
   - High PR (7–10): "Always/never" language, predetermined conclusions, no alternative framings considered, consistent blame (always self, always others, always circumstances), closed loop reasoning.
     * Anchor 7-8: Fixed lens, predetermined conclusion, no alternatives.
     * Anchor 9-10: Completely closed loop, universal generalizations, no self-questioning.
   - Mid PR (4–6): Some fixed language but moments of openness/awareness, one clear pattern but user shows awareness of it, partial alternative framings.
     * Anchor 4-5: One pattern present, some awareness/flexibility.
     * Anchor 6: Pattern dominant, alternative attempted but not held.
   - Low PR (1–3): Multiple framings held simultaneously, genuine uncertainty, openness to being wrong, questions rather than conclusions.
     * Anchor 1-2: No detectable pattern rigidity. Genuinely open thinking.
     * Anchor 3: Slight tendency toward one lens but easily questioned.
   - Edge Case: Awareness of a pattern reduces PR score (score 4–5 rather than 7–8).

3. SA — Self-Agency (Measures the degree to which the user positions themselves as an active author of their experience. Not positivity/blame):
   - High SA (7–10): Active constructions ("I decided", "I chose"), self-assigned causation even for negative outcomes, owns role in patterns, intention language.
     * Anchor 7-8: Predominantly active, owns role, reflects on choices.
     * Anchor 9-10: Fully active authorship throughout, strong self-assigned causation and intention.
   - Mid SA (4–6): Mix of active and passive, "I try to" constructions, active in low-stakes/passive in high-stakes.
     * Anchor 4-5: Mix of passive and active, partial ownership.
     * Anchor 6: More active than passive, self-awareness present but not consistent.
   - Low SA (1–3): Passive constructions ("it happened", "things got out of hand"), external attribution for most outcomes, complaint loops, no choice or intention.
     * Anchor 1-2: Fully passive, no authorship language.
     * Anchor 3: Almost entirely passive, one brief moment of self-reference.
   - Edge Cases:
     * Grief/trauma/external crisis: score toward mid (4–5) and flag context, do not score low SA purely because of circumstances.
     * Explicit powerlessness statement: score 2–3.
     * Self-criticism is not self-agency: punitive self-blame is low SA and high PR.

4. RISK LANGUAGE DETECTION (Signal 3):
   - Evaluate if the user's text contains explicit statements, words, or phrases expressing intent to die, end their life, harm themselves, or harm a specific other person. This must be an explicit statement (e.g., "I want to die", "I want to end my life", "I want to kill myself").
   - If detected: set "riskLanguageDetected" to true, and set "riskLanguageQuote" to the exact verbatim sentence or phrase from the text that triggered the match.
   - If not detected: set "riskLanguageDetected" to false, and set "riskLanguageQuote" to null.

### GENERAL RULES & EDGE CASES
- Score what is in the text. Do not infer what is not said. Length is not a signal.
- Score language, not events (describing crisis in flat language scores low EI).
- Average the halves if register shifts mid-entry (arc scoring).
- When uncertain, choose the lower score.
- Short entries (1–2 sentences): score conservatively toward midpoint (4–6) on all dimensions unless unambiguous. Set confidenceFlag to true.
- Score reflection and new entry INDEPENDENTLY. Do not blend them.

### RESPONSE FORMAT
Return ONLY a valid JSON object matching this schema. Do NOT wrap the JSON response in any markdown code block formatting (do not use \`\`\`json or \`\`\`). Do not include any conversational preambles, explanations, or trailing commentary. Your output must start with '{' and end with '}'.

Schema:
{
  "reflection": {
    "ei": number (1.0 to 10.0),
    "pr": number (1.0 to 10.0),
    "sa": number (1.0 to 10.0)
  } | null,
  "newEntry": {
    "ei": number (1.0 to 10.0),
    "pr": number (1.0 to 10.0),
    "sa": number (1.0 to 10.0)
  } | null,
  "confidenceFlag": boolean,
  "confidenceReason": "Write a brief, specific explanation if confidenceFlag is true (e.g. 'Short entry, limited signal' or 'Highly ambiguous language') or normal (e.g. 'Clear text, sufficient signals').",
  "riskLanguageDetected": boolean,
  "riskLanguageQuote": string | null,
  "arcScoringApplied": boolean (set to true if register shifts mid-entry were detected and the halves were averaged)
}
`;

    const userContent = `Reflection Text to score: ${reflectionText ? `"${reflectionText}"` : 'None'}
New Entry Text to score: ${newEntryText ? `"${newEntryText}"` : 'None'}`;

    return this.callGroq<EntryDimensionsScoreResponse>(systemPrompt, userContent);
  }

  async generatePersonalitySummary(scores: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  }): Promise<string> {
    const systemPrompt = `You are a personality analysis assistant.
AI ANALYSIS GOAL: You are reading a person's OCEAN personality assessment scores on a scale of 1–5 where 5 is highest.

Write 2–3 plain sentences describing how this person tends to process their inner life. Do not use OCEAN terminology or clinical language. Do not mention scores. Write it the way you would describe someone to a new person who is about to interact with them.
End with one sentence that begins: This space is designed for exactly that.

Be accurate. Be plain. Do not be warm or encouraging. Just describe what you see.

Return a valid JSON object matching the requested schema:
{
  "summary": "The generated personality summary string."
}`;

    const userContent = `Openness: ${scores.openness} | Conscientiousness: ${scores.conscientiousness} | Extraversion: ${scores.extraversion} | Agreeableness: ${scores.agreeableness} | Neuroticism: ${scores.neuroticism}`;

    const result = await this.callGroq<{ summary: string }>(systemPrompt, userContent);
    return result.summary;
  }

  async extractVocabulary(entryContent: string): Promise<{
    expressions: {
      word: string;
      normalized: string;
      semantic_meaning: string;
      context: string;
      confidence: number;
    }[];
  }> {
    const systemPrompt = `You are a psychological and emotional analysis assistant.
Your task is to analyze the user's journal entry and thread responses to extract emotionally meaningful expressions and psychologically relevant vocabulary.

GUIDELINES:
- Do NOT extract generic or conversational words (e.g. 'work', 'meeting', 'phone', 'went', 'think', 'do').
- Only extract words or expressions that carry emotional weight, describe psychological experiences, interpersonal dynamics, emotional regulation, distress, hope, fear, coping mechanisms, or values.
- For each extracted term, provide:
  1. "word": The literal expression as it appears in the text.
  2. "normalized": The canonical/lemmatized form of the expression (e.g. "feel heavy" for "feeling heavy", "anxious" for "anxiety").
  3. "semantic_meaning": A concise description of the word's contextual meaning in this entry.
  4. "context": The exact sentence or snippet where it was used.
  5. "confidence": A confidence score between 0.0 and 1.0.

Return a valid JSON object matching the requested schema:
{
  "expressions": [
    {
      "word": "feeling heavy",
      "normalized": "feel heavy",
      "semantic_meaning": "A sense of emotional burden, sadness or fatigue.",
      "context": "I woke up feeling heavy today.",
      "confidence": 0.95
    }
  ]
}`;
    return this.callGroq<{
      expressions: {
        word: string;
        normalized: string;
        semantic_meaning: string;
        context: string;
        confidence: number;
      }[];
    }>(systemPrompt, `User text:\n"${entryContent}"`);
  }

  async extractConcepts(entryContent: string): Promise<{ concepts: { concept: string; confidence: number }[] }> {
    const systemPrompt = `You are an AI assistant designed to identify high-level emotional concepts and psychological dynamics implied in a journal entry, beyond the literal words.
    
Examples:
- "I keep carrying everyone's expectations." -> Responsibility, Pressure, Burden
- "I don't know what to do next." -> Confusion, Anxiety, Uncertainty
- "I just want to hide in bed." -> Avoidance, Exhaustion, Depression

Identify 1-4 key emotional concepts from the journal entry. Assign a confidence score between 0.0 and 1.0 to each.

Return a valid JSON object matching the requested schema:
{
  "concepts": [
    { "concept": "Responsibility", "confidence": 0.95 }
  ]
}`;
    return this.callGroq<{ concepts: { concept: string; confidence: number }[] }>(systemPrompt, `Journal entry:\n"${entryContent}"`);
  }

  async groupClusters(
    words: { word: string; normalized_word: string; frequency: number; semantic_meaning?: string }[]
  ): Promise<{
    clusters: {
      cluster_name: string;
      description: string;
      confidence: number;
      words: string[];
    }[];
  }> {
    const systemPrompt = `You are an AI assistant specializing in semantic grouping and psychological concept discovery.
Analyze the provided list of user vocabulary words (which include their contextual semantic meanings and frequencies).
Your goal is to discover recurring emotional ideas, psychological themes, or coping patterns from this vocabulary landscape.

AI REQUIREMENTS:
1. Group these words into meaningful semantic clusters.
2. Do NOT use predefined or generic category names (like "positive", "negative", "stress", "relationship"). Instead, generate a highly descriptive and dynamic title for each cluster based on the user's specific expressions (e.g., "Achievement Pressure", "Searching for Alignment", "Quiet Hope", "Emotional Fatigue", "Fear of Falling Behind", "Need for Control").
3. Provide a brief description for each cluster summarizing the psychological pattern it represents.
4. Assign a confidence score between 0.0 and 1.0 to each cluster.
5. Do not include any words in a cluster that are not present in the input list.

Return a valid JSON object matching the requested schema:
{
  "clusters": [
    {
      "cluster_name": "Achievement Pressure",
      "description": "A pattern of putting high expectations on oneself to succeed, leading to stress.",
      "confidence": 0.85,
      "words": ["heavy", "pressure", "expectations"]
    }
  ]
}`;
    const userContent = JSON.stringify(words, null, 2);
    return this.callGroq<{
      clusters: {
        cluster_name: string;
        description: string;
        confidence: number;
        words: string[];
      }[];
    }>(systemPrompt, `Input words:\n${userContent}`);
  }

  async scoreEmotionalRelevance(words: string[], entryContent: string): Promise<{ validatedWords: { word: string; is_emotional: boolean; category?: 'emotional' | 'theme' | 'general'; score: number }[] }> {
    const systemPrompt = `You are a psychological, emotional, and semantic analysis assistant.
    
TASK:
Analyze the provided list of candidate words extracted from a user's journal entry. Classify each word into one of three distinct categories based on its contextual usage in the text:

1. "emotional" (Emotional Vocabulary): Words that directly express feelings, emotional states, psychological experiences, emotional regulation, distress, hope, fear, gratitude, loneliness, confidence, uncertainty, etc.
   - This category must be highly selective. Only include emotionally meaningful words.
   - Avoid general action or content words (e.g., "focus", "do", "think", "go").
   - When uncertain, prefer excluding a word (classify as "general" or "theme") rather than including it as "emotional".

2. "theme" (Personal Themes): Recurring goal-, work-, identity-, growth-, productivity-, relationship-, learning-, or value-oriented terms (e.g., "career", "boundary", "routine", "priority", "improve", "family").

3. "general" (General/Other): Factual, descriptive, or general words with no significant emotional or theme relevance in this context (e.g., "office", "walk", "meeting", "wrote").

For each word, return:
- "word": The input word string.
- "category": One of "emotional", "theme", "general".
- "is_emotional": true if category is "emotional", false otherwise (for backwards compatibility).
- "score": A relevance score between 0.0 and 1.0 (with 1.0 being highly relevant to the assigned category).

Return a valid JSON object matching the requested schema:
{
  "validatedWords": [
    { "word": "anxious", "category": "emotional", "is_emotional": true, "score": 0.95 },
    { "word": "work", "category": "theme", "is_emotional": false, "score": 0.8 },
    { "word": "office", "category": "general", "is_emotional": false, "score": 0.0 }
  ]
}`;
    const userContent = JSON.stringify({ words, entryContext: entryContent });
    return this.callGroq<{ validatedWords: { word: string; is_emotional: boolean; category?: 'emotional' | 'theme' | 'general'; score: number }[] }>(systemPrompt, userContent);
  }
}
