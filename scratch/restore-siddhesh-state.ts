import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

async function main() {
  // Load env variables
  try {
    const envContent = fs.readFileSync('D:/Internship/Ingress Within/.env', 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    });
  } catch (e: any) {
    console.error('Could not read .env file:', e.message);
  }

  const dbPath = pathToFileURL(path.join(process.cwd(), 'src/lib/db.ts')).href;
  const { supabase: db } = await import(dbPath);

  const testUser = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
  const originalCycleId = '69d4b73b-f212-47be-a2d4-5ab965e12829';

  console.log(`=== Restoring state for user ${testUser} ===`);

  // 1. Fetch all cycles for user to get IDs to delete
  const { data: userCycles, error: cyclesErr } = await db
    .from('cycles')
    .select('id, cycle_number')
    .eq('user_id', testUser);

  if (cyclesErr) {
    console.error('Error fetching cycles:', cyclesErr);
    return;
  }

  const cyclesToDelete = (userCycles || []).filter(c => {
    const num = c.cycle_number;
    return num && num > 1;
  });

  const deleteIds = cyclesToDelete.map(c => c.id);
  console.log(`Found ${deleteIds.length} extra cycles to delete:`, deleteIds);

  if (deleteIds.length > 0) {
    // 2. Delete assessments referencing the cycles to delete
    console.log('Deleting extra assessments...');
    const { error: assDelErr } = await db
      .from('assessments')
      .delete()
      .in('cycle_id', deleteIds);
    if (assDelErr) console.error('Error deleting assessments:', assDelErr);

    // 3. Delete extra cycles
    console.log('Deleting extra cycles...');
    const { error: cycleDelErr } = await db
      .from('cycles')
      .delete()
      .in('id', deleteIds);
    if (cycleDelErr) console.error('Error deleting cycles:', cycleDelErr);
  }

  // 4. Restore Cycle 1 status to ACTIVE
  console.log(`Restoring Cycle 1 (${originalCycleId}) to ACTIVE status...`);
  const { data: updatedCycle, error: updateErr } = await db
    .from('cycles')
    .update({
      status: 'ACTIVE',
      assessment_completed: false,
      completed_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', originalCycleId)
    .select();

  if (updateErr) {
    console.error('Error updating Cycle 1 status:', updateErr);
  } else {
    console.log('Successfully restored Cycle 1:', updatedCycle);
  }

  console.log('\n=== Restoration Complete ===');
}

main().catch(err => {
  console.error('\nRestoration Failed:', err);
  process.exit(1);
});
