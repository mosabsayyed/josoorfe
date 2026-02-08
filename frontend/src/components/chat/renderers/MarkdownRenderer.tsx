import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Artifact } from '../../../types/api';
import { ArtifactRenderer } from '../ArtifactRenderer';
import '../MessageBubble.css';

interface MarkdownRendererProps {
  content: string;
  variant?: 'bubble' | 'canvas';
  title?: string;
  artifact?: any;
  embeddedArtifacts?: Record<string, Artifact>;
}

export function MarkdownRenderer({ content, variant = 'bubble', title, artifact, embeddedArtifacts: propArtifacts }: MarkdownRendererProps) {
  // Resolve embedded artifacts
  const embeddedArtifacts = useMemo(() => {
    let artifacts = propArtifacts || {};
    if (artifact?.content?.embedded_artifacts) {
      artifacts = { ...artifacts, ...artifact.content.embedded_artifacts };
    }

    // DEBUG: Log what we have
    console.log('[MarkdownRenderer] embeddedArtifacts:', {
      count: Object.keys(artifacts).length,
      ids: Object.keys(artifacts),
      contentPreview: content?.substring(0, 200)
    });

    return artifacts;
  }, [propArtifacts, artifact, content]);

  // Process content: handle newlines
  const processedContent = useMemo(() => {
    let s = content || '';
    s = s.replace(/\\n/g, '\n');
    return s;
  }, [content]);

  // Create custom ReactMarkdown components for ui-chart and ui-table tags
  const components = useMemo(() => ({
    'ui-chart': ({ node, ...props }: any) => {
      console.log('[MarkdownRenderer] ui-chart component called!', { props, availableIds: Object.keys(embeddedArtifacts) });

      const chartId = props.id || props['data-id'];
      const artifact = chartId ? embeddedArtifacts[chartId] : null;

      if (!artifact) {
        console.warn('[MarkdownRenderer] Chart not found:', chartId, 'Available:', Object.keys(embeddedArtifacts));
        return <div style={{
          padding: '0.5rem',
          background: 'rgba(239,68,68,0.1)',
          borderRadius: '4px',
          color: '#ef4444',
          fontSize: '0.875rem'
        }}>Chart not found: {chartId}</div>;
      }

      console.log('[MarkdownRenderer] Rendering chart:', chartId, artifact);
      return (
        <div style={{ margin: '1rem 0' }}>
          <ArtifactRenderer artifact={artifact} embeddedArtifacts={embeddedArtifacts} />
        </div>
      );
    },
    'ui-table': ({ node, ...props }: any) => {
      const tableId = props.id || props['data-id'];
      const artifact = tableId ? embeddedArtifacts[tableId] : null;

      if (!artifact) {
        console.warn('[MarkdownRenderer] Table not found:', tableId);
        return <div style={{
          padding: '0.5rem',
          background: 'rgba(239,68,68,0.1)',
          borderRadius: '4px',
          color: '#ef4444',
          fontSize: '0.875rem'
        }}>Table not found: {tableId}</div>;
      }

      return (
        <div style={{ margin: '1rem 0' }}>
          <ArtifactRenderer artifact={artifact} embeddedArtifacts={embeddedArtifacts} />
        </div>
      );
    }
  }), [embeddedArtifacts]);

  const containerClass = variant === 'bubble'
    ? "markdown-renderer"
    : "markdown-renderer markdown-renderer--canvas";

  return (
    <div className={containerClass}>
      {title && (
        <h1 style={{
          fontSize: '1.4rem',
          fontWeight: 700,
          color: 'var(--component-text-accent)',
          marginTop: 0,
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: '2px solid var(--component-panel-border)',
        }}>
          {title}
        </h1>
      )}
      <div
        className="markdown-content josoor-report-content"
        style={{ whiteSpace: 'normal' }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={components}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
