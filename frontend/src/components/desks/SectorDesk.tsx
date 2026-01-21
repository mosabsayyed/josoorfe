import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { SectorSidebar } from './sector/SectorSidebar';
// import { DeckGLMap } from './sector/DeckGLMap';
import { SimpleKsaMap } from './sector/SimpleKsaMap';
import 'mapbox-gl/dist/mapbox-gl.css';

// Import Layout Styles reusing existing ones where applicable
// Or define inline for now to ensure structure
import '../../styles/GraphDashboard.css';

interface SectorDeskProps {
    year?: string;
    quarter?: string;
}

export const SectorDesk: React.FC<SectorDeskProps> = ({ year: propYear, quarter: propQuarter }) => {
    // Hooks must be called unconditionally
    const context = useOutletContext<{ year: string, quarter: string } | null>();

    const year = propYear || context?.year || '2025';
    const quarter = propQuarter || context?.quarter || 'Q4';

    return (
        <div className="sector-desk-container" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(350px, 20%) 1fr', // Sidebar uses 20%, Map uses rest
            gap: '12px',
            height: '100%',
            overflow: 'hidden',
            padding: '12px',
            boxSizing: 'border-box'
        }}>
            {/* Left Panel: KPI/Outcomes */}
            <div style={{
                height: '100%',
                overflowY: 'hidden', // Sidebar handles its own scrolling if properly styled
                display: 'flex',
                flexDirection: 'column'
            }}>
                <SectorSidebar year={year} quarter={quarter} />
            </div>

            {/* Main Panel: Map */}
            <div style={{
                height: '100%',
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'rgba(15, 23, 42, 0.6)', // Darker map background
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <SimpleKsaMap />
                {/* <DeckGLMap year={year} quarter={quarter} /> */}
            </div>
        </div>
    );
};
