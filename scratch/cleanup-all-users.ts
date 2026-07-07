import './env-loader';
import { supabase } from '../src/lib/db';

async function run() {
  console.log('=== GLOBAL DATABASE CLEANUP: REMOVING FAKE CYCLES FOR ALL USERS ===');

  // 1. Fetch all users
  const { data: users, error: usersErr } = await supabase
    .from('users')
    .select('id, name');

  if (usersErr || !users) {
    console.error('Error fetching users:', usersErr?.message);
    return;
  }

  console.log(`Found ${users.length} users in the database.`);

  for (const user of users) {
    console.log(`\nProcessing user: ${user.name || 'Unnamed'} (ID: ${user.id})`);

    // Fetch all cycles for this user
    const { data: cycles, error: cyclesErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', user.id)
      .order('cycle_number', { ascending: true });

    if (cyclesErr || !cycles || cycles.length === 0) {
      console.log(`No cycles found for user ${user.id}. Skipping.`);
      continue;
    }

    console.log(`User has ${cycles.length} cycles.`);

    // Find Cycle 1
    const cycle1 = cycles.find(c => c.cycle_number === 1 || c.number === 1);
    if (!cycle1) {
      console.log(`WARNING: Cycle 1 not found for user ${user.id}. Skipping.`);
      continue;
    }

    // Fetch all entries for this user
    const { data: entries, error: entriesErr } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id);

    if (entriesErr) {
      console.error(`Error fetching entries for user ${user.id}:`, entriesErr.message);
      continue;
    }

    const entriesList = entries || [];
    console.log(`User has ${entriesList.length} total entries.`);

    // Re-link any entry that is not linked to Cycle 1, IF Cycle 1 is the only cycle we want to keep
    // Wait, let's see which cycles have entries
    const otherCycles = cycles.filter(c => c.id !== cycle1.id);
    const cyclesToDelete: any[] = [];

    for (const cy of otherCycles) {
      const cycleEntries = entriesList.filter(e => e.cycle_id === cy.id);
      
      // Fetch assessments for this cycle
      const { data: assessments } = await supabase
        .from('assessments')
        .select('id')
        .eq('cycle_id', cy.id);

      const hasAssessments = assessments && assessments.length > 0;

      if (cycleEntries.length === 0 && !hasAssessments) {
        // Safe to delete this empty/fake cycle
        cyclesToDelete.push(cy);
      } else {
        // If it has entries but was created by a test run on Siddhesh, we already cleaned it up.
        // For other users, if it has entries, we keep it as a real cycle.
        console.log(`Cycle ${cy.cycle_number || cy.number} has ${cycleEntries.length} entries and ${assessments?.length || 0} assessments. Keeping it.`);
      }
    }

    // Perform deletions of empty/fake cycles
    for (const cy of cyclesToDelete) {
      console.log(`Deleting empty/fake Cycle ${cy.cycle_number || cy.number} (ID: ${cy.id})...`);

      // Delete weekly summaries
      await supabase.from('weekly_summaries').delete().eq('cycle_id', cy.id);
      // Delete snapshots
      await supabase.from('pattern_snapshots').delete().eq('cycle_id', cy.id);
      // Delete cycle
      const { error: delErr } = await supabase.from('cycles').delete().eq('id', cy.id);
      
      if (delErr) {
        console.error(`Failed to delete cycle ${cy.id}:`, delErr.message);
      } else {
        console.log(`Successfully deleted cycle ${cy.id}.`);
      }
    }

    // Ensure they have at least one ACTIVE cycle if all their cycles got archived
    const remainingCycles = cycles.filter(c => !cyclesToDelete.some(dc => dc.id === c.id));
    const activeCycle = remainingCycles.find(c => c.status === 'ACTIVE' || c.status === 'active');

    if (!activeCycle && remainingCycles.length > 0) {
      // Find the latest remaining cycle and make it active
      const latestRemainingCycle = remainingCycles[remainingCycles.length - 1];
      console.log(`No active cycle found. Restoring latest remaining Cycle ${latestRemainingCycle.cycle_number || latestRemainingCycle.number} (ID: ${latestRemainingCycle.id}) to ACTIVE...`);
      
      const { error: updateErr } = await supabase
        .from('cycles')
        .update({
          status: 'ACTIVE',
          updated_at: new Date().toISOString()
        })
        .eq('id', latestRemainingCycle.id);

      if (updateErr) {
        console.error(`Failed to activate cycle ${latestRemainingCycle.id}:`, updateErr.message);
      } else {
        console.log(`Successfully activated cycle ${latestRemainingCycle.id}.`);
      }
    }
  }

  console.log('\n=== GLOBAL DATABASE CLEANUP COMPLETED ===');
}

run();
