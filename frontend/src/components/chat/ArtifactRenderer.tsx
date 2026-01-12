import React from "react";
/**
 * ArtifactRenderer Component - CORRECTED VERSION
 *
 * Extends the Mono-Functional SaaS design system to artifacts:
 * - Monochrome palette with gold accent
 * - Proper color hierarchy
 * - Clean, professional styling
 *
 * Renders different artifact types:
 * - CHART: Recharts visualizations (translates from Highcharts config)
 * - TABLE: Interactive data tables
 * - REPORT: Markdown/JSON formatted reports
 * - DOCUMENT: HTML/Markdown documents
 */

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ComposedChart,
} from 'recharts';
import type {
  Artifact,
  ChartArtifact,
  ReportArtifact,
  DocumentArtifact,
  TableArtifact,
  TwinKnowledgeArtifact,
} from '../../types/api';
import DOMPurify from 'dompurify';
import { HtmlRenderer } from './renderers/HtmlRenderer';
import { MarkdownRenderer } from './renderers/MarkdownRenderer';
import { TwinKnowledgeRenderer } from './renderers/TwinKnowledgeRenderer';
import { CodeRenderer } from './renderers/CodeRenderer';
import { MediaRenderer } from './renderers/MediaRenderer';
import { FileRenderer } from './renderers/FileRenderer';
import './MessageBubble.css';
// Using internal Recharts-based ChartRenderer (NOT Highcharts)


class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ArtifactRenderer Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="panel renderer-panel artifact-error" style={{ padding: 20, color: 'var(--component-color-danger)' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600 }}>Error Rendering Artifact</h3>
          <p style={{ margin: 0, fontSize: 14 }}>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Color constants for charts
const CHART_COLORS = {
  primary: 'var(--component-text-accent)',
  secondary: 'var(--component-text-secondary)',
  gray1: 'var(--component-text-primary)',
  gray2: 'var(--component-text-secondary)',
  gray3: 'var(--component-text-muted)',
  gray4: 'var(--component-panel-border)',
  gray5: 'var(--component-bg-secondary)'
};

const COLOR_SEQUENCE = [
  'var(--component-text-accent)', '#8B5CF6', '#10B981', '#F59E0B',
  '#EF4444', '#3B82F6', '#EC4899', '#6B7280'
];


// Helper function to transform Highcharts data to Recharts format
// Helper to resolve data keys case-insensitively
function resolveDataKey(key: string | undefined, dataPoint: any): string | undefined {
  if (!key || !dataPoint) return undefined;

  // 1. Exact match
  if (Object.prototype.hasOwnProperty.call(dataPoint, key)) return key;

  // 2. Case-insensitive match
  const lowerKey = key.toLowerCase();
  const foundKey = Object.keys(dataPoint).find(k => k.toLowerCase() === lowerKey);
  if (foundKey) return foundKey;

  // 3. Partial match (if key is "Number of Projects", find "count" or "projects")
  // This is a heuristic. If the label contains the key, or vice versa.
  const partialKey = Object.keys(dataPoint).find(k => lowerKey.includes(k.toLowerCase()) || k.toLowerCase().includes(lowerKey));
  if (partialKey) return partialKey;

  // 4. Fallback for specific known patterns (based on user samples)
  if (lowerKey.includes('number') || lowerKey.includes('count')) {
    const countKey = Object.keys(dataPoint).find(k => k.toLowerCase().includes('count') || k.toLowerCase().includes('total'));
    if (countKey) return countKey;
  }

  return undefined;
}

function getNumericDataKeys(dataPoint: any, xAxisKey: string): string[] {
  if (!dataPoint) return [];
  return Object.keys(dataPoint).filter(key =>
    key !== xAxisKey &&
    typeof dataPoint[key] === 'number'
  );
}

// Helper to infer a category key (first string field) if explicit xAxis is missing
function inferCategoryKey(dataPoint: any, excludeKeys: string[] = []): string {
  if (!dataPoint) return 'name';
  const keys = Object.keys(dataPoint);
  // Find first string key that is not in excludeKeys and not 'id'
  const found = keys.find(k =>
    typeof dataPoint[k] === 'string' &&
    !excludeKeys.includes(k) &&
    k.toLowerCase() !== 'id'
  );
  return found || 'name';
}

