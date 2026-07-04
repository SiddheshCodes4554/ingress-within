export interface JournalEntry {
  id: string;
  day: string;
  text: string;
  date: string;
  words: number;
  type: 'entry' | 'exercise' | 'summary' | 'report';
  preview?: string;
  meta?: string;
  reflection?: any;
  entry_type?: string;
  cycle_day?: number;
  created_at?: string;
  crisis_flag?: boolean;
  crisis_type?: string | null;
}

export interface ReflectionThread {
  id: string;
  from: string;
  question: string;
  context: string;
  status: 'active' | 'new' | 'returned' | 'addressed' | 'ACTIVE' | 'NEW' | 'RETURNED' | 'CLOSED' | string;
  age: string;
  response?: string;
  addressedAt?: string;
}

export interface DashboardData {
  cycleInfo: {
    cycleNumber: number;
    currentDay: number;
    totalDays: number;
    startedAt: string;
    daysRemaining: number;
    hasWrittenToday: boolean;
  };
  entries: JournalEntry[];
  threads: ReflectionThread[];
  sessionState?: any;
  cycleStatus?: any;
}

function getAgeString(createdAt: string | null | undefined): string {
  if (!createdAt) return 'recently';
  const time = new Date(createdAt).getTime();
  if (isNaN(time)) return 'recently';
  const diffMs = Date.now() - time;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  return `${diffDays} days ago`;
}

export class DashboardService {
  private static cache: Record<string, { data: any; timestamp: number }> = {};
  private static inFlight: Record<string, Promise<any>> = {};
  private static STALE_TIME = 15000; // 15 seconds stale limit
  private static listeners: Record<string, Set<(data: any) => void>> = {};
  private static latencies: Record<string, number[]> = {};

  private static sessionContext: {
    userId?: string;
    cycleId?: string;
    engineVersion?: string;
    promptVersion?: string;
  } = {};

  public static setSessionContext(ctx: Partial<typeof DashboardService.sessionContext>) {
    this.sessionContext = { ...this.sessionContext, ...ctx };
  }

  private static getScopedCacheKey(key: string) {
    const { userId, cycleId, engineVersion, promptVersion } = this.sessionContext;
    return `${userId || 'anon'}_${cycleId || 'default'}_${engineVersion || '1.0'}_${promptVersion || '1.0'}_${key}`;
  }

  public static invalidateUserCache(userId: string) {
    Object.keys(this.cache).forEach((k) => {
      if (k.startsWith(`${userId}_`)) {
        delete this.cache[k];
      }
    });
  }

  private static invalidateScopedCache() {
    const scopedPrefix = this.getScopedCacheKey('');
    Object.keys(this.cache).forEach((key) => {
      if (key.startsWith(scopedPrefix)) {
        delete this.cache[key];
      }
    });
    Object.keys(this.inFlight).forEach((key) => {
      if (key.startsWith(scopedPrefix)) {
        delete this.inFlight[key];
      }
    });
  }

  private static getCached<T>(key: string): T | null {
    const scopedKey = this.getScopedCacheKey(key);
    const cached = this.cache[scopedKey];
    if (cached && (Date.now() - cached.timestamp < this.STALE_TIME)) {
      return cached.data as T;
    }
    return null;
  }

