import './load-env';
import { supabase } from '../src/lib/db';

const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';

async function check() {
  const { data: logs, error } = await supabase
    .from('crisis_log')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  console.log('=== CRISIS LOG TABLE ===');
  console.log(`Found ${logs?.length || 0} logs:`);
  logs?.forEach(l => {
    console.log(`ID: ${l.id}`);
    console.log(`Type: ${l.crisis_type}`);
    console.log(`Timestamp: ${l.timestamp}`);
    console.log('--------------------------------------------------');
  });
}

check();
