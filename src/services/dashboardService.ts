export interface JournalEntry {
  id: string;
  day: string;
  text: string;
  date: string;
  words: number;
  type: 'entry' | 'exercise' | 'summary' | 'report';
  preview?: string;
  meta?: string;
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
    try {
      // 1. Fetch entries
      const entriesRes = await fetch('/api/entries', {
        headers: DashboardService.getHeaders()
      });
      if (!entriesRes.ok) throw new Error('Failed to fetch journal entries.');
      const entriesData = await entriesRes.json();
      const dbEntries = entriesData.entries || [];

      // Map entries
      const mappedEntries: JournalEntry[] = dbEntries.map((entry: any) => {
        const dayNum = entry.daily_sessions?.day_number;
        return {
          id: entry.id,
          day: dayNum ? `D${dayNum}` : 'Free Write',
          text: entry.content,
          date: new Date(entry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          words: entry.word_count,
          type: 'entry'
        };
      });

      // 2. Fetch threads
      const threadsRes = await fetch('/api/threads', {
        headers: DashboardService.getHeaders()
      });
      if (!threadsRes.ok) throw new Error('Failed to fetch active threads.');
      const threadsData = await threadsRes.json();
      const dbThreads = threadsData.threads || [];

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

      // 3. Fetch active session state to compute cycleInfo
      let hasWrittenToday = false;
      let cycleNumber = 1;
      let currentDay = 1;
      let totalDays = 28;
      let startedAt = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      let daysRemaining = 27;

      try {
        const sessionRes = await fetch('/api/session', {
          headers: DashboardService.getHeaders()
        });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.exists && sessionData.session) {
            const session = sessionData.session;
            const isCompletedToday = sessionData.isCompletedToday || false;
            
            if (isCompletedToday) {
              currentDay = session.day_number;
              hasWrittenToday = true;
            } else {
              if (session.status !== 'complete') {
                currentDay = session.day_number;
              } else {
                currentDay = session.day_number + 1;
              }
              hasWrittenToday = false;
            }

            cycleNumber = Math.floor((currentDay - 1) / 28) + 1;
            const currentDayInCycle = ((currentDay - 1) % 28) + 1;
            daysRemaining = 28 - currentDayInCycle;

            const sessionDate = new Date(session.created_at);
            const dayOffset = currentDayInCycle - 1;
            const cycleStartDate = new Date(sessionDate.getTime() - dayOffset * 24 * 60 * 60 * 1000);
            startedAt = cycleStartDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          }
        }
      } catch (sessionErr) {
        console.error('Error fetching session for cycleInfo:', sessionErr);
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

      return {
        cycleInfo: {
          cycleNumber,
          currentDay,
          totalDays,
          startedAt,
          daysRemaining,
          hasWrittenToday
        },
        entries: mappedEntries,
        threads: mappedThreads
      };

    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      // Return fallback empty structures to prevent dashboard from breaking
      return {
        cycleInfo: {
          cycleNumber: 1,
          currentDay: 1,
          totalDays: 28,
          startedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          daysRemaining: 27,
          hasWrittenToday: false
        },
        entries: [],
        threads: []
      };
    }
  }

  /**
   * Saves a free-form journal entry in the database.
   */
  static async saveJournalEntry(text: string): Promise<JournalEntry> {
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: DashboardService.getHeaders(),
      body: JSON.stringify({ content: text })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to save journal entry.');
    }
    const entry = data.entry;
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
   * Fetches active threads for the user from Supabase.
   */
  static async fetchActiveThreads(): Promise<any> {
    const res = await fetch('/api/threads', {
      headers: DashboardService.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to fetch active threads.');
    }
    return data.threads;
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
    return data.response;
  }

  /**
   * Fetches the user's active or completed daily session for today.
   */
  static async fetchActiveSession(): Promise<any> {
    const res = await fetch('/api/session', {
      headers: DashboardService.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to fetch active session.');
    }
    return data;
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
    return data;
  }

  /**
   * Clears state for testing or logout purposes.
   */
  static resetState() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('iw_dashboard_data_v1');
    }
  }
}

