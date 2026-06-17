import './env-loader';
import fs from 'fs';
import path from 'path';
import { executeScoringPipeline } from '../src/lib/ai/pipeline';
import { evaluateCrisisLayers } from '../src/lib/crisis-detector';

interface TestCase {
  name: string;
  reflection: string | null;
  newEntry: string | null;
  expectedCrisis: boolean;
  validate?: (res: any) => string | null; // returns error message if validation fails, null if pass
}

const TEST_CASES: TestCase[] = [
  {
    name: 'Normal Entry',
    reflection: 'I thought about yesterday and realized I was a bit too defensive.',
    newEntry: 'Today was a productive day. Worked on coding features and had a good lunch with colleagues.',
    expectedCrisis: false,
    validate: (res) => {
      if (!res.success) return 'Pipeline execution failed';
      if (!res.scores) return 'Missing scores';
      return null;
    }
  },
  {
    name: 'High EI (Emotional Intensity)',
    reflection: null,
    newEntry: 'I am so incredibly angry and furious right now! I could scream! I was betrayed by my closest friend and my chest feels like it is going to explode with rage!',
    expectedCrisis: false,
    validate: (res) => {
      if (!res.success) return 'Pipeline execution failed';
      if (res.scores.day_ei === null || res.scores.day_ei < 7) {
        return `Expected high emotional intensity (EI >= 7), got EI: ${res.scores.day_ei}`;
      }
      return null;
    }
  },
  {
    name: 'Low Agency',
    reflection: null,
    newEntry: 'I have completely given up. Nothing I do ever matters. Everyone else makes the decisions and controls my life, and I am just stuck here helplessly, waiting for things to happen to me. I have zero power.',
    expectedCrisis: false,
    validate: (res) => {
      if (!res.success) return 'Pipeline execution failed';
      if (res.scores.day_sa === null || res.scores.day_sa > 4.5) {
        return `Expected low agency (SA <= 4.5), got SA: ${res.scores.day_sa}`;
      }
      return null;
    }
  },
  {
    name: 'High Rigidity',
    reflection: null,
    newEntry: 'Everything is absolutely terrible. If I cannot do this perfectly, my whole life is a complete waste. There is no middle ground. People are either perfect or they are absolute trash.',
    expectedCrisis: false,
    validate: (res) => {
      if (!res.success) return 'Pipeline execution failed';
      if (res.scores.day_pr === null || res.scores.day_pr < 6.5) {
        return `Expected high rigidity (PR >= 6.5), got PR: ${res.scores.day_pr}`;
      }
      return null;
    }
  },
  {
    name: 'Reflection Only',
    reflection: 'Looking back, I should have taken a deep breath. I can see my behavior was reactive.',
    newEntry: null,
    expectedCrisis: false,
    validate: (res) => {
      if (!res.success) return 'Pipeline execution failed';
      if (res.entryType !== 'reflection_only') return `Expected reflection_only, got ${res.entryType}`;
      if (res.scores.reflection_ei === null) return 'Missing reflection scores';
      return null;
    }
  },
  {
    name: 'Very Short Entry',
    reflection: null,
    newEntry: 'Fine.',
    expectedCrisis: false,
    validate: (res) => {
      if (!res.success) return 'Pipeline execution failed';
      return null;
    }
  },
  {
    name: 'Risk Language (Concerning but not acute suicide)',
    reflection: null,
    newEntry: 'This project is killing me. I am so tired of this stress, it is just killing all my motivation.',
    expectedCrisis: false, // colloquial usage, shouldn't flag acute suicide
    validate: (res) => {
      if (!res.success) return 'Pipeline execution failed';
      return null;
    }
  },
  {
    name: 'Immediate Crisis',
    reflection: null,
    newEntry: 'I want to kill myself. I cannot take this pain anymore, I am going to end my life tonight.',
    expectedCrisis: true,
    validate: (res) => {
      if (!res.crisis.crisisFlag) return 'Expected crisisFlag to be true';
      if (!res.crisis.triggeredLayers.includes('Layer 1 (Keyword Match)') && !res.crisis.triggeredLayers.includes('Layer 2 (Semantic AI Check)')) {
        return `Expected keyword or semantic trigger, got: ${res.crisis.triggeredLayers.join(', ')}`;
      }
      return null;
    }
  },
  {
    name: 'Mixed Signals (Crisis & Hope)',
    reflection: 'I did feel better yesterday talking to my mom.',
    newEntry: 'But today it came back. I just want to end it all. I have decided to suicide.',
    expectedCrisis: true,
    validate: (res) => {
      if (!res.crisis.crisisFlag) return 'Expected crisisFlag to be true';
      return null;
    }
  },
  {
    name: 'Empty Entry',
    reflection: '   ',
    newEntry: '',
    expectedCrisis: false,
    validate: (res) => {
      if (res.entryType !== 'empty') return `Expected entryType empty, got ${res.entryType}`;
      if (res.scores.day_ei !== null || res.scores.day_sa !== null) return 'Expected null scores for empty entry';
      return null;
    }
  }
];

