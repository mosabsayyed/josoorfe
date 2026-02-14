import React, { useState } from 'react';

interface ExpandableNodeListProps {
    sampleIds: string[];
    totalCount: number;
    isDark?: boolean;
}

/**
 * Component to display first 3 nodes with "Show All" expansion
 * Used in GraphSankey aggregate node tooltips
 */
export function ExpandableNodeList({ sampleIds, totalCount, isDark = true }: ExpandableNodeListProps) {
    const [showAll, setShowAll] = useState(false);
    
    const displayIds = showAll ? sampleIds : sampleIds.slice(0, 3);
    const hasMore = totalCount > 3;
    
    return (
        <div style={{ fontSize: '11px', opacity: 0.7, borderTop: `1px solid ${isDark ? '#555' : '#ddd'}`, paddingTop: '6px' }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Node IDs ({totalCount} total):</div>
            <div style={{ marginLeft: '8px', maxHeight: showAll ? '200px' : 'none', overflowY: showAll ? 'auto' : 'visible' }}>
                {displayIds.map((id, idx) => (
                    <div key={idx} style={{ marginBottom: '2px' }}>
                        • {id}
                    </div>
                ))}
                {hasMore && !showAll && (
                    <div style={{ 
                        marginTop: '6px', 
                        cursor: 'pointer',
                        color: '#D4AF37',
                        fontWeight: '600',
                        textDecoration: 'underline'
                    }} onClick={(e) => {
                        e.stopPropagation();
                        setShowAll(true);
                    }}>
                        + Show all {totalCount} nodes
                    </div>
                )}
                {showAll && hasMore && (
                    <div style={{ 
                        marginTop: '6px', 
                        cursor: 'pointer',
                        color: '#D4AF37',
                        fontWeight: '600',
                        textDecoration: 'underline'
                    }} onClick={(e) => {
                        e.stopPropagation();
                        setShowAll(false);
                    }}>
                        - Show less
                    </div>
                )}
            </div>
        </div>
    );
}