function transformChartData(content: any, externalData?: any[]) {
  // 0. If external data (from artifact.data) is provided and looks like Recharts format (array of objects)
  // CRITICAL: Ensure it's NOT a Highcharts series array (which has objects with a 'data' array property)
  if (externalData && Array.isArray(externalData) && externalData.length > 0) {
    const isSeriesArray = externalData.some(item => item && Array.isArray(item.data));
    if (!isSeriesArray) {
      return externalData;
    }
  }

  // Use config if available, otherwise content (handle both wrapper and direct config)
  const source = content.config || content;

  // 1. Direct data array in content
  if (source.data && Array.isArray(source.data)) {
    return source.data;
  }

  // 2. Categories + Series (Highcharts style or Radar chart style)
  let categories = source.categories || source.xAxis?.categories;

  // If no categories, infer from length of first series
  if (!categories && source.series && source.series.length > 0) {
    const dataLen = (source.series[0].data || source.series[0].values)?.length || 0;
    categories = Array.from({ length: dataLen }, (_, i) => `Item ${i + 1}`);
  }

  if (source.series) {
    return categories.map((category: any, index: number) => {
      const point: any = { name: category, category: category }; // Add both for compatibility
      source.series.forEach((series: any, sIndex: number) => {
        // Radar charts use series.values, other charts use series.data
        const dataArray = series.values || series.data;
        if (dataArray && dataArray[index] !== undefined) {
          const val = dataArray[index];
          // Use series name as key to match flattenChartDataForRecharts format
          // Fall back to series_N only if name is missing
          const key = series.name || `series_${sIndex}`;
          point[key] = (typeof val === 'object' && val !== null) ? val.y : val;
        }
      });
      return point;
    });
  }

  return [];
}



// ============================================================================
// MAIN EXPORTED COMPONENT
// ============================================================================

interface ArtifactRendererProps {
  artifact: Artifact;
  language?: 'en' | 'ar';
  fullHeight?: boolean;
}

export function ArtifactRenderer({ artifact, language = 'en', fullHeight = false }: ArtifactRendererProps) {
  return (
    <ErrorBoundary>
      <ArtifactRendererContent artifact={artifact} language={language} fullHeight={fullHeight} />
    </ErrorBoundary>
  );
}

function ArtifactRendererContent({ artifact, language = 'en', fullHeight = false }: ArtifactRendererProps) {
  const [showDebug, setShowDebug] = useState(false);



  const renderContent = () => {
    const type = artifact.artifact_type.toUpperCase();
    switch (type) {
      case 'CHART':
        // Using internal Recharts-based ChartRenderer
        return <ChartRenderer artifact={artifact as ChartArtifact} height={fullHeight ? '100%' : 400} />;
      case 'TABLE':
        return <TableRenderer artifact={artifact as TableArtifact} language={language} fullHeight={fullHeight} />;
      case 'REPORT':
        return <ReportRenderer artifact={artifact as ReportArtifact} language={language} fullHeight={fullHeight} />;
      case 'DOCUMENT':
        return <DocumentRenderer artifact={artifact as DocumentArtifact} language={language} fullHeight={fullHeight} />;
      case 'TWIN_KNOWLEDGE':
        return <TwinKnowledgeRenderer artifact={artifact as TwinKnowledgeArtifact} />;
      case 'HTML':
        // Historically HtmlRenderer accepts an artifact prop. Keep behavior
        // unchanged here and let HtmlRenderer extract the appropriate HTML
        // string. This avoids coupling artifact normalization into the core
        // renderer pipeline and preserves compatibility with other callers.
        console.log('[ArtifactRenderer] Returning HtmlRenderer; content keys:', Object.keys(artifact.content || {}));
        return <HtmlRenderer artifact={artifact} />;
      case 'MARKDOWN':
        // Match MarkdownRendererProps: { content: string; title?: string }
        const markdownBody = typeof artifact.content === 'string' ? artifact.content : (artifact.content?.body || JSON.stringify(artifact.content));
        return <MarkdownRenderer content={markdownBody} title={artifact.title} />;
      case 'CODE':
        // Match MarkdownRendererProps: { content: string; title?: string }
        const codeStart = artifact.content as any;
        const codeContent = typeof codeStart === 'string' ? codeStart : (codeStart.code || codeStart.body || JSON.stringify(codeStart, null, 2));
        return <CodeRenderer code={codeContent} language={artifact.language || 'text'} title={artifact.title} />;
      case 'MEDIA': {
        const content = artifact.content as any;
        return <MediaRenderer url={content.url} type={content.type} title={artifact.title} />;
      }
      case 'FILE': {
        const content = artifact.content as any;
        return <FileRenderer
          filename={content.filename || artifact.title}
          url={content.url}
          size={content.size}
          type={content.type}
          content={content.body}
        />;
      }
      case 'JSON':
        // Assuming CodeRenderer can render JSON
        return <CodeRenderer code={JSON.stringify(artifact.content, null, 2)} language="json" title={artifact.title} />;
      default:
        return (
          <div style={{ padding: 20, color: 'var(--component-text-secondary)', textAlign: 'center' }}>
            Unsupported artifact type: {artifact.artifact_type}
          </div>
        );
    }
  };

  return (
    <div
      className="relative group"
      style={{
        height: fullHeight ? '100%' : undefined,
        display: fullHeight ? 'flex' : undefined,
        flexDirection: fullHeight ? 'column' : undefined
      }}
    >
      {/* <button 
        onClick={() => setShowDebug(!showDebug)}
        className="absolute top-0 right-0 p-1 text-xs rounded text-gray-500 z-50 debug-button"
      >
        {showDebug ? 'Hide Debug' : 'Debug'}
      </button> */}
      {showDebug && (
        <pre className="text-xs panel p-2 overflow-auto max-h-40 border-b mb-2">
          {JSON.stringify({
            artifact_type: artifact.artifact_type,
            content_keys: Object.keys(artifact.content),
            // @ts-ignore
            external_data_length: artifact.data?.length,
            // @ts-ignore
            external_data_sample: artifact.data?.[0],
            full_artifact: artifact
          }, null, 2)}
        </pre>
      )}
      {renderContent()}
    </div>
  );
}

