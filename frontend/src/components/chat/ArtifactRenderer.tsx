import React from "react";
/**
 * ArtifactRenderer Component - UNIFIED HIGHCHARTS VERSION
 *
 * Extends the Mono-Functional SaaS design system to artifacts:
 * - Monochrome palette with gold accent
 * - Proper color hierarchy
 * - Clean, professional styling
 *
 * Renders different artifact types:
 * - CHART: Highcharts visualizations (unified with Strategy Reports)
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
import { StrategyReportChartRenderer } from '../desks/sector/StrategyReportChartRenderer';
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
import '../desks/sector/SectorReport.css';
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

// Helper functions for data key resolution
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



// ============================================================================
// MAIN EXPORTED COMPONENT
// ============================================================================

interface ArtifactRendererProps {
  artifact: Artifact;
  language?: 'en' | 'ar';
  fullHeight?: boolean;
  embeddedArtifacts?: Record<string, Artifact>;
}

export function ArtifactRenderer({ artifact, language = 'en', fullHeight = false, embeddedArtifacts }: ArtifactRendererProps) {
  return (
    <ErrorBoundary>
      <ArtifactRendererContent
        artifact={artifact}
        language={language}
        fullHeight={fullHeight}
        embeddedArtifacts={embeddedArtifacts}
      />
    </ErrorBoundary>
  );
}

function ArtifactRendererContent({ artifact, language = 'en', fullHeight = false, embeddedArtifacts }: ArtifactRendererProps) {
  const [showDebug, setShowDebug] = useState(false);



  const renderContent = () => {
    const type = artifact.artifact_type.toUpperCase();
    switch (type) {
      case 'CHART':
        // Using unified Highcharts renderer (same as Strategy Reports)
        return <StrategyReportChartRenderer artifact={artifact as ChartArtifact} width="100%" height={fullHeight ? '100%' : '400px'} />;
      case 'TABLE':
        return <TableRenderer artifact={artifact as TableArtifact} language={language} fullHeight={fullHeight} />;
      case 'REPORT':
        return <ReportRenderer artifact={artifact as ReportArtifact} language={language} fullHeight={fullHeight} embeddedArtifacts={embeddedArtifacts} />;
      case 'DOCUMENT':
        return <DocumentRenderer artifact={artifact as DocumentArtifact} language={language} fullHeight={fullHeight} embeddedArtifacts={embeddedArtifacts} />;
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
// TABLE RENDERER
// ============================================================================

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
    <div className="w-full overflow-auto rounded-lg josoor-report-content" style={{ maxHeight: typeof fullHeight === 'number' ? `${fullHeight}px` : (fullHeight ? "100%" : "600px") }}>
      {normalizedColumns.length === 0 || displayRows.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No data available
        </div>
      ) : (
        <table className="josoor-table">
          <thead>
            <tr>
              {normalizedColumns.map((column, index) => (
                <th
                  key={index}
                  onClick={() => handleSort(index)}
                  className="cursor-pointer"
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
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>
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

function ReportRenderer({ artifact, language, fullHeight, embeddedArtifacts }: { artifact: ReportArtifact; language: 'en' | 'ar'; fullHeight?: boolean | number; embeddedArtifacts?: Record<string, Artifact> }) {
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
        <HtmlRenderer artifact={artifact} embeddedArtifacts={embeddedArtifacts} />
      </div>
    );
  }

  // Markdown format: Parse and render as HTML
  const body = typeof content === 'string' ? content : (content.body || '');
  if (isMarkdown || body) {
    return (
      <div className="w-full overflow-auto josoor-report-content" style={{ border: "1px solid var(--component-panel-border)", padding: '1rem', maxHeight: fullHeight ? "100%" : "600px" }}>
        <div dir={isRTL ? 'rtl' : 'ltr'}>
          <MarkdownRenderer content={body} embeddedArtifacts={embeddedArtifacts} />
        </div>
      </div>
    );
  }

  // Fallback: JSON dump
  return (
    <div className="w-full overflow-auto josoor-report-content" style={{ border: "1px solid var(--component-panel-border)", padding: '1rem', maxHeight: fullHeight ? "100%" : "600px" }}>
      <pre className="whitespace-pre-wrap text-sm text-text-primary bg-canvas-page p-4 overflow-auto border border-border-default">
        {JSON.stringify(content.body, null, 2)}
      </pre>
    </div>
  );
}

// ============================================================================
// DOCUMENT RENDERER
// ============================================================================

function DocumentRenderer({ artifact, language, fullHeight, embeddedArtifacts }: { artifact: DocumentArtifact; language: 'en' | 'ar'; fullHeight?: boolean | number; embeddedArtifacts?: Record<string, Artifact> }) {
  const { content } = artifact;
  const isRTL = language === 'ar';

  // Render embedded HTML content (body)
  if (content.body) {
    if (content.format === 'html') {
      return (
        <div className="w-full overflow-auto" style={{ maxHeight: fullHeight ? "100%" : "600px", direction: isRTL ? 'rtl' : 'ltr' }}>
          <HtmlRenderer artifact={artifact} embeddedArtifacts={embeddedArtifacts} />
        </div>
      );
    }

    // Render as markdown (default)
    const body = typeof content === 'string' ? content : (content.body || '');
    return (
      <div className="w-full overflow-auto josoor-report-content" style={{ border: "1px solid var(--component-panel-border)", padding: '1rem', maxHeight: fullHeight ? "100%" : "600px" }}>
        <div dir={isRTL ? 'rtl' : 'ltr'}>
          <MarkdownRenderer content={body} embeddedArtifacts={embeddedArtifacts} />
        </div>
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
    // normal
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
