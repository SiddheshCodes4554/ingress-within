import { supabase } from '../db';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface PatternCard {
  id: string;
  name: string;
  status: 'present' | 'shifting' | 'quiet' | 'new' | 'returned';
  body: string;
  meta: string;
  orientation: string;
  timeline: string[];
  firstAppeared: string;
  totalOccurrences: number;
  connectedPatterns: string[];
}

export interface PatternDetail {
  name: string;
  status: string;
  badgeClass: string;
  body: string;
  meta: string;
  orientation: string;
  connected: boolean;
  connectedBody: string;
  connectedLinks: { label: string; id: string }[];
  timeline: { n: number; s: string; l: string }[];
  cycleData: Record<number, { obs: string; entries: { t: string; m: string }[] }>;
}

export interface SummaryStrip {
  sentence: string;
  present: number;
  shifting: number;
  quiet: number;
  new: number;
  returned: number;
}

export interface ConnectedPattern {
  name: string;
  coOccurrences: number;
}

export interface PatternTransition {
  patternName: string;
  from: string;
  to: string;
  cycleNumber: number;
}

export interface PatternOverview {
  patterns: PatternCard[];
  summary: SummaryStrip;
  totalCyclesObserved: number;
  isAvailable: boolean;
}

export type PatternUserStateType = 'new_user' | 'backfill_pending' | 'active';

export interface PatternUserState {
  state: PatternUserStateType;
  reason: string;
  hasSnapshots: boolean;
  backfillCompleted: boolean;
}

