import './load-env';
import { supabase } from '../src/lib/db';

async function main() {
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
  console.log('Fetching entries for pruning...');
  const { data: entries } = await supabase
    .from('entries')
    .select('id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!entries || entries.length <= 3) {
    console.log('User has 3 or fewer entries. No pruning needed.');
    return;
  }

  const keepIds = entries.slice(0, 3).map(e => e.id);
  const deleteIds = entries.slice(3).map(e => e.id);

  console.log(`Pruning ${deleteIds.length} older entries, keeping ${keepIds.length} entries.`);
  const { error } = await supabase
    .from('entries')
    .delete()
    .in('id', deleteIds);

  if (error) {
    console.error('Failed to prune entries:', error.message);
  } else {
    console.log('Pruning completed successfully!');
  }
}

main().catch(console.error);
