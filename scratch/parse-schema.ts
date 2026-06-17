import fs from 'fs';
import path from 'path';

function parseSchema() {
  const schemaPath = path.resolve(process.cwd(), 'scratch/schema-openapi.json');
  if (!fs.existsSync(schemaPath)) {
    console.error('scratch/schema-openapi.json does not exist. Run fetch-schema first.');
    return;
  }
  
  const rawData = fs.readFileSync(schemaPath, 'utf8');
  const spec = JSON.parse(rawData);
  
  if (!spec.definitions) {
    console.error('Definitions field not found in spec.');
    return;
  }
  
  let md = '# Current Supabase Schema Audit\n\n';
  md += `Retrieved at: ${new Date().toISOString()}\n\n`;
  
  const tableNames = Object.keys(spec.definitions);
  for (const tableName of tableNames) {
    const tableDef = spec.definitions[tableName];
    md += `## Table: \`${tableName}\`\n\n`;
    if (tableDef.description) {
      md += `${tableDef.description}\n\n`;
    }
    
    md += '| Column | Type | Format | Required | Default | Description |\n';
    md += '| --- | --- | --- | --- | --- | --- |\n';
    
    const requiredCols = tableDef.required || [];
    const props = tableDef.properties || {};
    
    for (const colName of Object.keys(props)) {
      const col = props[colName];
      const isRequired = requiredCols.includes(colName) ? 'Yes' : 'No';
      const typeStr = col.type || '';
      const formatStr = col.format || '';
      const defaultStr = col.default !== undefined ? String(col.default) : '';
      const descStr = col.description || '';
      
      md += `| \`${colName}\` | ${typeStr} | \`${formatStr}\` | ${isRequired} | \`${defaultStr}\` | ${descStr} |\n`;
    }
    md += '\n';
  }
  
  const outputPath = path.resolve(process.cwd(), 'scratch/current-schema.md');
  fs.writeFileSync(outputPath, md, 'utf8');
  console.log(`✅ Parsed current schema and saved to scratch/current-schema.md`);
}

parseSchema();
