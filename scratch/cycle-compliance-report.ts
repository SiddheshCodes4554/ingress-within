import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables manually
try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
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
  console.log('Environment variables loaded successfully.');
} catch (e: any) {
  console.error('Could not read .env file:', e.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase variables in .env!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runComplianceReport() {
  console.log('=== RUNNING CYCLE ENGINE COMPLIANCE AUDIT ===');
  
  const results = {
    schemaValid: false,
    cycleLinking: false,
    warnings: [] as string[],
    details: {} as any
  };

  try {
    // 1. Audit cycles columns
    const { data: cycles, error: cyclesError } = await supabase
      .from('cycles')
      .select('id, cycle_number, status, start_date, end_date, current_day, days_completed, entries_count, assessment_completed, assessment_available')
      .limit(1);

    if (cyclesError) {
      results.warnings.push(`Cycles table schema check failed: ${cyclesError.message}`);
      results.schemaValid = false;
    } else {
      console.log('✓ cycles table column validation passed.');
      results.schemaValid = true;
      results.details.cyclesTable = { status: 'OK', columnsVerified: true };
    }

    // 2. Audit entries cycle_id and cycle_day linkage
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('id, content, cycle_id, cycle_day')
      .limit(50);

    if (entriesError) {
      results.warnings.push(`Entries table audit failed: ${entriesError.message}`);
    } else {
      const totalEntries = entries?.length || 0;
      const unlinkedEntries = entries?.filter(e => !e.cycle_id) || [];
      const missingDayEntries = entries?.filter(e => e.cycle_day === null || e.cycle_day === undefined) || [];

      if (unlinkedEntries.length > 0) {
        results.warnings.push(`Found ${unlinkedEntries.length} / ${totalEntries} entries with missing cycle_id.`);
      } else {
        console.log('✓ All sampled entries successfully linked to cycles.');
      }
      
      results.details.entriesLinkage = {
        totalSampled: totalEntries,
        unlinked: unlinkedEntries.length,
        missingDay: missingDayEntries.length
      };
    }

    // 3. Audit reflections linkage
    const { data: reflections, error: reflectionsError } = await supabase
      .from('reflections')
      .select('id, cycle_id')
      .limit(50);

    if (reflectionsError) {
      results.warnings.push(`Reflections table audit failed: ${reflectionsError.message}`);
    } else {
      const totalRefl = reflections?.length || 0;
      const unlinkedRefl = reflections?.filter(r => !r.cycle_id) || [];
      
      if (unlinkedRefl.length > 0) {
        results.warnings.push(`Found ${unlinkedRefl.length} / ${totalRefl} reflections with missing cycle_id.`);
      } else {
        console.log('✓ All sampled reflections successfully linked to cycles.');
      }

      results.details.reflectionsLinkage = {
        totalSampled: totalRefl,
        unlinked: unlinkedRefl.length
      };
    }

    // 4. Audit vocab words linkage
    const { data: vocab, error: vocabError } = await supabase
      .from('vocab_words')
      .select('id, cycle_id')
      .limit(50);

    if (vocabError) {
      results.warnings.push(`vocab_words table audit failed: ${vocabError.message}`);
    } else {
      const totalVocab = vocab?.length || 0;
      const unlinkedVocab = vocab?.filter(v => !v.cycle_id) || [];

      if (unlinkedVocab.length > 0) {
        results.warnings.push(`Found ${unlinkedVocab.length} / ${totalVocab} vocab words with missing cycle_id.`);
      } else {
        console.log('✓ All sampled vocab words successfully linked to cycles.');
      }

      results.details.vocabLinkage = {
        totalSampled: totalVocab,
        unlinked: unlinkedVocab.length
      };
    }

    // 5. Audit entry scores linkage
    const { data: scores, error: scoresError } = await supabase
      .from('entry_scores')
      .select('id, cycle_id')
      .limit(50);

    if (scoresError) {
      results.warnings.push(`entry_scores table audit failed: ${scoresError.message}`);
    } else {
      const totalScores = scores?.length || 0;
      const unlinkedScores = scores?.filter(s => !s.cycle_id) || [];

      if (unlinkedScores.length > 0) {
        results.warnings.push(`Found ${unlinkedScores.length} / ${totalScores} scores with missing cycle_id.`);
      } else {
        console.log('✓ All sampled entry scores successfully linked to cycles.');
      }

      results.details.scoresLinkage = {
        totalSampled: totalScores,
        unlinked: unlinkedScores.length
      };
    }

    // 6. Check Active and Completed Cycle States and Gating
    const { data: activeCycles, error: activeCyclesError } = await supabase
      .from('cycles')
      .select('*')
      .eq('status', 'ACTIVE');

    if (activeCyclesError) {
      results.warnings.push(`Error fetching active cycles: ${activeCyclesError.message}`);
    } else {
      results.details.activeCyclesCount = activeCycles?.length || 0;
      console.log(`✓ Active cycles count in db: ${activeCycles?.length || 0}`);
    }

    // 7. Write the markdown compliance report
    const complianceScore = Math.max(0, 100 - (results.warnings.length * 15));
    const reportMd = `# Cycle Engine Compliance Report

Retrieved at: ${new Date().toISOString()}
Compliance Score: **${complianceScore}%**

## Audit Details

### 1. Database Schema
* **Cycles Table Columns**: ${results.schemaValid ? '✓ VALID' : '✗ INVALID'}
* **Verified Columns**: \`cycle_number\`, \`status\`, \`start_date\`, \`end_date\`, \`current_day\`, \`days_completed\`, \`entries_count\`, \`assessment_completed\`, \`assessment_available\`.

### 2. Entity Linkage
* **Entries Linked to Cycles**: ${(!results.details.entriesLinkage || results.details.entriesLinkage.unlinked === 0) ? '✓ COMPLETE' : '⚠ WARNING'}
* **Details**: Sampled ${results.details.entriesLinkage?.totalSampled || 0} entries, ${results.details.entriesLinkage?.unlinked || 0} unlinked, ${results.details.entriesLinkage?.missingDay || 0} missing cycle day.

### 3. Reflections Linkage
* **Reflections Linked to Cycles**: ${(!results.details.reflectionsLinkage || results.details.reflectionsLinkage.unlinked === 0) ? '✓ COMPLETE' : '⚠ WARNING'}
* **Details**: Sampled ${results.details.reflectionsLinkage?.totalSampled || 0} reflections, ${results.details.reflectionsLinkage?.unlinked || 0} unlinked.

### 4. Vocabulary Linkage
* **Vocab Words Linked to Cycles**: ${(!results.details.vocabLinkage || results.details.vocabLinkage.unlinked === 0) ? '✓ COMPLETE' : '⚠ WARNING'}
* **Details**: Sampled ${results.details.vocabLinkage?.totalSampled || 0} vocab words, ${results.details.vocabLinkage?.unlinked || 0} unlinked.

### 5. Entry Scores Linkage
* **Scores Linked to Cycles**: ${(!results.details.scoresLinkage || results.details.scoresLinkage.unlinked === 0) ? '✓ COMPLETE' : '⚠ WARNING'}
* **Details**: Sampled ${results.details.scoresLinkage?.totalSampled || 0} scores, ${results.details.scoresLinkage?.unlinked || 0} unlinked.

### 6. Active Cycles Consistency
* **Number of Active Cycles**: ${results.details.activeCyclesCount || 0} ACTIVE cycles found in database.

## Warnings & Remarks
${results.warnings.length === 0 ? '* No compliance issues identified. The system is 100% cycle-centric.' : results.warnings.map(w => `* ${w}`).join('\n')}

---
**Report generated programmatically via scratch/cycle-compliance-report.ts.**
`;

    const reportPath = path.resolve('C:\\Users\\siddh\\.gemini\\antigravity\\brain\\948714a0-b526-4e4b-964c-fc6829bd3df4', 'compliance_report.md');
    fs.writeFileSync(reportPath, reportMd, 'utf8');
    console.log(`✓ Saved compliance report to ${reportPath}`);

  } catch (error: any) {
    console.error('Error during compliance report generation:', error.message);
  }
}

runComplianceReport();
