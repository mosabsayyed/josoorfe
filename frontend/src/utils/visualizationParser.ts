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

    // ALSO parse <div class="visualization-placeholder"> format from LLM responses
    // This handles responses like: <div class="visualization-placeholder visualization-chart" data-id="..." data-chart-type="...">
    const divPlaceholderRegex = /<div\s+class="([^"]*visualization-placeholder[^"]*)"\s*([^>]*?)(?:>[\s\S]*?<\/div>|\/\s*>)/gi;
    while ((match = divPlaceholderRegex.exec(htmlContent)) !== null) {
      const classStr = match[1]; // e.g., "visualization-placeholder visualization-chart"
      const attributesStr = match[2]; // e.g., 'data-id="..." data-chart-type="..."'
      
      // Determine if it's a chart or table from the class
      const isChart = /visualization-chart|visualization-bar|visualization-line|visualization-pie/.test(classStr);
      const isTable = /visualization-table/.test(classStr);
      
      if (!isChart && !isTable) {
        continue; // Not a recognized visualization type
      }

      // Extract data-id and data-chart-type from attributes
      const fullAttrStr = classStr + ' ' + attributesStr;
      const dataIdMatch = /(?:data-id|id)=["']([^"']+)["']/.exec(fullAttrStr);
      const dataId = dataIdMatch?.[1]?.trim();

      if (!dataId) {
        console.warn("[parseVisualizationTags] visualization-placeholder div missing data-id");
        continue;
      }

      if (isChart) {
        // Extract chart type from data-chart-type attribute
        const chartTypeMatch = /data-chart-type=["']([^"']+)["']/.exec(fullAttrStr);
        const typeStr = chartTypeMatch?.[1]?.trim()?.toLowerCase();
        const chartType = (typeStr || undefined) as ChartType | undefined;

        if (chartType && !isValidChartType(chartType)) {
          console.warn(
            `[parseVisualizationTags] visualization-chart has invalid type: "${typeStr}". Valid types: bar, column, line, area, pie, radar, scatter, combo, bubble`
          );
        }

        tags.push({
          tagName: "ui-chart",
          dataId,
          chartType,
          element: null as any,
        });
      } else if (isTable) {
        tags.push({
          tagName: "ui-table",
          dataId,
          element: null as any,
        });
      }
    }
  } catch (error) {
    console.error("[parseVisualizationTags] Failed to parse tags:", error);
  }

  console.log('[parseVisualizationTags] Parsed', tags.length, 'total tags (ui-chart/ui-table + div.visualization-placeholder)');
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
 * Normalize chart types to valid types
 * Maps unsupported types to closest supported equivalents
 */
