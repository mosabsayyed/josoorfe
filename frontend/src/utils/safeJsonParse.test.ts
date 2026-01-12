import { safeJsonParse } from './streaming';

// File-based backend logs are disabled; use a small inline fixture instead.
const log = {
  events: [
    {
      event_type: 'llm_response',
      data: {
        answer: JSON.stringify({
          mode: 'CONVERSATION_MODE',
          answer: 'Hello',
          memory_process: { intent: 'Greeting', thought_trace: 'fixture' },
          data: { query_results: [] },
        }),
      },
    },
  ],
};

// Find the llm_response event
const llmEvent = log.events.find((e: any) => e.event_type === 'llm_response');
if (!llmEvent) throw new Error('No llm_response event found');

const rawData = llmEvent.data;
let rawJsonBlock = '';

// Try to extract the JSON block from the answer (simulate frontend usage)
if (typeof rawData === 'string') {
  rawJsonBlock = rawData;
} else if (typeof rawData === 'object') {
  // If the answer is embedded as a stringified JSON, use it
  if (rawData.answer && typeof rawData.answer === 'string' && rawData.answer.trim().startsWith('{')) {
    rawJsonBlock = rawData.answer;
  } else {
    // Otherwise, use the whole object as string
    rawJsonBlock = JSON.stringify(rawData);
  }
}

try {
  const parsed = safeJsonParse(rawJsonBlock);
  console.log('Parsed answer:', parsed.answer);
  console.log('Parsed memory_process.thought_trace:', parsed.memory_process?.thought_trace);
} catch (e) {
  console.error('safeJsonParse failed:', e);
}
