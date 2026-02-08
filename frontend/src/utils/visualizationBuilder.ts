/**
 * Visualization Artifact Builder
 * 
 * Transforms parsed visualization tags + datasets into normalized Artifact objects
 * for rendering in the chat UI and canvas.
 */

import {
  TableDataset,
  ChartDataset,
  extractTableDataset,
  extractChartDataset,
  flattenChartDataForRecharts,
  parseVisualizationTags,
} from "./visualizationParser";

/**
 * Extract all dataset blocks from answer text.
 * 
 * Finds all [DATASETS_JSON_START]...[DATASETS_JSON_END] blocks in the answer
 * and merges them into a single datasets map.
 * 
 * @param answerText The answer text that may contain dataset blocks
 * @returns Object with: { answer: cleanedText, datasets: mergedDatasetsMap }
 */
export function extractDatasetBlocks(
  answerText: string | undefined
): { answer: string; datasets: Record<string, any> } {
  if (!answerText || typeof answerText !== 'string') {
    return { answer: answerText || '', datasets: {} };
  }

  const mergedDatasets: Record<string, any> = {};
  let cleanAnswer = answerText;

  // Find ALL dataset blocks using regex (not just first)
  // Accept both DATASETS_JSON_* and the occasional DATASET_JSON_* typo from the model
  const datasetRegex = /\[DATASETS?_JSON_START\]\s*([\s\S]*?)\s*\[DATASETS?_JSON_END\]/gi;
  let match;

  while ((match = datasetRegex.exec(answerText)) !== null) {
    try {
      let jsonStr = match[1].trim();

      // Strategy -2: Brace Balancer (Multi-Object Support)
      // Iteratively find and parse all top-level JSON objects in the block
      let cursor = 0;
      while (cursor < jsonStr.length) {
        const startBrace = jsonStr.indexOf('{', cursor);
        if (startBrace === -1) break; // No more objects

        let openBraces = 0;
        let endIndex = -1;

        for (let i = startBrace; i < jsonStr.length; i++) {
          if (jsonStr[i] === '{') openBraces++;
          else if (jsonStr[i] === '}') openBraces--;

          if (openBraces === 0) {
            endIndex = i;
            break;
          }
        }

        if (endIndex !== -1) {
          const candidate = jsonStr.substring(startBrace, endIndex + 1);
          try {
            const parsed = JSON.parse(candidate);
            if (parsed.datasets && typeof parsed.datasets === 'object') {
              Object.assign(mergedDatasets, parsed.datasets);
            }
          } catch (e) { }
          cursor = endIndex + 1; // Advance past this object
        } else {
          break; // Unbalanced, stop
        }
      }

      if (Object.keys(mergedDatasets).length > 0) {
        continue;
      }

      // Strategy -1: Brace Balancer (The most robust way)
      // Find the first '{' and the matching '}' to ignore trailing garbage
      const firstBrace = jsonStr.indexOf('{');
      if (firstBrace !== -1) {
        let openBraces = 0;
        let endIndex = -1;

        for (let i = firstBrace; i < jsonStr.length; i++) {
          if (jsonStr[i] === '{') openBraces++;
          else if (jsonStr[i] === '}') openBraces--;

          if (openBraces === 0) {
            endIndex = i;
            break;
          }
        }

        if (endIndex !== -1) {
          const candidate = jsonStr.substring(firstBrace, endIndex + 1);
          try {
            // console.log('[extractDatasetBlocks] parsing balanced candidate:', candidate);
            const parsed = JSON.parse(candidate);
            if (parsed.datasets && typeof parsed.datasets === 'object') {
              Object.assign(mergedDatasets, parsed.datasets);
              continue; // Success!
            }
          } catch (e) { }
        }
      }

      // Strategy 0: Direct Parse Attempt (Optimistic)
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.datasets && typeof parsed.datasets === 'object') {
          Object.assign(mergedDatasets, parsed.datasets);
          continue; // Success!
        }
      } catch (e) {
        // Continue to cleaning strategies
      }

      // Strategy 1: Un-escape if it looks like a string literal
      if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
        try {
          const unescaped = JSON.parse(jsonStr);
          if (typeof unescaped === 'string') {
            // If unescaped is still a string, try parsing it as object
            try {
              const parsed = JSON.parse(unescaped);
              if (parsed.datasets) {
                Object.assign(mergedDatasets, parsed.datasets);
                continue;
              }
            } catch (e) { }
            jsonStr = unescaped; // Use unescaped version for next steps
          }
        } catch (e) {
          // Unescape failed
        }
      }

      // Strategy 2: Handle backslash-escaped cleaning (Common AI Artifact)
      // Removing excessive backslashes that might have been injected
      let cleanStr = jsonStr;
      if (cleanStr.includes('\\n') || cleanStr.includes('\\"')) {
        cleanStr = cleanStr
          .replace(/\\n/g, '\n')    // \n → newline
          .replace(/\\"/g, '"')    // \" → "
          .replace(/\\\\/g, '\\');  // \\ → \
      }

      // Strategy 3: Truncate at last valid closing brace
      // This fixes the "Unexpected non-whitespace character after JSON" error
      // caused by hallucinated text after the JSON block
      const lastBrace = cleanStr.lastIndexOf('}');
      if (lastBrace !== -1 && lastBrace < cleanStr.length - 1) {
        cleanStr = cleanStr.substring(0, lastBrace + 1);
      }

      // Strategy 4: Find first opening brace
      const startIdx = cleanStr.indexOf('{');
      if (startIdx !== -1 && startIdx > 0) {
        cleanStr = cleanStr.substring(startIdx);
      }

      // Final Parse Attempt with cleaned string
      console.log('[extractDatasetBlocks] Attempting parse with cleanStr:', cleanStr.substring(0, 100) + '...' + cleanStr.substring(cleanStr.length - 20));
      const parsed = JSON.parse(cleanStr);

      // Merge datasets from this block
      if (parsed.datasets && typeof parsed.datasets === 'object') {
        Object.assign(mergedDatasets, parsed.datasets);
      }
    } catch (e) {
      const preview = match[1].substring(0, 50).replace(/\n/g, '\\n');
      console.error(
        `[extractDatasetBlocks] DATASET PARSE ERROR: Backend sent malformed dataset block.\n` +
        `Expected: Valid JSON or escaped JSON string.\n` +
        `Received: "${preview}..."\n` +
        `Error: ${e instanceof Error ? e.message : String(e)}\n` +
        `This indicates backend is not following the contract. Dataset extraction skipped for this block.`
      );
    }
  }

  // Strip ALL dataset blocks from answer text
  cleanAnswer = answerText.replace(datasetRegex, '').trim();

  return { answer: cleanAnswer, datasets: mergedDatasets };
}

