import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

// Icons
import { Factory, Database, RefreshCw, Globe, TrendingUp, AlertCircle } from 'lucide-react';

interface SectorKPIOverlayProps {
    kpis: any;
}

const SectorKPIOverlay: React.FC<SectorKPIOverlayProps> = ({ kpis }) => {
    const { t } = useTranslation();
    if (!kpis) return null;

    const data = [
        {
            key: 'production',
            label: t('josoor.sector.kpi.productionCap'),
            value: kpis.production_capacity.value,
            sub: t('josoor.sector.kpi.src', { source: kpis.production_capacity.source }),
            icon: Factory,
            color: 'var(--component-text-primary)',
            bg: 'var(--component-bg-primary)'
        },
        {
            key: 'storage',
            label: t('josoor.sector.kpi.stratStorage'),
            value: kpis.strategic_storage.value,
            sub: t('josoor.sector.kpi.target', { target: kpis.strategic_storage.target }),
            icon: Database,
            color: 'var(--component-color-success)',
            bg: 'var(--component-bg-primary)'
        },
        {
            key: 'reuse',
            label: t('josoor.sector.kpi.reuseRate'),
            value: kpis.reuse_rate.value,
            sub: t('josoor.sector.kpi.target', { target: kpis.reuse_rate.target }),
            icon: RefreshCw,
            color: 'var(--component-color-error)', // Lagging status
            accent: true,
            bg: 'rgba(239, 68, 68, 0.15)'
        },
        {
            key: 'local',
            label: t('josoor.sector.kpi.localContent'),
            value: kpis.localization_impact.value,
            sub: t('josoor.sector.kpi.economicImpact'),
            icon: Globe,
            color: 'var(--component-text-accent)',
            bg: 'var(--component-bg-primary)'
        }
    ];

    return (
        <div style={{
            position: 'absolute',
            top: '16px',
            left: '20px', // Align left, or maybe center? "At the top". Left is usually HUD standard.
            display: 'flex',
            gap: '12px',
            zIndex: 10,
            pointerEvents: 'none' // Click through to map
        }}>
            {data.map((item, idx) => (
                <motion.div
                    key={item.key}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (idx * 0.1) }}
                    style={{
                        background: item.bg,
                        backdropFilter: 'blur(8px)',
                        border: item.accent ? `1px solid ${item.color}` : '1px solid var(--component-panel-border)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: '120px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        pointerEvents: 'auto'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <item.icon size={12} color="var(--component-text-muted)" />
                        <span style={{ fontSize: '10px', color: 'var(--component-text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                            {item.label}
                        </span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: item.color, whiteSpace: 'nowrap' }}>
                        {item.value}
                    </div>
                    {item.sub && (
                        <div style={{ fontSize: '9px', color: item.accent ? item.color : 'var(--component-text-secondary)', marginTop: '2px', opacity: 0.8 }}>
                            {item.sub}
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
};

export default SectorKPIOverlay;
