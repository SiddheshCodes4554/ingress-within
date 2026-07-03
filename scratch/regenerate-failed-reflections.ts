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

async function run() {
  const { createClient } = await import('@supabase/supabase-js');
  const { getAIProvider } = await import('../src/lib/ai/factory');
  const { decrypt } = await import('../src/lib/encryption');

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const provider = getAIProvider('groq');

  console.log('Fetching all reflections with status "failed"...');
  const { data: failedReflections, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('status', 'failed');

  if (error) {
    console.error('Error fetching failed reflections:', error);
    return;
  }

  console.log(`Found ${failedReflections.length} failed reflections.`);

  for (const reflection of failedReflections) {
    console.log(`\nProcessing reflection ID: ${reflection.id} (Entry ID: ${reflection.entry_id})`);
    
    // Fetch associated entry to get content
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select('*')
      .eq('id', reflection.entry_id)
      .single();

    if (entryError || !entry) {
      console.error(`Failed to fetch entry for reflection:`, entryError?.message);
      continue;
    }

    const content = decrypt(entry.new_entry_text_encrypted, entry.new_entry_text_iv) || entry.content;
    if (!content) {
      console.error(`Empty content for entry ${entry.id}`);
      continue;
    }

    console.log(`Entry Content: "${content.substring(0, 100)}..."`);

    // Fetch user context if available
    const { data: user } = await supabase
      .from('users')
      .select('personality_summary_text')
      .eq('id', reflection.user_id)
      .maybeSingle();

    const personalityContext = user?.personality_summary_text || undefined;

    console.log('Generating new reflection...');
    try {
      const result = await provider.generateReflection(content, personalityContext);
      console.log('Generated Reflection:', result);

      const fullReflectionText = `${result.reflection.trim()}\n\n${(result.closing_nudge || 'Sit with that tonight.\nCome back tomorrow and tell me what came up.').trim()}`;

      const updatePayload = {
        reflection_text: fullReflectionText,
        closing_question: result.closing_question,
        classification: result.classification,
        confidence: result.confidence || 'high',
        themes: result.themes || [],
        status: 'ready',
        generated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('reflections')
        .update(updatePayload)
        .eq('id', reflection.id);

      if (updateError) {
        console.error('Failed to update reflection row in DB:', updateError.message);
      } else {
        console.log('Successfully updated reflection in database!');
      }
    } catch (genErr) {
      console.error('Failed to generate reflection:', genErr);
    }
  }

  console.log('\nRegeneration run complete.');
}

run().catch(err => console.error(err));
