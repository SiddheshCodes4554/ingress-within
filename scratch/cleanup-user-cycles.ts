import './env-loader';
import { supabase } from '../src/lib/db';

async function run() {
  console.log('=== DATABASE CLEANUP: REMOVING FAKE CYCLES ===');

  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';

  // 1. Fetch all cycles for user Siddhesh
  const { data: cycles, error: cyclesErr } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', userId)
    .order('cycle_number', { ascending: true });

  if (cyclesErr) {
    console.error('Error fetching cycles:', cyclesErr.message);
    return;
  }

  console.log(`Found ${cycles?.length || 0} cycles for user ${userId}:`);
  console.log(JSON.stringify(cycles, null, 2));

  // Find Cycle 1
  const cycle1 = cycles?.find(c => c.cycle_number === 1 || c.number === 1);
  if (!cycle1) {
    console.error('Cycle 1 not found for user!');
    return;
  }

  console.log(`Cycle 1 ID is: ${cycle1.id}`);

  // Fetch all entries for this user
  const { data: entries, error: entriesErr } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId);

  if (entriesErr) {
    console.error('Error fetching entries:', entriesErr.message);
    return;
  }

  console.log(`Found ${entries?.length || 0} total entries for user ${userId}.`);

  // 2. Re-link all entries to Cycle 1
  for (const entry of entries || []) {
    if (entry.cycle_id !== cycle1.id) {
      console.log(`Entry ${entry.id} is currently linked to cycle ${entry.cycle_id}. Re-linking to Cycle 1...`);
      // Update entry
      const { error: updateErr } = await supabase
        .from('entries')
        .update({
          cycle_id: cycle1.id,
          // If cycle_day is not set, set it based on written_at
          cycle_day: entry.cycle_day || 1
        })
        .eq('id', entry.id);

      if (updateErr) {
        console.error(`Failed to update entry ${entry.id}:`, updateErr.message);
      }
    }
  }

  // 3. Delete any other cycles for this user (Cycle 2, 3, 4)
  const otherCycles = cycles?.filter(c => c.id !== cycle1.id) || [];
  for (const cy of otherCycles) {
    console.log(`Deleting fake Cycle ${cy.cycle_number || cy.number} (ID: ${cy.id})...`);
    
    // Delete any weekly summaries associated with this cycle
    const { error: wsDelErr } = await supabase
      .from('weekly_summaries')
      .delete()
      .eq('cycle_id', cy.id);
    if (wsDelErr) console.warn(`Failed to delete weekly summaries for cycle ${cy.id}:`, wsDelErr.message);

    // Delete any pattern snapshots associated with this cycle
    const { error: snapDelErr } = await supabase
      .from('pattern_snapshots')
      .delete()
      .eq('cycle_id', cy.id);
    if (snapDelErr) console.warn(`Failed to delete pattern snapshots for cycle ${cy.id}:`, snapDelErr.message);

    // Delete the cycle itself
    const { error: cycleDelErr } = await supabase
      .from('cycles')
      .delete()
      .eq('id', cy.id);

    if (cycleDelErr) {
      console.error(`Failed to delete cycle ${cy.id}:`, cycleDelErr.message);
    } else {
      console.log(`Successfully deleted cycle ${cy.id}.`);
    }
  }

  // 4. Update Cycle 1's status back to ACTIVE and make sure start date is June 12
  console.log('Restoring Cycle 1 status to ACTIVE...');
  const { error: c1UpdateErr } = await supabase
    .from('cycles')
    .update({
      status: 'ACTIVE',
      start_date: '2026-06-12',
      updated_at: new Date().toISOString()
    })
    .eq('id', cycle1.id);

  if (c1UpdateErr) {
    console.error('Failed to update Cycle 1:', c1UpdateErr.message);
  } else {
    console.log('Successfully restored Cycle 1.');
  }

  console.log('=== DATABASE CLEANUP COMPLETED ===');
}

run();
