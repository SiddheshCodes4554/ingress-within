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

  // Re-import supabase after process.env is set
  const dbPath = pathToFileURL(path.join(process.cwd(), 'src/lib/db.ts')).href;
  const { supabase: db } = await import(dbPath);

  const sqlPath = path.join(process.cwd(), 'orchestrator_migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Attempting to apply orchestrator migration via Supabase RPC...');
  const { data, error } = await db.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('RPC exec_sql failed:', error.message);
    console.log('\nPlease run the SQL statements inside "orchestrator_migration.sql" manually in your Supabase Dashboard SQL Editor.');
  } else {
    console.log('Migration successfully applied via RPC! Result:', data);
  }
}

main().catch(console.error);
