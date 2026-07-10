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

  console.log('Cleaning up any test auth users in database...');
  
  // List auth users
  const { data: usersData, error: listErr } = await db.auth.admin.listUsers();
  if (listErr) {
    console.error('Failed to list auth users:', listErr.message);
    return;
  }

  let deletedCount = 0;
  for (const user of usersData.users) {
    if (user.email && (user.email.startsWith('test-') || user.email.includes('example.com'))) {
      console.log(`Deleting test user: ${user.email} (${user.id})...`);
      
      // Delete from public.users first
      await db.from('users').delete().eq('id', user.id);
      
      // Delete from auth
      const { error: delErr } = await db.auth.admin.deleteUser(user.id);
      if (delErr) {
        console.error(`Failed to delete user ${user.id}:`, delErr.message);
      } else {
        deletedCount++;
      }
    }
  }

  console.log(`Cleanup complete. Deleted ${deletedCount} test users.`);
}

main().catch(console.error);
