import './load-env';
import { supabase } from '../src/lib/db';

const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';

async function check() {
  const { data: entries, error } = await supabase
    .from('entries')
    .select('id, content, created_at, crisis_flag, crisis_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  console.log('=== USER ENTRIES CRISIS FLAGS ===');
  entries?.forEach(e => {
    console.log(`Date: ${e.created_at.split('T')[0]}`);
    console.log(`Crisis: ${e.crisis_flag} | Type: ${e.crisis_type}`);
    console.log(`Content snippet: "${e.content.substring(0, 100)}..."`);
    console.log('--------------------------------------------------');
  });
}

check();
