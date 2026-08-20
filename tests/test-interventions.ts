import { InterventionEngine } from '../src/lib/interventions/engine/intervention-engine';
import { CatalogProvider } from '../src/lib/interventions/catalog/catalog-provider';

async function runTests() {
  console.log('====================================================');
  console.log('Ingress Within — Intervention Bank V1 Foundation Tests');
  console.log('====================================================\n');

  const engine = new InterventionEngine();
  const userA = '00000000-0000-0000-0000-000000000001';
  const userB = '00000000-0000-0000-0000-000000000002';

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(` ✓ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(` ✗ [FAIL] ${testName} - ${detail || 'Assertion failed'}`);
      failedCount++;
    }
  }

  try {
    // 1. Catalog loads
    const catalogResult = await engine.getCatalog();
    assert(catalogResult.pagination.total === 35, 'Catalog total count is 35 interventions', `Total: ${catalogResult.pagination.total}`);
    assert(catalogResult.data.length === 20, 'Catalog paginates 20 items per default page', `Page 1 count: ${catalogResult.data.length}`);

    const fullCatalog = await engine.getCatalog({ limit: 50 });
    assert(fullCatalog.data.length === 35, 'Catalog returns 35 interventions when limit >= 35', `Loaded ${fullCatalog.data.length}`);

    // Category filter test
    const anxietyCatalog = await engine.getCatalog({ category: 'anxiety_worry' });
    assert(anxietyCatalog.data.length === 5, 'Catalog filters by category (anxiety_worry)', `Got ${anxietyCatalog.data.length}`);

    // 2. Categories load
    const catResult = await engine.getCategories();
    assert(catResult.categories.length === 12, 'Categories load (12 categories)', `Got ${catResult.categories.length}`);
    assert(catResult.crisis_resources.helplines.length > 0, 'Crisis resources attached', `Helplines: ${catResult.crisis_resources.helplines.length}`);

    // 3. Sessions created
    const startResult = await engine.startSession(userA, { intervention_id: 'anx_001' });
    assert(!!startResult.session.id, 'Session created for User A', `Session ID: ${startResult.session.id}`);
    assert(startResult.session.status === 'in_progress', 'Session status is in_progress');

    const resumeResult: any = await engine.resumeSession(userA, {
      session_id: startResult.session.id,
      last_position: 2,
      elapsed_seconds: 45,
    });
    assert(resumeResult.last_position === 2 || resumeResult.progress?.current_step === 2 || resumeResult.session?.last_step === 2, 'Session resumed & position updated');

    // 5. Completion stored
    const completeResult = await engine.completeSession(userA, {
      session_id: startResult.session.id,
      elapsed_seconds: 180,
      responses: [{ question_id: 'q_anx_001_1', answer: 'Felt much calmer' }],
    });
    assert(completeResult.status === 'completed', 'Completion stored with status completed');
    assert(!!completeResult.completed_at, 'Completion timestamp present');

    // 6. Favorites stored
    const favResult = await engine.favorite(userA, 'anx_001');
    assert(favResult === true, 'Favorite stored for User A');
    const isFav = await engine.getIntervention('anx_001', userA);
    assert(isFav?.is_favourite === true, 'User A favorite flag verified on single lookup');

    const unfavResult = await engine.unfavorite(userA, 'anx_001');
    assert(unfavResult === true, 'Unfavorite processed for User A');
    const isUnfav = await engine.getIntervention('anx_001', userA);
    assert(isUnfav?.is_favourite === false, 'User A unfavorite flag verified');

    // 7. History stored
    const historyA = await engine.getHistory(userA);
    assert(historyA.data.length > 0, 'History stored for User A', `User A history items: ${historyA.data.length}`);

    // 8. User isolation
    const historyB = await engine.getHistory(userB);
    assert(historyB.data.length === 0, 'User isolation verified (User B sees 0 history of User A)', `User B history items: ${historyB.data.length}`);

    const isFavB = await engine.getIntervention('anx_001', userB);
    assert(isFavB?.is_favourite === false, 'User isolation verified (User B favorite flag is false)');
  } catch (err) {
    console.error('Unexpected error during test execution:', err);
    failedCount++;
  }

  console.log('\n====================================================');
  console.log(`Test Summary: ${passedCount} passed, ${failedCount} failed.`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
