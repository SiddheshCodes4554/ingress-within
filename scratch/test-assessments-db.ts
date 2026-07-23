import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  });
}

async function testAssessmentsTable() {
  const { supabase } = await import('../src/lib/db');

  console.log('Testing assessments table multi-cycle insertion...');
  const { data: user } = await supabase.from('profiles').select('id').limit(1).single();
  if (!user) return;

  // Check if we can select assessments by (user_id, cycle_id)
  const { data: testList, error: selErr } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', user.id);

  console.log('Assessments for user:', testList?.length, 'Sel error:', selErr?.message);
}

testAssessmentsTable();