/**
 * Normalized Artifact Interface (matches ArtifactRenderer expectations)
 */
export interface Artifact {
  id?: string;
  artifact_type: "HTML" | "TABLE" | "CHART" | "REPORT" | "DOCUMENT";
  title: string;
  description?: string;
  content: Record<string, any>;
  data?: Record<string, any>[];
  created_at?: string;
}

/**
 * Build normalized artifacts from parsed tags and datasets.
 * 
 * Process:
 * 1. Create HTML artifact for the report body (with custom tags sanitized)
 * 2. For each parsed tag, lookup dataset and build TABLE/CHART artifact
 * 3. Return array of all artifacts
 * 
 * @param htmlContent Original HTML content (may contain custom tags)
 * @param datasets Map of data-id to dataset spec from LLM payload
 * @returns Array of normalized artifacts
 */
export function buildArtifactsFromTags(
  htmlContent: string | undefined,
  datasets: Record<string, any> | undefined
): Artifact[] {
  const artifacts: Artifact[] = [];

  // Parse tags from HTML
  const parsedTags = parseVisualizationTags(htmlContent || "");

  console.log('[buildArtifactsFromTags] Found tags:', parsedTags.map(t => `${t.tagName}:${t.dataId}`));
  console.log('[buildArtifactsFromTags] Available datasets:', Object.keys(datasets || {}));

  // Map to store built artifacts for embedding
  const embeddedArtifacts: Record<string, Artifact> = {};

  // Build artifacts from parsed tags
  for (const parsedTag of parsedTags) {
    try {
      if (parsedTag.tagName === "ui-table") {
        const tableArtifact = buildTableArtifact(
          parsedTag.dataId,
          extractTableDataset(datasets, parsedTag.dataId)
        );
        if (tableArtifact) {
          artifacts.push(tableArtifact);
          embeddedArtifacts[parsedTag.dataId] = tableArtifact;
        }
      } else if (parsedTag.tagName === "ui-chart") {
        const chartArtifact = buildChartArtifact(
          parsedTag.dataId,
          parsedTag.chartType,
          extractChartDataset(datasets, parsedTag.dataId)
        );
        if (chartArtifact) {
          artifacts.push(chartArtifact);
          embeddedArtifacts[parsedTag.dataId] = chartArtifact;
        }
      }
    } catch (error) {
      console.error(
        `[buildArtifactsFromTags] Error building artifact for ${parsedTag.tagName}:${parsedTag.dataId}`,
        error
      );
    }
  }

  // NOTE: HTML artifact removed - report body is rendered separately via ReactMarkdown
  // in StrategyReportModal.tsx. Creating HTML artifacts breaks StrategyReportChartRenderer
  // which only handles CHART and TABLE types. Only return CHART and TABLE artifacts.

  console.log('[buildArtifactsFromTags] Built artifacts:', artifacts.map(a => `${a.artifact_type}:${a.title}`));
  return artifacts;
}

