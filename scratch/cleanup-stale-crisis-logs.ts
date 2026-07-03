import './load-env';
import { supabase } from '../src/lib/db';

const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';

async function cleanup() {
  console.log('=== CLEANING UP STALE CRISIS LOGS ===');
  
  // We want to delete all crisis logs for this user where the timestamp is NOT on June 30th (2026-06-30)
  const { data: logsBefore, error: fetchErr } = await supabase
    .from('crisis_log')
    .select('*')
    .eq('user_id', userId);

  if (fetchErr) {
    console.error('Error fetching logs:', fetchErr);
    return;
  }

  console.log(`Logs before cleanup: ${logsBefore?.length || 0}`);

  const staleLogs = logsBefore?.filter(log => !log.timestamp.startsWith('2026-06-30')) || [];
  console.log(`Found ${staleLogs.length} stale logs to delete.`);

  if (staleLogs.length > 0) {
    const idsToDelete = staleLogs.map(l => l.id);
    const { error: deleteErr } = await supabase
      .from('crisis_log')
      .delete()
      .in('id', idsToDelete);

    if (deleteErr) {
      console.error('Delete error:', deleteErr.message);
    } else {
      console.log('Successfully deleted stale logs.');
    }
  }

  const { data: logsAfter } = await supabase
    .from('crisis_log')
    .select('*')
    .eq('user_id', userId);

  console.log(`Logs after cleanup: ${logsAfter?.length || 0}`);
  console.log('Remaining logs:');
  console.log(JSON.stringify(logsAfter, null, 2));
}

cleanup();
