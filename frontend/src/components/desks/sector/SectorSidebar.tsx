import './SectorSidebar.css';

interface SectorSidebarProps {
    year?: string;
    quarter?: string;
}

export function SectorSidebar({ year, quarter }: SectorSidebarProps) {
    return (
        <div className="dashboard-sidebar-container">
            <div style={{
                padding: '24px',
                color: 'var(--muted-foreground)',
                textAlign: 'center'
            }}>
                <p>SectorSidebar placeholder</p>
                <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
                    Legacy dashboard code removed. Component ready for new implementation.
                </p>
                {year && quarter && (
                    <p style={{ fontSize: '0.75rem', marginTop: '8px', opacity: 0.7 }}>
                        Selected: {quarter} {year}
                    </p>
                )}
            </div>
        </div>
    );
}

export default SectorSidebar;
