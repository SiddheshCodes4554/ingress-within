import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

async function main() {
  // Load env variables
  try {
    const envContent = fs.readFileSync('D:/Internship/Ingress Within/.env', 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    });
  } catch (e: any) {
    console.error('Could not read .env file:', e.message);
  }

  // Re-import supabase after process.env is set
  const dbPath = pathToFileURL(path.join(process.cwd(), 'src/lib/db.ts')).href;
  const { supabase: db } = await import(dbPath);

  const knowledgePath = pathToFileURL(path.join(process.cwd(), 'src/lib/knowledge/knowledgeService.ts')).href;
  const { KnowledgeService } = await import(knowledgePath);

  const targetUserId = process.argv[2] || 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7'; // Default to Siddhesh

  console.log(`=== Knowledge Engine: Historical Rebuild Backfill ===`);
  console.log(`Target User: ${targetUserId}`);

  // Confirm user exists
  const { data: profile, error: profErr } = await db
    .from('profiles')
    .select('id, full_name')
    .eq('id', targetUserId)
    .maybeSingle();

  if (profErr || !profile) {
    console.error(`Error finding profile for user ${targetUserId}:`, profErr?.message || 'Not found');
    return;
  }
  console.log(`Found profile: ${profile.full_name || 'Unknown'}`);

  // 1. Purge existing knowledge data for this user to ensure idempotency and clean run
  console.log('Purging existing knowledge events, profile, snapshots, and cards...');
  await db.from('knowledge_cards').delete().eq('user_id', targetUserId);
  await db.from('knowledge_snapshots').delete().eq('user_id', targetUserId);
  await db.from('knowledge_profile').delete().eq('user_id', targetUserId);
  await db.from('knowledge_events').delete().eq('user_id', targetUserId);
  console.log('Purge complete.');

  // 2. Fetch all historical data
  console.log('Fetching historical entries, reflections, vocabulary, weekly summaries, patterns, and thread responses...');
  
  const { data: entries } = await db
    .from('entries')
    .select('*, reflections(*)')
    .eq('user_id', targetUserId);

  const { data: threadResponses } = await db
    .from('thread_responses')
    .select('*, threads(*)')
    .eq('user_id', targetUserId);

  const { data: weeklySummaries } = await db
    .from('weekly_summaries')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('status', 'READY');

  const { data: patternSnapshots } = await db
    .from('pattern_snapshots')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('status', 'completed');

  const { data: exercises } = await db
    .from('exercises')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('status', 'completed');

  const { data: assessments } = await db
    .from('assessments')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('generation_status', 'ready');

  // 3. Compile timeline of events
  const timeline: { timestamp: string; eventType: string; source: string; cycleId: string | null; entryId: string | null; payload: any }[] = [];

  // Entries and Reflections
  entries?.forEach(entry => {
    const time = entry.created_at || entry.written_at || new Date().toISOString();
    
    // JournalCreated
    timeline.push({
      timestamp: time,
      eventType: 'JournalCreated',
      source: 'journal',
      cycleId: entry.cycle_id,
      entryId: entry.id,
      payload: { entry_id: entry.id, cycle_day: entry.cycle_day }
    });

    // ReflectionGenerated (offset slightly)
    if (entry.reflections && entry.reflections.length > 0) {
      const refl = entry.reflections[0];
      if (refl.status === 'ready' || refl.status === 'completed') {
        const reflTime = refl.generated_at || new Date(new Date(time).getTime() + 5000).toISOString();
        timeline.push({
          timestamp: reflTime,
          eventType: 'ReflectionGenerated',
          source: 'reflection_engine',
          cycleId: entry.cycle_id,
          entryId: entry.id,
          payload: { reflection_id: refl.id }
        });
      }
    }

    // VocabularyUpdated (offset slightly)
    if (entry.vocab_processed) {
      const vocabTime = new Date(new Date(time).getTime() + 10000).toISOString();
      timeline.push({
        timestamp: vocabTime,
        eventType: 'VocabularyUpdated',
        source: 'vocabulary_engine',
        cycleId: entry.cycle_id,
        entryId: entry.id,
        payload: { entry_id: entry.id, thread_response_id: null }
      });
    }
  });

  // ThreadResponses
  threadResponses?.forEach(resp => {
    const time = resp.created_at || new Date().toISOString();
    timeline.push({
      timestamp: time,
      eventType: 'ThreadAnswered',
      source: 'guide_conversation',
      cycleId: resp.threads?.cycle_id || resp.cycle_id || null,
      entryId: null,
      payload: { thread_id: resp.thread_id, thread_response_id: resp.id }
    });

    if (resp.vocab_processed) {
      const vocabTime = new Date(new Date(time).getTime() + 5000).toISOString();
      timeline.push({
        timestamp: vocabTime,
        eventType: 'VocabularyUpdated',
        source: 'vocabulary_engine',
        cycleId: resp.threads?.cycle_id || resp.cycle_id || null,
        entryId: null,
        payload: { entry_id: null, thread_response_id: resp.id }
      });
    }
  });

  // WeeklySummaries
  weeklySummaries?.forEach(summary => {
    const time = summary.generated_at || summary.created_at || new Date().toISOString();
    timeline.push({
      timestamp: time,
      eventType: 'WeeklyReportGenerated',
      source: 'weekly_report_orchestrator',
      cycleId: summary.cycle_id,
      entryId: null,
      payload: { weekly_summary_id: summary.id, week_number: summary.week_number }
    });
  });

  // PatternSnapshots
  patternSnapshots?.forEach(snap => {
    const time = snap.updated_at || new Date().toISOString();
    timeline.push({
      timestamp: time,
      eventType: 'PatternUpdated',
      source: 'pattern_engine',
      cycleId: snap.cycle_id,
      entryId: null,
      payload: { weekly_summary_id: snap.cycle_id } // Matches cycle reference
    });
  });

  // Exercises
  exercises?.forEach(ex => {
    const time = ex.completed_at || ex.created_at || new Date().toISOString();
    timeline.push({
      timestamp: time,
      eventType: 'ExerciseCompleted',
      source: 'exercise_insight_worker',
      cycleId: ex.cycle_id,
      entryId: null,
      payload: { exercise_id: ex.id }
    });
  });

  // Assessments
  assessments?.forEach(ass => {
    const time = ass.generated_at || ass.unlocked_at || new Date().toISOString();
    timeline.push({
      timestamp: time,
      eventType: 'AssessmentCompleted',
      source: 'monthly_report_worker',
      cycleId: ass.cycle_id,
      entryId: null,
      payload: { assessment_id: ass.id }
    });
  });

  // 4. Sort timeline chronologically
  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  console.log(`Compiled timeline with ${timeline.length} events sorted chronologically.`);

  // 5. Emit and process events sequentially
  let processedCount = 0;
  for (const event of timeline) {
    console.log(`\n[Backfill] (${processedCount + 1}/${timeline.length}) Emitting event ${event.eventType} [${event.timestamp}]...`);
    
    // Disable automatic inline/background worker trigger inside emitKnowledgeEvent for this script,
    // we will run processKnowledgeEvent manually here to keep it perfectly sequential and synchronous.
    const { data: dbEvent, error: insertErr } = await db
      .from('knowledge_events')
      .insert({
        user_id: targetUserId,
        cycle_id: event.cycleId,
        entry_id: event.entryId,
        event_type: event.eventType,
        source: event.source,
        payload: event.payload,
        version: '1.0',
        processed: false
      })
      .select()
      .single();

    if (insertErr || !dbEvent) {
      console.error(`Failed to insert event:`, insertErr?.message);
      continue;
    }

    try {
      await KnowledgeService.processKnowledgeEvent(dbEvent.id);
      processedCount++;
    } catch (err: any) {
      console.error(`Error processing event ${dbEvent.id}:`, err.message || err);
    }
  }

  console.log(`\n=== Historical Rebuild Backfill Finished ===`);
  console.log(`Successfully processed ${processedCount} out of ${timeline.length} events.`);
}

main().catch(console.error);
