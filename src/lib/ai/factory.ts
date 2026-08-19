import { AIProvider } from './types';
import { GroqProvider } from './providers/GroqProvider';
import { ClaudeProvider } from './providers/claude';
import { GeminiProvider } from './providers/GeminiProvider';
import { FallbackProvider } from './providers/FallbackProvider';

export function getAIProvider(providerType?: string): AIProvider {
  const selected = providerType || process.env.AI_PROVIDER || 'claude';
  
  switch (selected.toLowerCase()) {
    case 'claude':
      // Claude as primary with automatic Groq fallback
      return new FallbackProvider(new ClaudeProvider(), new GroqProvider());
    case 'claude-direct':
      // Direct Claude without fallback (for explicit isolated testing)
      return new ClaudeProvider();
    case 'groq':
      // Direct Groq without fallback
      return new GroqProvider();
    case 'gemini':
      // Direct Gemini
      return new GeminiProvider();
    default:
      console.warn(`[AI Factory] Unknown provider type "${selected}". Using Claude with Groq fallback.`);
      return new FallbackProvider(new ClaudeProvider(), new GroqProvider());
  }
}

// Export a singleton instance for standard use across backend routes and workers
export const aiProvider = getAIProvider();
