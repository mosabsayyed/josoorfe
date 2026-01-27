import React, { useEffect, useRef, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import DOMPurify from 'dompurify';
import { replaceVisualizationTags } from '../../../utils/visualizationBuilder';
import { useArtifactHydration } from '../../../hooks/useArtifactHydration';
import { ArtifactRenderer } from '../ArtifactRenderer';
import type { Artifact } from '../../../types/api';

interface HtmlRendererProps {
  // Accept either a direct HTML string via `html` or an entire `artifact`
  // object (legacy callers pass the artifact directly). The renderer will
  // extract the HTML from known fields when given an artifact.
  html?: string | any;
  artifact?: any;
  title?: string;
  embeddedArtifacts?: Record<string, Artifact>;
}

export function HtmlRenderer({ html, artifact, title, embeddedArtifacts: propArtifacts }: HtmlRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sanitizedHtml, setSanitizedHtml] = useState<string>('');

  // Extract embedded artifacts map if available
  const getEmbeddedArtifacts = (): Record<string, Artifact> => {
    let artifacts: Record<string, Artifact> = propArtifacts || {};

    if (artifact && typeof artifact === 'object' && artifact.content?.embedded_artifacts) {
      artifacts = { ...artifacts, ...artifact.content.embedded_artifacts };
    }
    if (html && typeof html === 'object' && html.content?.embedded_artifacts) {
      artifacts = { ...artifacts, ...html.content.embedded_artifacts };
    }
    // Also check deeper nesting if passed as content object
    if (html && typeof html === 'object' && html.embedded_artifacts) {
      artifacts = { ...artifacts, ...html.embedded_artifacts };
    }
    return artifacts;
  };

  const embeddedArtifacts = getEmbeddedArtifacts();

  useEffect(() => {
    // Determine the raw candidate HTML string. Support these input shapes:
    //  - html is a string (preferred)
    //  - html is an artifact object (legacy callers)
    //  - artifact prop provided (artifact object)
    let candidate: string = '';
    try {
      if (typeof html === 'string' && html.trim()) {
        candidate = html;
      } else if (html && typeof html === 'object') {
        // html was passed but it's actually an artifact object; fall through
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

    // Attempt to unescape common HTML-escaped sequences the LLM may include
    candidate = candidate.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    candidate = candidate.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

    // If candidate looks like a full HTML document, extract the body inner HTML
    const extractBody = (docString: string) => {
      try {
        const bodyMatch = docString.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch && bodyMatch[1]) return bodyMatch[1];
        const htmlMatch = docString.match(/<html[^>]*>([\s\S]*)<\/html>/i);
        if (htmlMatch && htmlMatch[1]) return htmlMatch[1];
        // Fallback: remove <!doctype ...> and <head>...</head>
        let s = docString.replace(/<!doctype[\s\S]*?>/i, '');
        s = s.replace(/<head[\s\S]*?>[\s\S]*?<\/head>/i, '');
        return s;
      } catch (_) {
        return docString;
      }
    };

    if (/^\s*<!doctype/i.test(candidate) || /<html[\s\S]*>/i.test(candidate)) {
      candidate = extractBody(candidate);
    }

    // Use default DOMPurify sanitization first (avoid passing unstable config keys)
    let clean = DOMPurify.sanitize(candidate, {
      ADD_TAGS: ['ui-chart', 'ui-table'],
      ADD_ATTR: ['data-id', 'type', 'chart-type']
    });

    // Replace custom visualization tags with placeholders
    try {
      clean = replaceVisualizationTags(clean);
    } catch (error) {
      console.warn('[HtmlRenderer] Error replacing visualization tags:', error);
      // Continue gracefully if tag replacement fails
    }

    // As an extra safety layer, strip any remaining <script>, <style> or stylesheet links from the string
    try {
      clean = clean.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
      // clean = clean.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
      clean = clean.replace(/<link[^>]*rel=["']?stylesheet["']?[^>]*>/gi, '');
    } catch (e) {
      // ignore
    }

    setSanitizedHtml(clean);
  }, [html, artifact]);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 200,
    fontFamily: 'var(--component-font-family)',
    color: 'var(--component-text, inherit)',
    lineHeight: 1.45,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  // Hydrate visualization placeholders
  useArtifactHydration(containerRef, embeddedArtifacts, sanitizedHtml);

  // Scoped styles for the renderer content
  const scopedStyles = `
    .html-renderer-inner {
      font-family: var(--component-font-family);
      color: var(--component-text-primary);
      line-height: 1.6;
    }
    .html-renderer-inner h1, .html-renderer-inner h2, .html-renderer-inner h3, .html-renderer-inner h4, .html-renderer-inner h5, .html-renderer-inner h6 {
      font-weight: 700;
      margin-top: 1.5em;
      margin-bottom: 0.75em;
      color: var(--component-text-primary);
      line-height: 1.3;
    }
    .html-renderer-inner h1 { font-size: 1.8em; border-bottom: 1px solid var(--component-panel-border); padding-bottom: 0.3em; }
    .html-renderer-inner h2 { font-size: 1.5em; }
    .html-renderer-inner h3 { font-size: 1.25em; }
    .html-renderer-inner p { margin-top: 0; margin-bottom: 1em; }
    .html-renderer-inner a { color: var(--component-text-accent); text-decoration: none; }
    .html-renderer-inner a:hover { text-decoration: underline; }
    .html-renderer-inner code { 
      font-family: var(--component-font-mono, monospace); 
      background: rgba(0, 0, 0, 0.2); 
      padding: 0.2em 0.4em; 
      border-radius: 0.25em; 
      font-size: 0.9em;
      color: var(--component-text-accent);
    }
    .html-renderer-inner pre { 
      background: rgba(0, 0, 0, 0.2); 
      color: var(--component-text-primary); 
      padding: 1em; 
      border-radius: 0.5em; 
      overflow-x: auto; 
      border: 1px solid var(--component-panel-border);
    }
    .html-renderer-inner pre code { background: transparent; padding: 0; color: inherit; }
    .html-renderer-inner table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 1.5em; 
      font-size: 0.95em;
    }
    .html-renderer-inner th, .html-renderer-inner td { 
      border: 1px solid var(--component-panel-border); 
      padding: 0.75em; 
      text-align: left; 
      color: var(--component-text-primary);
    }
    .html-renderer-inner th { 
      background: rgba(255, 255, 255, 0.05); 
      font-weight: 600; 
      color: var(--component-text-accent);
    }
    .html-renderer-inner tr:nth-child(even) {
      background: rgba(255, 255, 255, 0.02);
    }
    .html-renderer-inner ul, .html-renderer-inner ol {
      padding-left: 1.5em;
      margin-bottom: 1em;
    }
    .html-renderer-inner li {
      margin-bottom: 0.5em;
    }
    .html-renderer-inner blockquote {
      border-left: 4px solid var(--component-accent);
      margin: 0 0 1em 0;
      padding-left: 1em;
      color: var(--component-text-secondary);
      font-style: normal;
    }
    /* Visualization placeholder styles used before hydration */
    .visualization-placeholder {
      display: block;
      padding: 1em;
      margin: 1em 0;
      background: rgba(100, 150, 200, 0.1);
      border: 2px dashed var(--component-text-accent);
      border-radius: 0.5em;
      color: var(--component-text-secondary);
      font-size: 0.95em;
      font-style: normal;
      text-align: center;
    }
    .visualization-table {
      background: rgba(74, 144, 226, 0.08);
      border-color: #4a90e2;
    }
    .visualization-chart {
      background: rgba(244, 100, 50, 0.08);
      border-color: #f46432;
    }
    /* Hydrated container style */
    .hydrated-visualization-container {
      margin: 1.5em 0;
      width: 100%;
      min-height: 400px; 
    }
  `;

  return (
    <div className="html-renderer-wrapper" style={{ padding: 8 }} aria-label={title || 'HTML content'}>
      <style>{scopedStyles}</style>
      <div
        ref={containerRef}
        className="html-renderer-inner"
        style={containerStyle}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
}
