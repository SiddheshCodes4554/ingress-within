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
  status: 'active' | 'new' | 'returned' | 'addressed';
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

const STORAGE_KEY = 'iw_dashboard_data_v1';

const defaultThreads: ReflectionThread[] = [
  {
    id: 'thread-0',
    from: 'Week 2 summary · Cycle 2',
    question: 'What would it look like to actually say the thing instead of absorbing it?',
    context: 'Conflict came up four times this week. Each time you described your response as "handling it." The entries suggest something quieter — managing, not resolving.',
    status: 'active',
    age: '4 days ago'
  },
  {
    id: 'thread-1',
    from: 'Week 1 summary · Cycle 2',
    question: 'Is avoiding the argument the same as keeping the peace — or just a different name for the same thing?',
    context: 'You ranked Peace as your top value in the card sort. But your entries this week describe three situations where you avoided saying what you actually thought.',
    status: 'new',
    age: '11 days ago'
  },
  {
    id: 'thread-2',
    from: 'Week 3 summary · Cycle 1',
    question: 'When did saying "fine" become easier than saying what\'s actually there?',
    context: 'The word "fine" appeared six times this week — always about yourself, never about anyone else.',
    status: 'returned',
    age: '3 weeks ago'
  }
];

const defaultEntries: JournalEntry[] = [
  {
    id: 'entry-0',
    day: 'D20',
    text: 'The same conversation keeps happening and I keep having it the same way — different person each time but the feeling at the end is identical.',
    date: '24 Jun',
    words: 184,
    type: 'entry'
  },
  {
    id: 'entry-1',
    day: 'D19',
    text: 'I noticed I apologised twice today for things that weren\'t my fault. Just to ease the tension in the room. I don\'t think they even noticed, but I felt it immediately.',
    date: '23 Jun',
    words: 211,
    type: 'entry'
  },
  {
    id: 'entry-2',
    day: 'D17',
    text: 'I keep framing it as them not understanding. Maybe I\'m not saying it clearly because I don\'t want them to hear it. It\'s safer to remain slightly misunderstood.',
    date: '21 Jun',
    words: 156,
    type: 'entry'
  }
];

const defaultCycleInfo = {
  cycleNumber: 2,
  currentDay: 20,
  totalDays: 28,
  startedAt: '4 Jun',
  daysRemaining: 8,
  hasWrittenToday: false
};

function getStoredData(): DashboardData {
  if (typeof window === 'undefined') {
    return {
      cycleInfo: defaultCycleInfo,
      entries: defaultEntries,
      threads: defaultThreads
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read localStorage dashboard data:', err);
  }

  const initialData: DashboardData = {
    cycleInfo: defaultCycleInfo,
    entries: defaultEntries,
    threads: defaultThreads
  };
  setStoredData(initialData);
  return initialData;
}

function setStoredData(data: DashboardData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to write localStorage dashboard data:', err);
  }
}

export class DashboardService {
  /**
   * Fetches dashboard data simulating network latency.
   * Prepares the architecture for a future Supabase join query.
   */
  static async fetchDashboardData(): Promise<DashboardData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getStoredData());
      }, 750);
    });
  }

  /**
   * Saves a daily journal entry.
   * Simulates insertion into a Supabase `user_entries` table.
   */
  static async saveJournalEntry(text: string): Promise<JournalEntry> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = getStoredData();
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
        const currentDayNum = data.cycleInfo.currentDay;
        
        const newEntry: JournalEntry = {
          id: `entry-${Date.now()}`,
          day: `D${currentDayNum}`,
          text,
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          words: wordCount,
          type: 'entry'
        };

        data.entries.unshift(newEntry);
        data.cycleInfo.hasWrittenToday = true;
        
        setStoredData(data);
        resolve(newEntry);
      }, 500);
    });
  }

  /**
   * Submits a thread response and marks it as addressed.
   * Simulates updating a Supabase `user_threads` row.
   */
  static async submitThreadResponse(threadId: string, responseText: string): Promise<ReflectionThread> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const data = getStoredData();
        const threadIndex = data.threads.findIndex(t => t.id === threadId);
        
        if (threadIndex === -1) {
          reject(new Error('Thread not found'));
          return;
        }

        const thread = data.threads[threadIndex];
        const updatedThread: ReflectionThread = {
          ...thread,
          status: 'addressed',
          response: responseText,
          addressedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        };

        data.threads[threadIndex] = updatedThread;
        
        setStoredData(data);
        resolve(updatedThread);
      }, 500);
    });
  }

  /**
   * Clears state for testing or logout purposes.
   */
  static resetState() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
