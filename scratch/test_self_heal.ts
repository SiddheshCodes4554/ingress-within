import '../src/lib/queue/load-env';
import { supabase } from '../src/lib/db';
import { GET } from '../src/app/api/vocab/overview/route';
import { signJwt } from '../src/utils/crypto';
import { NextRequest } from 'next/server';

async function main() {
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
  const cycleId = 'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da';
  const deviceId = 'edw8ppox4wpmqdti5uq';

  console.log('--- STARTING SELF-HEALING VERIFICATION ---');

  // 1. Delete all clusters for this cycle
  console.log('1. Deleting clusters from vocab_clusters table...');
  const { error: deleteErr } = await supabase
    .from('vocab_clusters')
    .delete()
    .eq('user_id', userId)
    .eq('cycle_id', cycleId);

  if (deleteErr) {
    console.error('Failed to delete clusters:', deleteErr);
    return;
  }

  // Double check they are 0
  const { count: clusterCountAfterDelete } = await supabase
    .from('vocab_clusters')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('cycle_id', cycleId);

  console.log(`Verified cluster count in DB after deletion: ${clusterCountAfterDelete}`);

  // 2. Sign JWT
  console.log('2. Signing JWT token...');
  const jwtSecret = process.env.JWT_SECRET || 'jwt_default_secret_dev';
  const token = signJwt({
    uid: userId,
    did: deviceId,
    phone: '1234567890'
  }, jwtSecret, 3600);

  // 3. Create mock NextRequest
  console.log('3. Creating mock NextRequest...');
  const url = 'http://localhost:3000/api/vocab/overview';
  const request = new NextRequest(url, {
    headers: {
      'authorization': `Bearer ${token}`
    }
  });

  // 4. Invoke GET handler
  console.log('4. Invoking GET route handler...');
  const response = await GET(request);
  const responseData = await response.json();

  console.log(`Response Status: ${response.status}`);
  if (response.status !== 200) {
    console.error('Response Error:', responseData);
  }
  console.log('Response Data clusters:', JSON.stringify(responseData.data?.clusters, null, 2));

  // 5. Verify clusters exist in database now
  console.log('5. Verifying DB clusters count...');
  const { count: clusterCountAfterGET } = await supabase
    .from('vocab_clusters')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('cycle_id', cycleId);

  console.log(`Cluster count in DB after GET request: ${clusterCountAfterGET}`);

  if (clusterCountAfterGET && clusterCountAfterGET > 0) {
    console.log('🎉 SUCCESS: Self-healing worked and clusters were automatically generated and saved!');
  } else {
    console.error('❌ FAILURE: Clusters were not generated.');
  }
}

main().catch(console.error);
