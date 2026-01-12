/**
 * Visualization Tag Parser
 * 
 * Extracts custom UI visualization tags (<ui-table>, <ui-chart>) from HTML content.
 * These tags reference datasets that should be looked up in the llm_payload.datasets map.
 */

export type ChartType = "bar" | "column" | "line" | "area" | "pie" | "radar" | "scatter" | "combo" | "bubble";

/**
 * Parsed specification from a single visualization tag
 */
export interface ParsedVisualizationTag {
  /** Tag name: ui-table or ui-chart */
  tagName: "ui-table" | "ui-chart";
  /** Dataset ID to lookup in datasets map */
  dataId: string;
  /** Chart type (only for ui-chart) */
  chartType?: ChartType;
  /** Original HTML element (for tracking/replacement) */
  element: HTMLElement;
}

/**
 * Parse HTML content and extract custom visualization tags using regex.
 * 
 * Looks for:
 * - <ui-table data-id="..." />
 * - <ui-chart type="bar" data-id="..." />
 * 
 * Uses regex instead of DOMParser because DOMParser doesn't handle custom tags reliably.
 * 
 * @param htmlContent Raw HTML string (may contain custom tags)
 * @returns Array of parsed tag specifications
 */
export function parseVisualizationTags(htmlContent: string): ParsedVisualizationTag[] {
  if (!htmlContent || typeof htmlContent !== "string") {
    return [];
  }

  const tags: ParsedVisualizationTag[] = [];

  try {
    // Match <ui-table ...>...</ui-table> OR self-closing; accept data-id or id
    const tableRegex = /<ui-table\b[^>]*?(?:data-id|id)=["']([^"']+)["'][^>]*?(?:\/\s*>|>[\s\S]*?<\/ui-table>)/gi;
    let match;
    while ((match = tableRegex.exec(htmlContent)) !== null) {
      const dataId = match[1]?.trim();
      if (dataId) {
        tags.push({
          tagName: "ui-table",
          dataId,
          element: null as any, // Not used for regex-based parsing
        });
      } else {
        console.warn("[parseVisualizationTags] ui-table tag missing data-id attribute");
      }
    }

    // Match <ui-chart ...>; unified regex that captures the full tag and extracts both data-id and type
    // Strategy: Extract full tag content, then parse attributes separately to handle any attribute order
    const chartFullRegex = /<ui-chart\b([^>]*?)(?:\/\s*>|>[\s\S]*?<\/ui-chart>)/gi;
    const dataIdRegex = /(?:data-id|id)=["']([^"']+)["']/i;
    const typeRegex = /type=["']([^"']*)["']/i;

    while ((match = chartFullRegex.exec(htmlContent)) !== null) {
      const tagAttributes = match[1]; // Everything between <ui-chart and > or />
      
      // Extract data-id from attributes
      const dataIdMatch = dataIdRegex.exec(tagAttributes);
      const dataId = dataIdMatch?.[1]?.trim();

      if (!dataId) {
        console.warn("[parseVisualizationTags] ui-chart tag missing data-id attribute");
        continue;
      }

      // Extract type from attributes (optional)
      const typeMatch = typeRegex.exec(tagAttributes);
      const typeStr = typeMatch?.[1]?.trim();
      const chartType = (typeStr?.toLowerCase() || undefined) as ChartType | undefined;

      if (chartType && !isValidChartType(chartType)) {
        console.warn(
          `[parseVisualizationTags] ui-chart has invalid type: "${typeStr}". Valid types: bar, column, line, area, pie, radar, scatter, combo, bubble`
        );
      }

      tags.push({
        tagName: "ui-chart",
        dataId,
        chartType,
        element: null as any, // Not used for regex-based parsing
      });
    }
  } catch (error) {
    console.error("[parseVisualizationTags] Failed to parse tags:", error);
  }

  return tags;
}

/**
 * Validate that a chart type string is one of the supported types
 */
function isValidChartType(type: string): type is ChartType {
  const validTypes: ChartType[] = [
    "bar",
    "column",
    "line",
    "area",
    "pie",
    "radar",
    "scatter",
    "combo",
    "bubble",
  ];
  return validTypes.includes(type as ChartType);
}

/**
 * Extract and validate table datasets from the datasets map.
 * 
 * @param datasets Map of data-id to dataset spec
 * @param dataId The data-id to look up
 * @returns Validated table dataset or null if not found/invalid
 */