function normalizeChartType(type: any): ChartType {
  if (!type || typeof type !== 'string') {
    return 'column'; // default fallback
  }

  const typeStr = type.toLowerCase().trim();

  // Direct matches
  if (isValidChartType(typeStr)) {
    return typeStr as ChartType;
  }

  // Type mappings for common LLM outputs
  const typeMap: Record<string, ChartType> = {
    'bullet': 'bar',           // Bullet charts → bar
    'horizontal': 'bar',       // Horizontal bar → bar
    'bar_horizontal': 'bar',
    'progress': 'bar',         // Progress bars → bar
    'gauge': 'pie',            // Gauges → pie
    'sankey': 'column',        // Sankey → column
    'flow': 'column',          // Flow → column
    'heatmap': 'scatter',      // Heatmap → scatter
    'tree': 'column',          // Tree → column
    'treemap': 'column',       // Treemap → column
    'sunburst': 'pie',         // Sunburst → pie
    'waterfall': 'column',     // Waterfall → column
    'funnel': 'column',        // Funnel → column
  };

  if (typeMap[typeStr]) {
    console.warn(
      `[normalizeChartType] Mapping unsupported type "${typeStr}" to "${typeMap[typeStr]}"`
    );
    return typeMap[typeStr];
  }

  // Fallback to column
  console.warn(
    `[normalizeChartType] Unknown chart type "${typeStr}", falling back to "column"`
  );
  return 'column';
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
  // Legacy flat format
  type?: "chart";
  chart_type?: ChartType;

  // Highcharts format (chart.type is preferred)
  chart?: {
    type: string;
    [key: string]: any;
  };

  title?: string;
  xAxis?: {
    categories?: string[];
    title?: { text: string };
    type?: string;
    min?: number;
    max?: number;
  };
  yAxis?: {
    title?: { text: string };
    min?: number;
    max?: number;
  };
  series: {
    name: string;
    data: (number | { x: number; y: number; size?: number; name?: string })[];
    color?: string;
  }[];

  // Allow additional Highcharts properties
  [key: string]: any;
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

  // BUGFIX: Accept datasets with:
  // 1. Highcharts format: dataset.chart.type (nested)
  // 2. Flat format: dataset.type = chart type (column, bar, etc.)
  // 3. Legacy format: dataset.type = "chart" with separate chart_type field
  const highchartsType = dataset.chart?.type?.toLowerCase();
  const flatType = dataset.type?.toLowerCase();
  const isChartType = ['bar', 'column', 'line', 'area', 'pie', 'radar', 'scatter', 'combo', 'bubble'].includes(highchartsType || flatType || '');

  if (!highchartsType && flatType !== "chart" && !isChartType) {
    console.error(
      `[extractChartDataset] Dataset "${dataId}" is not a chart. Type: ${dataset.type}, chart.type: ${dataset.chart?.type}`
    );
    return null;
  }

  // Determine chart type: prioritize Highcharts format (chart.type), fallback to flat type
  const chartTypeToUse = highchartsType || (isChartType ? flatType : dataset.chart_type);
  const normalizedChartType = normalizeChartType(chartTypeToUse);
  
  // BUGFIX: Handle datasets with either 'series' array OR 'data' field
  let seriesArray = dataset.series;

  // If no series but has data field, convert to series format
  if (!seriesArray && dataset.data) {
    seriesArray = [{
      name: dataset.title || dataId,
      data: Array.isArray(dataset.data) ? dataset.data : []
    }];
  }

  // CRITICAL: Preserve Highcharts structure (chart, xAxis, yAxis, series)
  // Only normalize legacy flat format datasets
  const normalizedDataset = highchartsType
    ? {
        // Highcharts format - preserve original structure
        ...dataset,
        series: seriesArray || dataset.series // Ensure series exists
      }
    : {
        // Legacy flat format - normalize
        ...dataset,
        type: "chart",
        chart_type: normalizedChartType,
        series: seriesArray
      };

  // Validate series
  if (!Array.isArray(normalizedDataset.series)) {
    console.error(`[extractChartDataset] Dataset "${dataId}" has no valid series or data`);
    return null;
  }

  for (const series of normalizedDataset.series) {
    if (!series.name || !Array.isArray(series.data)) {
      console.error(
        `[extractChartDataset] Dataset "${dataId}" has invalid series entry:`,
        series
      );
      return null;
    }
  }

  return normalizedDataset as ChartDataset;
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
      
      if (value === null || value === undefined) {
        row[series.name] = 0;
      } else if (typeof value === "object") {
        // Object with multiple fields - need to extract ALL numeric fields
        if ("y" in value) {
          // Bubble/scatter format: { x, y, size }
          row[series.name] = value.y;
        } else {
          // LLM sends objects like { pillar: "X", target: 85, actual: 72, variance: -13 }
          // Extract ALL numeric fields into separate columns
          Object.entries(value).forEach(([key, val]) => {
            if (typeof val === "number") {
              row[key] = val;
            } else if (typeof val === "string" && key !== "name") {
              // Use string value for category if not already set
              if (!row.category || row.category === idx.toString()) {
                row.category = val;
              }
            }
          });
        }
      } else {
        // Simple number value
        row[series.name] = value;
      }
    });

    return row;
  });

  return flatData;
}
