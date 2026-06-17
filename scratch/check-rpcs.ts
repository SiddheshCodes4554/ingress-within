import fs from 'fs';
import path from 'path';

function checkRpcs() {
  const schemaPath = path.resolve(process.cwd(), 'scratch/schema-openapi.json');
  if (!fs.existsSync(schemaPath)) {
    console.error('schema-openapi.json not found.');
    return;
  }
  
  const spec = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const paths = Object.keys(spec.paths || {});
  const rpcs = paths.filter(p => p.startsWith('/rpc/'));
  
  console.log('Available RPCs in Supabase API:');
  rpcs.forEach(rpc => {
    console.log(`- ${rpc}`);
  });
}

checkRpcs();
