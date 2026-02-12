import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ForceGraph3D from "react-force-graph-3d";
import ForceGraph2D from "react-force-graph-2d";
import { GraphData } from "../../types/dashboard";
import { Maximize2, Minimize2 } from "lucide-react";

interface NeoGraphProps {
  // OLD Interface (backward compatible)
  data?: GraphData;
  highlightPath?: string | null;
  highlightIds?: string[];
  showHealth?: boolean;
  isDark?: boolean;
  language?: string;
  year?: string;
  quarter?: string;
  onNodeClick?: (node: any) => void;
  nodeColor?: (node: any) => string;

  // NEW Interface (for chain-based fetching)
  chainKey?: string;
  analyzeGaps?: boolean;
  legendConfig?: any;
}

export function NeoGraph({
  data,
  highlightPath,
  highlightIds = [],
  showHealth = false,
  isDark = true,
  language = 'en',
  year = '2025',
  quarter = 'All',
  onNodeClick,
  nodeColor,
  chainKey,
  analyzeGaps = false,
  legendConfig
}: NeoGraphProps) {

  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [is3D, setIs3D] = useState(true);

  // Robust Resize handler using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          const newDimensions = {
            width: entry.contentRect.width,
            height: entry.contentRect.height
          };
          console.log('[NeoGraph] Dimensions updated:', newDimensions);
          setDimensions(newDimensions);
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 1. Coloring Logic
  const resolveNodeColor = (node: any) => {
    if (highlightIds && highlightIds.length > 0) {
      return highlightIds.includes(node.id) ? '#EF4444' : (isDark ? 'rgba(75,85,99,0.2)' : 'rgba(200,200,200,0.2)');
    }
    if (nodeColor) return nodeColor(node);
    if (legendConfig && legendConfig.colors) {
      const type = node.labels?.[0] || node.type;
      if (type && legendConfig.colors[type]) {
        return legendConfig.colors[type];
      }
    }
    return node.color || (isDark ? '#D4AF37' : '#1a365d'); // Default to gold for nodes in dark mode
  };

  // 2. Link Visualization
  const resolveLinkColor = (link: any) => {
    if (link.properties?.status === 'critical' || link.properties?.virtual) return '#EF4444';
    return isDark ? '#FFFFFF' : '#000000';
  };

  const resolveLinkWidth = (link: any) => {
    return (link.properties?.status === 'critical' || link.properties?.virtual) ? 3 : 2;
  };

  // 3. Deep Clone to protect cache and handle graphData format
  const graphData = React.useMemo(() => {
    if (!data || !data.nodes) return { nodes: [], links: [] };
    return {
      nodes: data.nodes.map(n => ({ ...n })),
      links: data.links ? data.links.map(l => ({ ...l })) : []
    };
  }, [data]);

  // Handle localization
  const content = {
    switchTo2D: { en: 'Switch to 2D', ar: 'تبديل إلى 2D' },
    switchTo3D: { en: 'Switch to 3D', ar: 'تبديل إلى 3D' },
  };
  const t = (key: keyof typeof content) => language === 'ar' ? content[key].ar : content[key].en;

  const commonProps = {
    ref: graphRef,
    width: dimensions.width,
    height: dimensions.height,
    graphData: graphData,
    nodeLabel: null, // Disable default tooltip to use our custom one
    nodeColor: resolveNodeColor,
    nodeRelSize: 6,
    linkColor: resolveLinkColor,
    linkWidth: resolveLinkWidth,
    linkDirectionalArrowLength: 3,
    linkDirectionalArrowRelPos: 1,
    linkCurvature: 0.1,
    linkOpacity: 1,
    backgroundColor: "rgba(0,0,0,0)",
    onNodeHover: setHoverNode,
    onNodeClick: (node: any) => onNodeClick && onNodeClick(node),
    cooldownTicks: 100,
    onEngineStop: () => { graphRef.current?.zoomToFit(400, 40); },
    onNodeDragEnd: (node: any) => { node.fx = node.x; node.fy = node.y; node.fz = node.z; },
    linkLineDash: (link: any) => (link.properties?.status === 'critical' || link.properties?.virtual) ? [5, 5] : null,
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* View Toggle */}
      <div className="viz-controls-overlay">
        <button
          onClick={() => setIs3D(!is3D)}
          className="viz-mode-btn"
        >
          {is3D ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          {is3D ? t('switchTo2D') : t('switchTo3D')}
        </button>
      </div>

      {(dimensions.width > 0 && dimensions.height > 0) ? (
        is3D ? <ForceGraph3D {...commonProps} /> : <ForceGraph2D {...commonProps} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Preparing Canvas...
        </div>
      )}

      {/* Tooltip via portal - escapes CSS transforms */}
      {hoverNode && createPortal(
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', padding: '1rem', width: '18rem',
          background: 'rgba(10, 10, 10, 0.95)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(212, 175, 55, 0.5)', borderLeft: '4px solid #D4AF37',
          borderRadius: '0.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 10px rgba(212,175,55,0.2)',
          pointerEvents: 'none' as const, zIndex: 9999, color: '#fff'
        }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 800, color: '#D4AF37',
            borderBottom: '1px solid rgba(212,175,55,0.3)', paddingBottom: '0.5rem',
            textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
            {hoverNode.properties?.name || hoverNode.label || hoverNode.id || 'Unnamed Node'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.5rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, color: '#fff' }}>
                <strong style={{ color: '#D4AF37' }}>Labels:</strong> {hoverNode.labels?.join(', ') || hoverNode.type || 'Unknown'}
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, color: '#fff' }}>
                <strong style={{ color: '#D4AF37' }}>ID:</strong> <code>{hoverNode.properties?.id || hoverNode.id}</code>
              </p>
            </div>
            {hoverNode.properties && Object.keys(hoverNode.properties).length > 0 && (
              <div>
                <strong style={{ display: 'block', marginTop: '8px', marginBottom: '4px', color: '#D4AF37' }}>Properties:</strong>
                {Object.entries(hoverNode.properties).map(([key, value]: [string, any]) => (
                  <div key={key} style={{ display: 'flex', gap: '4px', fontSize: '0.75rem', margin: '2px 0', color: '#fff' }}>
                    <span style={{ color: '#9ca3af', minWidth: '60px' }}>{key}:</span>
                    <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