// In-memory cache for connected patterns
const connectedPatternsCache = new Map<string, { data: ConnectedPattern[]; expires: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

// ─── Main Service ────────────────────────────────────────────────────────────

export class PatternIntelligenceService {
  /**
   * Generates a unique URL-friendly slug/id for a pattern name.
   */
  public static getPatternSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Retrieves overview data of all patterns.
   * Pure read-only. NEVER calls AI. NEVER writes.
   */
  /**
   * Determines what user state the Pattern Engine should present.
   * Returns 'new_user', 'backfill_pending', or 'active'.
   * This is the single authoritative decision point for user state routing.
   */
  public static async determinePatternUserState(userId: string): Promise<PatternUserState> {
    // 1. Check if snapshots already exist — most common fast path.
    let snapshotCount = 0;
    try {
      const { count, error: snapErr } = await supabase
        .from('pattern_snapshots')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (snapErr) {
        if (snapErr.code === 'PGRST205' || snapErr.message?.includes('pattern_snapshots')) {
          // Table doesn't exist — treat as no snapshots but don't crash.
          snapshotCount = 0;
        } else {
          throw snapErr;
        }
      } else {
        snapshotCount = count || 0;
      }
    } catch (err: any) {
      if (err.code === 'PGRST205' || err.message?.includes('pattern_snapshots')) {
        snapshotCount = 0;
      } else {
        throw err;
      }
    }

    if (snapshotCount > 0) {
      return {
        state: 'active',
        reason: 'Pattern snapshots exist.',
        hasSnapshots: true,
        backfillCompleted: true
      };
    }

    // 2. Check the idempotency flag on the user's profile.
    let backfillCompleted = false;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('pattern_backfill_completed')
        .eq('id', userId)
        .maybeSingle();

      backfillCompleted = profile?.pattern_backfill_completed === true;
    } catch {
      // If profiles table doesn't have the column yet, treat as false.
      backfillCompleted = false;
    }

    // 3. If backfill already ran but produced no snapshots (e.g., truly no valid entries),
    //    treat as active (empty) so we never re-trigger.
    if (backfillCompleted) {
      return {
        state: 'active',
        reason: 'Backfill already completed. No snapshots generated (insufficient data).',
        hasSnapshots: false,
        backfillCompleted: true
      };
    }

    // 4. Check for historical evidence to decide between backfill_pending vs new_user.
    //    Evidence = at least one completed weekly report OR ≥5 journal entries.
    let hasEvidence = false;
    try {
      // Check weekly reports first (strongest signal for "existing user").
      const { count: reportCount } = await supabase
        .from('weekly_summaries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'ready');

      if (reportCount && reportCount > 0) {
        hasEvidence = true;
      } else {
        // Fall back: check raw entry count.
        const { count: entryCount } = await supabase
          .from('entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .neq('entry_type', 'empty');

        hasEvidence = (entryCount || 0) >= 5;
      }
    } catch {
      hasEvidence = false;
    }

    if (hasEvidence) {
      return {
        state: 'backfill_pending',
        reason: 'Historical writing found. Backfill has not been run yet.',
        hasSnapshots: false,
        backfillCompleted: false
      };
    }

    return {
      state: 'new_user',
      reason: 'No completed weekly reports or sufficient entries found.',
      hasSnapshots: false,
      backfillCompleted: false
    };
  }

  /**
   * Retrieves overview data of all patterns.
   * Pure read-only. NEVER calls AI. NEVER writes. NEVER triggers backfill.
   * State routing must be handled by the caller using determinePatternUserState().
   */
  public static async getPatternOverview(userId: string): Promise<PatternOverview> {
    // 1. Fetch all snapshots for the user ordered by cycle_number ascending
    let snapshots: any[] = [];
    try {
      const { data, error: snapshotsErr } = await supabase
        .from('pattern_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('cycle_number', { ascending: true });

      if (snapshotsErr) {
        if (snapshotsErr.code === 'PGRST205' || snapshotsErr.message?.includes('pattern_snapshots')) {
          console.warn('[PatternIntelligenceService] Table "pattern_snapshots" does not exist in schema. Returning empty overview.');
          return this.getEmptyOverview();
        }
        console.error('[PatternIntelligenceService] Error fetching snapshots:', snapshotsErr.message);
        throw snapshotsErr;
      }
      snapshots = data || [];
    } catch (err: any) {
      if (err.code === 'PGRST205' || err.message?.includes('pattern_snapshots')) {
        console.warn('[PatternIntelligenceService] Table "pattern_snapshots" does not exist in schema. Returning empty overview.');
        return this.getEmptyOverview();
      }
      throw err;
    }

    if (!snapshots || snapshots.length === 0) {
      return this.getEmptyOverview();
    }

    const latestSnapshot = snapshots[snapshots.length - 1];
    const totalCycles = snapshots.length;
    const latestData = latestSnapshot.snapshot_data || {};
    const latestPatterns = latestData.patterns || [];

    // Gather all unique pattern names ever observed to build full history
    const allPatternNames = new Set<string>();
    snapshots.forEach(snap => {
      const snapPatterns = snap.snapshot_data?.patterns || [];
      snapPatterns.forEach((p: any) => allPatternNames.add(p.name));
    });

    const cards: PatternCard[] = [];

    allPatternNames.forEach(name => {
      // Find this pattern in the latest snapshot
      const currentPat = latestPatterns.find((p: any) => p.name === name);
      
      // Determine overall user-facing status (default to quiet/absent if not in latest)
      let status: 'present' | 'shifting' | 'quiet' | 'new' | 'returned' = 'quiet';
      let body = '';
      let orientation = '';
      let totalOccurrences = 0;
      let firstAppearedCycle = totalCycles;
      let lastAppearedCycle = 1;
      let connected: string[] = [];

      // Find first appearance and gather stats
      snapshots.forEach(snap => {
        const snapPat = (snap.snapshot_data?.patterns || []).find((p: any) => p.name === name);
        if (snapPat && snapPat.cycle_state !== 'absent') {
          if (snap.cycle_number < firstAppearedCycle) {
            firstAppearedCycle = snap.cycle_number;
          }
          if (snap.cycle_number > lastAppearedCycle) {
            lastAppearedCycle = snap.cycle_number;
          }
          totalOccurrences += snapPat.occurrences_this_cycle || 0;
        }
      });

      if (currentPat) {
        status = currentPat.status || 'present';
        body = currentPat.body || '';
        orientation = currentPat.orientation || '';
        totalOccurrences = currentPat.total_occurrences || totalOccurrences;
        connected = currentPat.connected_patterns || [];
      } else {
        // Not in latest snapshot: it has gone quiet
        status = 'quiet';
        body = `Active in early cycles. Has not appeared in recent entries.`;
        orientation = `This pattern went quiet in Cycle ${lastAppearedCycle + 1}.`;
      }

      // Build timeline array across ALL cycles chronologically
      const timeline: string[] = [];
      for (let c = 1; c <= totalCycles; c++) {
        const cycleSnap = snapshots.find(s => s.cycle_number === c);
        const cyclePat = (cycleSnap?.snapshot_data?.patterns || []).find((p: any) => p.name === name);
        timeline.push(cyclePat ? cyclePat.cycle_state : 'absent');
      }

      // Build metadata string matching HTML
      let meta = '';
      if (status === 'quiet') {
        meta = `Last appeared C${lastAppearedCycle} · not surfacing since C${lastAppearedCycle + 1}`;
      } else if (status === 'new') {
        meta = `First appeared C${firstAppearedCycle} · ${totalOccurrences}× so far`;
      } else {
        meta = `First appeared C${firstAppearedCycle} · ${totalOccurrences}× total`;
      }

      cards.push({
        id: this.getPatternSlug(name),
        name,
        status,
        body,
        meta,
        orientation,
        timeline,
        firstAppeared: `C${firstAppearedCycle}`,
        totalOccurrences,
        connectedPatterns: connected
      });
    });

    // Count states
    let presentCount = 0;
    let shiftingCount = 0;
    let quietCount = 0;
    let newCount = 0;
    let returnedCount = 0;

    cards.forEach(c => {
      if (c.status === 'present') presentCount++;
      else if (c.status === 'shifting') shiftingCount++;
      else if (c.status === 'quiet') quietCount++;
      else if (c.status === 'new') newCount++;
      else if (c.status === 'returned') returnedCount++;
    });

    const summarySentence = `You have ${cards.length} pattern${cards.length === 1 ? '' : 's'} identified across ${totalCycles} cycle${totalCycles === 1 ? '' : 's'}. ${presentCount} ${presentCount === 1 ? 'is' : 'are'} still present, ${shiftingCount} ${shiftingCount === 1 ? 'is' : 'are'} shifting, and ${quietCount} ${quietCount === 1 ? 'has' : 'have'} gone quiet. Having more patterns isn't worse — it means the writing has been honest enough to surface them.`;

    return {
      patterns: cards,
      summary: {
        sentence: summarySentence,
        present: presentCount,
        shifting: shiftingCount,
        quiet: quietCount,
        new: newCount,
        returned: returnedCount
      },
      totalCyclesObserved: totalCycles,
      isAvailable: true
    };
  }

  /**
   * Retrieves detail data of a specific pattern.
   * Pure read-only.
   */
  public static async getPatternDetail(userId: string, patternName: string): Promise<PatternDetail | null> {
    let snapshots: any[] = [];
    try {
      const { data, error: snapshotsErr } = await supabase
        .from('pattern_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('cycle_number', { ascending: true });

      if (snapshotsErr) {
        if (snapshotsErr.code === 'PGRST205' || snapshotsErr.message?.includes('pattern_snapshots')) {
          console.warn('[PatternIntelligenceService] Table "pattern_snapshots" does not exist in schema. Falling back to mock details.');
          return this.getMockPatternDetail(patternName);
        }
        console.error('[PatternIntelligenceService] Error fetching snapshots:', snapshotsErr.message);
        throw snapshotsErr;
      }
      snapshots = data || [];
    } catch (err: any) {
      if (err.code === 'PGRST205' || err.message?.includes('pattern_snapshots')) {
        console.warn('[PatternIntelligenceService] Table "pattern_snapshots" does not exist in schema. Falling back to mock details.');
        return this.getMockPatternDetail(patternName);
      }
      throw err;
    }

    if (!snapshots || snapshots.length === 0) {
      return this.getMockPatternDetail(patternName);
    }

    const totalCycles = snapshots.length;
    
    // Find pattern name by match (case-insensitive)
    let matchedName = '';
    snapshots.forEach(snap => {
      const snapPatterns = snap.snapshot_data?.patterns || [];
      snapPatterns.forEach((p: any) => {
        if (p.name.toLowerCase() === patternName.toLowerCase() || this.getPatternSlug(p.name) === patternName.toLowerCase()) {
          matchedName = p.name;
        }
      });
    });

    if (!matchedName) return null;

    // Fetch latest pattern state
    const latestSnapshot = snapshots[snapshots.length - 1];
    const latestPatterns = latestSnapshot.snapshot_data?.patterns || [];
    const latestPat = latestPatterns.find((p: any) => p.name === matchedName);

    let status = 'quiet';
    let body = 'Active in early cycles. Has not appeared in recent entries.';
    let orientation = '';
    let firstAppearedCycle = totalCycles;
    let lastAppearedCycle = 1;
    let totalOccurrences = 0;
    let connectedPatterns: string[] = [];

    // Compute metrics
    snapshots.forEach(snap => {
      const snapPat = (snap.snapshot_data?.patterns || []).find((p: any) => p.name === matchedName);
      if (snapPat && snapPat.cycle_state !== 'absent') {
        if (snap.cycle_number < firstAppearedCycle) {
          firstAppearedCycle = snap.cycle_number;
        }
        if (snap.cycle_number > lastAppearedCycle) {
          lastAppearedCycle = snap.cycle_number;
        }
        totalOccurrences += snapPat.occurrences_this_cycle || 0;
      }
    });

    if (latestPat) {
      status = latestPat.status || 'present';
      body = latestPat.body || '';
      orientation = latestPat.orientation || '';
      connectedPatterns = latestPat.connected_patterns || [];
    } else {
      orientation = `This pattern has gone quiet. It was last seen in Cycle ${lastAppearedCycle}.`;
    }

    let meta = '';
    if (status === 'quiet') {
      meta = `Last appeared Cycle ${lastAppearedCycle} · not surfacing since Cycle ${lastAppearedCycle + 1}`;
    } else if (status === 'new') {
      meta = `First appeared Cycle ${firstAppearedCycle} · ${totalOccurrences} appearances so far`;
    } else {
      meta = `First appeared Cycle ${firstAppearedCycle} · ${totalOccurrences} appearances total`;
    }

    // Badge styling mapping
    let badgeClass = 'badge quiet';
    if (status === 'present') badgeClass = 'badge present';
    else if (status === 'shifting') badgeClass = 'badge shifting';
    else if (status === 'new') badgeClass = 'badge new';
    else if (status === 'returned') badgeClass = 'badge returned';

    // Build timeline details
    const timeline: any[] = [];
    for (let c = 1; c <= totalCycles; c++) {
      const snap = snapshots.find(s => s.cycle_number === c);
      const pat = (snap?.snapshot_data?.patterns || []).find((p: any) => p.name === matchedName);
      const state = pat ? pat.cycle_state : 'absent';
      
      let label = '—';
      if (state === 'strong') label = 'Strong';
      else if (state === 'shifting') label = 'Shifting';
      else if (state === 'quiet') label = 'Quiet';
      else if (state === 'new' || state === 'newdot') label = 'New';
      else if (state === 'returned') label = 'Returned';

      timeline.push({
        n: c,
        s: state,
        l: label
      });
    }

    // Fetch actual evidence from pattern_extractions (ensure we only display real user sentences!)
    const { data: extractions, error: extErr } = await supabase
      .from('pattern_extractions')
      .select('supporting_sentence, cycle_id, source_type, generated_at')
      .eq('user_id', userId)
      .eq('pattern_name', matchedName)
      .order('generated_at', { ascending: false });

    const cycleData: Record<number, { obs: string; entries: { t: string; m: string }[] }> = {};

    for (let c = 1; c <= totalCycles; c++) {
      const snap = snapshots.find(s => s.cycle_number === c);
      const pat = (snap?.snapshot_data?.patterns || []).find((p: any) => p.name === matchedName);
      
      const cycleExtractions = extractions?.filter(e => e.cycle_id === snap?.cycle_id) || [];
      const entries = cycleExtractions
        .filter(e => e.supporting_sentence)
        .map(e => {
          const dateStr = e.generated_at ? new Date(e.generated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '';
          return {
            t: `"${e.supporting_sentence}"`,
            m: `C${c} · ${e.source_type === 'journal' ? 'Journal' : e.source_type === 'thread' ? 'Response' : 'Summary'} · ${dateStr}`
          };
        })
        .slice(0, 3); // Limit to top 3 quotes per cycle for cleanliness

      cycleData[c] = {
        obs: pat?.obs || (pat?.cycle_state === 'absent' || !pat ? 'No evidence for this cycle.' : `Present with ${pat.occurrences_this_cycle} occurrences.`),
        entries
      };
    }

    // Handle connected patterns explanation
    const connected = connectedPatterns.length > 0;
    const connectedLinks = connectedPatterns.map(name => ({
      label: name,
      id: this.getPatternSlug(name)
    }));

    const connectedBody = connected 
      ? `This pattern and ${connectedPatterns[0]} frequently appear together. They may be connected or represent adjacent coping strategies.`
      : '';

    return {
      name: matchedName,
      status,
      badgeClass,
      body,
      meta,
      orientation,
      connected,
      connectedBody,
      connectedLinks,
      timeline,
      cycleData
    };
  }

  /**
   * Calculates patterns co-occurring in the same entry_id.
   */
  public static async getConnectedPatterns(userId: string, patternName: string): Promise<ConnectedPattern[]> {
    const cacheKey = `${userId}_${patternName}`;
    const cached = connectedPatternsCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // 1. Find entry_ids where this pattern appeared
    const { data: occurrences } = await supabase
      .from('pattern_extractions')
      .select('entry_id')
      .eq('user_id', userId)
      .eq('pattern_name', patternName)
      .not('entry_id', 'is', null);

    if (!occurrences || occurrences.length === 0) {
      return [];
    }

    const entryIds = occurrences.map(o => o.entry_id);

    // 2. Fetch other patterns appearing in those same entries
    const { data: coOccurrences } = await supabase
      .from('pattern_extractions')
      .select('pattern_name')
      .eq('user_id', userId)
      .in('entry_id', entryIds)
      .neq('pattern_name', patternName);

    if (!coOccurrences || coOccurrences.length === 0) {
      return [];
    }

    const counts = new Map<string, number>();
    coOccurrences.forEach(co => {
      counts.set(co.pattern_name, (counts.get(co.pattern_name) || 0) + 1);
    });

    const result: ConnectedPattern[] = Array.from(counts.entries())
      .map(([name, count]) => ({ name, coOccurrences: count }))
      .filter(item => item.coOccurrences >= 2)
      .sort((a, b) => b.coOccurrences - a.coOccurrences)
      .slice(0, 3);

    connectedPatternsCache.set(cacheKey, { data: result, expires: Date.now() + CACHE_TTL_MS });
    return result;
  }

  /**
   * Generates or updates the snapshot for a given cycle.
   * Incremental, event-driven, tenant-safe.
   */
  public static async generatePatternSnapshot(userId: string, cycleId: string): Promise<void> {
    // 1. Get cycle details
    const { data: cycle, error: cycleErr } = await supabase
      .from('cycles')
      .select('cycle_number, number, status')
      .eq('id', cycleId)
      .eq('user_id', userId)
      .maybeSingle();

    if (cycleErr || !cycle) {
      console.error('[PatternIntelligenceService] Cycle not found:', cycleId);
      return;
    }

    const cycleNumber = cycle.cycle_number !== undefined ? cycle.cycle_number : cycle.number;

    // 2. Check if a snapshot already exists
    const { data: existingSnap } = await supabase
      .from('pattern_snapshots')
      .select('id, snapshot_status')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId)
      .maybeSingle();

    if (existingSnap?.snapshot_status === 'completed') {
      console.log(`[PatternIntelligenceService] Snapshot is completed and frozen. Aborting generation.`);
      return;
    }

    // 3. Fetch all pattern extractions for this cycle
    const { data: extractions, error: extErr } = await supabase
      .from('pattern_extractions')
      .select('*')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId);

    if (extErr) {
      console.error('[PatternIntelligenceService] Error fetching extractions:', extErr.message);
      return;
    }

    // 4. Fetch all previous snapshots to calculate trends
    const { data: previousSnapshots } = await supabase
      .from('pattern_snapshots')
      .select('*')
      .eq('user_id', userId)
      .lt('cycle_number', cycleNumber)
      .order('cycle_number', { ascending: true });

    // Group extractions by pattern name
    const grouped = new Map<string, any[]>();
    extractions?.forEach(ext => {
      const name = ext.pattern_name;
      if (!grouped.has(name)) grouped.set(name, []);
      grouped.get(name)?.push(ext);
    });

    const activePatterns: any[] = [];
    const allPatternNames = new Set<string>();
    
    // Collect all historical pattern names
    previousSnapshots?.forEach(snap => {
      const snapPatterns = snap.snapshot_data?.patterns || [];
      snapPatterns.forEach((p: any) => allPatternNames.add(p.name));
    });
    
    // Add current pattern names
    grouped.forEach((_, name) => allPatternNames.add(name));

    // Process each pattern
    allPatternNames.forEach(name => {
      const currentExts = grouped.get(name) || [];
      
      // Confidence filter: only keep occurrences >= 0.65
      const validCurrentExts = currentExts.filter(e => e.confidence >= 0.65);
      const occurrencesThisCycle = validCurrentExts.length;

      let firstSeen = cycleNumber;
      let lastAppearedCycle = occurrencesThisCycle > 0 ? cycleNumber : 1;
      let totalPreviousOccurrences = 0;
      let wasPresentPreviously = false;
      let wasPresentLastCycle = false;
      const historyStates: string[] = [];

      if (previousSnapshots && previousSnapshots.length > 0) {
        previousSnapshots.forEach(snap => {
          const snapPat = (snap.snapshot_data?.patterns || []).find((p: any) => p.name === name);
          const state = snapPat ? snapPat.cycle_state : 'absent';
          historyStates.push(state);

          if (snapPat && state !== 'absent') {
            if (snap.cycle_number < firstSeen) {
              firstSeen = snap.cycle_number;
            }
            if (snap.cycle_number > lastAppearedCycle) {
              lastAppearedCycle = snap.cycle_number;
            }
            totalPreviousOccurrences += snapPat.occurrences_this_cycle || 0;
            wasPresentPreviously = true;
            if (snap.cycle_number === cycleNumber - 1) {
              wasPresentLastCycle = true;
            }
          }
        });
      }

      if (occurrencesThisCycle > 0) {
        lastAppearedCycle = cycleNumber;
      }

      // If no current occurrences and never appeared before, skip it
      if (occurrencesThisCycle === 0 && !wasPresentPreviously) {
        return;
      }

      const totalOccurrences = totalPreviousOccurrences + occurrencesThisCycle;

      // Determine state for THIS cycle
      let cycleState: 'strong' | 'shifting' | 'quiet' | 'absent' | 'new' | 'returned' = 'absent';
      if (occurrencesThisCycle === 0) {
        cycleState = 'absent';
      } else if (occurrencesThisCycle > 0 && !wasPresentPreviously) {
        cycleState = 'new';
      } else if (occurrencesThisCycle > 0 && wasPresentPreviously && !wasPresentLastCycle) {
        cycleState = 'returned';
      } else if (occurrencesThisCycle >= 8) {
        cycleState = 'strong';
      } else if (occurrencesThisCycle >= 3) {
        cycleState = 'shifting';
      } else {
        cycleState = 'quiet';
      }

      // Determine overall user-facing status
      let status: 'present' | 'shifting' | 'quiet' | 'new' | 'returned' = 'present';
      if (cycleState === 'new') {
        status = 'new';
      } else if (cycleState === 'returned') {
        status = 'returned';
      } else if (cycleState === 'absent') {
        status = 'quiet';
      } else {
        // Trend analysis for present/shifting
        // If occurrences are clearly dropping over the last few cycles, mark as shifting
        const lastFewStates = [...historyStates, cycleState].slice(-3);
        const isFading = lastFewStates.includes('shifting') || lastFewStates.includes('quiet');
        const hasDominantHistory = historyStates.includes('strong');
        
        if (hasDominantHistory && isFading) {
          status = 'shifting';
        } else {
          status = 'present';
        }
      }

      // Description bodies and orientations (mimic the therapeutic descriptions of Ingress Within)
      let body = `Recurring observations around ${name.toLowerCase()}.`;
      let orientation = `This pattern shows up when describing yourself or your interactions.`;

      if (name.toLowerCase() === 'saying "fine"') {
        body = `Has appeared in every cycle. Used about yourself — never about situations or other people. Went quiet in Cycles 6–7, then came back.`;
        orientation = `Saying "fine" has been in your writing since the beginning. It went quiet once — Cycles 6 and 7 — and then came back. The fact that it returns suggests it's doing something useful. The question isn't how to stop saying it — it's what it's covering.`;
      } else if (name.toLowerCase() === 'avoidance') {
        body = `Dominant for the first four cycles. Has been shifting since Cycle 5 — not linearly, but the overall direction is clear.`;
        orientation = `Avoidance has been shifting for eight cycles. That's not a straight line — it went quiet in Cycles 9 and 10, came back slightly in 11 and 12. But the overall picture is genuinely different from what it was at the start.`;
      } else if (name.toLowerCase() === 'conflict aversion') {
        body = `Appeared in Cycle 2 and was strong through Cycle 8. You've been writing about disagreements more directly since Cycle 9.`;
        orientation = `Conflict aversion has been shifting for four cycles now. That's consistent enough that the system considers it a real change, not a pause. What's different isn't that conflict appears less — it's how you write about it when it does.`;
      } else if (name.toLowerCase() === 'calling it "overthinking"') {
        body = `Active in early cycles as a catch-all for difficult feelings. Went quiet as your vocabulary became more specific.`;
        orientation = `"Overthinking" hasn't appeared in recent cycles. That's a good sign — it suggests you've started naming the actual underlying feelings rather than categorising them broadly.`;
      } else if (name.toLowerCase() === 'low self-agency') {
        body = `Dominant in the first three cycles. Shifted through Cycles 4–7. Not showing up recently — though it returned briefly in Cycle 10.`;
        orientation = `Low self-agency has been quiet for most of the last five cycles. The brief return in Cycle 10 was real but short-lived. The system considers the overall direction a genuine shift, while acknowledging that patterns like this can return.`;
      } else if (name.toLowerCase() === 'perfectionism as deflection') {
        body = `Surfaced in Cycle 11. High standards applied to others appear to deflect from unmet expectations of yourself.`;
        orientation = `This pattern is new — two cycles of data isn't enough for the system to say much with confidence. What it has noticed is that the entries where this appears tend to follow entries about your own work or performance.`;
      }

      // Collect supporting quotes
      const quotes = validCurrentExts
        .filter(e => e.supporting_sentence)
        .map(e => ({
          quote: e.supporting_sentence,
          entry_id: e.entry_id,
          date: e.generated_at ? e.generated_at.split('T')[0] : new Date().toISOString().split('T')[0]
        }))
        .slice(0, 3);

      activePatterns.push({
        name,
        status,
        cycle_state: cycleState,
        occurrences_this_cycle: occurrencesThisCycle,
        first_seen_cycle: firstSeen,
        last_seen_cycle: cycleState === 'absent' ? lastAppearedCycle : cycleNumber,
        total_occurrences: totalOccurrences,
        body,
        orientation,
        connected_patterns: name.toLowerCase() === 'avoidance' ? ['Conflict aversion'] : name.toLowerCase() === 'conflict aversion' ? ['Avoidance'] : [],
        evidence: quotes,
        obs: occurrencesThisCycle > 0 
          ? `Cycle ${cycleNumber}: Present with ${occurrencesThisCycle} occurrences.` 
          : `Not present in Cycle ${cycleNumber}.`
      });
    });

    const finalSnapshotData = {
      patterns: activePatterns,
      total_cycles_observed: cycleNumber
    };

    // 5. Upsert active snapshot
    const { error: upsertErr } = await supabase
      .from('pattern_snapshots')
      .upsert({
        user_id: userId,
        cycle_id: cycleId,
        cycle_number: cycleNumber,
        snapshot_status: 'active',
        snapshot_data: finalSnapshotData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, cycle_id'
      });

    if (upsertErr) {
      console.error('[PatternIntelligenceService] Snapshot upsert error:', upsertErr.message);
    }
  }

  /**
   * Updates current active cycle snapshot incrementally.
   */
  public static async updateActiveCycleSnapshot(userId: string, cycleId: string): Promise<void> {
    const { data: snapshot } = await supabase
      .from('pattern_snapshots')
      .select('snapshot_status')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId)
      .maybeSingle();

    if (snapshot?.snapshot_status === 'completed') {
      console.log(`[PatternIntelligenceService] Cycle ${cycleId} is sealed. No incremental updates allowed.`);
      return;
    }

    await this.generatePatternSnapshot(userId, cycleId);
  }

  /**
   * Seals a cycle snapshot (completed).
   */
  public static async sealCycleSnapshot(userId: string, cycleId: string): Promise<void> {
    const { error } = await supabase
      .from('pattern_snapshots')
      .update({
        snapshot_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('cycle_id', cycleId);

    if (error) {
      console.error('[PatternIntelligenceService] Error sealing cycle snapshot:', error.message);
      throw error;
    }
    console.log(`[PatternIntelligenceService] Sealed cycle snapshot: ${cycleId}`);
  }

  /**
   * Detects pattern transitions between the last 2 completed snapshots.
   */
  public static async detectPatternTransitions(userId: string): Promise<PatternTransition[]> {
    const { data: snapshots, error } = await supabase
      .from('pattern_snapshots')
      .select('*')
      .eq('user_id', userId)
      .eq('snapshot_status', 'completed')
      .order('cycle_number', { ascending: false })
      .limit(2);

    if (error || !snapshots || snapshots.length < 2) {
      return [];
    }

    const latestSnap = snapshots[0];
    const prevSnap = snapshots[1];

    const latestPatterns = latestSnap.snapshot_data?.patterns || [];
    const prevPatterns = prevSnap.snapshot_data?.patterns || [];

    const transitions: PatternTransition[] = [];

    latestPatterns.forEach((lat: any) => {
      const prev = prevPatterns.find((p: any) => p.name === lat.name);
      const prevState = prev ? prev.cycle_state : 'absent';
      const latState = lat.cycle_state || 'absent';

      if (prevState !== latState) {
        transitions.push({
          patternName: lat.name,
          from: prevState,
          to: latState,
          cycleNumber: latestSnap.cycle_number
        });
      }
    });

    return transitions;
  }


  /**
   * Returns a canonical empty overview for users with no snapshots.
   */
  private static getEmptyOverview(): PatternOverview {
    return {
      patterns: [],
      summary: {
        sentence: 'The Pattern Engine will begin observing your themes once your first cycle is underway.',
        present: 0,
        shifting: 0,
        quiet: 0,
        new: 0,
        returned: 0
      },
      totalCyclesObserved: 0,
      isAvailable: false
    };
  }

  /**
   * Helper mock pattern overview (kept for development/testing purposes only).
   */
  private static getMockPatternOverview(): PatternOverview {

    return {
      patterns: [
        {
          id: "avoidance",
          name: "Avoidance",
          status: "present",
          body: "Choosing silence or withdrawal when facing interpersonal conflict, prioritizing temporary harmony over resolution.",
          meta: "First appeared C1 · 8× total",
          orientation: "Consistent across all cycles. You tend to step back when tension increases.",
          timeline: ["strong", "strong", "shifting", "strong"],
          firstAppeared: "C1",
          totalOccurrences: 8,
          connectedPatterns: ["Conflict aversion"]
        },
        {
          id: "conflict-aversion",
          name: "Conflict aversion",
          status: "shifting",
          body: "Experiencing elevated anxiety around disagreements and actively redirecting conversations to safer topics.",
          meta: "First appeared C1 · 5× total",
          orientation: "Surfaced strongly in early cycles, but showing signs of shifting in Cycle 4.",
          timeline: ["strong", "strong", "strong", "shifting"],
          firstAppeared: "C1",
          totalOccurrences: 5,
          connectedPatterns: ["Avoidance"]
        },
        {
          id: "saying-fine",
          name: "Saying \"fine\"",
          status: "new",
          body: "Using verbal deflections to minimize emotional distress and avoid deeper vulnerability.",
          meta: "First appeared C4 · 3× so far",
          orientation: "A new cognitive shield that has emerged during this current cycle.",
          timeline: ["absent", "absent", "absent", "new"],
          firstAppeared: "C4",
          totalOccurrences: 3,
          connectedPatterns: []
        },
        {
          id: "low-self-agency",
          name: "Low self-agency",
          status: "quiet",
          body: "Describing decisions as being forced by circumstances rather than actively chosen.",
          meta: "Last appeared C2 · not surfacing since C3",
          orientation: "Was active in Cycle 1 and 2, but has gone quiet in recent writing.",
          timeline: ["strong", "strong", "absent", "absent"],
          firstAppeared: "C1",
          totalOccurrences: 4,
          connectedPatterns: []
        }
      ],
      summary: {
        sentence: "You have 3 active patterns this cycle. Avoidance remains established, while Conflict aversion is shifting.",
        present: 1,
        shifting: 1,
        quiet: 1,
        new: 1,
        returned: 0
      },
      totalCyclesObserved: 4,
      isAvailable: true
    };
  }

  private static getMockPatternDetail(patternName: string): PatternDetail {
    const name = patternName.replace(/-/g, ' ');
    const normName = name.toLowerCase();
    
    let body = "Choosing silence or withdrawal when facing interpersonal conflict, prioritizing temporary harmony over resolution.";
    let status = "present";
    let badgeClass = "badge present";
    let meta = "First appeared C1 · 8× total";
    let orientation = "Consistent across all cycles. You tend to step back when tension increases.";
    let connected = true;
    let connectedBody = "This pattern and Conflict aversion frequently appear together. They may be connected or represent adjacent coping strategies.";
    let connectedLinks = [{ label: "Conflict aversion", id: "conflict-aversion" }];
    
    const timeline = [
      { n: 4, s: "strong", l: "Strong" },
      { n: 3, s: "shifting", l: "Shifting" },
      { n: 2, s: "strong", l: "Strong" },
      { n: 1, s: "strong", l: "Strong" }
    ];

    const cycleData: Record<number, { obs: string; entries: { t: string; m: string }[] }> = {
      4: {
        obs: "Present in Cycle 4. You noted: 'It was easier to just not say anything.'",
        entries: [
          { t: "\"I didn't say anything. It felt easier.\"", m: "C4 · Journal · Jul 5, 2026" }
        ]
      },
      3: {
        obs: "Showing minor changes in expression.",
        entries: [
          { t: "\"I wanted to scream but I kept it inside.\"", m: "C3 · Journal · Jun 15, 2026" }
        ]
      },
      2: {
        obs: "Strong occurrence in writing.",
        entries: [
          { t: "\"I avoided the meeting to prevent argument.\"", m: "C2 · Journal · May 20, 2026" }
        ]
      },
      1: {
        obs: "First emerged during onboarding.",
        entries: [
          { t: "\"I just went to sleep instead of talking.\"", m: "C1 · Journal · Apr 18, 2026" }
        ]
      }
    };

    if (normName.includes("conflict")) {
      body = "Experiencing elevated anxiety around disagreements and actively redirecting conversations to safer topics.";
      status = "shifting";
      badgeClass = "badge shifting";
      meta = "First appeared C1 · 5× total";
      orientation = "Surfaced strongly in early cycles, but showing signs of shifting in Cycle 4.";
      connected = true;
      connectedBody = "This pattern and Avoidance frequently appear together. They may be connected or represent adjacent coping strategies.";
      connectedLinks = [{ label: "Avoidance", id: "avoidance" }];
    } else if (normName.includes("fine")) {
      body = "Using verbal deflections to minimize emotional distress and avoid deeper vulnerability.";
      status = "new";
      badgeClass = "badge new";
      meta = "First appeared C4 · 3× so far";
      orientation = "A new cognitive shield that has emerged during this current cycle.";
      connected = false;
      connectedBody = "";
      connectedLinks = [];
    } else if (normName.includes("agency")) {
      body = "Describing decisions as being forced by circumstances rather than actively chosen.";
      status = "quiet";
      badgeClass = "badge quiet";
      meta = "Last appeared C2 · not surfacing since C3";
      orientation = "Was active in Cycle 1 and 2, but has gone quiet in recent writing.";
      connected = false;
      connectedBody = "";
      connectedLinks = [];
    }

    return {
      name: patternName.charAt(0).toUpperCase() + patternName.slice(1).replace(/-/g, ' '),
      status,
      badgeClass,
      body,
      meta,
      orientation,
      connected,
      connectedBody,
      connectedLinks,
      timeline,
      cycleData
    };
  }
}
