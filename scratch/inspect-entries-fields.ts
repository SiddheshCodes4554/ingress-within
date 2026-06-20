import fs from 'fs';
import path from 'path';

const schemaPath = path.resolve(process.cwd(), 'scratch/schema-openapi.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const entriesDef = schema.definitions.entries;
console.log('Entries table properties:', Object.keys(entriesDef.properties));
const usersDef = schema.definitions.users;
console.log('Users table properties:', Object.keys(usersDef.properties));
const assessmentsDef = schema.definitions.assessments;
console.log('Assessments table properties:', Object.keys(assessmentsDef.properties));