export interface TableDataset {
  type: "table";
  columns: string[];
  rows: (string | number | boolean | null)[][];
}

export function extractTableDataset(
  datasets: Record<string, any> | undefined,
  dataId: string
): TableDataset | null {
  if (!datasets || !dataId) {
    return null;
  }

  const dataset = datasets[dataId];
  if (!dataset) {
    console.error(`[extractTableDataset] Dataset not found: "${dataId}". Available: ${Object.keys(datasets).join(', ')}`);
    return null;
  }

  if (dataset.type !== "table") {
    console.error(
      `[extractTableDataset] Dataset "${dataId}" is not a table. Type: ${dataset.type}`
    );
    return null;
  }

  // Validate structure
  if (!Array.isArray(dataset.columns) || dataset.columns.length === 0) {
    console.error(`[extractTableDataset] Dataset "${dataId}" has invalid columns`);
    return null;
  }

  if (!Array.isArray(dataset.rows)) {
    console.error(`[extractTableDataset] Dataset "${dataId}" has invalid rows`);
    return null;
  }

  return dataset as TableDataset;
}

/**
 * Extract and validate chart datasets from the datasets map.
 * 
 * @param datasets Map of data-id to dataset spec
 * @param dataId The data-id to look up
 * @returns Validated chart dataset or null if not found/invalid
 */
export interface ChartDataset {
  type: "chart";
  chart_type: ChartType;
  title?: string;
  xAxis?: {
    categories?: string[];
    title?: { text: string };
    type?: string;
  };
  yAxis?: {
    title?: { text: string };
    min?: number;
    max?: number;
  };
  series: { name: string; data: (number | { x: number; y: number; size?: number })[] }[];
}

export function extractChartDataset(
  datasets: Record<string, any> | undefined,
  dataId: string
): ChartDataset | null {
  if (!datasets || !dataId) {
    return null;
  }

  const dataset = datasets[dataId];
  if (!dataset) {
    console.error(`[extractChartDataset] Dataset not found: "${dataId}". Available: ${Object.keys(datasets).join(', ')}`);
    return null;
  }

  if (dataset.type !== "chart") {
    console.error(
      `[extractChartDataset] Dataset "${dataId}" is not a chart. Type: ${dataset.type}`
    );
    return null;
  }

  // Validate chart_type
  if (!isValidChartType(dataset.chart_type)) {
    console.error(
      `[extractChartDataset] Dataset "${dataId}" has invalid chart_type: ${dataset.chart_type}`
    );
    return null;
  }

  // Validate series
  if (!Array.isArray(dataset.series)) {
    console.error(`[extractChartDataset] Dataset "${dataId}" has invalid series`);
    return null;
  }

  for (const series of dataset.series) {
    if (!series.name || !Array.isArray(series.data)) {
      console.error(
        `[extractChartDataset] Dataset "${dataId}" has invalid series entry:`,
        series
      );
      return null;
    }
  }

  return dataset as ChartDataset;
}

/**
 * Flatten chart series data into row objects for Recharts.
 * 
 * Transforms:
 *   Input: { xAxis: { categories: ["A", "B"] }, series: [{ name: "X", data: [1, 2] }] }
 *   Output: [{ category: "A", X: 1 }, { category: "B", X: 2 }]
 * 
 * @param dataset Chart dataset with series
 * @returns Array of row objects keyed by category + series names
 */
export function flattenChartDataForRecharts(dataset: ChartDataset): Record<string, any>[] {
  const categories = dataset.xAxis?.categories || [];

  if (categories.length === 0) {
    // Fallback: generate indices
    const maxDataLength = Math.max(...dataset.series.map((s) => s.data.length));
    const indices = Array.from({ length: maxDataLength }, (_, i) => `${i}`);
    categories.push(...indices);
  }

  const flatData = categories.map((category, idx) => {
    const row: Record<string, any> = { category };

    dataset.series.forEach((series) => {
      const value = series.data[idx];
      if (typeof value === "object" && value !== null && "y" in value) {
        // Bubble/scatter: { x, y, size }
        row[series.name] = value.y;
      } else {
        // Simple value
        row[series.name] = value !== undefined ? value : 0;
      }
    });

    return row;
  });

  return flatData;
}