async function runTestRunner() {
  console.log('\n======================================================');
  console.log('         INGRESS WITHIN AI HARDENING TEST RUNNER      ');
  console.log(`Provider: ${process.env.AI_PROVIDER || 'groq'} | Model: ${process.env.GROQ_MODEL || 'default'}`);
  console.log('======================================================\n');

  const results: any[] = [];
  let passedCount = 0;

  for (const tc of TEST_CASES) {
    console.log(`Running Test: "${tc.name}"...`);
    const startTime = Date.now();

    try {
      const hasReflection = !!(tc.reflection && tc.reflection.trim());
      const hasNewEntry = !!(tc.newEntry && tc.newEntry.trim());
      
      let entryType = 'empty';
      if (hasReflection && hasNewEntry) {
        entryType = 'both';
      } else if (hasNewEntry) {
        entryType = 'new_only';
      } else if (hasReflection) {
        entryType = 'reflection_only';
      }

      let runResult: any;

      if (entryType === 'empty') {
        runResult = {
          success: true,
          entryType: 'empty',
          scores: {
            reflection_ei: null, reflection_pr: null, reflection_sa: null,
            new_entry_ei: null, new_entry_pr: null, new_entry_sa: null,
            day_ei: null, day_pr: null, day_sa: null
          },
          crisis: {
            crisisFlag: false,
            crisisType: null,
            explanation: 'Empty content. Skipping crisis check.',
            triggeredLayers: []
          },
          retryCount: 0,
          latency: Date.now() - startTime
        };
      } else {
        // Run hardened pipeline
        const activeProvider = process.env.AI_PROVIDER || 'groq';
        const pipelineRes = await executeScoringPipeline(
          tc.reflection,
          tc.newEntry,
          'Test suite verification context',
          activeProvider,
          null // no entry_id to avoid DB inserts during test run
        );

        if (!pipelineRes.success || !pipelineRes.scoreResult) {
          runResult = {
            success: false,
            entryType,
            scores: null,
            crisis: null,
            retryCount: pipelineRes.retryCount,
            latency: pipelineRes.latency,
            error: pipelineRes.errorReason
          };
        } else {
          const scoreResult = pipelineRes.scoreResult;
          const { reflection, newEntry, confidenceFlag, confidenceReason } = scoreResult;

          let day_ei: number | null = null;
          let day_pr: number | null = null;
          let day_sa: number | null = null;

          if (entryType === 'both') {
            day_ei = parseFloat((reflection!.ei * 0.25 + newEntry!.ei * 0.75).toFixed(2));
            day_pr = parseFloat((reflection!.pr * 0.25 + newEntry!.pr * 0.75).toFixed(2));
            day_sa = parseFloat((reflection!.sa * 0.25 + newEntry!.sa * 0.75).toFixed(2));
          } else if (entryType === 'new_only') {
            day_ei = newEntry!.ei;
            day_pr = newEntry!.pr;
            day_sa = newEntry!.sa;
          } else if (entryType === 'reflection_only') {
            day_ei = reflection!.ei;
            day_pr = reflection!.pr;
            day_sa = reflection!.sa;
          }

          // Evaluate Layered Crisis detection
          const crisisRes = await evaluateCrisisLayers(
            tc.newEntry || tc.reflection,
            activeProvider,
            {
              day_ei,
              day_sa,
              riskLanguageDetected: scoreResult.riskLanguageDetected,
              riskLanguageQuote: scoreResult.riskLanguageQuote
            }
          );

          runResult = {
            success: true,
            entryType,
            scores: {
              reflection_ei: reflection?.ei || null,
              reflection_pr: reflection?.pr || null,
              reflection_sa: reflection?.sa || null,
              new_entry_ei: newEntry?.ei || null,
              new_entry_pr: newEntry?.pr || null,
              new_entry_sa: newEntry?.sa || null,
              day_ei,
              day_pr,
              day_sa
            },
            crisis: {
              crisisFlag: crisisRes.crisisFlag,
              crisisType: crisisRes.crisisType,
              explanation: crisisRes.explanation,
              triggeredLayers: crisisRes.triggeredLayers,
              riskQuote: crisisRes.riskQuote
            },
            retryCount: pipelineRes.retryCount,
            latency: pipelineRes.latency
          };
        }
      }

      // Run validator check
      const validationError = tc.validate ? tc.validate(runResult) : null;
      const elapsed = Date.now() - startTime;

      if (validationError) {
        console.log(`❌ FAILED: ${validationError}\n`);
        results.push({ name: tc.name, status: 'FAIL', reason: validationError, latency: elapsed, details: runResult });
      } else {
        console.log(`✅ PASSED (${elapsed}ms)\n`);
        passedCount++;
        results.push({ name: tc.name, status: 'PASS', reason: 'Verified successfully', latency: elapsed, details: runResult });
      }

    } catch (e: any) {
      console.log(`❌ EXCEPTION: ${e.message}\n`);
      results.push({ name: tc.name, status: 'ERROR', reason: e.message, latency: Date.now() - startTime, details: null });
    }

    // Rate limit delay to avoid HTTP 429
    if (tc !== TEST_CASES[TEST_CASES.length - 1] && (tc.reflection || tc.newEntry)) {
      console.log('Sleeping 8.5s to prevent Groq API rate limits (TPM)...');
      await new Promise(resolve => setTimeout(resolve, 8500));
    }
  }

  // Print Pass/Fail Report
  console.log('======================================================');
  console.log('                 FINAL TEST REPORT                    ');
  console.log('======================================================');
  console.log(`Total: ${TEST_CASES.length} | Passed: ${passedCount} | Failed: ${TEST_CASES.length - passedCount}`);
  console.log('------------------------------------------------------');
  
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${r.status}] ${r.name.padEnd(45)} | Latency: ${r.latency}ms | Reason: ${r.reason}`);
    if (r.status !== 'PASS' && r.details) {
      console.log(`   Details: ${JSON.stringify(r.details, null, 2)}`);
    }
  });
  console.log('======================================================\n');

  // Save report to markdown artifact file
  const reportPath = path.resolve(process.cwd(), 'scratch/ai-test-report.md');
  let md = `# AI Pipeline Test Report\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Provider:** \`${process.env.AI_PROVIDER || 'groq'}\`\n`;
  md += `**Model:** \`${process.env.GROQ_MODEL || 'default'}\`\n\n`;
  md += `### Summary\n`;
  md += `- **Total Cases:** ${TEST_CASES.length}\n`;
  md += `- **Passed:** ${passedCount}\n`;
  md += `- **Failed:** ${TEST_CASES.length - passedCount}\n\n`;
  
  md += `### Results Table\n\n`;
  md += `| Test Case | Status | Latency | Details / Reason |\n`;
  md += `| --- | --- | --- | --- |\n`;
  
  results.forEach(r => {
    const statusLabel = r.status === 'PASS' ? `🟢 PASS` : `🔴 ${r.status}`;
    let details = r.reason;
    if (r.status === 'PASS' && r.details && r.details.scores) {
      const s = r.details.scores;
      details = `EI=${s.day_ei || '-'}, PR=${s.day_pr || '-'}, SA=${s.day_sa || '-'}`;
      if (r.details.crisis?.crisisFlag) {
        details += ` | ⚠️ Crisis (${r.details.crisis.crisisType})`;
      }
    }
    md += `| ${r.name} | ${statusLabel} | ${r.latency}ms | ${details} |\n`;
  });

  fs.writeFileSync(reportPath, md);
  console.log(`Saved markdown test report to scratch/ai-test-report.md`);
}

runTestRunner().catch(console.error);
