import { supabase } from '../db';

const FIXED_WORDS = new Set([
  'HOME', 'ANGER', 'ENOUGH', 'SAFE', 'WAITING', 'WRONG', 'CLOSE', 'STILL', 'BREAK', 'CHANGE'
]);

const SENSITIVITY_EXCLUSIONS = new Set([
  'death', 'dead', 'dying', 'suicide', 'gone', 'leaving', 'alone', 'failure',
  'worthless', 'abuse', 'trauma', 'hurt', 'lost', 'ending', 'nothing',
  'hopeless', 'useless', 'empty', 'broken', 'ugly'
]);

const FALLBACK_WORDS = ['CHANGE', 'LOSS', 'STRESS'];

export class WordAssociationGenerator {
  /**
   * Generates a personalized 12-word stimulus list for a user.
   */
  public static async generate(userId: string): Promise<{ personalised: string[]; sequence: string[] }> {
    try {
      console.log(`[WordAssociationGenerator] Generating stimulus list for user ${userId}`);

      // 1. Fetch user's vocab extractions
      const { data: vocabWords } = await supabase
        .from('vocab_words')
        .select('word, count')
        .eq('user_id', userId)
        .order('count', { ascending: false });

      // 2. Fetch user's knowledge cards
      const { data: knowledgeCards } = await supabase
        .from('knowledge_cards')
        .select('title')
        .eq('user_id', userId)
        .limit(10);

      const candidatePool: string[] = [];

      // Process vocabulary words
      if (vocabWords && vocabWords.length > 0) {
        vocabWords.forEach((v: any) => {
          const w = v.word.trim().toUpperCase();
          if (this.isValidStimulus(w)) {
            candidatePool.push(w);
          }
        });
      }

      // Process knowledge cards (splitting multi-word titles if needed)
      if (knowledgeCards && knowledgeCards.length > 0) {
        knowledgeCards.forEach((c: any) => {
          const words = c.title.split(/\s+/);
          words.forEach((w: string) => {
            const cleanW = w.replace(/[^a-zA-Z]/g, '').trim().toUpperCase();
            if (this.isValidStimulus(cleanW)) {
              candidatePool.push(cleanW);
            }
          });
        });
      }

      // De-duplicate candidate pool while maintaining order
      const uniqueCandidates = Array.from(new Set(candidatePool));

      // Select top 3 unique candidates
      const selected = uniqueCandidates.slice(0, 3);

      // Backfill with fallbacks if we have fewer than 2 words
      while (selected.length < 2) {
        const nextFallback = FALLBACK_WORDS.find(f => !selected.includes(f));
        if (nextFallback) {
          selected.push(nextFallback);
        } else {
          selected.push('LIFE'); // Ultimate emergency fallback
        }
      }

      // Compile sequence
      const sequence = this.compileSequence(selected);

      return {
        personalised: selected,
        sequence
      };
    } catch (err: any) {
      console.error('[WordAssociationGenerator] Error during stimulus generation:', err.message);
      // Fail-safe fallback sequence
      const fallbacks = ['CHANGE', 'LOSS'];
      return {
        personalised: fallbacks,
        sequence: this.compileSequence(fallbacks)
      };
    }
  }

  private static isValidStimulus(word: string): boolean {
    if (!word || word.length < 3 || word.length > 12) return false;
    if (!/^[A-Z]+$/.test(word)) return false; // Alphabetic only
    if (FIXED_WORDS.has(word)) return false;
    if (SENSITIVITY_EXCLUSIONS.has(word.toLowerCase())) return false;
    return true;
  }

  private static compileSequence(personalised: string[]): string[] {
    const p = personalised;
    // 3, 5, 9 are personalized slots
    if (p.length >= 3) {
      return [
        'HOME',          // 1
        'ANGER',         // 2
        p[0],            // 3
        'ENOUGH',        // 4
        p[1],            // 5
        'SAFE',          // 6
        'WAITING',       // 7
        'WRONG',         // 8
        p[2],            // 9
        'CLOSE',         // 10
        'STILL',         // 11
        'BREAK'          // 12
      ];
    } else {
      // 2 personalized words
      return [
        'HOME',          // 1
        'ANGER',         // 2
        p[0],            // 3
        'ENOUGH',        // 4
        p[1],            // 5
        'SAFE',          // 6
        'WAITING',       // 7
        'WRONG',         // 8
        'STILL',         // 9
        'CLOSE',         // 10
        'BREAK',         // 11
        'CHANGE'         // 12
      ];
    }
  }
}
