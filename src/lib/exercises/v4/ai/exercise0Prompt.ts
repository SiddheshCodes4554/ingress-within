import { ExerciseResponse } from '../types/exercise.types';
import { EXERCISE_0_QUESTIONS } from '../definitions/exercise0Catalog';

export interface Exercise0AnalysisResult {
  summary: string;
  cognitive_style: string;
  emotional_resilience_score: number;
  pattern_awareness_score: number;
  values_alignment_score: number;
  key_insights: string[];
  recommendations: string[];
}

export class Exercise0Prompt {
  public static buildPrompt(responses: ExerciseResponse[]): { system: string; user: string } {
    const responseMap: Record<string, any> = {};
    responses.forEach(r => {
      responseMap[r.question_id] = r.response;
    });

    const formattedQA = EXERCISE_0_QUESTIONS.map(q => {
      const ans = responseMap[q.id] !== undefined ? responseMap[q.id] : 'No answer provided';
      return `Question (${q.id}): "${q.title}"\nUser Answer: ${typeof ans === 'object' ? JSON.stringify(ans) : ans}`;
    }).join('\n\n');

    const system = `You are an expert psychological and cognitive scientist conducting a baseline psychological analysis for a user's reflective journey.
Analyze the user's responses to the initial baseline exercise and provide a structured JSON assessment.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON conforming to the exact schema specified below.
2. Scores (emotional_resilience_score, pattern_awareness_score, values_alignment_score) MUST be integers between 1 and 100.
3. The summary must provide an insightful, empathetic, and professional synthesis of their baseline state (120-180 words).
4. key_insights must contain exactly 3 concise, highly relevant observations.
5. recommendations must contain exactly 2 actionable guidance points.

REQUIRED JSON SCHEMA:
{
  "summary": "String synthesis of baseline cognitive & emotional state...",
  "cognitive_style": "String summary of internal processing style...",
  "emotional_resilience_score": 82,
  "pattern_awareness_score": 75,
  "values_alignment_score": 88,
  "key_insights": ["Insight 1", "Insight 2", "Insight 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    const user = `Here are the user's baseline exercise responses:\n\n${formattedQA}\n\nProvide the baseline psychological analysis JSON object.`;

    return { system, user };
  }

  public static validateJSON(raw: any): Exercise0AnalysisResult {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Invalid AI response: output is not a JSON object.');
    }

    if (typeof raw.summary !== 'string' || !raw.summary.trim()) {
      throw new Error('Invalid AI JSON: missing or empty "summary".');
    }

    if (typeof raw.cognitive_style !== 'string' || !raw.cognitive_style.trim()) {
      raw.cognitive_style = 'Balanced analytical and intuitive reflective style';
    }

    raw.emotional_resilience_score = Number(raw.emotional_resilience_score) || 75;
    raw.pattern_awareness_score = Number(raw.pattern_awareness_score) || 75;
    raw.values_alignment_score = Number(raw.values_alignment_score) || 75;

    if (!Array.isArray(raw.key_insights) || raw.key_insights.length === 0) {
      raw.key_insights = ['Demonstrates foundational emotional self-awareness.'];
    }

    if (!Array.isArray(raw.recommendations) || raw.recommendations.length === 0) {
      raw.recommendations = ['Continue daily reflective journal entries.'];
    }

    return {
      summary: raw.summary.trim(),
      cognitive_style: raw.cognitive_style.trim(),
      emotional_resilience_score: Math.min(100, Math.max(1, raw.emotional_resilience_score)),
      pattern_awareness_score: Math.min(100, Math.max(1, raw.pattern_awareness_score)),
      values_alignment_score: Math.min(100, Math.max(1, raw.values_alignment_score)),
      key_insights: raw.key_insights.map((s: any) => String(s).trim()),
      recommendations: raw.recommendations.map((s: any) => String(s).trim())
    };
  }
}
