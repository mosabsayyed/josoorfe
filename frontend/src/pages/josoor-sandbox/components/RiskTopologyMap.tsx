import React from 'react';

export interface Node {
    id: string;
    label?: string;
    group?: number;
    value?: number;
    color?: string;
    properties?: any;
    x?: number;
    y?: number;
}

interface RiskTopologyMapProps {
    year: string;
    quarter: string;
}

export const RiskTopologyMap: React.FC<RiskTopologyMapProps> = ({ year, quarter }) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            background: 'var(--component-bg-primary)',
            color: 'var(--component-text-secondary)',
            border: '1px solid var(--component-panel-border)',
            borderRadius: '8px'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h3>Risk Topology Map</h3>
                <p>Component is currently under maintenance or migration.</p>
                <p>Period: {year} {quarter}</p>
            </div>
        </div>
    );
};
