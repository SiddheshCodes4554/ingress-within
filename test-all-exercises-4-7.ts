import {
  CORE_VALUES_ITEMS,
  CORE_VALUES_DEFINITION,
  calculateReorderDelta
} from './src/lib/exercises/v4/definitions/coreValuesCatalog';
import { RELATIONSHIP_MAP_DEFINITION, RELATIONSHIP_LABELS, FREQUENCY_CHOICES } from './src/lib/exercises/v4/definitions/relationshipMapCatalog';
import { BODY_SIGNAL_INVENTORY_DEFINITION, BODY_SYSTEMS } from './src/lib/exercises/v4/definitions/bodySignalCatalog';
import { AVOIDANCE_AUDIT_DEFINITION, AVOIDANCE_PROMPTS } from './src/lib/exercises/v4/definitions/avoidanceAuditCatalog';
import { CoreValuesPrompt } from './src/lib/exercises/v4/ai/coreValuesPrompt';
import { RelationshipMapPrompt } from './src/lib/exercises/v4/ai/relationshipMapPrompt';
import { BodySignalPrompt } from './src/lib/exercises/v4/ai/bodySignalPrompt';
import { AvoidanceAuditPrompt } from './src/lib/exercises/v4/ai/avoidanceAuditPrompt';

console.log('====================================================');
console.log('Ingress Within — Exercises 4-7 Comprehensive Test');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, description: string) {
  totalTests++;
  if (condition) {
    console.log(` ✓ [PASS] ${description}`);
    passedTests++;
  } else {
    console.error(` ✗ [FAIL] ${description}`);
    process.exitCode = 1;
  }
}

// Exercise 4: Core Values Card Sort (Day 35)
assert(CORE_VALUES_DEFINITION.unlock_rules?.day === 35, 'Exercise 4: Unlock day is set to 35');
assert(CORE_VALUES_ITEMS.length === 20, 'Exercise 4: Catalog contains 20 fixed values');
assert(calculateReorderDelta(['A', 'B', 'C', 'D', 'E'], ['A', 'B', 'C', 'D', 'E']) === 0, 'Exercise 4: Instant confirm yields reorder_delta = 0');

// Exercise 5: Relationship Map (Day 42)
assert(RELATIONSHIP_MAP_DEFINITION.unlock_rules?.day === 42, 'Exercise 5: Unlock day is set to 42');
assert(RELATIONSHIP_LABELS.length === 6, 'Exercise 5: Contains 6 relationship labels');
assert(FREQUENCY_CHOICES.length === 3, 'Exercise 5: Contains 3 frequency options');

// Exercise 6: Body Signal Inventory (Day 49)
assert(BODY_SIGNAL_INVENTORY_DEFINITION.unlock_rules?.day === 49, 'Exercise 6: Unlock day is set to 49');
assert(BODY_SYSTEMS.length === 6, 'Exercise 6: Contains 6 body systems (Sleep, Appetite, Tension, Energy, Digestion, Breathing)');

// Exercise 7: Avoidance Audit (Day 91)
assert(AVOIDANCE_AUDIT_DEFINITION.unlock_rules?.day === 91, 'Exercise 7: Unlock day is set to 91');
assert(AVOIDANCE_PROMPTS.length === 6, 'Exercise 7: Contains 6 sentence completion prompts');

// AI Prompt Verification for all 4 exercises
const p4 = CoreValuesPrompt.buildPrompt({ selectedValues: ['Peace'], selectionOrder: ['Peace'], reorderDelta: 0 });
assert(p4.includes('Return only 2–3 plain sentences'), 'Exercise 4 AI Prompt adheres to spec format');

const p5 = RelationshipMapPrompt.buildPrompt('1. Alex (Partner) — Feeling: "good"');
assert(p5.includes('Return only 2-3 plain sentences'), 'Exercise 5 AI Prompt adheres to spec format');

const p6 = BodySignalPrompt.buildPrompt('- Sleep: Difficulty falling asleep');
assert(p6.includes('Return only 2-3 plain sentences'), 'Exercise 6 AI Prompt adheres to spec format');

const p7 = AvoidanceAuditPrompt.buildPrompt('1. My manager');
assert(p7.includes('Return only 2-3 plain sentences'), 'Exercise 7 AI Prompt adheres to spec format');

console.log('\n====================================================');
console.log(`Exercises 4-7 Test Summary: ${passedTests} passed, ${totalTests - passedTests} failed.`);
console.log('====================================================\n');
