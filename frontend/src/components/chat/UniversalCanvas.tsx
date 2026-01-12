/**
 * UniversalCanvas - Auto-detecting polymorphic renderer
 * Intelligently detects content type and routes to specialized renderers
 */

import { CodeRenderer, MarkdownRenderer, MediaRenderer, ExcelRenderer, FileRenderer, HtmlRenderer } from './renderers';
import { LandingPageRenderer } from './renderers/LandingPageRenderer';
import { ArtifactRenderer } from './ArtifactRenderer';
import type { Artifact } from '../../types/api';

import { GraphDashboard } from '../dashboards/GraphDashboard';

interface UniversalCanvasProps {
  content?: any;
  title?: string;
  type?: string;
  artifact?: any; // Support passing artifact directly (flat or wrapped)
  embeddedArtifacts?: Record<string, Artifact>; // Explicit map of artifacts for hydration
  onNext?: () => void; // Callback for landing page "Start" button
}

function detectContentType(content: any, explicitType?: string, artifact?: any): {
  type: 'code' | 'markdown' | 'html' | 'image' | 'video' | 'audio' | 'excel' | 'file' | 'artifact' | 'json' | 'chart' | 'table' | 'graphv001' | 'landing_page';
  language?: string;
  url?: string;
  artifact?: any;
} {
  // PRIORITY 0: Check artifact parameter first if provided
  if (artifact && typeof artifact === 'object' && 'artifact_type' in artifact) {
    const at = String(artifact.artifact_type || '').toLowerCase();
    // Special handling for GRAPHV001 - must render as iframe, not through ArtifactRenderer
    if (at === 'graphv001') return { type: 'graphv001' };
    // Special handling for LANDING_PAGE
    if (at === 'landing_page') return { type: 'landing_page' };
    // Special handling for HTML/DOCUMENT artifacts
    if (at === 'html' || at === 'document') return { type: 'html' };
    // All other artifact types go through ArtifactRenderer
    return { type: 'artifact' };
  }

  // PRIORITY 1: String content - check for HTML documents first
  if (typeof content === 'string') {
    const trimmed = content.trim();

    // If the string contains a JSON-like object, try to parse it so we can
    // detect wrapped artifacts (e.g., { type: 'HTML', config: { html_content: '...' } })
    if ((trimmed.startsWith('{') || trimmed.startsWith('['))) {
      try {
        const parsed = JSON.parse(trimmed);
        // Delegate to object handling by replacing content locally
        content = parsed;
      } catch (_) {
        // not JSON, continue
      }
    } else {
      // HTML document (complete HTML file)
      if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || (trimmed.startsWith('<') && trimmed.includes('<html'))) {
        return { type: 'html' };
      }
    }
  }

  // PRIORITY 2: Check if it's a visualization object from the LLM
  // Format: { type: 'table'|'chart'|'column'|'bar', title, config, data }
  if (content && typeof content === 'object' && content.type) {
    const vizType = String(content.type).toLowerCase();

    // Known chart types
    if (['chart', 'column', 'bar', 'line', 'area', 'pie', 'radar', 'bubble', 'bullet', 'combo', 'scatter'].includes(vizType)) {
      return { type: 'chart' };
    }

    // Table
    if (vizType === 'table') {
      return { type: 'table' };
    }

    // Fallback: If it has config and data, assume it's a chart
    if (content.config && content.data) {

      return { type: 'chart' };
    }
  }

  // PRIORITY 3: Check if it's an Artifact object (from existing system)
  if (content && typeof content === 'object') {
    // Direct artifact marker
    if ('artifact_type' in content) {
      // If artifact explicitly indicates HTML, prefer html
      const at = String((content as any).artifact_type || '').toLowerCase();
      if (at === 'html' || at === 'document') return { type: 'html' };
      return { type: 'artifact' };
    }

    // Some tool outputs use `type: 'HTML'` or `type: 'html'` to denote an HTML artifact
    if (content.type && String(content.type).toLowerCase() === 'html') {
      return { type: 'html' };
    }

    // LLM visualization wrappers sometimes place the HTML under config.html_content or config.html
    const cfg = (content as any).config;
    if (cfg && (typeof cfg.html_content === 'string' || typeof cfg.html === 'string')) {
      return { type: 'html' };
    }

    // Some payloads include the full HTML under an `answer` field
    if (typeof (content as any).answer === 'string' && /<\/?[a-z][\s\S]*>/i.test((content as any).answer)) {
      return { type: 'html' };
    }
  }

  // PRIORITY 3: Explicit type provided
  if (explicitType) {
    const lower = explicitType.toLowerCase();

    if (['python', 'javascript', 'typescript', 'sql', 'java', 'cpp', 'go', 'rust'].includes(lower)) {
      return { type: 'code', language: lower };
    }
    if (lower === 'markdown' || lower === 'md') return { type: 'markdown' };
    if (lower === 'html') return { type: 'html' };
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(lower)) return { type: 'image' };
    if (['mp4', 'webm', 'ogg'].includes(lower)) return { type: 'video' };
    if (['mp3', 'wav', 'ogg'].includes(lower)) return { type: 'audio' };
    if (['csv', 'xlsx', 'xls'].includes(lower)) return { type: 'excel' };
    if (['pdf', 'docx', 'pptx'].includes(lower)) return { type: 'file' };
    if (lower === 'graphv001') return { type: 'graphv001' };
    if (lower === 'twin_knowledge') {
      return {
        type: 'artifact',
        artifact: {
          artifact_type: 'TWIN_KNOWLEDGE',
          title: 'Twin Knowledge Library',
          content: {}
        } as any
      };
    }
    // Handle DOCUMENT artifacts - route through ArtifactRenderer
    if (lower === 'document') return { type: 'artifact' };
  }

  // PRIORITY 4: String content - detect by pattern
  if (typeof content === 'string') {
    const trimmed = content.trim();

    // HTML
    if (trimmed.startsWith('<') && trimmed.includes('>')) {
      return { type: 'html' };
    }

    // Markdown (has headers, lists, or code blocks)
    if (/^#{1,6}\s/.test(trimmed) || /^[-*+]\s/.test(trimmed) || /```/.test(trimmed)) {
      return { type: 'markdown' };
    }

    // Code (has common code patterns)
    if (/^(def |class |function |import |from |const |let |var |SELECT |CREATE )/.test(trimmed)) {
      // Detect language
      if (/^(def |class |import |from )/.test(trimmed)) return { type: 'code', language: 'python' };
      if (/^(function |const |let |var |import )/.test(trimmed)) return { type: 'code', language: 'javascript' };
      if (/^(SELECT |CREATE |INSERT |UPDATE |DELETE )/.test(trimmed)) return { type: 'code', language: 'sql' };
      return { type: 'code', language: 'text' };
    }

    // URL (image/video/audio)
    if (/^https?:\/\//.test(trimmed)) {
      if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(trimmed)) return { type: 'image', url: trimmed };
      if (/\.(mp4|webm|ogg)$/i.test(trimmed)) return { type: 'video', url: trimmed };
      if (/\.(mp3|wav|ogg)$/i.test(trimmed)) return { type: 'audio', url: trimmed };
    }

    // CSV (has commas and newlines)
    if (trimmed.includes(',') && trimmed.includes('\n')) {
      return { type: 'excel' };
    }

    // Markdown Image (standalone)
    const markdownImageRegex = /^!\[.*?\]\((.*?)\)$/;
    const imageMatch = trimmed.match(markdownImageRegex);
    if (imageMatch) {
      return { type: 'image', url: imageMatch[1] };
    }

    // Default to markdown for plain text
    return { type: 'markdown' };
  }

  // PRIORITY 5: Array of arrays (Excel data)
  if (Array.isArray(content) && Array.isArray(content[0])) {
    return { type: 'excel' };
  }

  // LAST RESORT: Object - render as JSON
  if (typeof content === 'object') {
    return { type: 'json' };
  }

  return { type: 'markdown' };
}

