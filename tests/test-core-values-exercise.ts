import {
  CORE_VALUES_ITEMS,
  CORE_VALUES_DEFINITION,
  calculateReorderDelta
} from '../src/lib/exercises/v4/definitions/coreValuesCatalog';
import { CoreValuesPrompt } from '../src/lib/exercises/v4/ai/coreValuesPrompt';

console.log('====================================================');
console.log('Ingress Within — Core Values Card Sort Test Suite');
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

// Test 1: Catalog Integrity
assert(CORE_VALUES_ITEMS.length === 20, 'Catalog contains exactly 20 fixed values');
assert(CORE_VALUES_DEFINITION.unlock_rules?.day === 35, 'Exercise unlock day is set to 35');
assert(CORE_VALUES_ITEMS.every(i => i.name && i.definition && i.example), 'All 20 items have name, definition, and behavioral example');

// Test 2: Scenario 1 - User selects 5 and confirms immediately without reordering (Delta = 0)
const order1 = ['Family', 'Growth', 'Peace', 'Autonomy', 'Honesty'];
const ranked1 = ['Family', 'Growth', 'Peace', 'Autonomy', 'Honesty'];
const delta1 = calculateReorderDelta(order1, ranked1);
assert(delta1 === 0, `Scenario 1: Instant confirm without reorder yields reorder_delta = 0 (Got: ${delta1})`);

// Test 3: Scenario 2 - User selects 5, then heavily reorders them (> 2 position rule)
const order2 = ['Family', 'Growth', 'Peace', 'Autonomy', 'Honesty'];
// Positions: Family(1), Growth(2), Peace(3), Autonomy(4), Honesty(5)
// Move Autonomy (pos 4) to rank 1 -> abs(4 - 1) = 3 > 2 -> Count!
const ranked2 = ['Autonomy', 'Family', 'Peace', 'Growth', 'Honesty'];
const delta2 = calculateReorderDelta(order2, ranked2);
assert(delta2 === 1, `Scenario 2: Heavy reorder > 2 positions calculates reorder_delta = 1 (Got: ${delta2})`);

// Test 4: Maximum reorder delta (All 5 items moved > 2 positions)
const order3 = ['A', 'B', 'C', 'D', 'E'];
const ranked3 = ['D', 'E', 'C', 'A', 'B'];
// D: pos 4 -> rank 1 (abs=3 > 2) -> count
// E: pos 5 -> rank 2 (abs=3 > 2) -> count
// C: pos 3 -> rank 3 (abs=0)
// A: pos 1 -> rank 4 (abs=3 > 2) -> count
// B: pos 2 -> rank 5 (abs=3 > 2) -> count
const delta3 = calculateReorderDelta(order3, ranked3);
assert(delta3 === 4, `Max displacement calculates reorder_delta correctly (Got: ${delta3})`);

// Test 5: AI Prompt Builder Verification
const prompt = CoreValuesPrompt.buildPrompt({
  selectedValues: ['Autonomy', 'Family', 'Peace', 'Growth', 'Honesty'],
  selectionOrder: ['Family', 'Growth', 'Peace', 'Autonomy', 'Honesty'],
  reorderDelta: 1
});
assert(prompt.includes('Autonomy'), 'Prompt includes ranked values');
assert(prompt.includes('Reorder delta:\n1'), 'Prompt includes reorder delta value');
assert(prompt.includes('Address the person as "you"'), 'Prompt specifies "you" perspective');
assert(prompt.includes('Return only 2–3 plain sentences'), 'Prompt specifies 2–3 sentence length limit');

console.log('\n====================================================');
console.log(`Core Values Test Summary: ${passedTests} passed, ${totalTests - passedTests} failed.`);
console.log('====================================================\n');
