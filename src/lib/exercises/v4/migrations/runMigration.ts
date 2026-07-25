import fs from 'fs';
import path from 'path';
import { supabase } from '../../../db';

export async function runExerciseV4Migration() {
  console.log('[Migration V4] Executing 001_create_exercise_v4_tables.sql...');
  const sqlPath = path.join(process.cwd(), 'src/lib/exercises/v4/migrations/001_create_exercise_v4_tables.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Split SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      if (error) {
        console.warn(`[Migration V4] Statement notice: ${error.message}`);
      }
    } catch (err: any) {
      console.warn(`[Migration V4] RPC note: ${err.message}`);
    }
  }

  console.log('[Migration V4] Migration execution completed.');
}
