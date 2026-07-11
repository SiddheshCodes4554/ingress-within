import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import vm from 'vm';

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

  // 1. Extract and parse data from HTML spec using Node vm
  console.log('Extracting data from emotion-kb-ingress-within.html...');
  const htmlPath = 'C:/Users/siddh/Downloads/emotion-kb-ingress-within.html';
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Find the script tag containing the data
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptContent = '';
  let match;
  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    if (match[1].includes('const REFRAMES =') || match[1].includes('const SURFACE =')) {
      scriptContent = match[1];
      break;
    }
  }

  if (!scriptContent) {
    throw new Error('Could not find data script tag in HTML spec!');
  }

  // Set up mock window/document/localstorage objects so the script executes without errors
  const sandbox = {
    console,
    E: {},
    SURFACE: {},
    WORD_INDEX: {},
    EXTRA_WORDS: {},
    FAMILIES: [],
    PATTERNS: [],
    SITUATIONS: [],
    TEST_PERSONAS: [],
    visited: [],
    resonanceData: {},
    patternSignals: {},
    unknownKBCache: {},
    generatedPool: {},
    activePersona: null,
    trailCache: {},
    matchesContext: null,
    reframeIdx: 0,
    quizScore: { correct: 0, total: 0 },
    quizQuestionNumber: 0,
    currentQuiz: null,
    quizRecentNames: [],
    document: {
      getElementById: () => null,
      querySelectorAll: () => [],
      createElementNS: () => ({ setAttribute: () => {}, innerHTML: '' })
    },
    window: {},
    MutationObserver: class { observe() {} },
    init: () => {},
    iconify: () => {},
    iconObserver: { observe: () => {} }
  };

  vm.createContext(sandbox);
  // Comment out browser DOM initializations at execution time
  let runnableScript = scriptContent
    .replace('init();', '// init();')
    .replace('iconify(document);', '// iconify(document);')
    .replace('iconObserver.observe(document.body, { childList: true, subtree: true });', '// observer;');
  
  runnableScript += '\nthis.E = E;\nthis.WORD_INDEX = WORD_INDEX;\n';

  // Execute the script
  vm.runInContext(runnableScript, sandbox);

  const parsedEmotions = sandbox.E as Record<string, any>;
  const parsedWordIndex = sandbox.WORD_INDEX as Record<string, any>;

  console.log(`Parsed ${Object.keys(parsedEmotions).length} emotions and ${Object.keys(parsedWordIndex).length} word index entries.`);

  // 2. Database migrations creation SQL
  console.log('Creating database tables...');
  const migrationsSql = `
    -- 1. Create kb_dictionary_emotions table
    CREATE TABLE IF NOT EXISTS kb_dictionary_emotions (
      name TEXT PRIMARY KEY,
      family TEXT NOT NULL,
      aka TEXT NOT NULL,
      plain TEXT NOT NULL,
      depth INTEGER NOT NULL DEFAULT 1,
      color TEXT NOT NULL,
      ic TEXT NOT NULL,
      icon TEXT NOT NULL,
      body JSONB NOT NULL DEFAULT '[]'::jsonb,
      rl JSONB NOT NULL DEFAULT '[]'::jsonb,
      cw JSONB NOT NULL DEFAULT '[]'::jsonb,
      patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- 2. Create kb_word_index table
    CREATE TABLE IF NOT EXISTS kb_word_index (
      word TEXT PRIMARY KEY,
      hint TEXT NOT NULL,
      matches JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- 3. Create user_exploration_trail table
    CREATE TABLE IF NOT EXISTS user_exploration_trail (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      concept_name TEXT NOT NULL,
      concept_type TEXT NOT NULL DEFAULT 'emotion',
      visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (user_id, concept_name)
    );

    -- 4. Create resonance_responses table
    CREATE TABLE IF NOT EXISTS resonance_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      concept_name TEXT NOT NULL,
      concept_type TEXT NOT NULL,
      score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (user_id, concept_name, concept_type)
    );

    -- 5. Create kb_quiz_history table
    CREATE TABLE IF NOT EXISTS kb_quiz_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      concept_name TEXT NOT NULL,
      score_correct INTEGER NOT NULL,
      score_total INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Enable RLS on all tables
    ALTER TABLE kb_dictionary_emotions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE kb_word_index ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_exploration_trail ENABLE ROW LEVEL SECURITY;
    ALTER TABLE resonance_responses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE kb_quiz_history ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Allow public SELECT on dictionary_emotions" ON kb_dictionary_emotions;
    DROP POLICY IF EXISTS "Allow public SELECT on word_index" ON kb_word_index;
    
    DROP POLICY IF EXISTS "Allow user SELECT on exploration_trail" ON user_exploration_trail;
    DROP POLICY IF EXISTS "Allow user INSERT on exploration_trail" ON user_exploration_trail;
    DROP POLICY IF EXISTS "Allow user UPDATE on exploration_trail" ON user_exploration_trail;
    
    DROP POLICY IF EXISTS "Allow user SELECT on resonance" ON resonance_responses;
    DROP POLICY IF EXISTS "Allow user INSERT on resonance" ON resonance_responses;
    DROP POLICY IF EXISTS "Allow user UPDATE on resonance" ON resonance_responses;
    
    DROP POLICY IF EXISTS "Allow user SELECT on quiz_history" ON kb_quiz_history;
    DROP POLICY IF EXISTS "Allow user INSERT on quiz_history" ON kb_quiz_history;

    -- Policies for dictionary
    CREATE POLICY "Allow public SELECT on dictionary_emotions" ON kb_dictionary_emotions FOR SELECT USING (true);
    CREATE POLICY "Allow public SELECT on word_index" ON kb_word_index FOR SELECT USING (true);

    -- Policies for user exploration trail
    CREATE POLICY "Allow user SELECT on exploration_trail" ON user_exploration_trail FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Allow user INSERT on exploration_trail" ON user_exploration_trail FOR INSERT WITH CHECK (user_id = auth.uid());
    CREATE POLICY "Allow user UPDATE on exploration_trail" ON user_exploration_trail FOR UPDATE USING (user_id = auth.uid());

    -- Policies for resonance responses
    CREATE POLICY "Allow user SELECT on resonance" ON resonance_responses FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Allow user INSERT on resonance" ON resonance_responses FOR INSERT WITH CHECK (user_id = auth.uid());
    CREATE POLICY "Allow user UPDATE on resonance" ON resonance_responses FOR UPDATE USING (user_id = auth.uid());

    -- Policies for quiz history
    CREATE POLICY "Allow user SELECT on quiz_history" ON kb_quiz_history FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Allow user INSERT on quiz_history" ON kb_quiz_history FOR INSERT WITH CHECK (user_id = auth.uid());
  `;

  const { error: migrationError } = await db.rpc('exec_sql', { sql_query: migrationsSql });
  if (migrationError) {
    throw new Error(`Migration tables creation failed: ${migrationError.message}`);
  }
  console.log('Database tables successfully created!');

  // 3. Populate kb_dictionary_emotions table
  console.log('Seeding kb_dictionary_emotions...');
  // Delete existing data first to avoid duplicates or conflicts
  await db.from('kb_dictionary_emotions').delete().neq('name', '___');

  const emotionRows = Object.entries(parsedEmotions).map(([name, data]) => ({
    name,
    family: data.fam || 'Other',
    aka: data.aka || '',
    plain: data.plain || '',
    depth: data.depth || 1,
    color: data.color || '#fff',
    ic: data.ic || '#000',
    icon: data.icon || 'ti-circle',
    body: JSON.stringify(data.body || []),
    rl: JSON.stringify(data.rl || []),
    cw: JSON.stringify(data.cw || []),
    patterns: JSON.stringify(data.patterns || [])
  }));

  const { error: emoError } = await db.from('kb_dictionary_emotions').insert(emotionRows);
  if (emoError) {
    throw new Error(`Failed to seed emotions: ${emoError.message}`);
  }
  console.log(`Successfully seeded ${emotionRows.length} emotions into kb_dictionary_emotions.`);

  // 4. Populate kb_word_index table
  console.log('Seeding kb_word_index...');
  await db.from('kb_word_index').delete().neq('word', '___');

  const wordIndexRows = Object.entries(parsedWordIndex).map(([word, data]: [string, any]) => ({
    word,
    hint: data.hint || '',
    matches: JSON.stringify(data.matches || [])
  }));

  // Batch inserts to prevent hitting any limits
  const batchSize = 50;
  for (let i = 0; i < wordIndexRows.length; i += batchSize) {
    const batch = wordIndexRows.slice(i, i + batchSize);
    const { error: wordError } = await db.from('kb_word_index').insert(batch);
    if (wordError) {
      throw new Error(`Failed to seed word index batch: ${wordError.message}`);
    }
  }
  console.log(`Successfully seeded ${wordIndexRows.length} word mappings into kb_word_index.`);
}

main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
