import './load-env';
import { supabase } from '../src/lib/db';
import { processWeeklySummary } from '../src/lib/queue/workers/weeklySummaryWorker';

async function run() {
  console.log('=== WEEKLY REPORTS AUDIT AND BACKFILL STARTING ===');

  // 1. Fetch all weekly summaries
  const { data: summaries, error: fetchErr } = await supabase
    .from('weekly_summaries')
    .select('*')
    .order('created_at', { ascending: true });

  if (fetchErr) {
    console.error('Error fetching weekly summaries:', fetchErr.message);
    return;
  }

  console.log(`Found ${summaries?.length || 0} weekly summaries in database.\n`);

  let auditedCount = 0;
  let regeneratedCount = 0;

  for (const summary of summaries || []) {
    auditedCount++;
    console.log(`[Audit] Summary ID ${summary.id} (User: ${summary.user_id}, Week: ${summary.week_number})`);
    
    // Fetch cycle info to compute expected date range
    const { data: cycle, error: cycleErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('id', summary.cycle_id)
      .single();

    if (cycleErr || !cycle) {
      console.error(`  [Error] Failed to fetch cycle info for cycle ${summary.cycle_id}: ${cycleErr?.message}`);
      continue;
    }

    // Compute expected date range exactly like the collector
    const startPart = (cycle.start_date || cycle.started_at || cycle.created_at).split('T')[0];
    const [year, month, day] = startPart.split('-').map(Number);
    const cycleStartDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    const week_start_date = new Date(cycleStartDate.getTime() + (summary.week_number - 1) * 7 * 24 * 60 * 60 * 1000);
    const week_end_date = new Date(cycleStartDate.getTime() + (summary.week_number * 7 - 1) * 24 * 60 * 60 * 1000);
    const week_next_start_date = new Date(cycleStartDate.getTime() + summary.week_number * 7 * 24 * 60 * 60 * 1000);

    const expectedWeekRange = `${week_start_date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })} – ${week_end_date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}`;

    // Fetch actual entries written in this calendar range
    const { data: dbEntries } = await supabase
      .from('entries')
      .select('id, created_at, crisis_flag')
      .eq('user_id', summary.user_id)
      .eq('cycle_id', summary.cycle_id)
      .gte('created_at', week_start_date.toISOString())
      .lt('created_at', week_next_start_date.toISOString());

    // Fetch actual crisis logs in this calendar range
    const { data: dbCrisisLogs } = await supabase
      .from('crisis_log')
      .select('id')
      .eq('user_id', summary.user_id)
      .gte('timestamp', week_start_date.toISOString())
      .lt('timestamp', week_next_start_date.toISOString());

    // Group by date to dedup
    const dateToEntry = new Map<string, any>();
    (dbEntries || []).forEach(entry => {
      const entryDateStr = new Date(entry.created_at).toISOString().split('T')[0];
      const existing = dateToEntry.get(entryDateStr);
      if (!existing || new Date(entry.created_at) >= new Date(existing.created_at)) {
        dateToEntry.set(entryDateStr, entry);
      }
    });

    const expectedEntriesCount = dateToEntry.size;

    let isIncorrect = false;
    let mismatchReason = '';

    const reportData = summary.report_data;
    if (summary.status?.toUpperCase() === 'FAILED' || !reportData || typeof reportData !== 'object') {
      isIncorrect = true;
      mismatchReason = `Status is "${summary.status}" or report_data is missing.`;
    } else {
      const storedStats = reportData.weekly_stats || {};
      const storedWeekRange = storedStats.week_range;
      const storedEntriesCount = storedStats.entries_completed;
      const hasAudit = !!reportData.audit;

      if (storedWeekRange !== expectedWeekRange) {
        isIncorrect = true;
        mismatchReason = `Week range mismatch. Stored: "${storedWeekRange}", Expected: "${expectedWeekRange}" (timezone shift detected).`;
      } else if (storedEntriesCount !== expectedEntriesCount) {
        isIncorrect = true;
        mismatchReason = `Entries count mismatch. Stored: ${storedEntriesCount}, Expected: ${expectedEntriesCount} (entry shift detected).`;
      } else if (!hasAudit) {
        isIncorrect = true;
        mismatchReason = `Audit log metadata is missing in stored report_data.`;
      } else {
        const hasCrisis = (dbCrisisLogs || []).length > 0 || (dbEntries || []).some(e => e.crisis_flag);
        const storedCrisisOccurred = reportData.crisis_review?.occurred;
        if (hasCrisis !== storedCrisisOccurred) {
          isIncorrect = true;
          mismatchReason = `Crisis occurrence mismatch. DB: ${hasCrisis}, Stored: ${storedCrisisOccurred}`;
        }
      }
    }

    if (isIncorrect) {
      console.warn(`  [MISMATCH DETECTED] Reason: ${mismatchReason}`);
      console.log(`  Deleting stored report and regenerating...`);

      // 1. Delete corresponding open thread to prevent duplicates
      const { error: deleteThreadErr } = await supabase
        .from('open_threads')
        .delete()
        .eq('source_summary_id', summary.id);

      if (deleteThreadErr) {
        console.warn(`  [Warning] Failed to delete open thread: ${deleteThreadErr.message}`);
      }

      // 2. Clear out report data and set status back to pending
      const { error: resetErr } = await supabase
        .from('weekly_summaries')
        .update({
          status: 'PENDING',
          title: null,
          why: null,
          body: null,
          open_question: null,
          report_data: null,
          generated_at: null
        })
        .eq('id', summary.id);

      if (resetErr) {
        console.error(`  [Error] Failed to reset weekly summary row: ${resetErr.message}`);
        continue;
      }

      // 3. Trigger worker inline to regenerate
      try {
        console.log(`  Calling Weekly Summary Worker inline for regeneration...`);
        await processWeeklySummary({
          cycle_id: summary.cycle_id,
          user_id: summary.user_id,
          week_number: summary.week_number,
          summary_id: summary.id
        });
        console.log(`  [Success] Successfully regenerated report.`);
        regeneratedCount++;
        
        // Rate limiting delay
        console.log(`  Waiting 60 seconds to prevent Groq API rate limits...`);
        await new Promise(resolve => setTimeout(resolve, 60000));
      } catch (err: any) {
        console.error(`  [Error] Failed to regenerate report:`, err.message || err);
      }
    } else {
      console.log(`  [OK] Report is correct and matches date-driven calculations.`);
    }
  }

  console.log('\n=== AUDIT AND BACKFILL COMPLETED ===');
  console.log(`Total audited: ${auditedCount}`);
  console.log(`Total regenerated: ${regeneratedCount}`);
}

run().catch(console.error);
