import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import './PolicyToolsDrawer.css';

export interface PolicyToolItem {
    id: string;
    name: string;
    level: string;
    childCount: number;
    category: string;
}

interface PolicyToolsDrawerProps {
    isOpen: boolean;
    category: string | null;
    tools: PolicyToolItem[];
    onClose: () => void;
    color: string;
}

export const PolicyToolsDrawer: React.FC<PolicyToolsDrawerProps> = ({
    isOpen,
    category,
    tools,
    onClose,
    color
}) => {
    const { t } = useTranslation();
    return (
        <AnimatePresence>
            {isOpen && category && (
                <>
                    {/* Drawer - No backdrop */}
                    <motion.div
                        className="policy-drawer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        onMouseLeave={onClose}
                    >
                        <div className="policy-drawer-content">
                            {/* Tools List - No header */}
                            <div className="policy-drawer-list">
                                {tools.length === 0 ? (
                                    <div className="policy-drawer-empty">
                                        {t('josoor.sector.noPolicyTools')}
                                    </div>
                                ) : (
                                    tools.map((tool, index) => (
                                        <motion.div
                                            key={tool.id}
                                            className="policy-tool-card"
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05, duration: 0.2 }}
                                        >
                                            <div className="policy-tool-card-main">
                                                <div className="policy-tool-card-name">
                                                    <span style={{ opacity: 0.6, marginRight: '8px' }}>{tool.id}</span>
                                                    {tool.name}
                                                </div>
                                                {tool.childCount > 0 && (
                                                    <div className="policy-tool-card-meta">
                                                        <span className="policy-tool-children">
                                                            {tool.childCount} sub-tool{tool.childCount > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                className="policy-tool-card-accent"
                                                style={{ background: color }}
                                            />
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
