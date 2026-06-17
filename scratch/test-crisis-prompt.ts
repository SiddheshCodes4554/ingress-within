import fs from 'fs';
import path from 'path';

// Load env
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
} catch (e: any) {
  console.error('Could not read .env file:', e.message);
}

import { GroqProvider } from '../src/lib/ai/providers/GroqProvider';

async function runTest() {
  const provider = new GroqProvider();
  
  const testInputs = [
    "I cannot do this anymore. Everything feels impossible. I have no control over anything. I feel completely trapped.",
    "i am ending my life",
    "I want to kill myself",
    "I feel completely hopeless and want to end it all",
    "I don't want to live anymore"
  ];

  console.log("=== TESTING detectCrisis ===");
  for (const input of testInputs) {
    console.log(`\nInput: "${input}"`);
    try {
      const res = await provider.detectCrisis(input);
      console.log("Result:", JSON.stringify(res, null, 2));
      console.log("Raw Response:", provider.lastRawResponse);
    } catch (err: any) {
      console.error("Error:", err.message);
    }
  }

  console.log("\n=== TESTING scoreEntryDimensions ===");
  for (const input of testInputs) {
    console.log(`\nInput: "${input}"`);
    try {
      const res = await provider.scoreEntryDimensions(null, input, null);
      console.log("Result:", JSON.stringify(res, null, 2));
      console.log("Raw Response:", provider.lastRawResponse);
    } catch (err: any) {
      console.error("Error:", err.message);
    }
  }
}

runTest().catch(console.error);