/**
 * Build a TABLE artifact from parsed tag and dataset.
 * 
 * @param dataId The data-id from the tag
 * @param dataset Validated table dataset
 * @returns TABLE artifact or null if validation failed
 */
function buildTableArtifact(dataId: string, dataset: TableDataset | null): Artifact | null {
  if (!dataset) {
    console.warn(`[buildTableArtifact] Skipping artifact: dataset not found or invalid (${dataId})`);
    return null;
  }

  const title = inferTitleFromDataId(dataId);

  const artifact: Artifact = {
    id: dataId,
    artifact_type: "TABLE",
    title: title,
    description: `Table: ${dataId}`,
    content: {
      chart: { type: "table" },
      title: { text: title },
      columns: dataset.columns,
      rows: dataset.rows,
    },
  };

  return artifact;
}

/**
 * Build a CHART artifact from parsed tag and dataset.
 * 
 * @param dataId The data-id from the tag
 * @param chartTypeFromTag Chart type from tag attribute (if provided)
 * @param dataset Validated chart dataset
 * @returns CHART artifact or null if validation failed
 */
function buildChartArtifact(
  dataId: string,
  chartTypeFromTag: string | undefined,
  dataset: ChartDataset | null
): Artifact | null {
  if (!dataset) {
    console.warn(
      `[buildChartArtifact] Skipping artifact: dataset not found or invalid (${dataId})`
    );
    return null;
  }

  // Determine chart type: prefer tag attribute, fall back to dataset (check both Highcharts and flat formats)
  const chartType = chartTypeFromTag || dataset.chart?.type || dataset.chart_type || 'column';

  if (!chartType) {
    console.error(`[buildChartArtifact] No chart type found for ${dataId}`);
    return null;
  }

  // Infer title from dataset or data-id
  const title = dataset.title || inferTitleFromDataId(dataId);

  // CRITICAL: For Highcharts format (dataset.chart exists), use dataset directly as content
  // This preserves all properties (xAxis, yAxis, series with colors, etc.)
  const content: Record<string, any> = dataset.chart
    ? {
        // Highcharts format - use dataset directly, preserve all properties
        ...dataset,
        title: dataset.title || { text: title }
      }
    : {
        // Legacy flat format - build content structure
        chart: { type: chartType },
        title: { text: title },
        series: dataset.series,
        xAxis: dataset.xAxis || { type: "category" },
        yAxis: dataset.yAxis || { title: { text: "Value" } }
      };

  // Flatten data for Recharts (optional, for compatibility)
  const flatData = flattenChartDataForRecharts(dataset);

  const artifact: Artifact = {
    id: dataId,
    artifact_type: "CHART",
    title: title,
    description: `Chart: ${dataId}`,
    content: content,
    data: flatData,
  };

  return artifact;
}

/**
 * Infer a human-readable title from a data-id.
 * 
 * Transforms:
 *   "sector-projects-2025-Q3" → "Sector Projects 2025 Q3"
 *   "project-status-2025-Q3" → "Project Status 2025 Q3"
 *   "risk-heatmap" → "Risk Heatmap"
 * 
 * Rules:
 * - Split by hyphen
 * - Capitalize first letter of each word
 * - Preserve numbers and quarter/half notation (Q1, H2, etc.)
 * 
 * @param dataId The data-id string
 * @returns Inferred title
 */
