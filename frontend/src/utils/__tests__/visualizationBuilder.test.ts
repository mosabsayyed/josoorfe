/**
 * Test: Dataset Block Extraction
 * 
 * Verifies that extractDatasetBlocks correctly:
 * 1. Finds ALL dataset blocks (not just first)
 * 2. Merges them into single datasets map
 * 3. Strips all blocks from answer text
 */

import { extractDatasetBlocks } from '../visualizationBuilder';

describe('extractDatasetBlocks', () => {
  it('should extract single dataset block', () => {
    const answer = `Here's the analysis.

[DATASETS_JSON_START]
{"datasets": {"chart1": {"type": "bar", "data": [1, 2, 3]}}}
[DATASETS_JSON_END]

More text here.`;

    const result = extractDatasetBlocks(answer);
    
    expect(result.datasets).toEqual({
      chart1: { type: 'bar', data: [1, 2, 3] }
    });
    expect(result.answer).not.toContain('[DATASETS_JSON_START]');
    expect(result.answer).toContain('Here\'s the analysis.');
    expect(result.answer).toContain('More text here.');
  });

  it('should extract MULTIPLE dataset blocks and merge', () => {
    const answer = `Analysis part 1.

[DATASETS_JSON_START]
{"datasets": {"chart1": {"type": "bar", "data": [1, 2, 3]}}}
[DATASETS_JSON_END]

Analysis part 2.

[DATASETS_JSON_START]
{"datasets": {"chart2": {"type": "line", "data": [4, 5, 6]}}}
[DATASETS_JSON_END]

More text.`;

    const result = extractDatasetBlocks(answer);
    
    // Should have BOTH datasets merged
    expect(result.datasets).toEqual({
      chart1: { type: 'bar', data: [1, 2, 3] },
      chart2: { type: 'line', data: [4, 5, 6] }
    });
    
    // Should strip both blocks
    expect(result.answer).not.toContain('[DATASETS_JSON_START]');
    expect(result.answer).not.toContain('[DATASETS_JSON_END]');
    
    // Should preserve text between blocks
    expect(result.answer).toContain('Analysis part 1.');
    expect(result.answer).toContain('Analysis part 2.');
    expect(result.answer).toContain('More text.');
  });

  it('should handle case-insensitive tags', () => {
    const answer = `[datasets_json_start]
{"datasets": {"test": {"value": 123}}}
[datasets_json_end]`;

    const result = extractDatasetBlocks(answer);
    
    expect(result.datasets).toEqual({
      test: { value: 123 }
    });
    expect(result.answer).not.toContain('[datasets_json_start]');
  });

  it('should handle malformed JSON gracefully', () => {
    const answer = `Before.

[DATASETS_JSON_START]
This is not valid JSON
[DATASETS_JSON_END]

[DATASETS_JSON_START]
{"datasets": {"valid": {"data": [1, 2]}}}
[DATASETS_JSON_END]

After.`;

    const result = extractDatasetBlocks(answer);
    
    // Should skip malformed block and extract valid one
    expect(result.datasets).toEqual({
      valid: { data: [1, 2] }
    });
    expect(result.answer).toContain('Before.');
    expect(result.answer).toContain('After.');
  });

  it('should return empty datasets for text without blocks', () => {
    const answer = 'Just plain text, no datasets.';
    
    const result = extractDatasetBlocks(answer);
    
    expect(result.datasets).toEqual({});
    expect(result.answer).toBe(answer);
  });

  it('should handle undefined/null input', () => {
    expect(extractDatasetBlocks(undefined)).toEqual({
      answer: '',
      datasets: {}
    });
    
    expect(extractDatasetBlocks(null as any)).toEqual({
      answer: '',
      datasets: {}
    });
  });

  it('should merge overlapping dataset keys (later wins)', () => {
    const answer = `[DATASETS_JSON_START]
{"datasets": {"key": {"version": 1}}}
[DATASETS_JSON_END]

[DATASETS_JSON_START]
{"datasets": {"key": {"version": 2}}}
[DATASETS_JSON_END]`;

    const result = extractDatasetBlocks(answer);
    
    // Later block should overwrite earlier one
    expect(result.datasets.key.version).toBe(2);
  });
});
