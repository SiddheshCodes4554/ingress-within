import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

async function main() {
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

  console.log('=== Checking Knowledge Profiles ===');
  const { data: profiles, error: pErr } = await db.from('knowledge_profile').select('*');
  if (pErr) console.error('Error fetching profiles:', pErr);
  else console.log(`Found ${profiles?.length || 0} knowledge profiles.`);

  console.log('\n=== Checking Knowledge Cards ===');
  const { data: cards, error: cErr } = await db.from('knowledge_cards').select('id, card_type, title, confidence, referenced_nodes').limit(5);
  if (cErr) console.error('Error fetching cards:', cErr);
  else {
    console.log(`Found cards (sample showing ${cards?.length || 0}):`);
    console.log(JSON.stringify(cards, null, 2));
  }

  console.log('\n=== Checking Knowledge Relationships ===');
  const { data: rels, error: rErr } = await db.from('knowledge_relationships').select('id, source_node, source_type, target_node, target_type, relationship_type, confidence').limit(5);
  if (rErr) console.error('Error fetching relationships:', rErr);
  else {
    console.log(`Found relationships (sample showing ${rels?.length || 0}):`);
    console.log(JSON.stringify(rels, null, 2));
  }
}

main().catch(console.error);
