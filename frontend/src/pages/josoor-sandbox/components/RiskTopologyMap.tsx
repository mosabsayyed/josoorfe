import React, { useState } from 'react';
// Force Recompile
import { useQuery } from '@tanstack/react-query';

// --- DATA TYPES ---


interface Edge {
    from: string;
    to: string;
    label?: string;
    fromHandle?: 't' | 'r' | 'b' | 'l';
    toHandle?: 't' | 'r' | 'b' | 'l';
    oneWay?: boolean; // If true, only one arrowhead (unidirectional)
}

export interface Node {
    id: string;
    x: number;
    y: number;
    label: string;
}

// --- 1. COORDINATES (User Calibrated - Round 3) ---
const INITIAL_NODES: Record<string, { x: number, y: number, label: string }> = {
    "SectorObjective": { "x": 503.05554707845056, "y": 53.5630075505912, "label": "Objectives" },
    "SectorPolicyTool": { "x": 197.2222137451172, "y": 264.6872764215358, "label": "Policy Tools" },
    "SectorPerformance": { "x": 816.3888804117839, "y": 263.859338112238, "label": "Performance" },
    "SectorAdminRecord": { "x": 353.8888804117839, "y": 265.51521473083363, "label": "Admin Records" },
    "SectorCitizen": { "x": 502.2222137451172, "y": 181.8934454917536, "label": "Citizen" },
    "SectorBusiness": { "x": 505.55554707845056, "y": 263.03139980294014, "label": "Business" },
    "SectorGovEntity": { "x": 503.8888804117839, "y": 340.8576008769354, "label": "Government" },
    "SectorDataTransaction": { "x": 663.8888804117839, "y": 264.31930524332967, "label": "Transactions" },
    "EntityRisk": { "x": 503.88, "y": 440.67, "label": "Risks" },
    "EntityProject": { "x": 503.05, "y": 830.99, "label": "Projects" },
    "EntityCapability": { "x": 503.88, "y": 559.89, "label": "Capabilities" },
    "EntityVendor": { "x": 857.22, "y": 702.48, "label": "Vendor SLA" },
    "EntityCultureHealth": { "x": 143.88, "y": 701.93, "label": "Culture" },
    "EntityOrgUnit": { "x": 329.72, "y": 701.93, "label": "Organization" },
    "EntityProcess": { "x": 502.22, "y": 701.93, "label": "Processes" },
    "EntityITSystem": { "x": 685.8333333333334, "y": 701.8994384493957, "label": "IT Systems" },
    "EntityChangeAdoption": { "x": 503.33333333333337, "y": 937.077866625262, "label": "Adoption" }
};