// ============================================================================
// CHART RENDERER
// ============================================================================


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip panel" style={{
        backgroundColor: 'var(--component-background)',
        padding: '10px',
        border: '1px solid var(--component-border)',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p className="label" style={{ margin: 0, fontWeight: 600, color: 'var(--component-text-primary)' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ margin: 0, color: entry.color || entry.fill }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};
function ChartRenderer({ artifact, height = 400 }: { artifact: ChartArtifact, height?: number | string }) {

  console.log('[ChartRenderer] FULL ARTIFACT JSON:', JSON.stringify(artifact, null, 2));
  const { content } = artifact;

  // Debug: Log all possible locations where type might be
  console.log('[ChartRenderer] content.chart?.type:', content.chart?.type);
  console.log('[ChartRenderer] content.type:', (content as any).type);
  console.log('[ChartRenderer] artifact.content:', content);

  // Try to get type from various locations
  let rawType = content.chart?.type || (content as any).type;

  // If no type found, infer from content structure
  if (!rawType) {
    console.log('[ChartRenderer] No type found, inferring from content structure');

    // Check for radar chart indicators
    if ((content as any).categories && (content as any).series && (content as any).maxValue) {
      rawType = 'radar';
      console.log('[ChartRenderer] Inferred type: radar (has categories, series, maxValue)');
    }
    // Check for line chart indicators
    else if ((content as any).strokeWidth || artifact.title?.toLowerCase().includes('line')) {
      rawType = 'line';
      console.log('[ChartRenderer] Inferred type: line (has strokeWidth or title contains "line")');
    }
    // Check for bubble chart indicators
    else if (artifact.title?.toLowerCase().includes('bubble')) {
      rawType = 'bubble';
      console.log('[ChartRenderer] Inferred type: bubble (title contains "bubble")');
    }
    // Check for bullet chart indicators
    else if (artifact.title?.toLowerCase().includes('bullet')) {
      rawType = 'bullet';
      console.log('[ChartRenderer] Inferred type: bullet (title contains "bullet")');
    }
    // Check for combo chart indicators
    else if (artifact.title?.toLowerCase().includes('combo')) {
      rawType = 'combo';
      console.log('[ChartRenderer] Inferred type: combo (title contains "combo")');
    }
    // Default to column/bar for simple data
    else {
      rawType = 'column';
      console.log('[ChartRenderer] Inferred type: column (default)');
    }
  }

  const chartType = String(rawType).toLowerCase();
  console.log('[ChartRenderer] Chart type detected:', chartType);
  // @ts-ignore - artifact.data comes from visualizationBuilder with correct series names
  const externalData = artifact.data;
  // @ts-ignore - config comes from CanvasPanel
  const rawConfig = content.config;

  // PRIORITY: Use pre-flattened data from builder if available (has correct series names)
  // Only fall back to transformChartData for legacy artifacts without .data
  let data: any[];
  if (externalData && Array.isArray(externalData) && externalData.length > 0) {
    data = externalData;
    console.log('[ChartRenderer] Using pre-flattened artifact.data:', data.length, 'rows');
  } else {
    data = transformChartData(content);
    console.log('[ChartRenderer] Transformed content to data:', data.length, 'rows');
  }

  console.log('[ChartRenderer] Final data:', {
    dataLength: data?.length,
    sampleRow: data?.[0],
    keys: data?.[0] ? Object.keys(data[0]) : [],
    contentSeries: content.series?.map((s: any) => s.name)
  });

  // Handle empty data case gracefully
  if (!data || data.length === 0) {
    return (
      <div className="panel" style={{ padding: 20, textAlign: 'center', color: 'var(--component-text-secondary)', border: '1px dashed var(--component-panel-border)' }}>
        <p style={{ margin: 0, fontWeight: 500 }}>No chart data available</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.7 }}>The chart configuration was received but contains no data points.</p>
      </div>
    );
  }

  // Special handling for Bubble chart data mapping
  if ((chartType as string) === 'bubble' && rawConfig?.data) {
    data = rawConfig.data.map((item: any) => ({
      ...item,
      z: item.z || item.r || item.value || 1 // Ensure z-axis exists
    }));
  }

  // Special handling for Bullet chart data construction
  if ((chartType as string) === 'bullet' && rawConfig) {
    // Bullet chart simulation:
    // We need a single data point with ranges, value, and target
    const { value, target, ranges } = rawConfig;
    if (value !== undefined) {
      const dataPoint: any = { name: 'Current' };

      // Add ranges as stacked bars
      // Recharts stacks values, so we need deltas if ranges are cumulative maxes
      // Assuming ranges are sorted by max
      let prevMax = 0;
      (ranges || []).forEach((r: any, i: number) => {
        dataPoint[`range${i}`] = r.max - prevMax;
        dataPoint[`range${i}Color`] = r.color;
        prevMax = r.max;
      });

      dataPoint.value = value;
      dataPoint.target = target;
      data = [dataPoint];
    }
  }

  const commonProps = {
    margin: { top: 10, right: 30, left: 0, bottom: 0 },
    style: { fontSize: '12px' }
  };

  console.log('[ChartRenderer] Mounting for artifact:', artifact.id, 'Data Length:', data?.length);

  // Calculate explicit dimensions to avoid ResponsiveContainer measurement issues
  const containerHeight = typeof height === 'number' ? height - 40 : '100%'; // Subtract padding

  return (
    <div style={{ width: '100%', height: height, minHeight: 'unset', padding: 20 }}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ResponsiveContainer width="100%" height={containerHeight}>
          {(() => {
            if (!data || data.length === 0) {
              return (
                <div>
                  No data available for chart
                </div>
              );
            }
            console.log('[ChartRenderer] Rendering chart type:', chartType);

            if (chartType === 'bar' || chartType === 'column') {
              const xAxisObj = content.xAxis;
              const yAxisObj = content.yAxis;
              const xAxisLabel = typeof xAxisObj === 'string' ? xAxisObj : xAxisObj?.title?.text;
              const yAxisLabel = typeof yAxisObj === 'string' ? yAxisObj : yAxisObj?.title?.text;
              const barColor = content.color || CHART_COLORS.primary;
              // If xAxis is a string, it might be the key. If object, fallback to inference.
              const actualXAxisKey = resolveDataKey(typeof xAxisObj === 'string' ? xAxisObj : undefined, data?.[0]) || inferCategoryKey(data?.[0]);
              const dataKeys = getNumericDataKeys(data?.[0], actualXAxisKey);
              return (
                <BarChart data={data} {...commonProps} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="33" stroke={CHART_COLORS.gray4} vertical={false} />
                  <XAxis dataKey={actualXAxisKey} stroke={CHART_COLORS.gray2} fontSize={12} tickLine={false} axisLine={{ stroke: CHART_COLORS.gray4 }} label={{ value: xAxisLabel, position: 'insideBottom', offset: -10, fill: CHART_COLORS.gray2, fontSize: 12 }} />
                  <YAxis stroke={CHART_COLORS.gray2} fontSize={12} tickLine={false} axisLine={{ stroke: CHART_COLORS.gray4 }} label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 10, fill: CHART_COLORS.gray2, fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: CHART_COLORS.gray2, paddingTop: '10px' }} />
                  {content.series ? (
                    content.series.map((series: any, i: number) => (
                      <Bar
                        key={series.name || i}
                        dataKey={series.name || `series_${i}`}
                        name={series.name || `Series ${i + 1}`}
                        fill={series.color || COLOR_SEQUENCE[i % COLOR_SEQUENCE.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))
                  ) : (
                    dataKeys.map((key, index) => (
                      <Bar key={key} dataKey={key} fill={barColor} radius={[4, 4, 0, 0]} />
                    ))
                  )}
                </BarChart>
              );
            } else if (chartType === 'line') {
              const xAxisObj = content.xAxis;
              const yAxisObj = content.yAxis;
              const xAxisLabel = typeof xAxisObj === 'string' ? xAxisObj : xAxisObj?.title?.text;
              const yAxisLabel = typeof yAxisObj === 'string' ? yAxisObj : yAxisObj?.title?.text;
              const strokeWidth = content.strokeWidth || 2;
              // Try to resolve explicit key, or infer one
              const actualXAxisKey = resolveDataKey(typeof xAxisObj === 'string' ? xAxisObj : undefined, data?.[0]) || inferCategoryKey(data?.[0]);
              const dataKeys = getNumericDataKeys(data?.[0], actualXAxisKey);
              return (
                <LineChart data={data} {...commonProps} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gray4} vertical={false} />
                  <XAxis dataKey={actualXAxisKey} stroke={CHART_COLORS.gray2} fontSize={12} tickLine={false} axisLine={{ stroke: CHART_COLORS.gray4 }} label={{ value: xAxisLabel, position: 'insideBottom', offset: -10, fill: CHART_COLORS.gray2, fontSize: 12 }} />
                  <YAxis stroke={CHART_COLORS.gray2} fontSize={12} tickLine={false} axisLine={{ stroke: CHART_COLORS.gray4 }} label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 10, fill: CHART_COLORS.gray2, fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: CHART_COLORS.gray2, paddingTop: '10px' }} />
                  {content.series ? (
                    content.series.map((series: any, i: number) => (
                      <Line
                        key={series.name || i}
                        type="monotone"
                        dataKey={series.name || `series_${i}`}
                        name={series.name || `Series ${i + 1}`}
                        stroke={series.color || COLOR_SEQUENCE[i % COLOR_SEQUENCE.length]}
                        strokeWidth={strokeWidth}
                      />
                    ))
                  ) : (
                    dataKeys.map((key, index) => (
                      <Line key={key} type="monotone" dataKey={key} stroke={CHART_COLORS.primary} strokeWidth={strokeWidth} />
                    ))
                  )}
                </LineChart>
              );
            } else if (chartType === 'area') {
              const xAxisObj = content.xAxis;
              const yAxisObj = content.yAxis;
              const xAxisLabel = typeof xAxisObj === 'string' ? xAxisObj : xAxisObj?.title?.text;
              const yAxisLabel = typeof yAxisObj === 'string' ? yAxisObj : yAxisObj?.title?.text;
              // Try to resolve explicit key, or infer one
              const actualXAxisKey = resolveDataKey(typeof xAxisObj === 'string' ? xAxisObj : undefined, data?.[0]) || inferCategoryKey(data?.[0]);
              const dataKeys = getNumericDataKeys(data?.[0], actualXAxisKey);
              return (
                <AreaChart data={data} {...commonProps} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gray4} vertical={false} />
                  <XAxis dataKey={actualXAxisKey} stroke={CHART_COLORS.gray2} fontSize={12} tickLine={false} axisLine={{ stroke: CHART_COLORS.gray4 }} label={{ value: xAxisLabel, position: 'insideBottom', offset: -10, fill: CHART_COLORS.gray2, fontSize: 12 }} />
                  <YAxis stroke={CHART_COLORS.gray2} fontSize={12} tickLine={false} axisLine={{ stroke: CHART_COLORS.gray4 }} label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 10, fill: CHART_COLORS.gray2, fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: CHART_COLORS.gray2, paddingTop: '10px' }} />
                  {content.series ? (
                    content.series.map((series: any, i: number) => (
                      <Area
                        key={series.name || i}
                        type="monotone"
                        dataKey={series.name || `series_${i}`}
                        name={series.name || `Series ${i + 1}`}
                        fill={series.color || COLOR_SEQUENCE[i % COLOR_SEQUENCE.length]}
                        stroke={series.color || COLOR_SEQUENCE[i % COLOR_SEQUENCE.length]}
                      />
                    ))
                  ) : (
                    dataKeys.map((key, index) => (
                      <Area key={key} type="monotone" dataKey={key} fill={CHART_COLORS.primary} stroke={CHART_COLORS.primary} />
                    ))
                  )}
                </AreaChart>
              );
            } else if (chartType === 'bubble') {
              const xObj = content.xAxis;
              const yObj = content.yAxis;
              const zObj = content.sizeMetric;
              // Extract label strings
              const xLabel = typeof xObj === 'string' ? xObj : xObj?.title?.text;
              const yLabel = typeof yObj === 'string' ? yObj : yObj?.title?.text;
              const zLabel = typeof zObj === 'string' ? zObj : zObj?.title?.text;

              const xKey = resolveDataKey(typeof xObj === 'string' ? xObj : undefined, data?.[0]) || 'x';
              const yKey = resolveDataKey(typeof yObj === 'string' ? yObj : undefined, data?.[0]) || 'y';
              const zKey = resolveDataKey(typeof zObj === 'string' ? zObj : undefined, data?.[0]) || 'z';
              return (
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gray4} />
                  <XAxis type="number" dataKey={xKey} name={xLabel} stroke={CHART_COLORS.gray2} fontSize={12} label={{ value: xLabel, position: 'insideBottom', offset: -10, fill: CHART_COLORS.gray2, fontSize: 12 }} />
                  <YAxis type="number" dataKey={yKey} name={yLabel} stroke={CHART_COLORS.gray2} fontSize={12} label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 10, fill: CHART_COLORS.gray2, fontSize: 12 }} />
                  <ZAxis type="number" dataKey={zKey} range={[100, 1000]} name={zLabel} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Scatter name={typeof content.title === 'string' ? content.title : content.title?.text || 'Items'} data={data} fill={CHART_COLORS.primary} />
                </ScatterChart>
              );
            } else if (chartType === 'radar') {
              const xAxisObj = content.xAxis;
              const angleKey = resolveDataKey(typeof xAxisObj === 'string' ? xAxisObj : undefined, data?.[0]) || 'subject';

              const primMetric = content.primary?.metric;
              const valueKey = resolveDataKey(typeof primMetric === 'string' ? primMetric : primMetric?.title?.text, data?.[0]) || 'A';

              const titleText = typeof content.title === 'string' ? content.title : content.title?.text;

              return (
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                  <PolarGrid stroke={CHART_COLORS.gray4} />
                  {/* @ts-ignore */}
                  <PolarAngleAxis dataKey={angleKey} stroke={CHART_COLORS.gray2} fontSize={12} />
                  {/* @ts-ignore */}
                  <PolarRadiusAxis angle={30} domain={[0, content.maxValue || 'auto']} stroke={CHART_COLORS.gray4} />
                  {content.series ? (
                    content.series.map((series: any, i: number) => (
                      <Radar
                        key={series.name || i}
                        name={series.name || `Series ${i + 1}`}
                        dataKey={series.name || `series_${i}`}
                        stroke={COLOR_SEQUENCE[i % COLOR_SEQUENCE.length]}
                        fill={COLOR_SEQUENCE[i % COLOR_SEQUENCE.length]}
                        fillOpacity={0.3}
                      />
                    ))
                  ) : (
                    <Radar name={titleText || 'Value'} dataKey={valueKey} stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.3} />
                  )}
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Tooltip />
                </RadarChart>
              );
            } else if (chartType === 'bullet') {
              const measureLabelObj = (content as any).measure;
              const targetLabelObj = (content as any).target;

              const measureLabel = typeof measureLabelObj === 'string' ? measureLabelObj : measureLabelObj?.title?.text;
              const targetLabel = typeof targetLabelObj === 'string' ? targetLabelObj : targetLabelObj?.title?.text;

              const measureKey = resolveDataKey(measureLabel, data?.[0]) || 'actual';
              const targetKey = resolveDataKey(targetLabel, data?.[0]) || 'target';

              const xAxisObj = content.xAxis;

              // Use xAxis from content for the category name, or fallback to inferring it
              // Exclude the measure and target keys from inference
              const nameKey = resolveDataKey(typeof xAxisObj === 'string' ? xAxisObj : undefined, data?.[0]) || inferCategoryKey(data?.[0], [measureKey, targetKey]);
              return (
                <ComposedChart layout="vertical" data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gray4} horizontal={false} />
                  <XAxis type="number" stroke={CHART_COLORS.gray2} fontSize={12} />
                  <YAxis type="category" dataKey={nameKey} stroke={CHART_COLORS.gray2} fontSize={12} width={150} />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey={measureKey} name={measureLabel} fill={CHART_COLORS.primary} barSize={20} />
                  <Bar dataKey={targetKey} name={targetLabel} fill={CHART_COLORS.gray1} barSize={4} />
                </ComposedChart>
              );
            } else if (chartType === 'combo') {
              const primaryMetricObj = (content as any).primary?.metric;
              const secondaryMetricObj = (content as any).secondary?.metric;

              const primaryMetric = typeof primaryMetricObj === 'string' ? primaryMetricObj : primaryMetricObj?.title?.text;
              const secondaryMetric = typeof secondaryMetricObj === 'string' ? secondaryMetricObj : secondaryMetricObj?.title?.text;

              const barKey = resolveDataKey(primaryMetric, data?.[0]);
              const lineKey = resolveDataKey(secondaryMetric, data?.[0]);

              const xAxisObj = content.xAxis;

              // Fix: Use content.xAxis to resolve the key, instead of hardcoded 'project'
              const xAxisKey = resolveDataKey(typeof xAxisObj === 'string' ? xAxisObj : undefined, data?.[0]) || 'name';
              return (
                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gray4} />
                  <XAxis dataKey={xAxisKey} stroke={CHART_COLORS.gray2} fontSize={12} />
                  <YAxis yAxisId="left" stroke={CHART_COLORS.gray2} fontSize={12} label={{ value: primaryMetric, angle: -90, position: 'insideLeft', offset: 10, fill: CHART_COLORS.gray2, fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.gray2} fontSize={12} label={{ value: secondaryMetric, angle: 90, position: 'insideRight', offset: 10, fill: CHART_COLORS.gray2, fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  {barKey && <Bar yAxisId="left" dataKey={barKey} name={primaryMetric} fill={CHART_COLORS.primary} />}
                  {lineKey && <Line yAxisId="right" type="monotone" dataKey={lineKey} name={secondaryMetric} stroke={CHART_COLORS.secondary} strokeWidth={2} />}
                </ComposedChart>
              );
            }
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--component-text-secondary)' }}>
                Unsupported chart type: {chartType}
              </div>
            );
          })()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