export function inferTitleFromDataId(dataId: string): string {
  if (!dataId) {
    return "Visualization";
  }

  return dataId
    .split("-")
    .map((word) => {
      // Preserve pure numbers (years, etc.)
      if (/^\d+$/.test(word)) {
        return word;
      }
      // Preserve quarter/half notation (Q1, Q2, H1, H2, etc.)
      if (/^[QqHh]\d$/.test(word)) {
        return word.toUpperCase();
      }
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Sanitize HTML content, preserving custom visualization tags.
 * 
 * This is a wrapper for DOMPurify that ensures data-* attributes are preserved.
 * Called before building artifacts so tags can be parsed.
 * 
 * @param htmlContent Raw HTML
 * @returns Sanitized HTML with custom tags intact
 */
export function sanitizeHtmlWithCustomTags(htmlContent: string): string {
  // Import DOMPurify if available (should be in frontend deps)
  // For now, return as-is; actual sanitization happens in HtmlRenderer
  return htmlContent;
}

/**
 * Replace custom visualization tags with styled placeholders.
 * 
 * Called by HtmlRenderer to replace tags with visual indicators.
 * E.g., <ui-table data-id="X" /> → <div class="visualization-placeholder">Table: X</div>
 * 
 * @param htmlContent HTML with custom tags
 * @returns HTML with tags replaced
 */
export function replaceVisualizationTags(htmlContent: string): string {
  let result = htmlContent;

  // Robust replacement for ui-table
  // Capture the attributes part: <ui-table (attributes) /?>
  result = result.replace(
    /<ui-table\b([^>]*?)(?:\/\s*>|>[\s\S]*?<\/ui-table>|>(?!\s*<\/ui-table>))/gi,
    (match, attributes) => {
      // Extract data-id
      const dataIdMatch = /data-id=["']([^"']+)["']/i.exec(attributes);
      const dataId = dataIdMatch?.[1];

      if (!dataId) return match; // Keep original if no data-id

      const title = inferTitleFromDataId(dataId);
      return `<div class="visualization-placeholder visualization-table" data-id="${dataId}">📊 Table: ${title}</div>`;
    }
  );

  // Robust replacement for ui-chart
  result = result.replace(
    /<ui-chart\b([^>]*?)(?:\/\s*>|>[\s\S]*?<\/ui-chart>|>(?!\s*<\/ui-chart>))/gi,
    (match, attributes) => {
      // Extract data-id
      const dataIdMatch = /data-id=["']([^"']+)["']/i.exec(attributes);
      const dataId = dataIdMatch?.[1];

      if (!dataId) return match;

      // Extract type
      const typeMatch = /type=["']([^"']+)["']/i.exec(attributes);
      const chartType = typeMatch?.[1] || "bar";

      const title = inferTitleFromDataId(dataId);
      const chartEmoji = getChartEmoji(chartType);
      return `<div class="visualization-placeholder visualization-chart" data-id="${dataId}" data-chart-type="${chartType}"> ${chartEmoji} Chart: ${title}</div>`;
    }
  );

  return result;
}

/**
 * Get an emoji for a chart type.
 */
function getChartEmoji(chartType: string): string {
  const emojiMap: Record<string, string> = {
    bar: "📊",
    column: "📊",
    line: "📈",
    area: "📈",
    pie: "🥧",
    radar: "🎯",
    scatter: "🔵",
    combo: "📊",
    bubble: "🫧",
  };
  return emojiMap[chartType.toLowerCase()] || "📊";
}

/**
 * Integration point: build all artifacts from LLM response.
 * 
 * Called by chatService.adaptArtifacts() after receiving LLM payload.
 * 
 * @param llmPayload The llm_payload from ChatResponse
 * @returns Array of artifacts (parsed + existing)
 */
export function buildAllArtifacts(llmPayload: any): Artifact[] {
  const artifacts: Artifact[] = [];

  // Preserve existing artifacts (backward compatibility)
  if (llmPayload.artifacts && Array.isArray(llmPayload.artifacts)) {
    artifacts.push(...llmPayload.artifacts);
  }

  // Build new artifacts from custom tags
  const htmlContent =
    llmPayload.visualizations?.[0]?.content ||
    (typeof llmPayload.answer === "string" ? llmPayload.answer : "");

  const newArtifacts = buildArtifactsFromTags(htmlContent, llmPayload.datasets);
  artifacts.push(...newArtifacts);

  return artifacts;
}
