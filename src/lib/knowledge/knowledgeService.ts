import { supabase } from '../db';
import { aiProvider } from '../ai/factory';
import crypto from 'crypto';

export interface KnowledgeProfile {
  user_id: string;
  identity_model: any;
  emotion_model: any;
  vocabulary_model: any;
  pattern_model: any;
  agency_model: any;
  relationship_model: any;
  decision_model: any;
  growth_model: any;
  communication_model: any;
  knowledge_version: string;
  updated_at?: string;
}

export interface KnowledgeCard {
  id?: string;
  user_id: string;
  card_type: string;
  title: string;
  content: string;
  json_data: any;
  version: string;
  generated_from_event?: string;
  created_at?: string;
  updated_at?: string;
}

export class KnowledgeService {
  /**
   * Emits a new knowledge event into the database and triggers queue processing.
   */
  public static async emitKnowledgeEvent(
    userId: string,
    cycleId: string | null,
    entryId: string | null,
    eventType: string,
    source: string,
    payload: any
  ): Promise<any> {
    console.log(`[Knowledge Service] Emitting event ${eventType} for user ${userId}`);

    const { data: event, error } = await supabase
      .from('knowledge_events')
      .insert({
        user_id: userId,
        cycle_id: cycleId || null,
        entry_id: entryId || null,
        event_type: eventType,
        source: source,
        payload: payload || {},
        version: '1.0',
        processed: false
      })
      .select()
      .single();

    if (error) {
      console.error(`[Knowledge Service] Failed to insert knowledge event:`, error.message);
      throw error;
    }

    // Trigger the background worker processing for this event
    try {
      const { triggerKnowledgeProcessing } = await import('../queue/triggers');
      await triggerKnowledgeProcessing(event.id, userId, cycleId, entryId);
    } catch (triggerErr: any) {
      console.error(`[Knowledge Service] Failed to trigger background processing:`, triggerErr.message);
    }

    return event;
  }

  /**
   * Main entrypoint for processing a knowledge event in the background.
   * Performs idempotency check, updates profile, and regenerates cards.
   */
  public static async processKnowledgeEvent(eventId: string): Promise<void> {
    console.log(`[Knowledge Service] Processing event ${eventId}`);

    // 1. Fetch the event
    const { data: event, error: fetchErr } = await supabase
      .from('knowledge_events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle();

    if (fetchErr) {
      throw new Error(`Failed to fetch event: ${fetchErr.message}`);
    }

    if (!event) {
      console.warn(`[Knowledge Service] Event ${eventId} not found in database.`);
      return;
    }

    // Idempotency Guard: skip if already processed
    if (event.processed) {
      console.log(`[Knowledge Service] Event ${eventId} has already been processed. Skipping.`);
      return;
    }

    const userId = event.user_id;

    // 2. Fetch the current knowledge profile
    const { data: existingProfile, error: profileErr } = await supabase
      .from('knowledge_profile')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileErr) {
      throw new Error(`Failed to fetch knowledge profile: ${profileErr.message}`);
    }

    const currentProfile: KnowledgeProfile = existingProfile || {
      user_id: userId,
      identity_model: {},
      emotion_model: {},
      vocabulary_model: {},
      pattern_model: {},
      agency_model: {},
      relationship_model: {},
      decision_model: {},
      growth_model: {},
      communication_model: {},
      knowledge_version: '1.0'
    };

    // 3. Update the knowledge profile models using AI
    console.log(`[Knowledge Service] Updating knowledge profile models via AI for user ${userId}...`);
    const updatedModels = await this.updateProfileModelsWithAI(currentProfile, event);

    const updatedProfile: KnowledgeProfile = {
      ...currentProfile,
      ...updatedModels,
      updated_at: new Date().toISOString()
    };

    // Save updated profile
    const { error: upsertErr } = await supabase
      .from('knowledge_profile')
      .upsert(updatedProfile);

    if (upsertErr) {
      throw new Error(`Failed to save updated knowledge profile: ${upsertErr.message}`);
    }
    console.log(`[Knowledge Service] Successfully saved knowledge profile for user ${userId}.`);

    // 4. If the event is WeeklyReportGenerated, save a snapshot and regenerate knowledge cards
    if (event.event_type === 'WeeklyReportGenerated') {
      const weekNumber = event.payload?.week_number || 1;
      
      console.log(`[Knowledge Service] Generating weekly snapshot for week ${weekNumber}...`);
      const { error: snapErr } = await supabase
        .from('knowledge_snapshots')
        .insert({
          user_id: userId,
          week_number: weekNumber,
          snapshot: updatedProfile
        });

      if (snapErr) {
        console.error(`[Knowledge Service] Failed to save weekly snapshot:`, snapErr.message);
      }

      console.log(`[Knowledge Service] Regenerating user knowledge cards...`);
      await this.regenerateKnowledgeCards(userId, updatedProfile, eventId);
    }

    // 5. Mark event as processed (idempotency update)
    const { error: updateErr } = await supabase
      .from('knowledge_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (updateErr) {
      console.error(`[Knowledge Service] Failed to mark event ${eventId} as processed:`, updateErr.message);
    } else {
      console.log(`[Knowledge Service] Event ${eventId} marked as processed.`);
    }
  }

