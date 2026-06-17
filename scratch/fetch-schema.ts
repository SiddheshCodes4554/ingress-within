import fs from 'fs';
import path from 'path';

// Parse .env
try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase variables in .env!');
  process.exit(1);
}

async function fetchSchema() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    fs.writeFileSync(
      path.resolve(process.cwd(), 'scratch/schema-openapi.json'),
      JSON.stringify(data, null, 2),
      'utf8'
    );
    console.log('✅ OpenAPI schema successfully fetched and saved to scratch/schema-openapi.json');
    
    // Let's print out the list of tables we found
    if (data.definitions) {
      const tables = Object.keys(data.definitions);
      console.log('\nFound tables in schema definitions:');
      tables.forEach(t => console.log(`- ${t}`));
    } else {
      console.log('No definitions field found in OpenAPI spec.');
    }
  } catch (err: any) {
    console.error('Error fetching schema:', err.message);
  }
}

fetchSchema();
