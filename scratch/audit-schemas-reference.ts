import fs from 'fs';
import path from 'path';

const schemaPath = path.resolve(process.cwd(), 'scratch/schema-openapi.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const definitions = schema.definitions;

const expectedSchemas = {
  users: {
    ocean_openness: 'number',
    ocean_conscientiousness: 'number',
    ocean_extraversion: 'number',
    ocean_agreeableness: 'number',
    ocean_neuroticism: 'number',
    personality_profile_json: 'string', // text
    personality_summary_text: 'string', // text
    onboarding_completed: 'boolean',
    sustained_distress_flag: 'boolean',
    sustained_distress_since: 'string', // timestamp/date
    sustained_distress_cleared_at: 'string', // timestamp/date
  },
  entries: {
    user_id: 'string', // link / uuid
    created_at: 'string', // date
    reflection_text: 'string',
    new_entry_text: 'string',
    entry_type: 'string',
    reflection_ei: 'number',
    reflection_pr: 'number',
    reflection_sa: 'number',
    new_entry_ei: 'number',
    new_entry_pr: 'number',
    new_entry_sa: 'number',
    day_ei: 'number',
    day_pr: 'number',
    day_sa: 'number',
    confidence_flag: 'boolean',
    confidence_reason: 'string',
    arc_scoring_applied: 'boolean',
    arc_scoring_note: 'string',
    crisis_flag: 'boolean',
    crisis_type: 'string',
    crisis_flagged_at: 'string',
    reflection_suppressed: 'boolean',
    risk_language_quote: 'string',
  },
  assessments: {
    user_id: 'string',
    created_at: 'string',
    ei_avg: 'number',
    pr_avg: 'number',
    sa_avg: 'number',
    dt_score: 'number',
    normalised_sa: 'number',
    risk_total: 'number',
    path_assignment: 'string',
    dominant_dimension: 'string',
    branch_assignment: 'string',
    stability_gate_triggered: 'boolean',
    entry_count: 'integer'
  },
  monthly_scores: {
    user_id: 'string',
    assessment_id: 'string',
    month_number: 'integer',
    window_start: 'string',
    window_end: 'string',
    ei_score: 'number',
    pr_score: 'number',
    sa_score: 'number',
    dt_score: 'number',
    ei_delta: 'number',
    pr_delta: 'number',
    sa_delta: 'number',
    dt_delta: 'number',
    primary_dimension: 'string',
    routing_action: 'string',
    professional_nudge_active: 'boolean',
    consecutive_worsening_count: 'integer',
    consecutive_improvement_count: 'integer',
    entry_count: 'integer'
  }
};

console.log('=== DATABASE SCHEMA ALIGNMENT AUDIT ===\n');

for (const [tableName, fields] of Object.entries(expectedSchemas)) {
  const tableDef = definitions[tableName];
  if (!tableDef) {
    console.log(`Table "${tableName}": ❌ NOT FOUND in OpenAPI definitions!`);
    continue;
  }
  
  console.log(`Table "${tableName}":`);
  const props = tableDef.properties || {};
  
  for (const [fieldName, expectedType] of Object.entries(fields)) {
    const col = props[fieldName];
    if (!col) {
      console.log(`  - Field "${fieldName}": ❌ MISSING!`);
    } else {
      const actualType = col.type || '';
      console.log(`  - Field "${fieldName}": ✅ Found (type: ${actualType})`);
    }
  }
  console.log('');
}
