/**
 * Utility to extract and parse a JSON object from text returned by LLMs.
 * Handles raw JSON, markdown JSON codeblocks, and braced JSON within text.
 * Implements self-healing algorithms for quote normalization, trailing commas, 
 * unescaped string newlines, and unclosed braces/brackets.
 */

export function repairJsonString(jsonStr: string): string {
  let cleaned = jsonStr.trim();

  // 1. Normalize smart quotes to standard quotes
  cleaned = cleaned.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
  cleaned = cleaned.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, '"'); // normalize single curly quotes too for JSON key/value compat

  // 2. Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

  // 3. Fix literal unescaped newlines inside JSON string values
  let inString = false;
  let result = '';
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const prevChar = i > 0 ? cleaned[i - 1] : '';
    
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
    }
    
    if (inString && (char === '\n' || char === '\r')) {
      if (char === '\n') {
        result += '\\n';
      }
      // skip \r
    } else {
      result += char;
    }
  }
  cleaned = result;

  // 4. Auto-balance opening/closing braces and brackets
  let openBraces = 0;
  let openBrackets = 0;
  let inStr = false;
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const prevChar = i > 0 ? cleaned[i - 1] : '';
    
    if (char === '"' && prevChar !== '\\') {
      inStr = !inStr;
    }
    
    if (!inStr) {
      if (char === '{') openBraces++;
      if (char === '}') openBraces = Math.max(0, openBraces - 1);
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets = Math.max(0, openBrackets - 1);
    }
  }

  // If unclosed, append missing closures
  if (openBrackets > 0) {
    cleaned += ']'.repeat(openBrackets);
  }
  if (openBraces > 0) {
    cleaned += '}'.repeat(openBraces);
  }

  return cleaned;
}

export function extractJson<T>(text: string): T {
  const trimmed = text.trim();
  
  // 1. Try direct JSON parse
  try {
    return JSON.parse(trimmed) as T;
  } catch {}

  // 2. Extract code block or first JSON structure
  let candidate = trimmed;
  const blockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (blockMatch && blockMatch[1]) {
    candidate = blockMatch[1].trim();
  } else {
    const startIdx = trimmed.indexOf('{');
    const endIdx = trimmed.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      candidate = trimmed.substring(startIdx, endIdx + 1);
    }
  }

  // 3. Try parsing the extracted string directly
  try {
    return JSON.parse(candidate) as T;
  } catch {}

  // 4. Apply self-healing repairs
  const repaired = repairJsonString(candidate);
  try {
    return JSON.parse(repaired) as T;
  } catch (err: any) {
    console.error('[extractJson] Self-healing repair failed. Cleaned string was:', repaired);
    throw new Error(`Failed to parse and repair JSON from LLM response. Original response:\n${text}\nParse error: ${err.message}`);
  }
}
