import fs from 'fs';
import path from 'path';

// Parse .env first
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
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
      if (key && val) {
        process.env[key] = val;
      }
    }
  });
}

async function test() {
  const { getAIProvider } = await import('../src/lib/ai/factory');
  const { validateReflection } = await import('../src/lib/queue/workers/reflectionWorker');

  const provider = getAIProvider('groq');
  const entryText = "SO my therapist asked me today do i want to get married or not. I said i dont want to fit in timeline but i also dont want to be alone so in future i want a partner but today i also feel very cautious because of past experiences that drained me completely.";
  
  console.log('--- Testing Groq with latest entry text ---');
  try {
    const result = await provider.generateReflection(entryText);
    console.log('LLM Result:', result);
    
    const validation = validateReflection(result.reflection || '');
    console.log('Validation status:', validation);
  } catch (err: any) {
    console.error('Test failed:', err);
  }
}

test();
