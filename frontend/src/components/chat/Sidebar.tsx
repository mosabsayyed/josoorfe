import { useState, useEffect } from 'react';
// Using image assets for sidebar icons (PNG/JPG). Avoiding SVG icon components as requested.
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import type { ConversationSummary } from '../../types/api';
import './Sidebar.css';
import '../../styles/sidebar.css';
import { useNavigate } from 'react-router-dom';
import { getUser, logout as authLogout, getGuestConversations, isGuestMode } from '../../services/authService';
import { useLanguage } from '../../contexts/LanguageContext';

interface QuickAction {
  id: string;
  // path to image in public/ (use PNG/JPG). Example: '/logo192.png'
  icon: string;
  label: { en: string; ar: string };
  command: { en: string; ar: string };
  category: 'learn' | 'explore' | 'tools';
}

/**
 * QUICK ACTIONS CONFIGURATION
 * ---------------------------
 * These sidebar items trigger special actions when clicked via onQuickAction().
 * 
 * Each action.id maps to a handler in ChatAppPage.handleQuickAction():
 *   - 'knowledge'    → Opens TwinKnowledge component (with landing page)
 *   - 'demo'         → Opens Investor Demo walkthrough hub
 *   - 'architecture' → Opens ProductRoadmap component (DIRECT - no landing page)
 *   - 'approach'     → Opens PlanYourJourney component (DIRECT - no landing page)
 * 
 * The command field is for chat fallback; icons are displayed in the sidebar.
 */
const quickActions: QuickAction[] = [];

const deskItems = [
  { id: 'sector-desk', label: { en: 'Sector Observatory', ar: 'مرصد القطاع' }, icon: '/icons/demo.png', path: '/josoor' },
  { id: 'enterprise-desk', label: { en: 'Enterprise Capabilities', ar: 'قدرات المؤسسة' }, icon: '/icons/twin.png', path: '/josoor' },
  { id: 'controls-desk', label: { en: 'Control Signals', ar: 'إشارات التحكم' }, icon: '/icons/architecture.png', path: '/josoor' },
  { id: 'planning-desk', label: { en: 'Planning Lab', ar: 'مختبر التخطيط' }, icon: '/icons/approach.png', path: '/josoor' },
  { id: 'reporting-desk', label: { en: 'Reporting Hub', ar: 'مركز التقارير' }, icon: '/icons/chat.png', path: '/josoor' },
];

const contentItems = [
  { id: 'knowledge', label: { en: 'Multimedia Tutorials', ar: 'الدروس المتعددة الوسائط' }, icon: '/icons/josoor.png' },
  { id: 'explorer', label: { en: 'Graph Explorer', ar: 'مستكشف الرسم البياني' }, icon: '/icons/demo.png' },
  { id: 'roadmap', label: { en: 'Roadmap', ar: 'خارطة الطريق' }, icon: '/icons/approach.png' },
];

const adminItems = [
  { id: 'settings', label: { en: 'Settings', ar: 'الإعدادات' }, icon: '/icons/menu.png' },
  { id: 'observability', label: { en: 'Observability', ar: 'المراقبة' }, icon: '/icons/architecture.png' },
];

interface SidebarProps {
  conversations: ConversationSummary[];
  activeConversationId: number | null;
  onNewChat: () => void;
  onSelectConversation: (id: number) => void;
  onDeleteConversation: (id: number) => void;
  onQuickAction: (action: QuickAction | string | any) => void;
  isCollapsed?: boolean;
  onRequestToggleCollapse?: () => void;
  activeView?: string;
}