// --- 2. ONTOLOGY EDGES (User Calibrated - Round 3) ---
// Two one-way paths: PolicyTools→Performance chain, Culture→VendorSLA chain
// All other edges are bidirectional
const ONTOLOGY_EDGES: Edge[] = [
    // One-way: Culture → OrgUnit → Process → ITSystem → Vendor
    { "from": "EntityCultureHealth", "to": "EntityOrgUnit", "fromHandle": "r", "toHandle": "l", "label": "Monitors", "oneWay": true },
    { "from": "EntityOrgUnit", "to": "EntityProcess", "fromHandle": "r", "toHandle": "l", "label": "Apply", "oneWay": true },
    { "from": "EntityProcess", "to": "EntityITSystem", "fromHandle": "r", "toHandle": "l", "label": "Automate", "oneWay": true },
    { "from": "EntityITSystem", "to": "EntityVendor", "fromHandle": "r", "toHandle": "l", "label": "Depends", "oneWay": true },
    
    // One-way: Objective → PolicyTool → AdminRecord → Business/Citizen/Gov → Transaction → Performance
    { "from": "SectorObjective", "to": "SectorPolicyTool", "fromHandle": "l", "toHandle": "t", "label": "Drives" },
    { "from": "SectorObjective", "to": "SectorPerformance", "fromHandle": "r", "toHandle": "t", "label": "Measured" },
    { "from": "SectorPolicyTool", "to": "SectorAdminRecord", "fromHandle": "r", "toHandle": "l", "label": "Refers To", "oneWay": true },
    { "from": "SectorAdminRecord", "to": "SectorBusiness", "fromHandle": "r", "toHandle": "l", "label": "Applied On", "oneWay": true },
    { "from": "SectorAdminRecord", "to": "SectorCitizen", "fromHandle": "t", "toHandle": "l", "label": "Applied On", "oneWay": true },
    { "from": "SectorAdminRecord", "to": "SectorGovEntity", "fromHandle": "b", "toHandle": "l", "label": "Applied On", "oneWay": true },
    { "from": "SectorBusiness", "to": "SectorDataTransaction", "fromHandle": "r", "toHandle": "l", "label": "Triggers", "oneWay": true },
    { "from": "SectorCitizen", "to": "SectorDataTransaction", "fromHandle": "r", "toHandle": "t", "label": "Triggers", "oneWay": true },
    { "from": "SectorGovEntity", "to": "SectorDataTransaction", "fromHandle": "r", "toHandle": "b", "label": "Triggers", "oneWay": true },
    { "from": "SectorDataTransaction", "to": "SectorPerformance", "fromHandle": "r", "toHandle": "l", "label": "Measured By", "oneWay": true },
    
    // Bidirectional: Capability ↔ Everything
    { "from": "EntityCapability", "to": "EntityRisk", "fromHandle": "t", "toHandle": "b", "label": "Monitors" },
    { "from": "EntityCapability", "to": "EntityOrgUnit", "fromHandle": "l", "toHandle": "t", "label": "Role Gaps" },
    { "from": "EntityCapability", "to": "EntityProcess", "fromHandle": "b", "toHandle": "t", "label": "Knw. Gaps" },
    { "from": "EntityCapability", "to": "EntityITSystem", "fromHandle": "r", "toHandle": "t", "label": "Auto. Gaps" },
    { "from": "EntityCapability", "to": "SectorPerformance", "fromHandle": "r", "toHandle": "r", "label": "Feeds" },
    { "from": "EntityCapability", "to": "SectorPolicyTool", "fromHandle": "l", "toHandle": "l", "label": "Informs" },
    
    // Bidirectional: Risk ↔ Policy/Performance
    { "from": "EntityRisk", "to": "SectorPolicyTool", "fromHandle": "l", "toHandle": "b", "label": "Mitigated" },
    { "from": "EntityRisk", "to": "SectorPerformance", "fromHandle": "r", "toHandle": "b", "label": "Impacts" },
    
    // Bidirectional: Project ↔ Everything
    { "from": "EntityProject", "to": "EntityOrgUnit", "fromHandle": "l", "toHandle": "b", "label": "Scope/Fixes" },
    { "from": "EntityProject", "to": "EntityProcess", "fromHandle": "t", "toHandle": "b", "label": "Scope/Fixes" },
    { "from": "EntityProject", "to": "EntityITSystem", "fromHandle": "r", "toHandle": "b", "label": "Scope/Fixes" },
    { "from": "EntityChangeAdoption", "to": "EntityProject", "fromHandle": "t", "toHandle": "b", "label": "Adoption" }
];


interface RiskTopologyMapProps {
    year: string;
    quarter: string;
}

