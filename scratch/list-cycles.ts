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

  // Get cycles
  const { data: cycles } = await db
    .from('cycles')
    .select('*')
    .eq('user_id', testUser);

  console.log('Cycles list:');
  for (const c of cycles || []) {
    const { count } = await db
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('cycle_id', c.id);
    console.log(`Cycle: ID=${c.id}, Number=${c.cycle_number}, Status=${c.status}, Entries=${count}`);
  }
}

main().catch(console.error);