  private static setCached(key: string, data: any) {
    const scopedKey = this.getScopedCacheKey(key);
    this.cache[scopedKey] = { data, timestamp: Date.now() };
    const keyListeners = this.listeners[key];
    if (keyListeners) {
      keyListeners.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in cache listener for key ${key}:`, err);
        }
      });
    }
  }

  private static runDedupedRequest<T>(key: string, fetchFresh: () => Promise<T>): Promise<T> {
    const scopedKey = this.getScopedCacheKey(key);
    if (this.inFlight[scopedKey]) {
      return this.inFlight[scopedKey] as Promise<T>;
    }

    const requestPromise = (async () => {
      try {
        const data = await fetchFresh();
        this.setCached(key, data);
        return data;
      } finally {
        delete this.inFlight[scopedKey];
      }
    })();

    this.inFlight[scopedKey] = requestPromise;
    return requestPromise;
  }

  private static getCachedOrFetch<T>(key: string, fetchFresh: () => Promise<T>, revalidateOnCache = false): Promise<T> {
    const cached = this.getCached<T>(key);
    const scopedKey = this.getScopedCacheKey(key);
    const inFlight = this.inFlight[scopedKey];

    if (cached !== null) {
      if (revalidateOnCache && !inFlight) {
        void this.runDedupedRequest(key, fetchFresh).catch(() => {});
      }
      return Promise.resolve(cached);
    }

    if (inFlight) {
      return inFlight as Promise<T>;
    }

    return this.runDedupedRequest(key, fetchFresh);
  }

  public static subscribe(key: string, callback: (data: any) => void): () => void {
    if (!this.listeners[key]) {
      this.listeners[key] = new Set();
    }
    this.listeners[key].add(callback);
    return () => {
      this.listeners[key]?.delete(callback);
      if (this.listeners[key]?.size === 0) {
        delete this.listeners[key];
      }
    };
  }

  private static trackLatency(apiName: string, durationMs: number) {
    if (!this.latencies[apiName]) {
      this.latencies[apiName] = [];
    }
    this.latencies[apiName].push(Math.round(durationMs));
    if (this.latencies[apiName].length > 20) {
      this.latencies[apiName].shift();
    }
  }

  public static getLatencies(): Record<string, number[]> {
    return this.latencies;
  }

  /**
   * Generates request headers, including client local midnight in UTC for daily limits.
   */
  static getHeaders(extraHeaders: Record<string, string> = {}): HeadersInit {
    if (typeof window === 'undefined') {
      return {
        'Content-Type': 'application/json',
        ...extraHeaders
      };
    }
    const localMidnight = new Date();
    localMidnight.setHours(0, 0, 0, 0);
    return {
      'Content-Type': 'application/json',
      'x-client-today-start': localMidnight.toISOString(),
      ...extraHeaders
    };
  }

  /**
   * Fetches dashboard data by combining parallel requests to entries, threads, and sessions endpoints.
   */
  static async fetchDashboardData(): Promise<DashboardData> {
    const cacheKey = 'dashboard_data';
    return this.getCachedOrFetch<DashboardData>(cacheKey, async () => {
      const startTime = performance.now();
      try {
        const [entriesRes, threadsRes, sessionRes, cycleStatusRes] = await Promise.all([
          fetch('/api/entries?limit=5', { headers: this.getHeaders() }),
          fetch('/api/threads', { headers: this.getHeaders() }),
          fetch('/api/session', { headers: this.getHeaders() }).catch(err => {
            console.error('Session fetch failed in dashboardService:', err);
            return null;
          }),
          fetch('/api/cycles/status', { headers: this.getHeaders() }).catch(err => {
            console.error('Cycle status fetch failed in dashboardService:', err);
            return null;
          })
        ]);

        if (!entriesRes.ok) throw new Error('Failed to fetch journal entries.');
        if (!threadsRes.ok) throw new Error('Failed to fetch active threads.');

        const [entriesData, threadsData] = await Promise.all([
          entriesRes.json(),
          threadsRes.json()
        ]);

        const dbEntries = entriesData.entries || [];
        const dbThreads = threadsData.threads || [];

        // Map entries
        const mappedEntries: JournalEntry[] = dbEntries.map((entry: any) => {
          const dayNum = entry.daily_sessions?.day_number;
          return {
            id: entry.id,
            day: dayNum ? `D${dayNum}` : 'Free Write',
            text: entry.content,
            date: new Date(entry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            words: entry.word_count,
            type: 'entry',
            reflection: entry.reflection,
            entry_type: entry.entry_type,
            cycle_day: entry.cycle_day,
            created_at: entry.created_at,
            crisis_flag: entry.crisis_flag || false,
            crisis_type: entry.crisis_type || null
          };
        });

        // Map threads
        const mappedThreads: ReflectionThread[] = dbThreads.map((thread: any) => {
          return {
            id: thread.id,
            from: thread.origin || 'Self-Reflection',
            question: thread.question,
            context: 'This thread has been opened based on your recurring patterns for ongoing self-reflection.',
            status: thread.status,
            age: getAgeString(thread.created_at)
          };
        });

        this.setCached('active_threads', mappedThreads);

        // Fetch active session state to compute hasWrittenToday
        let hasWrittenToday = false;
        let userId = 'anon';
        let cycleId = 'default';
        let sessionState: any = null;
        let cycleStatusData: any = null;
        if (sessionRes && sessionRes.ok) {
          sessionState = await sessionRes.json().catch(() => null);
          if (sessionState) {
            this.setCached('session_state', sessionState);
            if (sessionState.isCompletedToday) {
              hasWrittenToday = true;
            }
            if (sessionState.session) {
              userId = sessionState.session.user_id || userId;
              cycleId = sessionState.session.cycle_id || cycleId;
            }
          }
        }

        // Fetch cycle status details from backend status API
        let cycleNumber = 1;
        let currentDay = 1;
        let totalDays = 30;
        let startedAt = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        let daysRemaining = 29;

        if (cycleStatusRes && cycleStatusRes.ok) {
          cycleStatusData = await cycleStatusRes.json().catch(() => null);
          if (cycleStatusData) {
            this.setCached('cycle_status', cycleStatusData);
          }
          if (cycleStatusData && cycleStatusData.hasCycle && cycleStatusData.cycle) {
            const cycle = cycleStatusData.cycle;
            cycleNumber = cycle.cycleNumber || 1;
            currentDay = cycle.currentDay || 1;
            totalDays = cycle.totalDays || 30;
            daysRemaining = cycle.daysRemaining !== undefined ? cycle.daysRemaining : (totalDays - currentDay);
            userId = cycle.userId || cycle.user_id || userId;
            cycleId = cycle.id || cycleId;
            
            if (cycle.startDate) {
              const startDateObj = new Date(cycle.startDate);
              if (!isNaN(startDateObj.getTime())) {
                startedAt = startDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
              }
            }
          }
        }

        // If they wrote a free write today, set hasWrittenToday = true
        const hasWrittenFreeWriteToday = dbEntries.some((entry: any) => {
          const entryDate = new Date(entry.created_at);
          const today = new Date();
          return entryDate.getDate() === today.getDate() &&
                 entryDate.getMonth() === today.getMonth() &&
                 entryDate.getFullYear() === today.getFullYear();
        });

        if (hasWrittenFreeWriteToday) {
          hasWrittenToday = true;
        }

        const dashboardDataResult: DashboardData = {
          cycleInfo: {
            cycleNumber,
            currentDay,
            totalDays,
            startedAt,
            daysRemaining,
            hasWrittenToday
          },
          entries: mappedEntries,
          threads: mappedThreads,
          sessionState,
          cycleStatus: cycleStatusData
        };

        this.setSessionContext({
          userId,
          cycleId,
          engineVersion: '2.0',
          promptVersion: '1.0'
        });

        const duration = performance.now() - startTime;
        this.trackLatency('fetchDashboardData', duration);

        return dashboardDataResult;
      } catch (err) {
        console.error('Error in fetchDashboardData background fetch:', err);
        throw err;
      }
    });
  }

  /**
   * Saves a free-form journal entry in the database.
   */
  static async saveJournalEntry(text: string): Promise<JournalEntry> {
    const startTime = performance.now();
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: DashboardService.getHeaders(),
      body: JSON.stringify({ content: text })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to save journal entry.');
    }
    
    // Invalidate only the current user/cycle scope on write.
    this.invalidateScopedCache();

    const entry = data.entry;
    const duration = performance.now() - startTime;
    this.trackLatency('saveJournalEntry', duration);

    return {
      id: entry.id,
      day: entry.daily_sessions?.day_number ? `D${entry.daily_sessions.day_number}` : 'Free Write',
      text: entry.content,
      date: new Date(entry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      words: entry.word_count,
      type: 'entry'
    };
  }

  /**
   * Fetches status of a specific entry (for checking scoring/crisis).
   */
  static async checkEntryStatus(entryId: string): Promise<any> {
    const startTime = performance.now();
    const res = await fetch(`/api/entries/${entryId}`, {
      headers: DashboardService.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to check entry status.');
    }
    const duration = performance.now() - startTime;
    this.trackLatency('checkEntryStatus', duration);

    return {
      ...data.entry,
      reflection: data.reflection || null
    };
  }

  /**
   * Fetches active threads for the user from Supabase.
   */
  static async fetchActiveThreads(): Promise<any> {
    return this.getCachedOrFetch<any>('active_threads', async () => {
      const startTime = performance.now();
      const res = await fetch('/api/threads', {
        headers: DashboardService.getHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to fetch active threads.');
      }
      const duration = performance.now() - startTime;
      this.trackLatency('fetchActiveThreads', duration);
      return data.threads;
    });
  }

  /**
   * Fetches specific thread details, including historical responses.
   */
  static async fetchThreadDetails(threadId: string): Promise<any> {
    const res = await fetch(`/api/threads/${threadId}`, {
      headers: DashboardService.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to fetch thread details.');
    }
    return data;
  }

  /**
   * Submits a new response to a thread.
   */
  static async submitThreadResponse(threadId: string, response: string): Promise<any> {
    const res = await fetch(`/api/threads/${threadId}`, {
      method: 'POST',
      headers: DashboardService.getHeaders(),
      body: JSON.stringify({ response })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to submit thread response.');
    }
    // Invalidate caches
    this.invalidateScopedCache();
    return data.response;
  }

  /**
   * Saves a draft response to a thread.
   */
  static async saveThreadDraft(threadId: string, draft: string): Promise<any> {
    const res = await fetch(`/api/threads/${threadId}`, {
      method: 'PATCH',
      headers: DashboardService.getHeaders(),
      body: JSON.stringify({ draft })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to save thread draft.');
    }
    this.invalidateScopedCache();
    return data.draft_response;
  }

  /**
   * Fetches the user's active or completed daily session for today.
   */
  static async fetchActiveSession(): Promise<any> {
    return this.getCachedOrFetch<any>('session_state', async () => {
      const startTime = performance.now();
      const res = await fetch('/api/session', {
        headers: DashboardService.getHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to fetch active session.');
      }
      const duration = performance.now() - startTime;
      this.trackLatency('fetchActiveSession', duration);
      return data;
    });
  }

  /**
   * Starts a new daily session.
   */
  static async startSession(): Promise<any> {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: DashboardService.getHeaders(),
      body: JSON.stringify({ action: 'start' })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to start session.');
    }
    this.invalidateScopedCache();
    return data;
  }

  /**
   * Saves the state/draft of the active session step.
   */
  static async saveSessionStep(status: string, sessionData: any): Promise<any> {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: DashboardService.getHeaders(),
      body: JSON.stringify({ action: 'save-step', status, sessionData })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to save session step.');
    }
    this.invalidateScopedCache();
    return data;
  }

  /**
   * Completes the daily session, creating exercises and journal entry.
   */
  static async completeSession(payload: {
    exercise: {
      stressor_type: string;
      reactive_thought: string;
      reframed_thought: string;
      clarity_score: number;
    };
    journal: {
      content: string;
    };
    closing_response: string;
  }): Promise<any> {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: DashboardService.getHeaders(),
      body: JSON.stringify({ action: 'complete', ...payload })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to complete session.');
    }
    // Invalidate only the current user/cycle scope on complete.
    this.invalidateScopedCache();
    return data;
  }

  /**
   * Clears state for testing or logout purposes.
   */
  static resetState() {
    this.cache = {};
    this.inFlight = {};
    this.sessionContext = {};
    if (typeof window !== 'undefined') {
      localStorage.removeItem('iw_dashboard_data_v1');
    }
  }

  static async fetchVocabOverview(): Promise<any> {
    return this.getCachedOrFetch<any>('vocab_overview', async () => {
      const startTime = performance.now();
      const res = await fetch('/api/vocab/overview', {
        headers: DashboardService.getHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to fetch vocabulary overview.');
      }
      const duration = performance.now() - startTime;
      this.trackLatency('fetchVocabOverview', duration);
      return data.data;
    });
  }

  static async fetchVocabByCycle(): Promise<any> {
    return this.getCachedOrFetch<any>('vocab_by_cycle', async () => {
      const startTime = performance.now();
      const res = await fetch('/api/vocab/by-cycle', {
        headers: DashboardService.getHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to fetch vocabulary by cycle.');
      }
      const duration = performance.now() - startTime;
      this.trackLatency('fetchVocabByCycle', duration);
      return data.cycles;
    });
  }

  static async fetchVocabThreadResponses(): Promise<any> {
    const res = await fetch('/api/vocab/thread-responses', {
      headers: DashboardService.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to fetch vocabulary thread responses.');
    }
    return data;
  }

  /**
   * Submits or autosaves a response to a reflection question.
   */
  static async submitReflectionAnswer(reflectionId: string, answer: string, status: 'ready' | 'completed' = 'completed'): Promise<any> {
    const res = await fetch('/api/reflections/answer', {
      method: 'POST',
      headers: DashboardService.getHeaders(),
      body: JSON.stringify({ reflectionId, answer, status })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to submit reflection response.');
    }
    // Invalidate caches
    this.invalidateScopedCache();
    return data.reflection;
  }

  /**
   * Fetches active cycle status and progression metrics.
   */
  static async fetchCycleStatus(): Promise<any> {
    return this.getCachedOrFetch<any>('cycle_status', async () => {
      const startTime = performance.now();
      const res = await fetch('/api/cycles/status', {
        headers: DashboardService.getHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to fetch cycle status.');
      }
      const duration = performance.now() - startTime;
      this.trackLatency('fetchCycleStatus', duration);
      return data;
    });
  }

  /**
   * Submits the cycle-end transition assessment and triggers next cycle.
   */
  static async submitCycleAssessment(answers: Record<string, any>): Promise<any> {
    const res = await fetch('/api/cycles/complete-assessment', {
      method: 'POST',
      headers: DashboardService.getHeaders(),
      body: JSON.stringify({ answers })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to submit cycle transition assessment.');
    }
    // Invalidate caches on transition
    this.invalidateScopedCache();
    return data;
  }

  /**
   * Simulates cycle events for developer testing.
   */
  static async simulateCycle(payload: { action: string; days?: number; cycleNumber?: number; cycleId?: string }): Promise<any> {
    const res = await fetch('/api/cycles/simulate', {
      method: 'POST',
      headers: DashboardService.getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to execute cycle simulation.');
    }
    // Invalidate only the current user/cycle scope on simulation.
    this.invalidateScopedCache();
    return data;
  }

  /**
   * Fetches the complete, cycle-centric timeline list.
   */
  static async fetchCyclesList(): Promise<any[]> {
    return this.getCachedOrFetch<any[]>('cycles_list', async () => {
      const startTime = performance.now();
      const res = await fetch('/api/cycles', {
        headers: DashboardService.getHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to fetch cycles list.');
      }
      const duration = performance.now() - startTime;
      this.trackLatency('fetchCyclesList', duration);
      return data.cycles || [];
    });
  }

  /**
   * Fetches full single cycle details on demand.
   */
  static async fetchCycleDetails(cycleId: string): Promise<any> {
    const startTime = performance.now();
    const res = await fetch(`/api/cycles/${cycleId}`, {
      headers: DashboardService.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to fetch cycle details.');
    }
    const duration = performance.now() - startTime;
    this.trackLatency('fetchCycleDetails', duration);

    return data.cycle;
  }

  /**
   * Fetches all weekly reports for the user.
   */
  static async fetchWeeklyReports(cycleId?: string): Promise<any[]> {
    const cacheKey = `weekly_reports_${cycleId || 'all'}`;
    return this.getCachedOrFetch<any[]>(cacheKey, async () => {
      const startTime = performance.now();
      const url = cycleId ? `/api/reports/weekly?cycleId=${cycleId}` : '/api/reports/weekly';
      const res = await fetch(url, {
        headers: DashboardService.getHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to fetch weekly reports.');
      }
      const duration = performance.now() - startTime;
      this.trackLatency('fetchWeeklyReports', duration);
      return data.reports;
    });
  }

  /**
   * Fetches single weekly report detail on demand.
   */
  static async fetchWeeklyReportDetail(reportId: string): Promise<any> {
    const cacheKey = `weekly_report_detail_${reportId}`;
    return this.getCachedOrFetch<any>(cacheKey, async () => {
      const startTime = performance.now();
      const res = await fetch(`/api/reports/weekly/${reportId}`, {
        headers: DashboardService.getHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to fetch weekly report detail.');
      }
      const duration = performance.now() - startTime;
      this.trackLatency('fetchWeeklyReportDetail', duration);
      return data.report;
    });
  }

  /**
   * Fetches the Day 28 assessment report for a cycle.
   */
  static async fetchCycleAssessment(cycleId: string): Promise<any> {
    const cacheKey = `cycle_assessment_${cycleId}`;
    return this.getCachedOrFetch<any>(cacheKey, async () => {
      const startTime = performance.now();
      const res = await fetch(`/api/reports/assessment?cycleId=${cycleId}`, {
        headers: DashboardService.getHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to fetch cycle assessment.');
      }
      const duration = performance.now() - startTime;
      this.trackLatency('fetchCycleAssessment', duration);
      return data.assessment;
    });
  }
}


