import '../src/lib/queue/load-env';
import { supabase } from '../src/lib/db';

async function main() {
  console.log('Fetching a single row from vocab_clusters to see the columns...');
  const { data, error } = await supabase
    .from('vocab_clusters')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns in vocab_clusters:', Object.keys(data[0] || {}));
  }
}

main().catch(console.error);
