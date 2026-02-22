import React, { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { StrategyReportChartRenderer } from '../../desks/sector/StrategyReportChartRenderer';
import type { Artifact } from '../../../types/api';
import '../../desks/sector/SectorReport.css';

interface HtmlRendererProps {
  html?: string | any;
  artifact?: any;
  title?: string;
  embeddedArtifacts?: Record<string, Artifact>;
}

/**
 * HtmlRenderer — renders HTML content with inline chart/table rendering.
 *
 * Uses the same proven approach as StrategyReportModal:
 * Split HTML by <ui-chart>/<ui-table> regex, render charts inline as React components.
 */
export function HtmlRenderer({ html, artifact, title, embeddedArtifacts: propArtifacts }: HtmlRendererProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState<string>('');

  // Build artifact lookup map from all available sources
  const artifactMap = useMemo(() => {
    const map: Record<string, Artifact> = {};

    // From prop
    if (propArtifacts) {
      Object.entries(propArtifacts).forEach(([k, v]) => { map[k] = v; });
    }

    // From artifact.content.embedded_artifacts
    if (artifact?.content?.embedded_artifacts) {
      Object.entries(artifact.content.embedded_artifacts).forEach(([k, v]) => {
        map[k] = v as Artifact;
      });
    }

    // From html object (legacy)
    if (html && typeof html === 'object') {
      const ea = html.content?.embedded_artifacts || html.embedded_artifacts;
      if (ea) {
        Object.entries(ea).forEach(([k, v]) => { map[k] = v as Artifact; });
      }
    }

    console.log('[HtmlRenderer] artifactMap keys:', Object.keys(map));
    return map;
  }, [propArtifacts, artifact, html]);

  useEffect(() => {
    let candidate: string = '';
    try {
      if (typeof html === 'string' && html.trim()) {
        candidate = html;
      } else if (html && typeof html === 'object') {
        const art = html;
        candidate = String(art.content?.body || art.content?.html || art.content?.config?.html_content || art.resolved_html || art.content || '');
      } else if (artifact && typeof artifact === 'object') {
        const art = artifact;
        candidate = String(art.content?.body || art.content?.html || art.content?.config?.html_content || art.resolved_html || art.content || '');
      }
    } catch (_) {
      candidate = '';
    }

    if (!candidate) {
      setSanitizedHtml('');
      return;
    }

    // Unescape common HTML-escaped sequences
    candidate = candidate.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

    // Extract body from full HTML documents
    if (/^\s*<!doctype/i.test(candidate) || /<html[\s\S]*>/i.test(candidate)) {
      try {
        const bodyMatch = candidate.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch?.[1]) candidate = bodyMatch[1];
        else {
          const htmlMatch = candidate.match(/<html[^>]*>([\s\S]*)<\/html>/i);
          if (htmlMatch?.[1]) candidate = htmlMatch[1];
          else {
            candidate = candidate.replace(/<!doctype[\s\S]*?>/i, '');
            candidate = candidate.replace(/<head[\s\S]*?>[\s\S]*?<\/head>/i, '');
          }
        }
      } catch (_) { /* keep candidate as-is */ }
    }

    // Sanitize but KEEP <ui-chart> and <ui-table> tags
    let clean = DOMPurify.sanitize(candidate, {
      ADD_TAGS: ['ui-chart', 'ui-table'],
      ADD_ATTR: ['data-id', 'type', 'chart-type']
    });

    // Strip scripts and stylesheet links
    try {
      clean = clean.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
      clean = clean.replace(/<link[^>]*rel=["']?stylesheet["']?[^>]*>/gi, '');
    } catch (_) { /* ignore */ }

    setSanitizedHtml(clean);
  }, [html, artifact]);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 200,
    fontFamily: 'var(--component-font-family)',
    color: 'var(--component-text, inherit)',
    lineHeight: 1.45,
    whiteSpace: 'normal',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  // Split HTML by <ui-chart> and <ui-table> tags, render charts inline (proven StrategyReportModal pattern)
  const renderContent = () => {
    if (!sanitizedHtml) return null;

    const parts = sanitizedHtml.split(/(<ui-chart[^>]*>|<ui-table[^>]*>)/g);

    return parts.map((part, index) => {
      // Check for chart tag
      const chartMatch = part.match(/<ui-chart[^>]*data-id=["']([^"']+)["'][^>]*>/);
      if (chartMatch) {
        const chartId = chartMatch[1];
        const chartArtifact = artifactMap[chartId];
        if (!chartArtifact) {
          console.warn('[HtmlRenderer] Chart artifact not found:', chartId, 'Available:', Object.keys(artifactMap));
          return null;
        }
        return (
          <div key={`chart-${index}`} style={{ margin: '16px 0', width: '100%' }}>
            <StrategyReportChartRenderer
              artifact={chartArtifact}
              width="100%"
              height={chartArtifact.artifact_type === 'TABLE' ? 'auto' : '420px'}
            />
          </div>
        );
      }

      // Check for table tag
      const tableMatch = part.match(/<ui-table[^>]*data-id=["']([^"']+)["'][^>]*>/);
      if (tableMatch) {
        const tableId = tableMatch[1];
        const tableArtifact = artifactMap[tableId];
        if (!tableArtifact) {
          console.warn('[HtmlRenderer] Table artifact not found:', tableId, 'Available:', Object.keys(artifactMap));
          return null;
        }
        return (
          <div key={`table-${index}`} style={{ margin: '16px 0', width: '100%' }}>
            <StrategyReportChartRenderer
              artifact={tableArtifact}
              width="100%"
              height="auto"
            />
          </div>
        );
      }

      // Also handle data-id first format: <ui-chart data-id="X"> or <ui-table data-id="X">
      const altChartMatch = part.match(/<ui-chart[^>]*id=["']([^"']+)["'][^>]*>/);
      if (altChartMatch) {
        const chartArtifact = artifactMap[altChartMatch[1]];
        if (chartArtifact) {
          return (
            <div key={`chart-alt-${index}`} style={{ margin: '16px 0', width: '100%' }}>
              <StrategyReportChartRenderer artifact={chartArtifact} width="100%" height="380px" />
            </div>
          );
        }
      }
      const altTableMatch = part.match(/<ui-table[^>]*id=["']([^"']+)["'][^>]*>/);
      if (altTableMatch) {
        const tableArtifact = artifactMap[altTableMatch[1]];
        if (tableArtifact) {
          return (
            <div key={`table-alt-${index}`} style={{ margin: '16px 0', width: '100%' }}>
              <StrategyReportChartRenderer artifact={tableArtifact} width="100%" height="auto" />
            </div>
          );
        }
      }

      // Regular HTML content — render via ReactMarkdown (handles both HTML and markdown)
      if (!part.trim()) return null;
      return (
        <ReactMarkdown
          key={`content-${index}`}
          rehypePlugins={[rehypeRaw]}
          remarkPlugins={[remarkGfm]}
        >
          {part}
        </ReactMarkdown>
      );
    });
  };

  return (
    <div className="html-renderer-wrapper" style={{ padding: 8 }} aria-label={title || 'HTML content'}>
      <div
        className="html-renderer-inner josoor-report-content"
        style={containerStyle}
      >
        {renderContent()}
      </div>
    </div>
  );
}
