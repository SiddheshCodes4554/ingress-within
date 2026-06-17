import { AIProvider } from './types';
import { GroqProvider } from './providers/GroqProvider';
import { ClaudeProvider } from './providers/ClaudeProvider';

export function getAIProvider(providerType?: string): AIProvider {
  const selected = providerType || process.env.AI_PROVIDER || 'groq';
  
  switch (selected.toLowerCase()) {
    case 'groq':
      return new GroqProvider();
    case 'claude':
      return new ClaudeProvider();
    default:
      console.warn(`[AI Factory] Unknown provider type "${selected}". Falling back to Groq.`);
      return new GroqProvider();
  }
}

// Export a singleton instance for standard use across backend routes and workers
export const aiProvider = getAIProvider();
