/**
 * Utility to extract intervention options JSON from LLM response text.
 * Looks for [OPTIONS_JSON_START]...[OPTIONS_JSON_END] blocks.
 */

export interface InterventionOption {
  id: string;
  title: string;
  description: string;
  impact?: string;
  timeline?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface ParsedOptionsResponse {
  narrative: string;  // HTML narrative (markers stripped)
  options: InterventionOption[] | null;  // Parsed options or null if extraction failed
}

/**
 * Extract options JSON block from answer text.
 * Returns the narrative without the options block and the parsed options array.
 */
export function parseOptionsResponse(answer: string): ParsedOptionsResponse {
  if (!answer || typeof answer !== 'string') {
    return { narrative: answer, options: null };
  }

  const optionsRegex = /\[OPTIONS_JSON_START\]\s*(.*?)\s*\[OPTIONS_JSON_END\]/s;
  const match = answer.match(optionsRegex);

  if (!match) {
    // No options block found
    return { narrative: answer, options: null };
  }

  try {
    // Parse the JSON block
    const optionsJson = JSON.parse(match[1]);

    // Remove the options block from the answer
    const cleanNarrative = answer.slice(0, match.index) + answer.slice(match.index! + match[0].length);

    return {
      narrative: cleanNarrative.trim(),
      options: (optionsJson.options ?? null) as InterventionOption[] | null
    };
  } catch (e) {
    // Failed to parse JSON, return original answer as narrative
    console.warn('[parseOptionsResponse] Failed to parse options JSON:', e);

    // Still strip the markers even if JSON is malformed
    const cleanNarrative = answer
      .replace(/\[OPTIONS_JSON_START\].*?\[OPTIONS_JSON_END\]/s, '')
      .trim();

    return { narrative: cleanNarrative, options: null };
  }
}
