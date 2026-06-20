import fs from 'fs';
import path from 'path';

const schemaPath = path.resolve(process.cwd(), 'scratch/schema-openapi.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const reflectionsDef = schema.definitions.reflections;
console.log('Reflections table properties:', Object.keys(reflectionsDef.properties));

const monthlyScoresDef = schema.definitions.monthly_scores;
console.log('MonthlyScores table properties:', Object.keys(monthlyScoresDef.properties));
