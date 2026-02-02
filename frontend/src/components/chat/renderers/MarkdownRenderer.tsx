import { useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useArtifactHydration } from '../../../hooks/useArtifactHydration';
import { replaceVisualizationTags } from '../../../utils/visualizationBuilder';
import type { Artifact } from '../../../types/api';
import '../MessageBubble.css';

interface MarkdownRendererProps {
  content: string;
  variant?: 'bubble' | 'canvas';
  title?: string;
  artifact?: any;
  embeddedArtifacts?: Record<string, Artifact>;
}

export function MarkdownRenderer({ content, variant = 'bubble', title, artifact, embeddedArtifacts: propArtifacts }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve embedded artifacts
  const embeddedArtifacts = useMemo(() => {
    let artifacts = propArtifacts || {};
    if (artifact?.content?.embedded_artifacts) {
      artifacts = { ...artifacts, ...artifact.content.embedded_artifacts };
    }
    return artifacts;
  }, [propArtifacts, artifact]);

  // Process content: replace tags with placeholders and handle newlines
  const processedContent = useMemo(() => {
    let s = content || '';
    s = s.replace(/\\n/g, '\n');
    return replaceVisualizationTags(s);
  }, [content]);

  // Use hydration hook
  useArtifactHydration(containerRef, embeddedArtifacts, processedContent);

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
        ref={containerRef}
        className="markdown-content josoor-report-content"
        style={{ whiteSpace: 'normal' }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
