import './load-env';
import { supabase } from '../src/lib/db';

async function check() {
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching reflections:', error);
  } else {
    console.log('Sample reflection keys:', data ? Object.keys(data[0] || {}) : 'No data');
  }
}

check();
