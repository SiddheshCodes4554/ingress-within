import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('Connecting to Supabase at:', supabaseUrl);
  try {
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('*')
      .limit(3);
    
    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
    } else {
      console.log('Successfully fetched entries:', entries);
    }
  } catch (err) {
    console.error('Exception occurred:', err);
  }
}

run();
