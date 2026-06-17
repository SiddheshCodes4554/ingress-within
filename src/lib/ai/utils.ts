/**
 * Utility to extract and parse a JSON object from text returned by LLMs.
 * Handles raw JSON, markdown JSON codeblocks, and braced JSON within text.
 */
export function extractJson<T>(text: string): T {
  const trimmed = text.trim();
  try {
    // 1. Try direct JSON parse
    return JSON.parse(trimmed) as T;
  } catch {
    // 2. Try to match markdown JSON or text block: ```json ... ``` or ``` ... ```
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim()) as T;
      } catch (e) {
        console.error('[extractJson] Failed to parse matched codeblock JSON:', e);
      }
    }
    
    // 3. Try to locate the first '{' and the last '}' and parse that substring
    const startIdx = trimmed.indexOf('{');
    const endIdx = trimmed.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const bracedStr = trimmed.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(bracedStr) as T;
      } catch (e) {
        console.error('[extractJson] Failed to parse braced JSON substring:', e);
      }
    }
    
    throw new Error(`Failed to extract JSON from LLM response. Original response:\n${text}`);
  }
}
