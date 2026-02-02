import React, { useEffect, useRef, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import DOMPurify from 'dompurify';
import { replaceVisualizationTags } from '../../../utils/visualizationBuilder';
import { useArtifactHydration } from '../../../hooks/useArtifactHydration';
import { ArtifactRenderer } from '../ArtifactRenderer';
import type { Artifact } from '../../../types/api';
import '../../desks/sector/SectorReport.css';

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
    whiteSpace: 'normal', // Override parent pre-wrap
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  // Hydrate visualization placeholders
  useArtifactHydration(containerRef, embeddedArtifacts, sanitizedHtml);

  return (
    <div className="html-renderer-wrapper" style={{ padding: 8 }} aria-label={title || 'HTML content'}>
      <div
        ref={containerRef}
        className="html-renderer-inner josoor-report-content"
        style={containerStyle}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
}
