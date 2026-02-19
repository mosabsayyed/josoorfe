import { useTranslation } from 'react-i18next';
import './SectorSidebar.css';

interface SectorSidebarProps {
    year?: string;
    quarter?: string;
}

export function SectorSidebar({ year, quarter }: SectorSidebarProps) {
    const { t } = useTranslation();
    return (
        <div className="dashboard-sidebar-container">
            <div style={{
                padding: '24px',
                color: 'var(--muted-foreground)',
                textAlign: 'center'
            }}>
                <p>{t('josoor.sector.sidebar.placeholder')}</p>
                <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
                    {t('josoor.sector.sidebar.legacyRemoved')}
                </p>
                {year && quarter && (
                    <p style={{ fontSize: '0.75rem', marginTop: '8px', opacity: 0.7 }}>
                        {t('josoor.sector.sidebar.selected', { quarter, year })}
                    </p>
                )}
            </div>
        </div>
    );
}

export default SectorSidebar;
