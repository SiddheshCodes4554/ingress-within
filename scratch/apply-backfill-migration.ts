import * as fs from 'fs';
import * as path from 'path';

// Manual .env loader
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      if (line.trim().startsWith('#') || !line.trim()) return;
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

async function main() {
  const { supabase } = await import('../src/lib/db');
  
  const sqlPath = path.join(process.cwd(), 'scratch', 'create-pattern-backfill-status.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Attempting to execute SQL migration for pattern backfill status via Supabase RPC...');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('RPC exec_sql failed:', error.message, error.code);
    process.exit(1);
  } else {
    console.log('Migration applied successfully via RPC! Result:', data);
  }
}

main().catch(console.error);