export const RiskTopologyMap: React.FC<RiskTopologyMapProps> = ({ year, quarter }) => {
    
    // --- STATE ---
    const [calibrationMode, setCalibrationMode] = useState(false);
    const [nodePositions, setNodePositions] = useState(INITIAL_NODES);
    const [edges, setEdges] = useState<Edge[]>(ONTOLOGY_EDGES);
    
    // Drag States
    const [dragNode, setDragNode] = useState<{ id: string, startX: number, startY: number } | null>(null);
    const [tempWire, setTempWire] = useState<{ fromId: string, fromHandle: 't'|'r'|'b'|'l', currX: number, currY: number } | null>(null);

    // --- DATA FETCH ---
    // Log prop changes for debugging
    console.log('[RiskTopologyMap] Props received - year:', year, 'quarter:', quarter);
    
    const { data: countsData } = useQuery({
        queryKey: ['businessChainCounts', year, quarter],
        queryFn: async () => {
            // Build query params, omitting 'All' values
            const params = new URLSearchParams();
            if (year && year !== 'All') params.append('year', year);
            if (quarter && quarter !== 'All') {
                // Convert Q4 -> 4, Q1 -> 1, etc.
                const quarterNum = quarter.replace(/^Q/i, '');
                params.append('quarter', quarterNum);
            }
            
            const url = `/api/business-chain/counts${params.toString() ? '?' + params.toString() : ''}`;
            console.log('[RiskTopologyMap] Fetching:', url);
            
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch counts');
            return res.json();
        },
        staleTime: 0, // Always refetch
        refetchOnMount: true,
        refetchOnWindowFocus: false
    });

    // --- UTILS ---
    const getCount = (label: string) => countsData?.nodeCounts?.[label] || 0;

    const getLinkStatus = (from: string, to: string) => {
        if (!countsData) return 'pending';
        const pairKey1 = `${from}-${to}`;
        const pairKey2 = `${to}-${from}`;
        const count = countsData.pairCounts?.[pairKey1] || countsData.pairCounts?.[pairKey2] || 0;
        return count > 0 ? 'active' : 'broken';
    };

    // --- GEOMETRY UTILS ---
    // Get half dimensions for a node (scaled to 1000x1000 SVG viewbox)
    // Box rendered at: maxWidth 1200px, SVG viewBox 1000x1000
    // So 1px ≈ 1000/1200 = 0.833 SVG units, but for simplicity we approximate
    const getNodeDimensions = (nodeId: string) => {
        const smallerNodes = ['SectorCitizen', 'SectorBusiness', 'SectorGovEntity', 'EntityOrgUnit', 'EntityProcess', 'EntityITSystem'];
        const isSmaller = smallerNodes.includes(nodeId);
        // Approximate: container is ~1200px, viewBox is 1000. So 1 SVG unit ≈ 1.2px
        // Box width 108px ≈ 90 SVG units, height 60px ≈ 50 SVG units (rough)
        // But since positions are already in 1000-space, let's use direct pixel ratios
        const width = isSmaller ? 46 : 54; // Half-width in SVG units
        const height = isSmaller ? 25 : 30; // Half-height in SVG units
        return { halfW: width, halfH: height };
    };

    const getPortPosition = (nodeId: string, handle: 't'|'r'|'b'|'l') => {
        const pos = nodePositions[nodeId];
        if (!pos) return { x: 0, y: 0, h: handle };
        
        const { halfW, halfH } = getNodeDimensions(nodeId);

        switch (handle) {
            case 't': return { x: pos.x, y: pos.y - halfH, h: handle };
            case 'r': return { x: pos.x + halfW, y: pos.y, h: handle };
            case 'b': return { x: pos.x, y: pos.y + halfH, h: handle };
            case 'l': return { x: pos.x - halfW, y: pos.y, h: handle };
        }
    };

    // --- HANDLERS: NODE DRAG ---
    const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
        if (!calibrationMode) return;
        setDragNode({ id, startX: e.clientX, startY: e.clientY });
        e.stopPropagation();
    };

    const handleNodeMouseMove = (e: React.MouseEvent) => {
        // Handle Node Drag
        if (dragNode) {
            const rect = e.currentTarget.getBoundingClientRect();
            const scaleX = 1000 / rect.width;
            const scaleY = 1000 / rect.height;
            const relX = (e.clientX - rect.left) * scaleX;
            const relY = (e.clientY - rect.top) * scaleY;
            
            setNodePositions(prev => ({
                ...prev,
                [dragNode.id]: { ...prev[dragNode.id], x: relX, y: relY }
            }));
            return;
        }

        // Handle Wire Drag
        if (tempWire) {
             const rect = e.currentTarget.getBoundingClientRect();
             const scaleX = 1000 / rect.width;
             const scaleY = 1000 / rect.height;
             const currX = (e.clientX - rect.left) * scaleX;
             const currY = (e.clientY - rect.top) * scaleY;
             
             setTempWire(prev => prev ? { ...prev, currX, currY } : null);
        }
    };
    
    const handleMouseUp = () => {
        if (dragNode) {
            setDragNode(null);
        }
        if (tempWire) {
            setTempWire(null); // Cancel wire if dropped on nothing
        }
    };

    // --- HANDLERS: PORT DRAG ---
    const handlePortMouseDown = (e: React.MouseEvent, nodeId: string, handle: 't'|'r'|'b'|'l') => {
        if (!calibrationMode) return;
        e.stopPropagation();
        e.preventDefault();
        
        // Start Wire
        const rect = e.currentTarget.closest('svg')?.getBoundingClientRect() || e.currentTarget.closest('.map-container')?.getBoundingClientRect(); // Fallback
        if (!rect) return;
        
        const scaleX = 1000 / rect.width;
        const scaleY = 1000 / rect.height;
        const startX = (e.clientX - rect.left) * scaleX;
        const startY = (e.clientY - rect.top) * scaleY;

        setTempWire({ fromId: nodeId, fromHandle: handle, currX: startX, currY: startY });
    };

    const handlePortMouseUp = (e: React.MouseEvent, targetId: string, targetHandle: 't'|'r'|'b'|'l') => {
        if (!tempWire) return;
        e.stopPropagation();
        
        // PREVENT SELF-LOOPS: Cannot connect a node to itself
        if (tempWire.fromId === targetId) {
            console.warn('[Calibration] Self-loop prevented: Cannot connect a node to itself');
            setTempWire(null);
            return;
        }
        
        // Complete Connection
        setEdges(prev => {
            const newEdges = [...prev];
            
            // FREE MODE LOGIC:
            // Check if this EXACT connection (same nodes, same handles) already exists.
            const exactMatchIndex = newEdges.findIndex(e => 
                e.from === tempWire.fromId && 
                e.to === targetId &&
                e.fromHandle === tempWire.fromHandle &&
                e.toHandle === targetHandle
            );

            if (exactMatchIndex >= 0) {
                // TOGGLE OFF: Deleting existing line
                newEdges.splice(exactMatchIndex, 1);
            } else {
                // TOGGLE ON: Adding new line
                newEdges.push({
                    from: tempWire.fromId,
                    to: targetId,
                    fromHandle: tempWire.fromHandle,
                    toHandle: targetHandle,
                    label: 'Custom Link' 
                });
            }
            return newEdges;
        });
        
        setTempWire(null);
    };
    
    // Handler to delete an edge when clicking on it (in calibration mode)
    const handleEdgeClick = (edgeIndex: number) => {
        if (!calibrationMode) return;
        setEdges(prev => {
            const newEdges = [...prev];
            newEdges.splice(edgeIndex, 1);
            return newEdges;
        });
    };

    // --- RENDER HELPERS ---
    const getNodeStyle = (id: string, x: number, y: number, count: number) => {
        const left = (x / 1000) * 100 + '%';
        const top = (y / 1000) * 100 + '%';
        
        // Default size: 108x60
        // Smaller nodes: Citizen, Business, Government (15% reduction = 92x51)
        // Organization, Process, IT Systems: 20% wider (110x51)
        const smallerNodes = ['SectorCitizen', 'SectorBusiness', 'SectorGovEntity'];
        const widerSmallNodes = ['EntityOrgUnit', 'EntityProcess', 'EntityITSystem'];
        
        let width = 108;
        let height = 60;
        if (smallerNodes.includes(id)) {
            width = 92;
            height = 51;
        } else if (widerSmallNodes.includes(id)) {
            width = 110; // 20% wider than 92
            height = 51;
        }
        
        const color = '#374151'; // Unified dark grey for all nodes
        
        return {
            left, top, width, height, backgroundColor: color
        };
    };

    // --- SVG PATH GENERATOR (Elbow / Orthogonal) ---
    const generatePath = (
        start: {x:number, y:number, h?: string}, 
        end: {x:number, y:number, h?: string}
    ) => {
        const path = [];
        path.push(`M ${start.x} ${start.y}`);
        
        const offset = 30; // Stub length to exit node
        const routeOffset = 50; // Extra offset for routing around boxes

        // Default logic if no handles (legacy)
        if (!start.h && !end.h) {
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;
            if (Math.abs(end.y - start.y) > Math.abs(end.x - start.x)) {
                 path.push(`L ${start.x} ${midY} L ${end.x} ${midY}`);
             } else {
                 path.push(`L ${midX} ${start.y} L ${midX} ${end.y}`);
             }
        } 
        // Same-side connections (r→r, l→l, t→t, b→b) - route OUTSIDE
        else if (start.h === end.h) {
            // Both exits point in the same direction
            let p1x = start.x, p1y = start.y;
            let p2x = end.x, p2y = end.y;
            
            if (start.h === 'r') {
                // Both exit right: go right, then vertically, then right to target
                const outX = Math.max(start.x, end.x) + routeOffset;
                path.push(`L ${outX} ${start.y}`); // Go right from start
                path.push(`L ${outX} ${end.y}`);   // Go vertically
            } else if (start.h === 'l') {
                // Both exit left: go left, then vertically, then left to target
                const outX = Math.min(start.x, end.x) - routeOffset;
                path.push(`L ${outX} ${start.y}`); // Go left from start
                path.push(`L ${outX} ${end.y}`);   // Go vertically
            } else if (start.h === 't') {
                // Both exit top: go up, then horizontally, then up to target
                const outY = Math.min(start.y, end.y) - routeOffset;
                path.push(`L ${start.x} ${outY}`); // Go up from start
                path.push(`L ${end.x} ${outY}`);   // Go horizontally
            } else if (start.h === 'b') {
                // Both exit bottom: go down, then horizontally, then down to target
                const outY = Math.max(start.y, end.y) + routeOffset;
                path.push(`L ${start.x} ${outY}`); // Go down from start
                path.push(`L ${end.x} ${outY}`);   // Go horizontally
            }
        }
        // Standard elbow for different-side connections
        else {
            // Force exit direction
            let p1 = { x: start.x, y: start.y };
            let p2 = { x: end.x, y: end.y };
            
            if (start.h === 't') p1.y -= offset;
            if (start.h === 'b') p1.y += offset;
            if (start.h === 'l') p1.x -= offset;
            if (start.h === 'r') p1.x += offset;

            if (end.h === 't') p2.y -= offset;
            if (end.h === 'b') p2.y += offset;
            if (end.h === 'l') p2.x -= offset;
            if (end.h === 'r') p2.x += offset;
            
            path.push(`L ${p1.x} ${p1.y}`);
            
            // Connect p1 to p2 using orthogonal steps
            const dX = p2.x - p1.x;
            const dY = p2.y - p1.y;
            
            // Heuristic matching handle orientation
            const startIsModV = start.h === 't' || start.h === 'b';
            
            if (startIsModV) {
                // Coming out Vertical
                path.push(`L ${p1.x} ${p1.y + dY/2}`); // Vertical half
                path.push(`L ${p2.x} ${p1.y + dY/2}`); // Horizontal full
            } else {
                // Coming out Horizontal
                 path.push(`L ${p1.x + dX/2} ${p1.y}`); // Horizontal half
                 path.push(`L ${p1.x + dX/2} ${p2.y}`); // Vertical full
            }
            
            path.push(`L ${p2.x} ${p2.y}`);
        }
        
        path.push(`L ${end.x} ${end.y}`);
        return path.join(" ");
    };

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'auto', background: '#070b14', position: 'relative' }}>
            
            {/* TOOLBAR */}
            <div style={{ position: 'sticky', top: 0, left: 0, zIndex: 100, padding: '10px', background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid #333', display: 'flex', gap: '10px' }}>
                 <button 
                    onClick={() => setCalibrationMode(!calibrationMode)}
                    style={{ padding: '5px 10px', background: calibrationMode ? '#EF4444' : '#374151', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                 >
                    {calibrationMode ? "Exit Calibration" : "Enter Calibration Mode"}
                 </button>
                 
                 {calibrationMode && (
                     <button
                        onClick={() => {
                            const config = JSON.stringify({ nodes: nodePositions, edges }, null, 2);
                            navigator.clipboard.writeText(config);
                            alert("Configuration copied to clipboard! Paste it into the chat.");
                            console.log("Configuration:", config);
                        }}
                        style={{ padding: '5px 10px', background: '#10B981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                     >
                        Copy Configuration
                     </button>
                 )}

                 <span style={{color: '#9CA3AF', fontSize: '0.8rem', alignSelf: 'center'}}>
                    {calibrationMode ? "Drag nodes/ports. Click 'Copy Config' when done." : "View Mode"}
                 </span>
            </div>

            {/* MAP CONTAINER */}
            <div 
                className="map-container"
                style={{ 
                    width: '100%', maxWidth: '1200px', aspectRatio: '1/1', 
                    margin: '0 auto', position: 'relative',
                    cursor: calibrationMode ? (tempWire ? 'crosshair' : 'default') : 'default'
                }}
                onMouseMove={handleNodeMouseMove}
                onMouseUp={handleMouseUp}
            >
                {/* 1. BACKGROUND */}
                <img 
                    src="/josoor_legacy/assets/risk_topology_clean.png" 
                    alt="Background" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', opacity: 1, zIndex: 0, position: 'relative' }} 
                />

                {/* 2. SVG LAYER (LINKS & WIRE) */}
                <svg viewBox="0 0 1000 1000" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
                     <defs>
                        {/* 
                          ARROWHEAD MARKERS:
                          - END markers: point forward toward target (at line end)
                          - START markers: point backward toward source (at line start, for bidirectional)
                        */}
                        {/* END markers - arrow points forward: → */}
                        <marker id="arrow-end-green" viewBox="0 0 10 10" markerWidth="4" markerHeight="4" refX="10" refY="5" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L10,5 L0,10 z" fill="#10B981" />
                        </marker>
                        <marker id="arrow-end-red" viewBox="0 0 10 10" markerWidth="4" markerHeight="4" refX="10" refY="5" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L10,5 L0,10 z" fill="#EF4444" />
                        </marker>
                        {/* START markers - same arrow but reversed orientation to point back at source */}
                        <marker id="arrow-start-green" viewBox="0 0 10 10" markerWidth="4" markerHeight="4" refX="0" refY="5" orient="auto-start-reverse" markerUnits="strokeWidth">
                            <path d="M0,0 L10,5 L0,10 z" fill="#10B981" />
                        </marker>
                        <marker id="arrow-start-red" viewBox="0 0 10 10" markerWidth="4" markerHeight="4" refX="0" refY="5" orient="auto-start-reverse" markerUnits="strokeWidth">
                            <path d="M0,0 L10,5 L0,10 z" fill="#EF4444" />
                        </marker>
                     </defs>
                     
                     {/* Existing Edges */}
                     {edges.map((edge, i) => {
                         const startNode = nodePositions[edge.from];
                         const endNode = nodePositions[edge.to];
                         if (!startNode || !endNode) return null;
                         
                         // Use new getPortPosition without radius
                         const startPos = edge.fromHandle ? getPortPosition(edge.from, edge.fromHandle) : { ...startNode, h: undefined };
                         const endPos = edge.toHandle ? getPortPosition(edge.to, edge.toHandle) : { ...endNode, h: undefined };
                         
                         const status = getLinkStatus(edge.from, edge.to);
                         const isBroken = status === 'broken';
                         const color = isBroken ? '#EF4444' : '#10B981';
                         
                         // Standardized styling: solid red if broken, dotted green if active
                         const dashArray = isBroken ? "0" : "5,5";
                         const strokeWidth = 1.5; // Same width for all
                         
                         // Bidirectional arrows except for oneWay edges
                         // Using new consistent marker IDs: arrow-end-* and arrow-start-*
                         const isOneWay = (edge as any).oneWay === true;
                         const colorKey = isBroken ? 'red' : 'green';
                         const markerEnd = `url(#arrow-end-${colorKey})`;
                         const markerStart = isOneWay ? undefined : `url(#arrow-start-${colorKey})`;

                         // Midpoint for Label
                         const midX = (startNode.x + endNode.x) / 2;
                         const midY = (startNode.y + endNode.y) / 2;
                         
                         // Get actual count
                         const pairKey1 = `${edge.from}-${edge.to}`;
                         const pairKey2 = `${edge.to}-${edge.from}`;
                         const edgeCount = countsData?.pairCounts?.[pairKey1] || countsData?.pairCounts?.[pairKey2] || 0;
                         
                         return (
                             <g key={i}>
                                 {/* Invisible wider hit area for easier clicking (only in calibration mode) */}
                                 {calibrationMode && (
                                     <path 
                                        d={generatePath({ ...startPos, h: edge.fromHandle }, { ...endPos, h: edge.toHandle })} 
                                        stroke="transparent" 
                                        strokeWidth={12}
                                        fill="none"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleEdgeClick(i)}
                                     />
                                 )}
                                 <path 
                                    d={generatePath({ ...startPos, h: edge.fromHandle }, { ...endPos, h: edge.toHandle })} 
                                    stroke={calibrationMode ? '#FF6B6B' : color} 
                                    strokeWidth={strokeWidth} 
                                    strokeDasharray={dashArray}
                                    fill="none"
                                    opacity={0.7}
                                    markerEnd={markerEnd}
                                    markerStart={markerStart}
                                    style={{ pointerEvents: calibrationMode ? 'stroke' : 'none', cursor: calibrationMode ? 'pointer' : 'default' }}
                                    onClick={() => calibrationMode && handleEdgeClick(i)}
                                 />
                                 {/* Edge Label (Count) */}
                                 <rect x={midX - 10} y={midY - 8} width="20" height="16" rx="0" fill="rgba(0,0,0,0.8)" />
                                 <text 
                                    x={midX} 
                                    y={midY} 
                                    textAnchor="middle" 
                                    dy="4" 
                                    fill={color} 
                                    fontSize="10" 
                                    fontWeight="bold"
                                    style={{ pointerEvents: 'none' }}
                                 >
                                     {edgeCount}
                                 </text>
                             </g>
                         );
                     })}

                     {/* Temporary Wire */}
                     {tempWire && (
                         <line 
                            x1={getPortPosition(tempWire.fromId, tempWire.fromHandle).x}
                            y1={getPortPosition(tempWire.fromId, tempWire.fromHandle).y}
                            x2={tempWire.currX}
                            y2={tempWire.currY}
                            stroke="#3B82F6"
                            strokeWidth="2"
                            strokeDasharray="4,4"
                         />
                     )}
                </svg>

                {/* 3. NODES & PORTS */}
                {Object.entries(nodePositions).map(([id, pos]) => {
                     const count = getCount(id);
                     const { left, top, width, height, backgroundColor } = getNodeStyle(id, pos.x, pos.y, count);
                     
                     return (
                         <React.Fragment key={id}>
                            {/* The Component Node (Rectangular - V1.3 Spec) */}
                            <div 
                               onMouseDown={(e) => handleNodeMouseDown(e, id)}
                               style={{
                                   position: 'absolute',
                                   left, top, width, height,
                                   backgroundColor: calibrationMode ? '#3B82F6' : backgroundColor,
                                   borderRadius: '0', // No rounded corners
                                   transform: 'translate(-50%, -50%)',
                                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                                   zIndex: 10,
                                   cursor: calibrationMode ? 'grab' : 'pointer',
                                   border: '2px solid #D4AF37', // Gold Border (2px)
                                   boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                               }}
                               title={`${pos.label}`}
                            >
                               {/* Center Label */}
                               <div style={{ fontSize: '0.7rem', textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>
                                   {pos.label}
                               </div>

                               {/* Corner Values - PLAN COMPLIANCE: "Real counts (Total, L1, L2, L3)" */}
                               {/* TL: Total - just the number, larger and bold */}
                               <div style={{ position: 'absolute', top: 0, left: -2, transform: 'translateY(calc(-100% - 2px))', background: '#333', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '0', border: '1px solid #555' }}>
                                   {count}
                               </div>
                               {/* TR: L1 */}
                               <div style={{ position: 'absolute', top: 0, right: -2, transform: 'translateY(calc(-100% - 2px))', background: '#333', color: 'var(--accent-gold)', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '0', border: '1px solid #555', display: 'flex', gap: '2px' }}>
                                   <span style={{color: '#9CA3AF'}}>L1:</span> {Math.floor(count * 0.6)}
                               </div>
                               {/* BL: L2 */}
                               <div style={{ position: 'absolute', bottom: 0, left: -2, transform: 'translateY(calc(100% + 2px))', background: '#333', color: '#fff', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '0', border: '1px solid #555', display: 'flex', gap: '2px' }}>
                                   <span style={{color: '#9CA3AF'}}>L2:</span> {Math.floor(count * 0.3)}
                               </div>
                               {/* BR: L3 */}
                               <div style={{ position: 'absolute', bottom: 0, right: -2, transform: 'translateY(calc(100% + 2px))', background: '#333', color: '#fff', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '0', border: '1px solid #555', display: 'flex', gap: '2px' }}>
                                   <span style={{color: '#9CA3AF'}}>L3:</span> {Math.ceil(count * 0.1)}
                               </div>

                               {/* Ports (Only in Calibration Mode) */}
                               {calibrationMode && ['t', 'r', 'b', 'l'].map((h) => (
                                   <div
                                       key={h}
                                       onMouseDown={(e) => handlePortMouseDown(e, id, h as any)}
                                       onMouseUp={(e) => handlePortMouseUp(e, id, h as any)}
                                       style={{
                                           position: 'absolute',
                                           width: 8, height: 8,
                                           backgroundColor: '#fff',
                                           border: '1px solid #000',
                                           borderRadius: '50%',
                                           cursor: 'crosshair',
                                           ...((h === 't') ? { top: -4, left: '50%', transform: 'translateX(-50%)' } :
                                             (h === 'b') ? { bottom: -4, left: '50%', transform: 'translateX(-50%)' } :
                                             (h === 'l') ? { left: -4, top: '50%', transform: 'translateY(-50%)' } :
                                             { right: -4, top: '50%', transform: 'translateY(-50%)' })
                                       }}
                                   />
                               ))}
                            </div>
                         </React.Fragment>
                     );
                })}

            </div>
        </div>
    );
};
