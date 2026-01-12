/**
 * Utility to extract datasets from LLM response text.
 * Looks for [DATASETS_JSON_START]...[DATASETS_JSON_END] blocks.
 */

export interface ExtractedContent {
  answer: string;
  datasets?: Record<string, any>;
}

/**
 * Extract datasets JSON block from answer text.
 * Returns the answer without the datasets block and the parsed datasets object.
 */
export function extractDatasetsFromAnswer(answer: string): ExtractedContent {
  if (!answer || typeof answer !== 'string') {
    return { answer, datasets: undefined };
  }

  const datasetsRegex = /\[DATASETS_JSON_START\]\s*(.*?)\s*\[DATASETS_JSON_END\]/s;
  const match = answer.match(datasetsRegex);

  if (!match) {
    // No datasets block found
    return { answer, datasets: undefined };
  }

  try {
    // Parse the JSON block
    const datasetsJson = JSON.parse(match[1]);
    
    // Remove the datasets block from the answer
    const cleanAnswer = answer.slice(0, match.index) + answer.slice(match.index! + match[0].length);
    
    return {
      answer: cleanAnswer.trim(),
      datasets: datasetsJson.datasets || datasetsJson
    };
  } catch (e) {
    // Failed to parse JSON, return original answer
    console.warn('[extractDatasetsFromAnswer] Failed to parse datasets JSON:', e);
    return { answer, datasets: undefined };
  }
}
