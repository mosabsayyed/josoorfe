import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMainApp } from './MainAppContext';
import { Button } from '../../components/ui/button';
import '../../styles/sidebar.css';
import '../../components/chat/Sidebar.css';

interface MenuItem {
  id: string;
  label: { en: string; ar: string };
  path: string;
  icon?: string;
}

const enterpriseMenuItems: MenuItem[] = [
  { id: 'sector', label: { en: 'Sector Desk', ar: 'مكتب القطاع' }, path: '/main/sector' },
  { id: 'enterprise', label: { en: 'Enterprise Desk', ar: 'مكتب المؤسسة' }, path: '/main/enterprise' },
  { id: 'controls', label: { en: 'Controls Desk', ar: 'مكتب الرقابة' }, path: '/main/controls' },
  { id: 'planning', label: { en: 'Planning Desk', ar: 'مكتب التخطيط' }, path: '/main/planning' },
  { id: 'reporting', label: { en: 'Reporting Desk', ar: 'مكتب التقارير' }, path: '/main/reporting' },
];

const toolsMenuItems: MenuItem[] = [
  { id: 'knowledge', label: { en: 'Knowledge Series', ar: 'سلسلة المعرفة' }, path: '/main/knowledge' },
  { id: 'roadmap', label: { en: 'Roadmap', ar: 'خارطة الطريق' }, path: '/main/roadmap' },
  { id: 'graph', label: { en: 'Graph Explorer', ar: 'مستكشف الرسم البياني' }, path: '/main/graph' },
  { id: 'chat', label: { en: 'Graph Chat', ar: 'محادثة الرسم البياني' }, path: '/main/chat' },
];

const adminMenuItems: MenuItem[] = [
  { id: 'settings', label: { en: 'Settings', ar: 'الإعدادات' }, path: '/main/settings' },
  { id: 'observability', label: { en: 'Observability', ar: 'المراقبة' }, path: '/main/observability' },
];

interface MainSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const MainSidebar: React.FC<MainSidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, isRTL, openEscalationsCount } = useMainApp();
  const [showConversations, setShowConversations] = useState(true);

  const translations = {
    appName: language === 'ar' ? 'جسور' : 'JOSOOR',
    newChat: language === 'ar' ? 'محادثة جديدة' : 'New Chat',
    enterpriseManagement: language === 'ar' ? 'إدارة المؤسسة' : 'ENTERPRISE MANAGEMENT',
    tools: language === 'ar' ? 'الأدوات' : 'TOOLS',
    admin: language === 'ar' ? 'الإدارة' : 'ADMIN',
    conversations: language === 'ar' ? 'المحادثات' : 'CONVERSATIONS',
    today: language === 'ar' ? 'اليوم' : 'Today',
    yesterday: language === 'ar' ? 'أمس' : 'Yesterday',
    previous7Days: language === 'ar' ? 'آخر 7 أيام' : 'Previous 7 days',
    toggleSidebar: language === 'ar' ? 'تبديل الشريط الجانبي' : 'Toggle sidebar',
  };

  const handleNewChat = () => {
    navigate('/main/chat');
  };

  const isActive = (path: string) => location.pathname === path;

  const renderMenuItem = (item: MenuItem) => (
    <button
      key={item.id}
      onClick={() => navigate(item.path)}
      className="quickaction-item clickable"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: isActive(item.path) ? 'var(--component-text-accent)' : 'transparent',
        color: isActive(item.path) ? 'var(--component-text-on-accent)' : 'var(--component-text-primary)',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        width: '100%',
        textAlign: isRTL ? 'right' : 'left',
        fontSize: '13px',
        fontWeight: isActive(item.path) ? 600 : 400,
      }}
    >
      <span>▸</span>
      <span>{item.label[language]}</span>
      {item.id === 'graph' && openEscalationsCount > 0 && (
        <span style={{
          marginLeft: 'auto',
          backgroundColor: 'var(--component-color-danger)',
          color: '#fff',
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '10px',
          fontWeight: 600,
        }}>
          {openEscalationsCount}
        </span>
      )}
    </button>
  );

  if (isCollapsed) {
    return (
      <aside className="sidebar collapsed" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="sidebar-collapsed-top">
          <button
            onClick={onToggleCollapse}
            title={translations.toggleSidebar}
            className="sidebar-icon-button clickable"
          >
            <img src="/icons/menu.png" alt={translations.toggleSidebar} className="sidebar-quickaction-icon sidebar-quickaction-small" />
          </button>
          <button
            onClick={handleNewChat}
            title={translations.newChat}
            className="sidebar-icon-button clickable"
          >
            <img src="/icons/new.png" alt={translations.newChat} className="sidebar-quickaction-icon sidebar-quickaction-small" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside id="sidebar-menu" className="sidebar tajawal-headings cairo-body" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="sidebar-header" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onToggleCollapse}
            title={translations.toggleSidebar}
            className="sidebar-icon-button clickable"
          >
            <img src="/icons/menu.png" alt={translations.toggleSidebar} style={{ width: '24px', height: '24px' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/icons/josoor.png" alt="JOSOOR" style={{ width: '32px', height: '32px' }} />
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-gold)' }}>{translations.appName}</span>
          </div>
        </div>

        <Button
          onClick={handleNewChat}
          className="sidebar-newchat-button clickable"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--component-text-accent)',
            color: 'var(--component-text-on-accent)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <img src="/icons/new.png" alt="+" style={{ width: '16px', height: '16px' }} />
          {translations.newChat}
        </Button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            color: 'var(--text-secondary)', 
            padding: '8px 12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {translations.enterpriseManagement}
          </div>
          {enterpriseMenuItems.map(renderMenuItem)}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            color: 'var(--text-secondary)', 
            padding: '8px 12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {translations.tools}
          </div>
          {toolsMenuItems.map(renderMenuItem)}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            color: 'var(--text-secondary)', 
            padding: '8px 12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {translations.admin}
          </div>
          {adminMenuItems.map(renderMenuItem)}
        </div>

        <div id="sidebar-chat-section" className="conversations-card" style={{ marginTop: '8px' }}>
          <button 
            onClick={() => setShowConversations(!showConversations)} 
            className="conversations-header clickable"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 0',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--component-text-primary)',
            }}
          >
            <img src="/icons/chat.png" alt="chat" style={{ width: '24px', height: '24px' }} />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>{translations.conversations}</span>
            <span style={{ marginLeft: 'auto', fontSize: '12px' }}>{showConversations ? '▾' : '▸'}</span>
          </button>

          {showConversations && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '32px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '4px 0' }}>{translations.today}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '4px 0' }}>{translations.yesterday}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '4px 0' }}>{translations.previous7Days}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default MainSidebar;
