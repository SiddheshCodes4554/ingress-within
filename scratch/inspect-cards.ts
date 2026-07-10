import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

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

async function inspectCards() {
  const dbPath = pathToFileURL(path.join(process.cwd(), 'src/lib/db.ts')).href;
  const { supabase: db } = await import(dbPath);

  console.log('=== INSPECTING KNOWLEDGE CARDS IN DATABASE ===');
  const { data: cards, error } = await db
    .from('knowledge_cards')
    .select('*, profiles(full_name)');

  if (error) {
    console.error('Error fetching cards:', error);
    return;
  }

  console.log(`Found ${cards?.length || 0} total cards in database.\n`);

  cards?.forEach((c: any) => {
    console.log(`--------------------------------------------------`);
    console.log(`User: ${c.profiles?.full_name || 'Unknown'} (${c.user_id})`);
    console.log(`ID: ${c.id} | Type: ${c.card_type}`);
    console.log(`Title: ${c.title}`);
    console.log(`Subtitle: ${c.subtitle}`);
    console.log(`Body: ${c.body}`);
    console.log(`Confidence: ${c.confidence}`);
    console.log(`Citations:`);
    console.log(`  Supporting Entries: ${JSON.stringify(c.supporting_entries)}`);
    console.log(`  Supporting Reports: ${JSON.stringify(c.supporting_reports)}`);
    console.log(`  Supporting Patterns: ${JSON.stringify(c.supporting_patterns)}`);
    console.log(`  Supporting Vocabulary: ${JSON.stringify(c.supporting_vocabulary)}`);
  });
}

inspectCards().catch(console.error);