function TableRenderer({ artifact, language, fullHeight }: { artifact: TableArtifact; language: 'en' | 'ar'; fullHeight?: boolean | number }) {
  const { content } = artifact;
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Handle different data structures that might come from streaming
  const normalizedData = useMemo(() => {
    // Priority: 1. artifact.data (external flat data), 2. content.data, 3. content itself
    const data = artifact.data || content.data || content;
    const columns = Array.isArray(content.columns) ? content.columns :
      Array.isArray(data.columns) ? data.columns :
        data.config?.columns ? data.config.columns : [];
    let rows: any[] = [];
    if (Array.isArray(data)) {
      if (data.length > 0) {
        if (columns.length === 0 && typeof data[0] === 'object') columns.push(...Object.keys(data[0]));
        rows = data.map((row: any) => {
          if (Array.isArray(row)) return row;
          if (columns.length > 0) {
            return columns.map((col: string) => {
              const key = resolveDataKey(col, row);
              return key ? row[key] : "";
            });
          }
          return Object.values(row);
        });
      }
    } else if (Array.isArray(data.rows)) {
      if (data.rows.length > 0 && Array.isArray(data.rows[0])) {
        rows = data.rows;
      } else if (data.rows.length > 0 && typeof data.rows[0] === "object") {
        const firstRow = data.rows[0];
        const keys = Object.keys(firstRow);
        rows = data.rows.map((row: any) => keys.map(key => row[key]));
      }
    } else if (Array.isArray(data.query_results)) {
      const results = data.query_results;
      if (results.length > 0) {
        const keys = Object.keys(results[0]);
        if (columns.length === 0) columns.push(...keys);
        rows = results.map((row: any) => keys.map(key => row[key]));
      }
    }
    return { columns, rows };
  }, [content, artifact.data]);


  const normalizedColumns = normalizedData.columns.map(col =>
    typeof col === 'string' ? col : (col.headerName || col.field || String(col))
  );

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };

  let displayRows = [...normalizedData.rows];
  if (sortColumn !== null) {
    displayRows.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }

  return (
    <div className="w-full overflow-auto rounded-lg markdown-content" style={{ maxHeight: fullHeight ? "100%" : "600px" }}>
      {normalizedColumns.length === 0 || displayRows.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No data available
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', backgroundColor: "var(--component-panel-bg)", zIndex: 10, position: "relative" }}>
          <thead>
            <tr>
              {normalizedColumns.map((column, index) => (
                <th
                  key={index}
                  onClick={() => handleSort(index)}
                  style={{
                    cursor: "pointer",
                    padding: '8px 12px',
                    border: '1px solid var(--component-panel-border)',
                    textAlign: 'left',
                    backgroundColor: 'var(--component-bg-secondary)',
                    fontWeight: 600,
                    color: 'var(--component-text-primary)'
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{column}</span>
                    {sortColumn === index && (
                      <span style={{ fontSize: 12 }}>
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ backgroundColor: rowIndex % 2 === 0 ? 'var(--component-panel-bg)' : 'var(--component-bg-secondary)' }}
              >
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{
                    padding: '8px 12px',
                    border: '1px solid var(--component-panel-border)',
                    textAlign: 'left',
                    color: 'var(--component-text-primary)',
                  }}>
                    {typeof cell === "number" ? cell.toLocaleString() : String(cell || "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ============================================================================
// REPORT RENDERER
// ============================================================================

function ReportRenderer({ artifact, language, fullHeight }: { artifact: ReportArtifact; language: 'en' | 'ar'; fullHeight?: boolean | number }) {
  const { content } = artifact;
  const isRTL = language === 'ar';

  // Detect format: HTML format should use HtmlRenderer for visualization hydration support
  const isHtml = content.format === 'html' ||
    (typeof content.body === 'string' && (content.body.trim().startsWith('<') || content.body.includes('<ui-')));
  const isMarkdown = content.format === 'markdown';

  // HTML format: Use HtmlRenderer to support embedded <ui-chart> and <ui-table> tags
  if (isHtml) {
    return (
      <div className="w-full overflow-auto" style={{ maxHeight: fullHeight ? "100%" : undefined, direction: isRTL ? 'rtl' : 'ltr' }}>
        <HtmlRenderer artifact={artifact} />
      </div>
    );
  }

  // Markdown format: Parse and render as HTML
  if (isMarkdown || typeof content.body === 'string') {
    return (
      <div className="w-full overflow-auto " style={{ border: "1px solid var(--component-border)", padding: 8, maxHeight: fullHeight ? "100%" : "400px" }}>
        <div
          className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-primary prose-strong:text-text-primary prose-li:text-text-primary prose-a:text-interactive-primary-default"
          dir={isRTL ? 'rtl' : 'ltr'}
          dangerouslySetInnerHTML={{ __html: parseMarkdown(content.body) }}
        />
      </div>
    );
  }

  // Fallback: JSON dump
  return (
    <div className="w-full overflow-auto " style={{ border: "1px solid var(--component-border)", padding: 8, maxHeight: fullHeight ? "100%" : "400px" }}>
      <pre className="whitespace-pre-wrap text-sm text-text-primary bg-canvas-page p-4 overflow-auto border border-border-default">
        {JSON.stringify(content.body, null, 2)}
      </pre>
    </div>
  );
}

// ============================================================================
// DOCUMENT RENDERER
// ============================================================================

function DocumentRenderer({ artifact, language, fullHeight }: { artifact: DocumentArtifact; language: 'en' | 'ar'; fullHeight?: boolean | number }) {
  const { content } = artifact;
  const isRTL = language === 'ar';

  // Render embedded HTML content (body)
  if (content.body) {
    if (content.format === 'html') {
      const sanitizedHtml = DOMPurify.sanitize(content.body);
      return (
        <div className="w-full overflow-auto" style={{
          fontSize: '14px',
          lineHeight: '1.6',
          color: 'var(--component-text-primary)',
          direction: isRTL ? 'rtl' : 'ltr'
        }}>
          <div
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            style={{
              width: '100%',
              padding: '0'
            }}
          />
        </div>
      );
    }

    // Render as markdown (default)
    return (
      <div className="w-full overflow-auto " style={{ border: "1px solid var(--component-border)", padding: 8, maxHeight: fullHeight ? "100%" : "400px" }}>
        <div
          className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-primary prose-strong:text-text-primary prose-li:text-text-primary prose-a:text-interactive-primary-default"
          dir={isRTL ? 'rtl' : 'ltr'}
          dangerouslySetInnerHTML={{ __html: parseMarkdown(content.body) }}
        />
      </div>
    );
  }

  // No content available
  return (
    <div className="w-full overflow-auto " style={{ border: "1px solid var(--component-border)", padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--component-text-secondary)', fontSize: '14px' }}>
        No content available
      </div>
    </div>
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Simple markdown parser
 * In production, use a library like react-markdown
 */
function parseMarkdown(markdown: string): string {
  if (!markdown) return '';

  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap in paragraphs, but avoid wrapping block-level elements (h1-6, ul, ol, pre, blockquote)
  html = html.replace(/<p>\s*(<(?:(?:h[1-6])|ul|ol|pre|blockquote)[\s\S]*?>)/g, '$1');
  html = html.replace(/(<\/(?:(?:h[1-6])|ul|ol|pre|blockquote)>)[\s\S]*?<\/p>/g, '$1');

  // Wrap list items (make sure to wrap all occurrences)
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');

  return html;
}
