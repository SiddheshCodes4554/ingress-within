import '../src/lib/queue/load-env';
import { supabase } from '../src/lib/db';

async function main() {
  const cycleId = 'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da';
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';

  console.log('Testing insertion of a cluster into vocab_clusters...');
  
  const testCluster = {
    user_id: userId,
    cycle_id: cycleId,
    cluster_name: 'Test Cluster API',
    cluster_type: 'emotional',
    words: ['anxious', 'stressed'],
    frequency: 5
  };

  const { data, error } = await supabase
    .from('vocab_clusters')
    .insert(testCluster)
    .select()
    .single();

  if (error) {
    console.error('Insertion failed:', error);
  } else {
    console.log('Insertion succeeded! Inserted data:', data);
  }
}

main().catch(console.error);
