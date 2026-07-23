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

async function inspectAssessments() {
  const { supabase } = await import('../src/lib/db');

  console.log('=== INSPECTING ASSESSMENTS & CYCLES FOR ALL USERS ===');

  const { data: users } = await supabase.from('profiles').select('id, full_name');
  console.log(`Users count: ${users?.length}`);

  const { data: cycles } = await supabase.from('cycles').select('*');
  console.log(`Total cycles count: ${cycles?.length}`);
  console.log('Cycles summary:', cycles?.map(c => ({
    id: c.id,
    user_id: c.user_id,
    cycle_number: c.cycle_number || c.number,
    status: c.status,
    current_day: c.current_day,
    assessment_completed: c.assessment_completed,
    assessment_available: c.assessment_available
  })));

  const { data: assessments } = await supabase.from('assessments').select('*');
  console.log(`Total assessments count: ${assessments?.length}`);
  console.log('Assessments summary:', assessments?.map(a => ({
    id: a.id,
    user_id: a.user_id,
    cycle_id: a.cycle_id,
    status: a.generation_status,
    unlocked_at: a.unlocked_at,
    generated_at: a.generated_at,
    has_text: !!a.report_text
  })));
}

inspectAssessments();
