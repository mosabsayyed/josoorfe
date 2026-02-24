import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import './SectorReport.css';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { htmlToMarkdown } from '../../../utils/htmlToMarkdown';
import { StrategyReportChartRenderer } from './StrategyReportChartRenderer';
import { Artifact } from '../../../types/api';
import { InterventionOption } from '../../../utils/optionsParser';

interface StrategyReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    htmlContent: string;
    artifacts?: Artifact[];
    onContinueInChat: () => void;
    interventionOptions?: InterventionOption[] | null;
    onSelectOption?: (option: InterventionOption) => void;
    title?: string;
}

// OptionCard extracted to avoid hook-in-callback issues with hover state
const OptionCard: React.FC<{
    option: InterventionOption;
    onSelect?: (option: InterventionOption) => void;
    t: (key: string) => string;
}> = ({ option, onSelect, t }) => {
    const [hovered, setHovered] = React.useState(false);

    return (
        <button
            onClick={() => onSelect?.(option)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'var(--component-panel-bg)',
                borderTop: `1px solid ${hovered ? 'var(--component-text-accent)' : 'var(--component-panel-border)'}`,
                borderRight: `1px solid ${hovered ? 'var(--component-text-accent)' : 'var(--component-panel-border)'}`,
                borderBottom: `1px solid ${hovered ? 'var(--component-text-accent)' : 'var(--component-panel-border)'}`,
                borderLeft: '3px solid var(--component-text-accent)',
                borderRadius: '8px',
                padding: '14px 16px',
                cursor: 'pointer',
                boxShadow: hovered ? '0 0 12px rgba(244,187,48,0.15)' : 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                        margin: '0 0 6px 0',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: 'var(--component-text-primary)',
                        lineHeight: 1.3
                    }}>
                        {option.title}
                    </p>
                    {option.description && (
                        <p style={{
                            margin: '0 0 10px 0',
                            fontSize: '0.82rem',
                            color: 'var(--component-text-secondary)',
                            lineHeight: 1.5
                        }}>
                            {option.description}
                        </p>
                    )}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {option.impact && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--component-text-secondary)' }}>
                                <span style={{ color: 'var(--component-text-accent)', fontWeight: 600 }}>
                                    {t('josoor.enterprise.impact') || 'Impact'}:{' '}
                                </span>
                                {option.impact}
                            </span>
                        )}
                        {option.timeline && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--component-text-secondary)' }}>
                                <span style={{ color: 'var(--component-text-accent)', fontWeight: 600 }}>
                                    {t('josoor.enterprise.timeline') || 'Timeline'}:{' '}
                                </span>
                                {option.timeline}
                            </span>
                        )}
                    </div>
                </div>
                <span style={{
                    flexShrink: 0,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--component-text-accent)',
                    whiteSpace: 'nowrap',
                    paddingTop: '2px'
                }}>
                    {t('josoor.enterprise.selectOption') || 'Select'} →
                </span>
            </div>
        </button>
    );
};