  /**
   * Calls AI to evolve the 9 profile models based on the new event payload.
   */
  private static async updateProfileModelsWithAI(
    current: KnowledgeProfile,
    event: any
  ): Promise<Partial<KnowledgeProfile>> {
    const prompt = `You are the core Knowledge Intelligence Engine for Ingress Within, a therapeutic writing platform.
Your task is to update the long-term knowledge profile of the user based on the current profile models and a new system event.

CURRENT KNOWLEDGE MODELS:
- identity_model: ${JSON.stringify(current.identity_model)}
- emotion_model: ${JSON.stringify(current.emotion_model)}
- vocabulary_model: ${JSON.stringify(current.vocabulary_model)}
- pattern_model: ${JSON.stringify(current.pattern_model)}
- agency_model: ${JSON.stringify(current.agency_model)}
- relationship_model: ${JSON.stringify(current.relationship_model)}
- decision_model: ${JSON.stringify(current.decision_model)}
- growth_model: ${JSON.stringify(current.growth_model)}
- communication_model: ${JSON.stringify(current.communication_model)}

NEW EVENT:
- event_type: ${event.event_type}
- source: ${event.source}
- payload: ${JSON.stringify(event.payload)}

INSTRUCTIONS:
1. Review the new event. Evolve and update the 9 models in the user's profile.
2. Maintain long-term understanding. Do not delete historical knowledge unless the new event explicitly corrects it or shows a significant shift.
3. Keep descriptions and summaries grounded strictly in the user's actual history and events.
4. STRICT TONE REQUIREMENT: Write all summaries, traits, and descriptions in either the first-person ("I", "my") or address the user directly as "you" ("your"). NEVER refer to the writer in the third person (e.g. "the user", "the writer", "he/she", "they").
5. Return ONLY a valid JSON object matching the schema below. Do not include markdown code block formatting (e.g. \`\`\`json), no preamble, no explanation.

JSON SCHEMA:
{
  "identity_model": {
    "core_narrative": "1-2 sentences summarizing how they describe themselves and their story",
    "persona_traits": ["trait1", "trait2"]
  },
  "emotion_model": {
    "dominant_states": ["emotion1", "emotion2"],
    "triggers": ["trigger1", "trigger2"],
    "defense_mechanisms": ["mechanism1", "mechanism2"]
  },
  "vocabulary_model": {
    "preferred_descriptors": ["word1", "word2"],
    "linguistic_clusters": ["cluster1", "cluster2"]
  },
  "pattern_model": {
    "active_patterns": ["pattern1", "pattern2"],
    "evolution": "Description of how their behavioral patterns are changing"
  },
  "agency_model": {
    "locus_of_control": "internal / external / mixed",
    "self_efficacy_rating": "low / medium / high",
    "observations": "1-2 sentences about how much control they feel they have over their life"
  },
  "relationship_model": {
    "dynamics": "Relational behaviors and boundaries",
    "relational_triggers": ["trigger1"]
  },
  "decision_model": {
    "choice_making_behavior": "Description of how they face choices or dilemmas",
    "core_values": ["value1", "value2"]
  },
  "growth_model": {
    "insights_achieved": ["insight1"],
    "growth_areas": ["area1"]
  },
  "communication_model": {
    "conversational_style": "Description of their expression, defensiveness, or transparency"
  }
}`;

    try {
      const response = await aiProvider.callRaw(prompt);
      let cleaned = response.trim();
      if (cleaned.startsWith('```')) {
        const lines = cleaned.split('\n');
        cleaned = lines.slice(1, -1).join('\n').trim();
      }
      return JSON.parse(cleaned);
    } catch (err: any) {
      console.error(`[Knowledge Service] AI profile update error:`, err.message || err);
      // Fallback: return unchanged models
      return {
        identity_model: current.identity_model,
        emotion_model: current.emotion_model,
        vocabulary_model: current.vocabulary_model,
        pattern_model: current.pattern_model,
        agency_model: current.agency_model,
        relationship_model: current.relationship_model,
        decision_model: current.decision_model,
        growth_model: current.growth_model,
        communication_model: current.communication_model
      };
    }
  }

