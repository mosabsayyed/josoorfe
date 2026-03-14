import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from 'react-i18next';
import ForceGraph3D from "react-force-graph-3d";
import ForceGraph2D from "react-force-graph-2d";
import { GraphData } from "../../types/dashboard";
import { LayoutMode, HierarchySource, computeLayout } from './graphLayouts';

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

  // Layout engine props
  layoutMode?: LayoutMode;
  hierarchySource?: HierarchySource;
  is3D?: boolean;
}

// Distinct colors per ontology node type — matches GraphDataTable LABEL_COLORS
const LABEL_COLORS: Record<string, string> = {
  SectorObjective: '#3b82f6', SectorPolicyTool: '#8b5cf6', SectorAdminRecord: '#06b6d4',
  SectorBusiness: '#f59e0b', SectorCitizen: '#10b981', SectorGovEntity: '#ef4444',
  SectorDataTransaction: '#ec4899', SectorPerformance: '#f97316',
  EntityCapability: '#6366f1', EntityOrgUnit: '#14b8a6', EntityProcess: '#a855f7',
  EntityITSystem: '#0ea5e9', EntityProject: '#84cc16', EntityChangeAdoption: '#e879f9',
  EntityRisk: '#f43f5e', EntityCultureHealth: '#22d3ee', EntityVendor: '#fb923c',
};

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
  legendConfig,
  layoutMode = 'sphere',
  hierarchySource = 'parent_of',
  is3D: is3DProp = true,
}: NeoGraphProps) {

  const { t } = useTranslation();
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoverNode, setHoverNode] = useState<any>(null);
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
    // Distinct color per node type
    const nodeType = node.labels?.[0] || node.type;
    if (nodeType && LABEL_COLORS[nodeType]) {
      return LABEL_COLORS[nodeType];
    }
    // Fallback: theme accent
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

  // 3. Layout computation via layout engine
  const graphData = React.useMemo(() => {
    if (!data || !data.nodes) return { nodes: [], links: [] };

    const links = data.links ? data.links.map(l => ({ ...l })) : [];
    const nodes = computeLayout(
      data.nodes.map(n => ({ ...n })),
      links,
      layoutMode,
      hierarchySource
    );

    return { nodes, links };
  }, [data, layoutMode, hierarchySource]);

  // Click zoom handler
  const handleNodeClick = (node: any) => {
    if (onNodeClick) onNodeClick(node);

    const fg = graphRef.current;
    if (!fg || !is3DProp) return;

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

  // Force-directed needs longer simulation
  const forceProps = layoutMode === 'force' ? {
    cooldownTicks: 200,
    d3AlphaDecay: 0.02,
    d3VelocityDecay: 0.3,
  } : {
    cooldownTicks: 100,
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }} onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
      {(dimensions.width > 0 && dimensions.height > 0) ? (
        is3DProp ? <ForceGraph3D {...commonProps} {...forceProps} /> : <ForceGraph2D {...commonProps} {...forceProps} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {t('josoor.dashboard.graph.preparingCanvas')}
        </div>
      )}

      {/* Minimal hover tooltip — just Name · Type */}
      {hoverNode && createPortal(
        (() => {
          const nodeProps = hoverNode.properties || hoverNode.nProps || {};
          // domain_id comes from chains; for custom queries fall back to the node id
          const rawDomainId = hoverNode.domain_id || nodeProps.domain_id || '';
          // If no domain_id, extract just the numeric part from the node id
          const rawId = String(hoverNode.id || '');
          const numericId = rawId.includes(':') ? rawId.split(':').pop() || rawId : rawId;
          const domainId = rawDomainId || numericId;
          const namePart = hoverNode.name || nodeProps.name || nodeProps.title || hoverNode.label || String(hoverNode.id || 'Node');
          const nodeName = domainId ? `${domainId} ${namePart}` : namePart;
          const nodeType = (hoverNode.labels && hoverNode.labels.length > 0)
            ? hoverNode.labels.filter((l: string) => l !== 'Unknown')[0]
            : (hoverNode.label && hoverNode.label !== 'Unknown' ? hoverNode.label : '');
          const level = nodeProps.level || '';

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
              {domainId && (
                <span style={{ fontSize: '10px', fontWeight: 700, color: isDark ? '#F4BB30' : '#B8860B' }}>{domainId}</span>
              )}
              <span style={{ fontWeight: 600, color: isDark ? '#F9FAFB' : '#111827' }}>{namePart}</span>
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
              {level && (
                <span style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  color: isDark ? '#6EE7B7' : '#059669',
                }}>{level}</span>
              )}
            </div>
          );
        })(),
        document.body
      )}
    </div>
  );
}