const StrategyReportModal: React.FC<StrategyReportModalProps> = ({
    isOpen,
    onClose,
    htmlContent,
    artifacts = [],
    onContinueInChat,
    interventionOptions,
    onSelectOption,
    title
}) => {
    const { t } = useTranslation();
    // Create artifact lookup map by ID for inline rendering
    const artifactMap = React.useMemo(() => {
        const map: Record<string, Artifact> = {};
        artifacts.forEach(artifact => {
            const id = (artifact as any).id || artifact.title;
            if (id) map[id] = artifact;
        });
        return map;
    }, [artifacts]);

    if (!isOpen) return null;

    const handleSaveMd = () => {
        const mdContent = htmlToMarkdown(htmlContent);
        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `strategic-report-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="josoor-modal-overlay">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="josoor-modal-container"
                    >
                        {/* Header */}
                        <div className="josoor-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    background: 'linear-gradient(135deg, var(--component-text-accent) 0%, #B8860B 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 15px rgba(244,187,48,0.3)'
                                }}>
                                    <span style={{ color: 'black', fontWeight: 800, fontSize: '14px' }}>{t('josoor.sector.report.aiBadge')}</span>
                                </div>
                                <h2 style={{ margin: 0, color: 'var(--component-text-primary)', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                                    {title || t('josoor.sector.strategyReport')}
                                </h2>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <button
                                    onClick={handleSaveMd}
                                    title={t('josoor.sector.report.saveAsMarkdown')}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--component-panel-border)',
                                        color: 'var(--component-text-secondary)',
                                        padding: '8px 14px',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s',
                                        fontWeight: 600
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                >
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    {t('josoor.sector.saveMd')}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="josoor-modal-close-btn"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        </div>

                        {/* Content Scroll Area */}
                        <div className="josoor-modal-content custom-scrollbar">
                            <div className="josoor-report-content">
                                {/* Render content with inline charts/tables */}
                                {htmlContent.split(/(<ui-chart[^>]*>|<ui-table[^>]*>)/g).map((part, index) => {
                                    // Check if this part is a chart or table tag
                                    const chartMatch = part.match(/<ui-chart[^>]*id=["']([^"']+)["'][^>]*>/);
                                    const tableMatch = part.match(/<ui-table[^>]*id=["']([^"']+)["'][^>]*>/);

                                    if (chartMatch) {
                                        const chartId = chartMatch[1];
                                        const artifact = artifactMap[chartId];
                                        if (!artifact) {
                                            console.warn('[StrategyReportModal] Chart not found:', chartId);
                                            return null;
                                        }
                                        return (
                                            <div key={`chart-${index}`} className="josoor-chart-container">
                                                <StrategyReportChartRenderer
                                                    artifact={artifact}
                                                    width="100%"
                                                    height={artifact.artifact_type === 'TABLE' ? 'auto' : '420px'}
                                                />
                                            </div>
                                        );
                                    }

                                    if (tableMatch) {
                                        const tableId = tableMatch[1];
                                        const artifact = artifactMap[tableId];
                                        if (!artifact) {
                                            console.warn('[StrategyReportModal] Table not found:', tableId);
                                            return null;
                                        }
                                        return (
                                            <div key={`table-${index}`} className="josoor-table-container">
                                                <StrategyReportChartRenderer
                                                    artifact={artifact}
                                                    width="100%"
                                                    height="auto"
                                                />
                                            </div>
                                        );
                                    }

                                    // If part contains HTML tables, render directly as HTML
                                    if (part.includes('<table')) {
                                        return (
                                            <div
                                                key={`html-${index}`}
                                                dangerouslySetInnerHTML={{ __html: part }}
                                            />
                                        );
                                    }

                                    // Regular markdown content
                                    return (
                                        <ReactMarkdown
                                            key={`content-${index}`}
                                            rehypePlugins={[rehypeRaw]}
                                            remarkPlugins={[remarkGfm]}
                                        >
                                            {part}
                                        </ReactMarkdown>
                                    );
                                })}
                            </div>

                            {/* Intervention Options Section */}
                            {interventionOptions && interventionOptions.length > 0 && (
                                <div style={{
                                    padding: '24px',
                                    borderTop: '1px solid var(--component-panel-border)',
                                    marginTop: '8px'
                                }}>
                                    <p style={{
                                        margin: '0 0 16px 0',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        letterSpacing: '0.12em',
                                        textTransform: 'uppercase',
                                        color: 'var(--component-text-accent)'
                                    }}>
                                        {t('josoor.enterprise.chooseIntervention') || 'Choose an Intervention Strategy'}
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {interventionOptions.map((option) => (
                                            <OptionCard
                                                key={option.id}
                                                option={option}
                                                onSelect={onSelectOption}
                                                t={t}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer / Actions */}
                        <div className="josoor-modal-footer">
                            {(!interventionOptions || interventionOptions.length === 0) && (
                                <button
                                    onClick={onContinueInChat}
                                    style={{
                                        background: 'var(--component-text-accent)',
                                        border: 'none',
                                        color: 'black',
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 4px 15px rgba(244,187,48,0.2)',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <span>{t('josoor.sector.continueExploration')}</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default StrategyReportModal;
