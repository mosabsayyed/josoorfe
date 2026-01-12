import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import '../MessageBubble.css';
import { useArtifactHydration } from '../../../hooks/useArtifactHydration';
import { replaceVisualizationTags } from '../../../utils/visualizationBuilder';
import type { Artifact } from '../../../types/api';

interface MarkdownRendererProps {
  content: string;
  title?: string;
  embeddedArtifacts?: Record<string, Artifact>;
  artifact?: Artifact; // Fallback to extract embedded_artifacts
  variant?: 'default' | 'bubble';
}

export function MarkdownRenderer({ content, title, embeddedArtifacts, artifact, variant = 'default' }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve embedded artifacts
  const artifactsMap = embeddedArtifacts || ((artifact?.content as any)?.embedded_artifacts) || {};

  // Pre-process content to replace tags
  const processedContent = replaceVisualizationTags(content || '');

  // Hydrate tags
  useArtifactHydration(containerRef, artifactsMap as Record<string, Artifact>, processedContent);

  const containerClass = variant === 'bubble'
    ? "markdown-renderer"
    : "markdown-renderer renderer-panel";

  return (
    <div className={containerClass} ref={containerRef}>
      {title && (
        <h1 className="markdown-renderer-title" style={{
          fontSize: 24,
          fontWeight: 600,
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: '2px solid var(--component-panel-border)',
        }}>
          {title}
        </h1>
      )}
      <div className="markdown-content">
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