export function Sidebar({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onQuickAction,
  isCollapsed = false,
  onRequestToggleCollapse,
  activeView,
}: SidebarProps) {
  const { language, isRTL, setLanguage } = useLanguage();
  const [showConversations, setShowConversations] = useState(() => conversations.length > 0);
  const [collapsed, setCollapsed] = useState<boolean>(!!isCollapsed);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const updateTheme = () => {
      const themeAttr = document.documentElement.getAttribute('data-theme');
      setTheme((themeAttr as 'light' | 'dark') || 'dark');
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (conversations.length > 0) setShowConversations(true);
  }, [conversations.length]);

  useEffect(() => {
    // keep collapsed in sync if parent controls it
    setCollapsed(!!isCollapsed);
  }, [isCollapsed]);

  const [currentUser, setCurrentUser] = useState<any | null>(() => getUser());

  useEffect(() => {
    const onStorage = () => {
      setCurrentUser(getUser());
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('josoor_auth_change', onStorage as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('josoor_auth_change', onStorage as EventListener);
    };
  }, []);

  const navigate = useNavigate();

  const translations = {
    appName: language === 'ar' ? 'جسور' : 'JOSOOR',
    newChat: language === 'ar' ? 'محادثة جديدة' : 'New Chat',
    quickActions: language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions',
    conversations: language === 'ar' ? 'محادثاتك' : 'Your Chats',
    guestMode: language === 'ar' ? 'وضع الضيف' : 'Guest Mode',
    loginToSave: language === 'ar' ? 'سجل الدخول للحفظ' : 'Login to save',
    messagesCount: (count: number) => (language === 'ar' ? `${count} رسالة` : `${count} messages`),
    deleteConversation: language === 'ar' ? 'حذف' : 'Delete',
    account: language === 'ar' ? 'الحساب' : 'Account',
    toggleSidebar: language === 'ar' ? 'تبديل الشريط الجانبي' : 'Toggle sidebar',
    guestLeaveWarning: language === 'ar' ? 'أنت تستخدم التطبيق كضيف ولديك محفوظات محلية. إذا غادرت فسوف تفقد السجل والملفات. المتابعة إلى تسجيل الدخول؟' : 'You are using the app as guest and have local history. If you leave you will lose history and artifacts. Proceed to login?',
    account_menu: language === 'ar' ? 'قائمة الحساب' : 'Account menu',
    profile: language === 'ar' ? 'الملف الشخصي' : 'Profile',
    logout: language === 'ar' ? 'تسجيل الخروج' : 'Logout',
    close: language === 'ar' ? 'إغلاق' : 'Close',
    theme: language === 'ar' ? 'المظهر' : 'Theme',
    language: language === 'ar' ? 'اللغة' : 'Language',
    light: language === 'ar' ? 'فاتح' : 'Light',
    dark: language === 'ar' ? 'داكن' : 'Dark',
    english: 'English',
    arabic: 'العربية',
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === 'ar' ? 'الآن' : 'Now';
    if (diffMins < 60) return language === 'ar' ? `${diffMins} د` : `${diffMins}m`;
    if (diffHours < 24) return language === 'ar' ? `${diffHours} س` : `${diffHours}h`;
    if (diffDays < 7) return language === 'ar' ? `${diffDays} ي` : `${diffDays}d`;

    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // We're using the canonical action labels directly from `quickActions`.
  // No labelOverrides are needed in this simplified approach.

  const renderSection = (title: string, items: any[], isFirst: boolean = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: isFirst ? '8px 29px 0 0' : '8px 28px 0 0', padding: '1px', border: '1px solid rgba(238, 201, 4, 1)' }}>
      {!collapsed && (
        <div className="sidebar-quickactions-title" style={{ fontWeight: "400", paddingLeft: '8px' }}>
          <div style={{ display: "inline", font: isFirst ? '700 18px/18.2px system-ui, sans-serif' : '700 18px/18.2px Tajawal, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', color: 'rgba(238, 201, 4, 1)' }}><span style={{ color: 'rgb(238, 201, 4)' }}>{title}</span></div>
        </div>
      )}

      {items.map((item) => {
        const overrideLabel = item.label?.[language] || item.label?.en || item.label;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              console.log('Sidebar QuickAction Clicked:', item.id);
              onQuickAction(item);
            }}
            className={`quickaction-item clickable ${isActive ? 'active' : ''}`}
            title={overrideLabel}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? 'center' : 'flex-start',
              backgroundColor: isActive ? 'var(--component-bg-disconnected)' : "rgba(0, 0, 0, 0)",
              color: theme === 'light' ? "rgb(55, 65, 81)" : "rgb(243, 244, 246)",
              fontFamily: 'Cairo, "Segoe UI", Roboto, Arial, sans-serif',
              fontSize: "13px",
              fontWeight: "400",
              gap: collapsed ? '0' : '8px',
              padding: "6px 6px",
              border: "0.8px solid rgba(0, 0, 0, 0)",
              textAlign: "start",
              width: '100%',
              cursor: 'pointer'
            }}
          >
            <img src={item.icon} alt={overrideLabel} className="sidebar-quickaction-icon sidebar-quickaction-large" style={{ display: "block", fontWeight: "600", height: "24px", width: "24px", objectFit: "cover" }} />
            {!collapsed && (
              <div className="quickaction-meta" style={{ display: "flex", alignItems: "flex-start", flexDirection: "column" }}>
                <span className="quickaction-title" style={{ display: "block", fontSize: "14px" }}>{overrideLabel}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} tajawal-headings cairo-body`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Fixed Top Section */}
      <div className="sidebar-header" style={{ width: "100%", height: "auto", padding: collapsed ? "10px 0" : "10px 20px", display: "flex", flexDirection: "column", gap: "6px", alignItems: collapsed ? 'center' : 'stretch' }}>

        {/* Actions row */}
        <div className="sidebar-header-actions" style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: collapsed ? "center" : "flex-start", padding: collapsed ? '0' : '0 0 10px 0', marginRight: collapsed ? '0' : '33px' }}>
          <button className="sidebar-icon-button clickable" onClick={() => onRequestToggleCollapse?.()} title={translations.toggleSidebar} style={{ display: "flex", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0)", height: "40px", justifyContent: "center", width: "40px", border: 'none' }}>
            <img src="/icons/menu.png" alt={translations.toggleSidebar} style={{ height: "24px", width: "24px" }} />
          </button>

          {!collapsed && (
            <div style={{ display: "block", color: "#eec904", margin: "0 auto", font: "600 18px __Inter_d65c78, sans-serif" }}>
              JOSOOR
            </div>
          )}
        </div>

        {/* Sections */}
        {renderSection(language === 'ar' ? 'الحوكمة والرقابة' : 'Governance/Oversight', deskItems, true)}
        {renderSection(language === 'ar' ? 'المراجع' : 'References', contentItems)}
        {renderSection(language === 'ar' ? 'الإدارة' : 'Admin', adminItems)}
      </div>

      {/* Conversations - only if not collapsed */}
      {!collapsed && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginLeft: '20px', maxWidth: '210px', padding: '1px', border: '1px solid rgba(238, 201, 4, 1)', overflowY: 'auto' }}>
          {/* Graph Chat Button */}
          <button
            title="Graph Chat"
            onClick={() => onQuickAction?.({ id: 'graph-chat', label: { en: 'Graph Chat', ar: 'دردشة الرسم البياني' }, icon: '/icons/chat.png' })}
            className="quickaction-item clickable"
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(0, 0, 0, 0)",
              borderRadius: "4px",
              color: "rgb(243, 244, 246)",
              gap: "8px",
              justifyContent: "flex-start",
              width: "100%",
              padding: "6px 0",
              font: '400 13px Cairo, "Segoe UI", Roboto, Arial, sans-serif',
              border: "1px solid rgba(0, 0, 0, 0)",
              cursor: "pointer"
            }}
          >
            <img src="/icons/chat.png" alt="Graph Chat" className="sidebar-quickaction-icon sidebar-quickaction-large" style={{ display: "block", fontWeight: "600", height: "24px", width: "24px", objectFit: "cover" }} />
            <div className="quickaction-meta" style={{ display: "flex", alignItems: "flex-start", flexDirection: "column" }}>
              <span className="quickaction-title" style={{ display: "block", fontSize: "14px" }}>Graph Chat</span>
            </div>
          </button>

          <div className="conversations-card" style={{ marginRight: '-0', padding: '5px 10px 5px 0' }}>
            <button onClick={() => setShowConversations(!showConversations)} className="conversations-header clickable">
              <span className="conversations-title">{translations.conversations}</span>
            </button>
            {showConversations && (
              <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                {conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === activeConversationId}
                    onClick={() => onSelectConversation(conversation.id)}
                    onDelete={() => onDeleteConversation(conversation.id)}
                    formatDate={formatDate}
                    messagesCountLabel={translations.messagesCount(conversation.message_count)}
                    deleteLabel={translations.deleteConversation}
                    isRTL={isRTL}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

interface ConversationItemProps {
  conversation: ConversationSummary;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
  messagesCountLabel: string;
  deleteLabel: string;
  isRTL: boolean;
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  formatDate,
  messagesCountLabel,
  deleteLabel,
  isRTL,
}: ConversationItemProps) {
  return (
    <div className={`conversation-item clickable ${isActive ? 'conversation-active' : ''}`}>
      <div style={{ flex: 1, minWidth: 0 }} onClick={onClick}>
        <p
          style={{
            fontSize: '12px',
            fontWeight: '500',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: isRTL ? 'right' : 'left',
            color: isActive ? 'var(--component-text-on-accent, rgba(255,255,255,1))' : 'var(--component-text-primary, rgba(26,36,53,1))',
          }}
        >
          {conversation.title}
        </p>
        <div className="conversation-meta">
          <div style={{ display: 'block', fontWeight: '400' }}>{formatDate(conversation.updated_at)}</div>
          <div style={{ display: 'block', fontWeight: '400' }}>•</div>
          <div style={{ display: 'block', fontWeight: '400' }}>{messagesCountLabel}</div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            style={{
              opacity: 0,
              padding: '4px',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0';
            }}
          >
            <span style={{ fontSize: 16, lineHeight: '16px' }}>⋮</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isRTL ? 'start' : 'end'} style={{ backgroundColor: 'var(--component-panel-bg)', color: 'var(--component-text-primary)' }}>
          <DropdownMenuItem
            style={{ color: 'rgb(220, 38, 38)', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <span style={{ fontSize: 16, lineHeight: '16px' }}>🗑️</span>
            <span>{deleteLabel}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