  /**
   * Regenerates a set of user knowledge cards using the updated profile.
   */
  private static async regenerateKnowledgeCards(
    userId: string,
    profile: KnowledgeProfile,
    eventId: string
  ): Promise<void> {
    const prompt = `You are the core Knowledge Intelligence Engine for Ingress Within, a therapeutic writing platform.
Based on the user's updated long-term knowledge profile, generate a set of 3 to 4 distinct user-facing "Knowledge Cards".
Each card should represent a deep, therapeutic insight about their long-term identity, patterns, growth, relationships, or values.

USER KNOWLEDGE PROFILE:
${JSON.stringify(profile, null, 2)}

INSTRUCTIONS:
1. Generate between 3 and 4 knowledge cards.
2. Each card must have:
   - A standard type (e.g. "identity", "patterns", "relationships", "growth", "decisions").
   - A supportive, descriptive title.
   - A content paragraph (2-4 sentences) presenting the insight.
   - STRICT TONE REQUIREMENT: Write the card content in either the first-person ("I", "my") or address the user directly as "you" ("your"). NEVER refer to the writer in the third person (e.g. "the user", "the writer", "he/she", "they").
3. Return ONLY a valid JSON array of card objects. Do not include markdown code block formatting (e.g. \`\`\`json), no preamble, no explanation.

JSON SCHEMA:
[
  {
    "card_type": "patterns",
    "title": "Conflict Avoidance & Self-Pressure",
    "content": "You notice that you put significant pressure on yourself to keep the peace. When tensions arise in your daily routines, your default reflex is to stay quiet to protect others from disappointment.",
    "json_data": {
      "key_indicators": ["suppressed expression", "high emotional intensity"]
    }
  }
]`;

    try {
      const response = await aiProvider.callRaw(prompt);
      let cleaned = response.trim();
      if (cleaned.startsWith('```')) {
        const lines = cleaned.split('\n');
        cleaned = lines.slice(1, -1).join('\n').trim();
      }
      
      const cards: any[] = JSON.parse(cleaned);
      if (Array.isArray(cards)) {
        // Clear old cards for the user to prevent duplication
        const { error: deleteErr } = await supabase
          .from('knowledge_cards')
          .delete()
          .eq('user_id', userId);

        if (deleteErr) {
          throw deleteErr;
        }

        // Insert new cards
        const dbCards = cards.map(c => ({
          user_id: userId,
          card_type: c.card_type,
          title: c.title,
          content: c.content,
          json_data: c.json_data || {},
          version: '1.0',
          generated_from_event: eventId
        }));

        const { error: insertErr } = await supabase
          .from('knowledge_cards')
          .insert(dbCards);

        if (insertErr) {
          console.error(`[Knowledge Service] Failed to insert knowledge cards:`, insertErr.message);
        } else {
          console.log(`[Knowledge Service] Successfully generated and saved ${dbCards.length} knowledge cards for user ${userId}.`);
        }
      }
    } catch (err: any) {
      console.error(`[Knowledge Service] AI card generation error:`, err.message || err);
    }
  }
}