export function UniversalCanvas({ content: propsContent, title, type, artifact, onNext }: UniversalCanvasProps) {
  // Support both calling patterns:
  // 1. CanvasPanel: passes content, title, type directly
  // 2. MessageBubble: might pass artifact (flat visualization object)
  const content = propsContent || artifact?.content || artifact || {};

  // If the incoming content is an artifact object that contains an HTML string
  // in nested fields (html, content, body), prefer that raw string so we do
  // not accidentally stringify or mutate the HTML before rendering.
  let resolvedContent: any = content;
  if (content && typeof content === 'object') {
    // If a React element is provided on the artifact (reactElement), render it directly.
    // This allows rendering a local route/component inside the canvas without routing changes.
    try {
      if ((content as any).reactElement) {
        console.log('[UniversalCanvas] Rendering artifact reactElement directly');
        return (
          <div style={{ width: '100%', height: '100%', minHeight: 400 }}>
            {(content as any).reactElement}
          </div>
        );
      }
    } catch (e) {
      // fallthrough to other renderers
    }

    if (typeof content.html === 'string') resolvedContent = content.html;
    else if (typeof content.content === 'string') resolvedContent = content.content;
    else if (typeof content.body === 'string') resolvedContent = content.body;
  }

  const detected = detectContentType(resolvedContent, type || artifact?.artifact_type, artifact);

  const isEmptyContent = !resolvedContent || (typeof resolvedContent === 'object' && Object.keys(resolvedContent).length === 0);

  // Debug logging removed for performance

  if (isEmptyContent && detected.type !== 'graphv001') return null;

  // Render based on detected type
  switch (detected.type) {
    case 'html': {
      const sourceContent: any = content;
      let baseContent: any = {};

      if (sourceContent && typeof sourceContent === 'object') {
        baseContent = {
          ...(sourceContent.config || sourceContent),
          ...(sourceContent.type && { type: sourceContent.type })
        };
      } else if (sourceContent?.type) {
        baseContent = { type: sourceContent.type };
      }

      const seedStrings: string[] = [];
      if (typeof resolvedContent === 'string') seedStrings.push(resolvedContent);
      if (typeof sourceContent === 'string') seedStrings.push(sourceContent);
      if (typeof sourceContent === 'object') {
        if (typeof sourceContent.html === 'string') seedStrings.push(sourceContent.html);
        if (typeof sourceContent.body === 'string') seedStrings.push(sourceContent.body);
        if (typeof sourceContent.answer === 'string') seedStrings.push(sourceContent.answer);
      }

      let htmlString = '';

      const tryExtractFromJson = (raw: string): string => {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            if (typeof parsed.config?.html_content === 'string') return parsed.config.html_content;
            if (typeof parsed.config?.html === 'string') return parsed.config.html;
            if (typeof parsed.answer === 'string' && /<\/?[a-z][\s\S]*>/i.test(parsed.answer)) return parsed.answer;
            if (typeof parsed.html === 'string') return parsed.html;
          }
        } catch (_) {
          // not JSON
        }
        return '';
      };

      for (const seed of seedStrings) {
        const trimmed = (seed || '').trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          const parsedHtml = tryExtractFromJson(trimmed);
          if (parsedHtml) {
            htmlString = parsedHtml;
            break;
          }
        }

        if (/^<!doctype html>/i.test(trimmed) || /^<html\b/i.test(trimmed) || /<\/?[a-z][\s\S]*>/i.test(trimmed)) {
          htmlString = trimmed;
          break;
        }

        if (!htmlString) htmlString = trimmed;
      }

      if (!htmlString && resolvedContent && typeof resolvedContent === 'object') {
        htmlString =
          (resolvedContent as any).config?.html_content ||
          (resolvedContent as any).config?.html ||
          (resolvedContent as any).answer ||
          (resolvedContent as any).html ||
          (resolvedContent as any).body ||
          '';
      }

      const findHtmlInObject = (obj: any, depth = 0): string | null => {
        if (!obj || depth > 6) return null;
        if (typeof obj === 'string') {
          const s = obj.trim();
          if ((/^<!doctype html>/i).test(s) || (/^<html\b/i).test(s) || /<\/?[a-z][\s\S]*>/i.test(s)) return s;
          return null;
        }
        if (Array.isArray(obj)) {
          for (const item of obj) {
            const found = findHtmlInObject(item, depth + 1);
            if (found) return found;
          }
          return null;
        }
        if (typeof obj === 'object') {
          for (const k of Object.keys(obj)) {
            try {
              const found = findHtmlInObject(obj[k], depth + 1);
              if (found) return found;
            } catch (_) { }
          }
        }
        return null;
      };

      const looksLikePlaceholder = (s: string) => !s || /embedded in the 'answer' field|placeholder|<!--\s*The full HTML/i.test(s);
      if (looksLikePlaceholder(htmlString) && typeof resolvedContent === 'object') {
        const found = findHtmlInObject(resolvedContent);
        if (found) {
          htmlString = found;
        }
      }

      const format = baseContent.format || sourceContent?.format;
      if (format === 'markdown') {
        return (
          <MarkdownRenderer
            content={htmlString || seedStrings[0] || ''}
            title={title}
          />
        );
      }

      const shouldUseArtifactRenderer = Boolean(
        artifact || (content && typeof content === 'object' && (content.config || content.body || content.html || content.artifact_type))
      );

      if (shouldUseArtifactRenderer) {
        if (htmlString && typeof htmlString === 'string' && htmlString.trim()) {
          baseContent.body = htmlString;
          baseContent.format = baseContent.format || 'html';
          baseContent.html = baseContent.html || htmlString;
          baseContent.config = {
            ...(baseContent.config || {}),
            html_content: htmlString
          };
        }

        const artifactForRenderer = {
          artifact_type: 'HTML',
          title: (sourceContent && (sourceContent.title || title)) || title || 'Untitled',
          description: sourceContent?.description,
          content: baseContent,
          data: sourceContent?.config?.data || sourceContent?.data,
        } as any;

        return (
          <div style={{ width: '100%', height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <ArtifactRenderer artifact={artifactForRenderer as Artifact} />
          </div>
        );
      }

      return (
        <HtmlRenderer
          html={htmlString || seedStrings[0] || ''}
          title={title}
        />
      );
    }

    case 'markdown':
      return (
        <MarkdownRenderer
          content={typeof content === 'string' ? content : (content.content || '')}
          title={title}
          artifact={artifact}
        />
      );

    case 'code':
      return (
        <CodeRenderer
          code={typeof content === 'string' ? content : (content.content || '')}
          language={detected.language || 'text'}
          title={title}
        />
      );

    case 'image':
    case 'video':
    case 'audio':
      return (
        <MediaRenderer
          type={detected.type as 'image' | 'video' | 'audio'}
          url={detected.url || (typeof content === 'string' ? content : content.url)}
          title={title}
        />
      );

    case 'excel':
      return (
        <ExcelRenderer
          data={Array.isArray(content) ? content : undefined}
          csvContent={typeof content === 'string' ? content : undefined}
          title={title}
        />
      );

    case 'file':
      return (
        <FileRenderer
          url={content.url}
          filename={content.filename || 'download'}
          size={content.size}
          type={content.fileType}
          content={content.content}
        />
      );

    case 'chart':
    case 'table':
      // At this point, content is the raw visualization object from the LLM
      // We need to wrap it in the Artifact interface for ArtifactRenderer
      console.log('[UniversalCanvas] Rendering chart/table with content:', {
        detectedType: detected.type,
        content: content,
        config: content.config,
        data: content.config?.data || content.data,
        typeField: content.type  // CHECK IF TYPE EXISTS HERE
      });

      let artifactType = detected.type === 'chart' ? 'CHART' : 'TABLE';

      // Detect if it's actually a table disguised as a chart
      if (detected.type === 'chart' && (content.chart?.type === 'table' || content.type === 'table')) {
        artifactType = 'TABLE';
      }

      const artifactForRenderer = {
        artifact_type: artifactType,
        title: content.title || title || 'Untitled',
        description: content.description,
        // CRITICAL FIX: Preserve the type field from the original content
        content: {
          ...(content.config || content),
          // If content has a type field at root, preserve it as chart.type
          ...(content.type && { chart: { type: content.type } })
        },
        // Also expose data at the top level for convenience
        data: content.config?.data || content.data,
      };

      console.log('[UniversalCanvas] Created artifactForRenderer:', artifactForRenderer);
      console.log('[UniversalCanvas] Created artifactForRenderer:', artifactForRenderer);
      return (
        <div style={{ width: '100%', height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <ArtifactRenderer artifact={artifactForRenderer as Artifact} />
        </div>
      );

    case 'artifact':
      // For DOCUMENT type, use the full artifact if available, otherwise content
      const artifactToRender = (artifact && 'artifact_type' in artifact) ? artifact : (content as Artifact);
      return <ArtifactRenderer artifact={artifactToRender as Artifact} fullHeight={true} />;

    case 'json':
      return (
        <CodeRenderer
          code={JSON.stringify(content, null, 2)}
          language="json"
          title={title}
        />
      );

    case 'landing_page':
      return (
        <LandingPageRenderer
          data={artifact.content}
          onStart={onNext || (() => console.warn('onNext not provided for landing page'))}
        />
      );
    case 'graphv001':
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#111827', color: '#F3F4F6', overflow: 'hidden' }}>
          <GraphDashboard />
        </div>
      );

    default:
      return (
        <div style={{ padding: 24 }}>
          <p>Unable to render content</p>
          <pre style={{ fontSize: 12, color: '#666' }}>
            {JSON.stringify({ detected, content }, null, 2)}
          </pre>
        </div>
      );
  }
}
