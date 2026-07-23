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

async function testReportsPageData() {
  const { supabase } = await import('../src/lib/db');

  const { data: users } = await supabase.from('profiles').select('id, full_name');

  for (const user of users || []) {
    console.log(`\n---------------- USER: ${user.full_name} (${user.id}) ----------------`);

    // Fetch cycles for user
    const { data: cycles } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', user.id)
      .order('cycle_number', { ascending: false });

    console.log(`Cycles for user (${cycles?.length}):`);
    for (const c of cycles || []) {
      const { data: assessment } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .eq('cycle_id', c.id)
        .maybeSingle();

      console.log(`  - Cycle ${c.cycle_number || c.number} (ID: ${c.id}):`);
      console.log(`    Status: ${c.status}, current_day: ${c.current_day}, assessment_completed: ${c.assessment_completed}, assessment_available: ${c.assessment_available}`);
      console.log(`    Assessment in DB: ${assessment ? `YES (status: ${assessment.generation_status}, text_len: ${assessment.report_text?.length || 0})` : 'NO'}`);
    }
  }
}

testReportsPageData();
