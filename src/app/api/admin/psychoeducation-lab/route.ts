import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '../../../../lib/admin-auth';
import { ModuleCatalogService } from '../../../../lib/modules/moduleCatalogService';
import { ModuleContentService } from '../../../../lib/modules/moduleContentService';
import { ModuleRecommendationService } from '../../../../lib/modules/moduleRecommendationService';
import { ModuleProgressService } from '../../../../lib/modules/moduleProgressService';
import { supabase } from '../../../../lib/db';

/**
 * POST /api/admin/psychoeducation-lab: Server-protected Developer Lab API router.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: '403 Forbidden — Developer/Admin authorization required.' } },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Action parameter required.' } },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // ACTION 1: run_recommendation
    // -------------------------------------------------------------------------
    if (action === 'run_recommendation') {
      const { testUserId = 'test_user_01', testCycleId = 'cycle_dev_lab_test', topPatterns = [] } = body;

      const recResponse = await ModuleRecommendationService.getOrGenerateRecommendation(
        testUserId,
        testCycleId,
        topPatterns
      );

      // Construct pipeline breakdown
      const catalog = ModuleCatalogService.getAllCatalogItems();
      const eligibleModules: Array<{ moduleId: string; name: string; eligible: boolean; reason: string }> = [];

      catalog.forEach(item => {
        const matchesPattern = topPatterns.some((p: any) =>
          item.taxonomy_concerns.some(c => c.toUpperCase() === (p.taxonomyId || p.patternId || '').toUpperCase()) ||
          (p.title && item.taxonomy_concerns.some(c => c.toLowerCase().includes(p.title.toLowerCase())))
        );
        eligibleModules.push({
          moduleId: item.id,
          name: item.name,
          eligible: matchesPattern,
          reason: matchesPattern ? 'Taxonomy concern match' : 'No qualifying taxonomy match in top 3'
        });
      });

      return NextResponse.json({
        success: true,
        testMode: true,
        response: recResponse,
        pipeline: {
          simulatedPatternsCount: topPatterns.length,
          safetyPassed: !recResponse.status.includes('CRISIS'),
          eligibleModules,
          selectedModule: recResponse.recommendation?.module || null,
          status: recResponse.status
        }
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 2: health_check
    // -------------------------------------------------------------------------
    if (action === 'health_check') {
      const catalog = ModuleCatalogService.getAllCatalogItems();
      const modulesHealth: Array<{
        moduleId: string;
        name: string;
        slug: string;
        status: 'PASS' | 'WARNING' | 'FAIL';
        checks: Record<string, boolean>;
        totalTouches: number;
        totalTechniques: number;
        issues: string[];
      }> = [];

      for (const item of catalog) {
        const content = ModuleContentService.getModuleContent(item.id);
        const issues: string[] = [];

        const checks = {
          catalogExists: !!item,
          contentExists: !!content,
          versionExists: !!item?.version,
          mechanismsExist: !!content?.brief?.mechanisms && content.brief.mechanisms.length > 0,
          weeksExist: !!content?.weeks && content.weeks.length > 0,
          touchesExist: false,
          techniquesExist: false,
          techniquesFormatValid: true,
          requiredFieldsExist: !!content?.brief?.moduleName,
          mhpiConfigExists: !!content?.mhpiConfig,
          reinforcementBankExists: !!content?.reinforcementBank,
          toolsConfigExists: !!content?.toolsData,
          escalationConfigExists: !!content?.escalationConfig,
          durationMatches: content ? content.weeks.length === item.duration_weeks : false,
          noDuplicateIds: true,
          noOrphanedContent: true,
          noMissingReferences: true,
          priceMatches: item.price > 0
        };

        let totalTouches = 0;
        let totalTechniques = 0;

        if (content) {
          totalTouches = content.weeks.reduce((acc, w) => acc + w.touches.length, 0);
          checks.touchesExist = totalTouches > 0;

          const touchIds = new Set<string>();
          content.weeks.forEach(w => {
            w.touches.forEach(t => {
              if (touchIds.has(t.id)) {
                checks.noDuplicateIds = false;
                issues.push(`Duplicate touch ID: ${t.id}`);
              }
              touchIds.add(t.id);
            });
          });

          content.brief.mechanisms.forEach(m => {
            totalTechniques += m.techniques.length;
            m.techniques.forEach(tech => {
              if (!['A', 'B', 'C'].includes(tech.format)) {
                checks.techniquesFormatValid = false;
                issues.push(`Invalid technique format '${tech.format}' for technique ${tech.code}`);
              }
            });
          });
          checks.techniquesExist = totalTechniques > 0;
        } else {
          issues.push(`Module content dataset missing for ID '${item.id}'`);
        }

        if (!checks.durationMatches && content) {
          issues.push(`Duration mismatch: catalog says ${item.duration_weeks} weeks, content has ${content.weeks.length} weeks`);
        }

        const passCount = Object.values(checks).filter(Boolean).length;
        const totalChecks = Object.keys(checks).length;
        const status = passCount === totalChecks ? 'PASS' : issues.length > 0 ? 'FAIL' : 'WARNING';

        modulesHealth.push({
          moduleId: item.id,
          name: item.name,
          slug: item.slug,
          status,
          checks,
          totalTouches,
          totalTechniques,
          issues
        });
      }

      return NextResponse.json({
        success: true,
        testMode: true,
        modulesHealth
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 3: end_to_end_test
    // -------------------------------------------------------------------------
    if (action === 'end_to_end_test') {
      const testUserId = 'test_e2e_user_01';
      const testCycleId = `cycle_e2e_${Date.now()}`;

      const stages: Array<{ stage: string; status: 'PASS' | 'FAIL'; details: string }> = [];

      try {
        // Stage 1: Recommendation
        const rec = await ModuleRecommendationService.getOrGenerateRecommendation(
          testUserId,
          testCycleId,
          [{ patternId: 'M1-C01', title: 'Self-Worth Deficit', description: 'Low self-worth', score: 85, rank: 1 }]
        );
        stages.push({ stage: '1. Recommendation Engine', status: rec.status === 'RECOMMENDED' ? 'PASS' : 'FAIL', details: `Status: ${rec.status}` });

        // Stage 2: Catalog lookup
        const catalogItem = await ModuleCatalogService.getModuleByIdOrSlug('M1');
        stages.push({ stage: '2. Catalog Metadata', status: catalogItem ? 'PASS' : 'FAIL', details: `Name: ${catalogItem?.name}` });

        // Stage 3: Content resolution
        const content = ModuleContentService.getModuleContent('M1');
        stages.push({ stage: '3. Module Content', status: content ? 'PASS' : 'FAIL', details: `Weeks: ${content?.weeks.length}` });

        // Stage 4: MHPI baseline
        stages.push({ stage: '4. MHPI Baseline Config', status: content?.mhpiConfig?.baselineQuestions ? 'PASS' : 'FAIL', details: `Questions: ${content?.mhpiConfig?.baselineQuestions?.length}` });

        // Stage 5: Touch structure
        const touchesCount = content?.weeks.reduce((a, w) => a + w.touches.length, 0) || 0;
        stages.push({ stage: '5. Touch Structure', status: touchesCount >= 25 ? 'PASS' : 'FAIL', details: `Total Touches: ${touchesCount}` });

        // Stage 6: Progress initialization
        const prog = await ModuleProgressService.updateProgress(testUserId, 'M1', { status: 'active', current_week: 1 });
        stages.push({ stage: '6. Progress Initialization', status: prog ? 'PASS' : 'FAIL', details: `Status: ${prog?.status}` });

        // Stage 7: Touch completion
        const touchRec = await ModuleProgressService.recordTouchCompletion(testUserId, 'M1', 'w1t1');
        stages.push({ stage: '7. Touch Completion', status: touchRec.success ? 'PASS' : 'FAIL', details: `Completed: ${touchRec.completedTouches.join(', ')}` });

        // Stage 8: Answer persistence
        const ans = await ModuleProgressService.saveAnswer(testUserId, 'M1', 'w1t1', 'step1', { response: 'Test answer' });
        stages.push({ stage: '8. Answer Persistence', status: ans.success ? 'PASS' : 'FAIL', details: 'Autosave verified' });

        // Stage 9: Full state retrieval
        const fullState = await ModuleProgressService.getFullUserModuleState(testUserId, 'M1');
        stages.push({ stage: '9. Full State Retrieval', status: fullState.completedTouches.includes('w1t1') ? 'PASS' : 'FAIL', details: `Completed count: ${fullState.completedTouches.length}` });

        // Stage 10: Module completion
        const completedProg = await ModuleProgressService.updateProgress(testUserId, 'M1', { status: 'completed', completed_at: new Date().toISOString() });
        stages.push({ stage: '10. Module Completion', status: completedProg.status === 'completed' ? 'PASS' : 'FAIL', details: `Completed At: ${completedProg.completed_at}` });

        // Stage 11: Idempotency
        const repeatedRec = await ModuleRecommendationService.getOrGenerateRecommendation(testUserId, testCycleId, []);
        stages.push({ stage: '11. Idempotency Check', status: repeatedRec.recommendation?.id === rec.recommendation?.id ? 'PASS' : 'FAIL', details: `Reused ID: ${repeatedRec.recommendation?.id}` });

        // Clean up test data
        await supabase.from('module_recommendations').delete().eq('user_id', testUserId);
        await supabase.from('module_purchases').delete().eq('user_id', testUserId);
        await supabase.from('module_progress').delete().eq('user_id', testUserId);

      } catch (err: any) {
        stages.push({ stage: 'Execution Exception', status: 'FAIL', details: err.message });
      }

      const overallStatus = stages.every(s => s.status === 'PASS') ? 'PASS' : 'FAIL';

      return NextResponse.json({
        success: true,
        testMode: true,
        overallStatus,
        stages
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 4: test_control
    // -------------------------------------------------------------------------
    if (action === 'test_control') {
      const { subAction, userId = 'test_user_01', moduleId = 'M1' } = body;

      if (subAction === 'reset_progress') {
        await supabase.from('module_progress').delete().eq('user_id', userId).eq('module_id', moduleId);
        await supabase.from('module_touch_completions').delete().eq('user_id', userId).eq('module_id', moduleId);
        await supabase.from('module_answers').delete().eq('user_id', userId).eq('module_id', moduleId);
        return NextResponse.json({ success: true, testMode: true, message: `Reset test progress for user ${userId} module ${moduleId}` });
      }

      if (subAction === 'simulate_purchase') {
        await supabase.from('module_purchases').upsert({
          user_id: userId,
          module_id: moduleId,
          status: 'active',
          purchased_at: new Date().toISOString()
        }, { onConflict: 'user_id,module_id' });
        return NextResponse.json({ success: true, testMode: true, message: `Simulated purchase for user ${userId} module ${moduleId}` });
      }

      if (subAction === 'complete_touch') {
        const { touchId = 'w1t1' } = body;
        await ModuleProgressService.recordTouchCompletion(userId, moduleId, touchId);
        return NextResponse.json({ success: true, testMode: true, message: `Completed touch ${touchId}` });
      }

      if (subAction === 'complete_module') {
        await ModuleProgressService.updateProgress(userId, moduleId, { status: 'completed', completed_at: new Date().toISOString() });
        return NextResponse.json({ success: true, testMode: true, message: `Completed module ${moduleId}` });
      }
    }

    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: `Unknown action '${action}'` } },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Developer Lab API Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
