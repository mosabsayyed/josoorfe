import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from 'react-i18next';
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

// 20 gold/amber tones — dark gold palette matching site accent
const NODE_PALETTE = [
  '#F4BB30', '#D4A017', '#B8860B', '#DAA520', '#C49102',
  '#E6A817', '#A67B00', '#CF9B1D', '#8B6914', '#F0C040',
  '#D4920A', '#BFA14A', '#9C7A1E', '#E8B828', '#C8A22C',
  '#A08520', '#D4AF37', '#B59410', '#C9A82C', '#8C7317',
] as const;

function hashStringToIndex(str: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % mod;
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

  const { t } = useTranslation();
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [is3D, setIs3D] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
    if (node.properties?.status === 'critical') return '#EF4444';
    if (nodeColor) return nodeColor(node);
    if (legendConfig && legendConfig.colors) {
      const type = node.labels?.[0] || node.type;
      if (type && legendConfig.colors[type]) {
        return legendConfig.colors[type];
      }
    }
    // Palette-based coloring by node type/label
    const nodeType = node.labels?.[0] || node.type;
    if (nodeType) {
      return NODE_PALETTE[hashStringToIndex(nodeType, NODE_PALETTE.length)];
    }
    // Fallback: theme accent in dark, dark text in light
    return node.color || (isDark ? '#F4BB30' : '#4B5563');
  };

  // 2. Link Visualization
  // Mid-tone links: contrast against dark bg (#111827) AND bright nodes
  const resolveLinkColor = (link: any) => {
    if (link.properties?.status === 'critical' || link.properties?.virtual) return '#EF4444';
    return isDark ? '#FFFFFF' : '#4B5563';
  };

  const resolveLinkWidth = (link: any) => {
    return (link.properties?.status === 'critical' || link.properties?.virtual) ? 1.5 : 0.5;
  };

  // 3. Deep Clone + Fibonacci sphere placement (fx/fy/fz) + relation-based sizing
  const graphData = React.useMemo(() => {
    if (!data || !data.nodes) return { nodes: [], links: [] };

    // Count relations per node
    const relCount: Record<string, number> = {};
    if (data.links) {
      for (const l of data.links) {
        const src = typeof l.source === 'object' ? l.source.id : l.source;
        const tgt = typeof l.target === 'object' ? l.target.id : l.target;
        relCount[src] = (relCount[src] || 0) + 1;
        relCount[tgt] = (relCount[tgt] || 0) + 1;
      }
    }

    const nodeCount = data.nodes.length;
    const radius = Math.max(200, nodeCount * 3);
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    const nodes = data.nodes.map((n, i) => {
      const theta = Math.acos(1 - 2 * (i + 0.5) / nodeCount);
      const phi = 2 * Math.PI * i / goldenRatio;
      const count = relCount[n.id] || 1;
      return {
        ...n,
        fx: radius * Math.sin(theta) * Math.cos(phi),
        fy: radius * Math.sin(theta) * Math.sin(phi),
        fz: radius * Math.cos(theta),
        _val: Math.max(2, Math.min(20, count * 2)),
      };
    });

    return {
      nodes,
      links: data.links ? data.links.map(l => ({ ...l })) : []
    };
  }, [data]);

  // Click zoom handler
  const handleNodeClick = (node: any) => {
    if (onNodeClick) onNodeClick(node);

    const fg = graphRef.current;
    if (!fg || !is3D) return;

    const distance = 250;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
    fg.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
      node,
      1500
    );
  };

  const commonProps = {
    ref: graphRef,
    width: dimensions.width,
    height: dimensions.height,
    graphData: graphData,
    nodeLabel: null,
    nodeColor: resolveNodeColor,
    nodeVal: (node: any) => node._val || 4,
    nodeRelSize: 8,
    nodeResolution: 16,
    linkColor: resolveLinkColor,
    linkWidth: resolveLinkWidth,
    linkOpacity: 0.2,
    linkDirectionalArrowLength: 3,
    linkDirectionalArrowRelPos: 1,
    linkCurvature: 0.1,
    backgroundColor: isDark ? "#111827" : "#F3F4F6",
    onNodeHover: setHoverNode,
    onNodeClick: handleNodeClick,
    cooldownTicks: 100,
    linkLineDash: (link: any) => (link.properties?.status === 'critical' || link.properties?.virtual) ? [5, 5] : null,
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }} onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
      {/* View Toggle */}
      <div className="viz-controls-overlay">
        <button
          onClick={() => setIs3D(!is3D)}
          className="viz-mode-btn"
        >
          {is3D ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          {is3D ? t('josoor.dashboard.graph.switchTo2D') : t('josoor.dashboard.graph.switchTo3D')}
        </button>
      </div>

      {(dimensions.width > 0 && dimensions.height > 0) ? (
        is3D ? <ForceGraph3D {...commonProps} /> : <ForceGraph2D {...commonProps} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {t('josoor.dashboard.graph.preparingCanvas')}
        </div>
      )}

      {/* Minimal hover tooltip — just Name · Type */}
      {hoverNode && createPortal(
        (() => {
          const nodeProps = hoverNode.properties || hoverNode.nProps || {};
          const domainId = hoverNode.domain_id || nodeProps.domain_id || '';
          const namePart = hoverNode.name || nodeProps.name || nodeProps.title || hoverNode.label || String(hoverNode.id || 'Node');
          const nodeName = domainId ? `${domainId} ${namePart}` : namePart;
          const nodeType = (hoverNode.labels && hoverNode.labels.length > 0)
            ? hoverNode.labels.filter((l: string) => l !== 'Unknown')[0]
            : (hoverNode.label && hoverNode.label !== 'Unknown' ? hoverNode.label : '');

          return (
            <div style={{
              position: 'fixed',
              left: mousePos.x + 14,
              top: mousePos.y - 36,
              backgroundColor: isDark ? 'rgba(17,24,39,0.92)' : 'rgba(255,255,255,0.95)',
              border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
              borderRadius: '6px',
              padding: '6px 10px',
              zIndex: 99999,
              pointerEvents: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              whiteSpace: 'nowrap' as const,
              boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              direction: 'ltr' as const,
            }}>
              <span style={{ fontWeight: 600, color: isDark ? '#F9FAFB' : '#111827' }}>{nodeName}</span>
              {nodeType && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  color: isDark ? '#9CA3AF' : '#6B7280',
                  backgroundColor: isDark ? 'rgba(55,65,81,0.6)' : 'rgba(243,244,246,0.8)',
                  padding: '1px 6px',
                  borderRadius: '3px',
                }}>{nodeType}</span>
              )}
            </div>
          );
        })(),
        document.body
      )}
    </div>
  );
}
