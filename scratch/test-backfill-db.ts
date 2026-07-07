import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
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
  try {
    const { supabase } = await import('../src/lib/db');
    const { data, error } = await supabase
      .from('pattern_snapshots')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Error querying pattern_snapshots:', error.code, error.message);
    } else {
      console.log('pattern_snapshots query success:', data);
    }
  } catch (err: any) {
    console.error('Catch error:', err);
  }
}

test();
