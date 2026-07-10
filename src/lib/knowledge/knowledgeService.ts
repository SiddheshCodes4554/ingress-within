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

  /**
   * Performs an idempotent, resumable, and progress-tracked historical backfill for a single user.
   */
  public static async backfillUser(userId: string, force: boolean = false): Promise<any> {
    console.log(`[Knowledge Service] Initiating backfill for user ${userId} (force: ${force})`);

    // 1. If force flag is active, delete existing knowledge data
    if (force) {
      console.log(`[Knowledge Service] Force flag active. Purging existing knowledge data for user ${userId}...`);
      await supabase.from('knowledge_cards').delete().eq('user_id', userId);
      await supabase.from('knowledge_snapshots').delete().eq('user_id', userId);
      await supabase.from('knowledge_profile').delete().eq('user_id', userId);
      await supabase.from('knowledge_events').delete().eq('user_id', userId);
      await supabase.from('knowledge_backfill_status').delete().eq('user_id', userId);
    }

    // 2. Fetch or create backfill progress record
    const { data: existingProgress } = await supabase
      .from('knowledge_backfill_status')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingProgress?.status === 'completed' && !force) {
      console.log(`[Knowledge Service] Backfill for user ${userId} already completed. Skipping.`);
      return existingProgress;
    }

    if (!existingProgress) {
      await supabase
        .from('knowledge_backfill_status')
        .insert({
          user_id: userId,
          status: 'pending',
          updated_at: new Date().toISOString()
        });
    }

    // Mark as processing
    await supabase
      .from('knowledge_backfill_status')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        current_step: 'compiling_events',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    try {
      // 3. Fetch historical source records
      console.log(`[Knowledge Service] Compiling historical records for user ${userId}...`);
      const [
        { data: entries },
        { data: reflections },
        { data: entriesVocab },
        { data: threadVocab },
        { data: threadResponses },
        { data: weeklySummaries },
        { data: patternSnapshots },
        { data: exercises },
        { data: assessments },
        { data: dbEvents }
      ] = await Promise.all([
        supabase.from('entries').select('id, created_at, cycle_day, cycle_id').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('reflections').select('id, entry_id, status, generated_at, created_at').eq('user_id', userId),
        supabase.from('entries').select('id, created_at, cycle_id').eq('user_id', userId).eq('vocab_processed', true),
        supabase.from('thread_responses').select('id, created_at, cycle_id').eq('user_id', userId).eq('vocab_processed', true),
        supabase.from('thread_responses').select('id, thread_id, response_text, created_at, cycle_id, threads(cycle_id)').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('weekly_summaries').select('id, week_number, title, why, body, open_question, generated_at, created_at, cycle_id').eq('user_id', userId).eq('status', 'READY').order('week_number', { ascending: true }),
        supabase.from('pattern_snapshots').select('id, cycle_number, snapshot_data, updated_at, created_at, cycle_id').eq('user_id', userId).eq('snapshot_status', 'completed').order('cycle_number', { ascending: true }),
        supabase.from('exercises').select('id, cycle_id, completed_at, created_at').eq('user_id', userId).eq('status', 'completed'),
        supabase.from('assessments').select('id, cycle_id, generated_at, unlocked_at').eq('user_id', userId).eq('generation_status', 'ready'),
        supabase.from('knowledge_events').select('*').eq('user_id', userId)
      ]);

      // 4. Compile the chronological timeline of events
      const timeline: any[] = [];

      // JournalCreated
      entries?.forEach(entry => {
        timeline.push({
          timestamp: entry.created_at || new Date().toISOString(),
          eventType: 'JournalCreated',
          source: 'journal',
          cycleId: entry.cycle_id,
          entryId: entry.id,
          payload: { entry_id: entry.id, cycle_day: entry.cycle_day }
        });
      });

      // ReflectionGenerated
      reflections?.forEach(refl => {
        if (refl.status === 'ready' || refl.status === 'completed') {
          const entry = entries?.find(e => e.id === refl.entry_id);
          timeline.push({
            timestamp: refl.generated_at || refl.created_at || new Date().toISOString(),
            eventType: 'ReflectionGenerated',
            source: 'reflection_engine',
            cycleId: entry?.cycle_id || null,
            entryId: refl.entry_id,
            payload: { reflection_id: refl.id }
          });
        }
      });

      // VocabularyUpdated (Entries)
      entriesVocab?.forEach(entry => {
        timeline.push({
          timestamp: new Date(new Date(entry.created_at).getTime() + 10000).toISOString(),
          eventType: 'VocabularyUpdated',
          source: 'vocabulary_engine',
          cycleId: entry.cycle_id,
          entryId: entry.id,
          payload: { entry_id: entry.id, thread_response_id: null }
        });
      });

      // VocabularyUpdated (Thread Responses)
      threadVocab?.forEach(resp => {
        timeline.push({
          timestamp: new Date(new Date(resp.created_at).getTime() + 5000).toISOString(),
          eventType: 'VocabularyUpdated',
          source: 'vocabulary_engine',
          cycleId: resp.cycle_id || null,
          entryId: null,
          payload: { entry_id: null, thread_response_id: resp.id }
        });
      });

      // ThreadAnswered
      threadResponses?.forEach(resp => {
        const cId = resp.threads?.cycle_id || resp.cycle_id || null;
        timeline.push({
          timestamp: resp.created_at || new Date().toISOString(),
          eventType: 'ThreadAnswered',
          source: 'guide_conversation',
          cycleId: cId,
          entryId: null,
          payload: { thread_id: resp.thread_id, thread_response_id: resp.id }
        });
      });

      // WeeklyReportGenerated
      weeklySummaries?.forEach(ws => {
        timeline.push({
          timestamp: ws.generated_at || ws.created_at || new Date().toISOString(),
          eventType: 'WeeklyReportGenerated',
          source: 'weekly_report_orchestrator',
          cycleId: ws.cycle_id,
          entryId: null,
          payload: { weekly_summary_id: ws.id, week_number: ws.week_number }
        });
      });

      // PatternUpdated
      patternSnapshots?.forEach(snap => {
        timeline.push({
          timestamp: snap.updated_at || snap.created_at || new Date().toISOString(),
          eventType: 'PatternUpdated',
          source: 'pattern_engine',
          cycleId: snap.cycle_id,
          entryId: null,
          payload: { weekly_summary_id: snap.cycle_id }
        });
      });

      // ExerciseCompleted
      exercises?.forEach(ex => {
        timeline.push({
          timestamp: ex.completed_at || ex.created_at || new Date().toISOString(),
          eventType: 'ExerciseCompleted',
          source: 'exercise_insight_worker',
          cycleId: ex.cycle_id,
          entryId: null,
          payload: { exercise_id: ex.id }
        });
      });

      // AssessmentCompleted
      assessments?.forEach(ass => {
        timeline.push({
          timestamp: ass.generated_at || ass.unlocked_at || new Date().toISOString(),
          eventType: 'AssessmentCompleted',
          source: 'monthly_report_worker',
          cycleId: ass.cycle_id,
          entryId: null,
          payload: { assessment_id: ass.id }
        });
      });

      // Sort chronological
      timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // 5. Deduplicate and filter out events
      const eventsToProcess: any[] = [];
      const dbEventsList = dbEvents || [];

      for (const event of timeline) {
        const existing = dbEventsList.find(de => {
          if (de.event_type !== event.eventType) return false;
          if (de.entry_id !== event.entryId) return false;
          if (de.cycle_id !== event.cycleId) return false;

          // Payload matching
          if (event.payload.entry_id && de.payload?.entry_id !== event.payload.entry_id) return false;
          if (event.payload.thread_response_id && de.payload?.thread_response_id !== event.payload.thread_response_id) return false;
          if (event.payload.weekly_summary_id && de.payload?.weekly_summary_id !== event.payload.weekly_summary_id) return false;
          if (event.payload.reflection_id && de.payload?.reflection_id !== event.payload.reflection_id) return false;
          if (event.payload.exercise_id && de.payload?.exercise_id !== event.payload.exercise_id) return false;
          if (event.payload.assessment_id && de.payload?.assessment_id !== event.payload.assessment_id) return false;
          return true;
        });

        if (existing) {
          if (existing.processed) {
            continue; // Skip completely, already processed!
          } else {
            eventsToProcess.push(existing); // Existing in DB but unprocessed
          }
        } else {
          // Insert new event with processed = false
          const { data: newDbEvent, error: insertErr } = await supabase
            .from('knowledge_events')
            .insert({
              user_id: userId,
              cycle_id: event.cycleId,
              entry_id: event.entryId,
              event_type: event.eventType,
              source: event.source,
              payload: event.payload,
              version: '1.0',
              processed: false,
              created_at: event.timestamp
            })
            .select()
            .single();

          if (insertErr || !newDbEvent) {
            console.error(`[Knowledge Service] Failed to insert event ${event.eventType}:`, insertErr?.message);
            continue;
          }

          eventsToProcess.push(newDbEvent);
        }
      }

      const totalEvents = timeline.length;
      let processedCount = totalEvents - eventsToProcess.length;

      await supabase
        .from('knowledge_backfill_status')
        .update({
          current_step: 'processing_events',
          processed_events: processedCount,
          remaining_events: eventsToProcess.length,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      // 6. Process each queued event (silently mark as processed to avoid massive AI overhead)
      for (const dbEvent of eventsToProcess) {
        await supabase
          .from('knowledge_backfill_status')
          .update({
            current_step: `processing_event_${dbEvent.id}`,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        const { error: procUpdateErr } = await supabase
          .from('knowledge_events')
          .update({
            processed: true,
            processed_at: new Date().toISOString()
          })
          .eq('id', dbEvent.id);

        if (procUpdateErr) {
          console.error(`[Knowledge Service] Failed to mark event ${dbEvent.id} as processed:`, procUpdateErr.message);
        }

        processedCount++;
        const remainingCount = totalEvents - processedCount;

        await supabase
          .from('knowledge_backfill_status')
          .update({
            processed_events: processedCount,
            remaining_events: remainingCount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }

      // 7. Compile unified historical profile inputs
      console.log(`[Knowledge Service] Fetching inputs for consolidated profile generation...`);
      const [
        { data: entryScores },
        { data: vocabExtractions },
        { data: finalThreadResponses }
      ] = await Promise.all([
        supabase.from('entry_scores').select('id, day_ei, day_pr, day_sa, created_at').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('vocab_extractions').select('word, normalized_word, sentence, confidence').eq('user_id', userId),
        supabase.from('thread_responses').select('response_text').eq('user_id', userId)
      ]);

      const historicalSummary = {
        user_id: userId,
        total_entries: entries?.length || 0,
        average_scores: {
          emotional_intensity: entryScores && entryScores.length > 0 ? (entryScores.reduce((acc, s) => acc + (s.day_ei || 0), 0) / entryScores.length).toFixed(2) : '5.0',
          processing_depth: entryScores && entryScores.length > 0 ? (entryScores.reduce((acc, s) => acc + (s.day_pr || 0), 0) / entryScores.length).toFixed(2) : '4.5',
          self_agency: entryScores && entryScores.length > 0 ? (entryScores.reduce((acc, s) => acc + (s.day_sa || 0), 0) / entryScores.length).toFixed(2) : '5.5'
        },
        weekly_summaries: weeklySummaries?.map(ws => ({
          week: ws.week_number,
          title: ws.title,
          realization: ws.why,
          what_we_saw: ws.body,
          open_question: ws.open_question
        })) || [],
        patterns: patternSnapshots?.map(ps => ({
          week: ps.cycle_number,
          active_patterns: (ps.snapshot_data?.patterns || [])
            .filter((p: any) => p.status !== 'absent' && p.status !== 'quiet')
            .map((p: any) => ({
              name: p.pattern_name || p.name,
              summary: p.summary || p.body,
              status: p.status
            }))
        })) || [],
        vocabulary: vocabExtractions?.slice(0, 100).map(v => ({
          word: v.word,
          normalized: v.normalized_word,
          confidence: v.confidence
        })) || [],
        thread_responses: finalThreadResponses?.map(tr => tr.response_text) || []
      };

      // 8. Generate long-term Knowledge Profile via 1 unified AI call
      await supabase
        .from('knowledge_backfill_status')
        .update({
          current_step: 'generating_profile',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log(`[Knowledge Service] Generating Knowledge Profile via AI...`);
      const profileModels = await this.generateConsolidatedProfileWithAI(userId, historicalSummary);
      
      const newProfile: KnowledgeProfile = {
        user_id: userId,
        identity_model: profileModels.identity_model || {},
        emotion_model: profileModels.emotion_model || {},
        vocabulary_model: profileModels.vocabulary_model || {},
        pattern_model: profileModels.pattern_model || {},
        agency_model: profileModels.agency_model || {},
        relationship_model: profileModels.relationship_model || {},
        decision_model: profileModels.decision_model || {},
        growth_model: profileModels.growth_model || {},
        communication_model: profileModels.communication_model || {},
        knowledge_version: '1.0',
        updated_at: new Date().toISOString()
      };

      const { error: profileUpsertErr } = await supabase
        .from('knowledge_profile')
        .upsert(newProfile);

      if (profileUpsertErr) {
        throw new Error(`Failed to save knowledge profile: ${profileUpsertErr.message}`);
      }

      // 9. Generate Knowledge Cards via AI
      await supabase
        .from('knowledge_backfill_status')
        .update({
          current_step: 'generating_cards',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log(`[Knowledge Service] Generating Knowledge Cards via AI...`);
      await this.generateCardsWithAI(userId, newProfile);

      // 10. Save completed weekly snapshots (simulate week snapshots from historical summaries)
      console.log(`[Knowledge Service] Copying snapshots to knowledge_snapshots...`);
      if (weeklySummaries && weeklySummaries.length > 0) {
        for (const ws of weeklySummaries) {
          // Check if snapshot already exists
          const { count: snapExists } = await supabase
            .from('knowledge_snapshots')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('week_number', ws.week_number);

          if (!snapExists || snapExists === 0) {
            await supabase
              .from('knowledge_snapshots')
              .insert({
                user_id: userId,
                week_number: ws.week_number,
                snapshot: newProfile,
                generated_at: ws.generated_at || ws.created_at || new Date().toISOString()
              });
          }
        }
      }

      // 11. Complete
      const { data: finalProgress } = await supabase
        .from('knowledge_backfill_status')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          current_step: 'finished',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      console.log(`[Knowledge Service] Backfill successfully finished for user ${userId}.`);
      return finalProgress;

    } catch (err: any) {
      console.error(`[Knowledge Service] Backfill failed for user ${userId}:`, err.message || err);
      await supabase
        .from('knowledge_backfill_status')
        .update({
          status: 'failed',
          error_message: err.message || JSON.stringify(err),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      throw err;
    }
  }

  /**
   * Generates a 9-model consolidated profile from full user history.
   */
  private static async generateConsolidatedProfileWithAI(
    userId: string,
    historicalSummary: any
  ): Promise<any> {
    const prompt = `You are the core Knowledge Intelligence Engine for Ingress Within, a therapeutic writing platform.
Your task is to generate a comprehensive, long-term therapeutic Knowledge Profile (representing a deep clinical registers of understanding) based on the user's complete historical timeline.

USER HISTORICAL INTEL SUMMARY:
${JSON.stringify(historicalSummary, null, 2)}

INSTRUCTIONS:
1. Review the complete history. Generate a consolidated profile of the user across the 9 models.
2. Ensure the narrative is grounded strictly in the actual weekly reports, patterns, and scores provided. Do not invent details.
3. STRICT TONE REQUIREMENT: Write all summaries, traits, and descriptions in either the first-person ("I", "my") or address the user directly as "you" ("your"). NEVER refer to the writer in the third person (e.g. "the user", "the writer", "he/she", "they").
4. Return ONLY a valid JSON object matching the schema below. Do not include markdown code block formatting (e.g. \`\`\`json), no preamble, no explanation.

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

    const response = await aiProvider.callRaw(prompt);
    let cleaned = response.trim();
    if (cleaned.startsWith('```')) {
      const lines = cleaned.split('\n');
      cleaned = lines.slice(1, -1).join('\n').trim();
    }
    return JSON.parse(cleaned);
  }

  /**
   * Generates insight cards using the completed profile.
   */
  private static async generateCardsWithAI(
    userId: string,
    profile: KnowledgeProfile
  ): Promise<void> {
    const prompt = `You are the core Knowledge Intelligence Engine for Ingress Within, a therapeutic writing platform.
Based on the user's completed long-term knowledge profile, generate a set of 3 to 4 distinct user-facing "Knowledge Cards".
Each card should represent a deep, therapeutic insight about their long-term identity, patterns, growth, relationships, or values.

USER KNOWLEDGE PROFILE:
${JSON.stringify(profile, null, 2)}

INSTRUCTIONS:
1. Generate between 3 and 4 knowledge cards.
2. Each card must have:
   - A standard type ("identity", "patterns", "relationships", "growth", "decisions").
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

    const response = await aiProvider.callRaw(prompt);
    let cleaned = response.trim();
    if (cleaned.startsWith('```')) {
      const lines = cleaned.split('\n');
      cleaned = lines.slice(1, -1).join('\n').trim();
    }
    
    const cards: any[] = JSON.parse(cleaned);
    if (Array.isArray(cards)) {
      // Clear old cards to prevent duplication
      await supabase
        .from('knowledge_cards')
        .delete()
        .eq('user_id', userId);

      const dbCards = cards.map(c => ({
        user_id: userId,
        card_type: c.card_type,
        title: c.title,
        content: c.content,
        json_data: c.json_data || {},
        version: '1.0'
      }));

      const { error: insertErr } = await supabase
        .from('knowledge_cards')
        .insert(dbCards);

      if (insertErr) {
        throw new Error(`Failed to insert generated cards: ${insertErr.message}`);
      }
    }
  }
}

