import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/sidebar.css';
import '../chat/Sidebar.css';

interface SidebarProps {
    isCollapsed: boolean;
    onRequestToggleCollapse: () => void;
    onNewChat: () => void;
    activeDesk?: string;
    onNavigate: (path: string) => void;
}

export function UnifiedSidebar({
    isCollapsed,
    onRequestToggleCollapse,
    onNewChat,
    activeDesk,
    onNavigate
}: SidebarProps) {
    const { language, isRTL } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    const translations = {
        newChat: language === 'ar' ? 'محادثة جديدة' : 'New Chat',
        toggleSidebar: language === 'ar' ? 'تبديل الشريط الجانبي' : 'Toggle sidebar',
        desks: language === 'ar' ? 'المكاتب' : 'Desks',
        sector: language === 'ar' ? 'القطاع' : 'Sector',
        controls: language === 'ar' ? 'التحكم' : 'Controls',
        planning: language === 'ar' ? 'التخطيط' : 'Planning',
        enterprise: language === 'ar' ? 'المؤسسة' : 'Enterprise',
        reporting: language === 'ar' ? 'التقارير' : 'Reporting',
        knowledge: language === 'ar' ? 'المعرفة' : 'Knowledge',
        roadmap: language === 'ar' ? 'الخارطة' : 'Roadmap',
        graph: language === 'ar' ? 'المستكشف' : 'Graph Explorer',

        admin: language === 'ar' ? 'المسؤول' : 'Admin',
        providers: language === 'ar' ? 'المزودين' : 'Providers',
        abTesting: language === 'ar' ? 'اختبار A/B' : 'A/B Testing',
        monitoring: language === 'ar' ? 'المراقبة' : 'Monitoring'
    };

    const menuItems = [
        { id: 'sector', label: translations.sector, icon: '/icons/demo.svg', path: '/desk/sector' },
        { id: 'controls', label: translations.controls, icon: '/icons/architecture.svg', path: '/desk/controls' },
        { id: 'planning', label: translations.planning, icon: '/icons/approach.svg', path: '/desk/planning' },
        { id: 'enterprise', label: translations.enterprise, icon: '/icons/twin.svg', path: '/desk/enterprise' },
        { id: 'reporting', label: translations.reporting, icon: '/icons/chat.svg', path: '/desk/reporting' },
    ];

    const contentItems = [
        { id: 'knowledge', label: translations.knowledge, icon: '/icons/josoor.svg', path: '/desk/knowledge' },
        { id: 'roadmap', label: translations.roadmap, icon: '/icons/architecture.svg', path: '/desk/roadmap' },
        { id: 'graph', label: translations.graph, icon: '/icons/demo.svg', path: '/desk/explorer' },
    ]

    const adminItems = [
        { id: 'providers', label: translations.providers, icon: '/icons/architecture.svg', path: '/admin/providers' },
        { id: 'abTesting', label: translations.abTesting, icon: '/icons/approach.svg', path: '/admin/ab-testing' },
        { id: 'monitoring', label: translations.monitoring, icon: '/icons/demo.svg', path: '/admin/monitoring' },
    ];

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} tajawal-headings cairo-body`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* HEADER SECTION: Toggle & New Chat */}
            <div className="sidebar-header" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        className="sidebar-icon-button clickable"
                        onClick={onRequestToggleCollapse}
                        title={translations.toggleSidebar}
                    >
                        <img src="/icons/menu.svg" alt="Menu" className="sidebar-quickaction-icon sidebar-quickaction-small" />
                    </button>

                    {!isCollapsed && (
                        <button
                            onClick={onNewChat}
                            className="sidebar-newchat-button clickable"
                            style={{
                                flex: 1,
                                backgroundColor: 'var(--component-text-accent)',
                                color: 'var(--component-text-on-accent)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontWeight: 600
                            }}
                        >
                            <span>+ {translations.newChat}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* MENU ITEMS SECTION */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {!isCollapsed && <div style={{ fontSize: '12px', color: 'var(--component-text-muted)', marginBottom: '8px', padding: '0 8px' }}>{translations.desks}</div>}

                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.path)}
                            className={`quickaction-item clickable ${location.pathname.includes(item.path) ? 'active' : ''}`}
                            title={item.label}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px',
                                borderRadius: '8px',
                                width: '100%',
                                textAlign: isRTL ? 'right' : 'left',
                                backgroundColor: location.pathname.includes(item.path) ? 'var(--component-bg-disconnected)' : 'transparent',
                                color: location.pathname.includes(item.path) ? 'var(--component-text-primary)' : 'var(--component-text-secondary)',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <img src={item.icon} alt={item.label} style={{ width: '24px', height: '24px', opacity: 0.8 }} />
                            {!isCollapsed && <span style={{ fontSize: '14px' }}>{item.label}</span>}
                        </button>
                    ))}

                    <div style={{ height: '1px', backgroundColor: 'var(--component-panel-border)', margin: '12px 0' }}></div>

                    {contentItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.path)}
                            className={`quickaction-item clickable ${location.pathname.includes(item.path) ? 'active' : ''}`}
                            title={item.label}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px',
                                borderRadius: '8px',
                                width: '100%',
                                textAlign: isRTL ? 'right' : 'left',
                                backgroundColor: location.pathname.includes(item.path) ? 'var(--component-bg-disconnected)' : 'transparent',
                                color: location.pathname.includes(item.path) ? 'var(--component-text-primary)' : 'var(--component-text-secondary)',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <img src={item.icon} alt={item.label} style={{ width: '24px', height: '24px', opacity: 0.8 }} />
                            {!isCollapsed && <span style={{ fontSize: '14px' }}>{item.label}</span>}
                        </button>
                    ))}

                    <div style={{ height: '1px', backgroundColor: 'var(--component-panel-border)', margin: '12px 0' }}></div>
                    {!isCollapsed && <div style={{ fontSize: '12px', color: 'var(--component-text-muted)', marginBottom: '8px', padding: '0 8px' }}>{translations.admin}</div>}

                    {adminItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.path)}
                            className={`quickaction-item clickable ${location.pathname.includes(item.path) ? 'active' : ''}`}
                            title={item.label}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px',
                                borderRadius: '8px',
                                width: '100%',
                                textAlign: isRTL ? 'right' : 'left',
                                backgroundColor: location.pathname.includes(item.path) ? 'var(--component-bg-disconnected)' : 'transparent',
                                color: location.pathname.includes(item.path) ? 'var(--component-text-primary)' : 'var(--component-text-secondary)',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <img src={item.icon} alt={item.label} style={{ width: '24px', height: '24px', opacity: 0.8 }} />
                            {!isCollapsed && <span style={{ fontSize: '14px' }}>{item.label}</span>}
                        </button>
                    ))}

                    <div style={{ height: '1px', backgroundColor: 'var(--component-panel-border)', margin: '12px 0 20px 0' }}></div>
                </div>
            </div>

        </aside>
    );
}
