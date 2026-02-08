/**
 * ChatContainer Component
 * 
 * Main chat interface containing:
 * - Header with conversation title
 * - Messages list with auto-scroll
 * - Chat input fixed at bottom
 * - Welcome screen (when no messages)
 */

import { useEffect, useRef, useMemo, useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageBubble, ThinkingIndicator } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '../ui/scroll-area';
import { BarChart3, FileText, Table, MessageSquare, LogOut } from 'lucide-react';
import type { Message as APIMessage } from '../../types/api';
import ThemeToggle from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import { getUser, logout as authLogout, getGuestConversations, isGuestMode } from '../../services/authService';
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
import '../../styles/chat.css';
import '../../styles/message-bubble.css';
import '../../styles/sidebar.css';
import '../../styles/chat-container.css';

interface ChatContainerProps {
  conversationId: number | null;
  conversationTitle?: string;
  messages: APIMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  language?: 'en' | 'ar';
  onToggleSidebar?: () => void;
  onToggleCanvas?: () => void;
  onOpenArtifact?: (artifact: any, artifacts?: any[]) => void;
  streamingMessage?: APIMessage | null;
  // New props for unified header
  year?: string;
  quarter?: string;
  onYearChange?: (year: string) => void;
  onQuarterChange?: (quarter: string) => void;
  // Children for desk content
  children?: React.ReactNode;
  // Title for desk mode
  title?: string;
  subtitle?: string;
  availableYears?: string[];
}

export const ChatContainer = memo(function ChatContainer({
  conversationId,
  conversationTitle,
  messages,
  onSendMessage,
  isLoading = false,
  language = 'en',
  onToggleSidebar,
  onToggleCanvas,
  onOpenArtifact,
  streamingMessage,
  year = '2025',
  quarter = 'All',
  onYearChange,
  onQuarterChange,
  children,
  title,
  subtitle,
  availableYears = ['2025', '2026', '2027', '2028', '2029'],
}: ChatContainerProps) {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(() => getUser());

  // Listen for auth changes
  useEffect(() => {
    const onStorage = () => setCurrentUser(getUser());
    window.addEventListener('storage', onStorage);
    window.addEventListener('josoor_auth_change', onStorage as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('josoor_auth_change', onStorage as EventListener);
    };
  }, []);
  const { language: ctxLanguage } = useLanguage();
  const effectiveLanguage = language ?? ctxLanguage;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const themeAttr = document.documentElement.getAttribute('data-theme');
    return (themeAttr as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    const updateTheme = () => {
      const themeAttr = document.documentElement.getAttribute('data-theme');
      setTheme((themeAttr as 'light' | 'dark') || 'dark');
    };
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Combine regular messages with streaming message
  const displayMessages = useMemo(() => {
    return streamingMessage ? [...messages, streamingMessage] : messages;
  }, [messages, streamingMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, isLoading]);

  const translations = {
    welcomeTitle: effectiveLanguage === 'ar' ? 'مرحباً بك، أنا نور' : 'Welcome, I am Noor',
    welcomeSubtitle: effectiveLanguage === 'ar'
      ? 'مساعدك الذكي في رحلة التحول المعرفي'
      : 'Your AI guide to cognitive transformation',
    examplesTitle: effectiveLanguage === 'ar' ? 'جرب هذه الأمثلة:' : 'Try these examples:',
    examples: [
      {
        icon: BarChart3,
        text: effectiveLanguage === 'ar'
          ? 'كيف يتقدم التحول حتى الآن؟'
          : 'How is the transformation progressing to date?',
      },
      {
        icon: Table,
        text: effectiveLanguage === 'ar'
          ? 'سرد القدرات الأكثر نضجاً حسب الوحدات التنظيمية'
          : 'List the most mature capabilities by organisational units',
      },
      {
        icon: FileText,
        text: effectiveLanguage === 'ar'
          ? 'إنشاء تقرير مشاريع الربع الثالث لعام 2025'
          : 'Generate Q3 Projects Report for 2025',
      },
      {
        icon: MessageSquare,
        text: effectiveLanguage === 'ar'
          ? 'ما هو إطار الحوكمة للوكالة؟'
          : 'What is the governance framework for the agency?',
      },
    ],
  };

  const hasMessages = displayMessages.length > 0;

  return (
    <div className="chat-container-root">
      <div className="chat-top-controls" style={{ display: "flex", alignItems: "center", fontWeight: "400", justifyContent: "space-between", padding: "8px 16px", gap: "16px", backgroundColor: theme === 'light' ? 'rgba(250, 236, 195, 0.7)' : 'rgba(31, 41, 55, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', height: '60px' }}>
        {/* LEFT: Logo, App Name & Title */}
        <div dir={effectiveLanguage === 'ar' ? 'rtl' : 'ltr'} style={{ display: "flex", alignItems: "center", gap: "12px", color: theme === 'light' ? '#4B5563' : "white" }}>
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets%2Fdcb6338cd56942dd9d0d7f3bbd865659%2Fe4fa8a9e49344786befd964c7169a6de"
            style={{ aspectRatio: "1", objectFit: "cover", objectPosition: "center", width: "40px", height: "40px", overflow: "hidden", margin: "-5px auto" }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ font: "700 16px __Inter_d65c78, sans-serif", color: theme === 'light' ? '#4B5563' : "white" }}>AI Twin Tech</span>
              {title && (
                <>
                  <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
                  <span style={{ color: 'var(--component-text-accent)', fontSize: '14px', fontWeight: 600 }}>{title}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Year/Quarter Filters */}
          <div style={{ display: 'flex', gap: '8px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <select
              value={year}
              onChange={(e) => onYearChange?.(e.target.value)}
              style={{ backgroundColor: 'transparent', color: theme === 'light' ? '#374151' : '#fff', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', outline: 'none', padding: '2px 8px' }}
            >
              {availableYears.map(y => (
                <option key={y} value={y} style={{ color: '#000' }}>{y}</option>
              ))}
            </select>
            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <select
              value={quarter}
              onChange={(e) => onQuarterChange?.(e.target.value)}
              style={{ backgroundColor: 'transparent', color: 'var(--component-text-accent)', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', outline: 'none', padding: '2px 8px' }}
            >
              {['Q1', 'Q2', 'Q3', 'Q4', 'All'].map(q => (
                <option key={q} value={q} style={{ color: '#000' }}>{q}</option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

          {/* Export/Share Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button title={effectiveLanguage === 'ar' ? 'تصدير التقرير' : 'Export Report'} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '18px' }}>📥</span>
            </button>
            <button title={effectiveLanguage === 'ar' ? 'مشاركة العرض' : 'Share View'} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '18px' }}>🔗</span>
            </button>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

          {/* Onboarding Button */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('start-onboarding'))}
            title={effectiveLanguage === 'ar' ? 'إعادة الجولة التعريفية' : 'Replay Tour'}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', color: 'var(--component-text-accent)', fontSize: '16px', fontWeight: 700, width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ?
          </button>

          {/* Language & Theme Toggles */}
          <LanguageToggle />
          <ThemeToggle />

          {/* Profile Dropdown - Copied from Sidebar */}
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="account-row clickable" style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ position: 'relative', background: 'var(--component-color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%' }}>
                    <img src="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2Faa1d3e8edf5b47d1b88df2eb208d3cac" alt="profile" style={{ width: '100%', height: '100%', display: 'block', borderRadius: '50%' }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: theme === 'light' ? '#374151' : '#fff', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.user_metadata?.full_name || currentUser?.email || (effectiveLanguage === 'ar' ? 'الحساب' : 'Account')}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom" style={{ width: '240px', backgroundColor: 'var(--component-panel-bg)', color: 'var(--component-text-primary)', border: '1px solid var(--component-panel-border)' }}>
                <div style={{ padding: '12px', borderBottom: '1px solid var(--component-panel-border)', marginBottom: '4px' }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{currentUser?.user_metadata?.full_name || (effectiveLanguage === 'ar' ? 'الحساب' : 'Account')}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--component-text-secondary)' }}>{currentUser?.email}</p>
                </div>
                <DropdownMenuItem className="clickable" onSelect={(e) => { e.preventDefault(); setIsProfileOpen(true); }}>
                  <span>👤 {effectiveLanguage === 'ar' ? 'الملف الشخصي' : 'Profile'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="clickable" onSelect={(e) => { e.preventDefault(); setIsSettingsOpen(true); }}>
                  <span>⚙️ {effectiveLanguage === 'ar' ? 'الإعدادات' : 'Settings'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="clickable" style={{ color: 'var(--component-color-danger)' }} onClick={async () => {
                  try { await authLogout(); } catch { }
                  try { localStorage.removeItem('josoor_user'); localStorage.setItem('josoor_authenticated', 'false'); } catch { }
                  setCurrentUser(null);
                  navigate('/landing');
                }}>
                  <span>🚪 {effectiveLanguage === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button className="clickable" style={{ padding: '4px 12px', borderRadius: '24px', backgroundColor: 'rgba(244,187,48,0.1)', border: '1px solid rgba(244,187,48,0.3)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/login')}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}>
                <img src="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2Faa1d3e8edf5b47d1b88df2eb208d3cac" alt="profile" style={{ width: '100%', height: '100%', display: 'block' }} />
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1 }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--component-text-accent)' }}>{effectiveLanguage === 'ar' ? 'ضيف' : 'Guest'}</p>
                <p style={{ margin: 0, fontSize: '10px', color: 'var(--component-text-accent)', opacity: 0.8 }}>{effectiveLanguage === 'ar' ? 'سجل للحفظ' : 'Login to save'}</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent style={{ maxWidth: '425px', width: '100%' }}>
          <DialogHeader>
            <DialogTitle>{effectiveLanguage === 'ar' ? 'الملف الشخصي' : 'Profile'}</DialogTitle>
            <DialogDescription>{effectiveLanguage === 'ar' ? 'الحساب' : 'Account'}</DialogDescription>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '16px 0' }}>
            <div style={{ height: '96px', width: '96px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2Faa1d3e8edf5b47d1b88df2eb208d3cac" alt="profile" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{currentUser?.user_metadata?.full_name || currentUser?.email || (effectiveLanguage === 'ar' ? 'الحساب' : 'Account')}</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{currentUser?.email}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsProfileOpen(false)}>{effectiveLanguage === 'ar' ? 'إغلاق' : 'Close'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent style={{ maxWidth: '425px', width: '100%' }}>
          <DialogHeader>
            <DialogTitle>{effectiveLanguage === 'ar' ? 'الإعدادات' : 'Settings'}</DialogTitle>
            <DialogDescription>{effectiveLanguage === 'ar' ? 'تخصيص تفضيلات التطبيق الخاص بك.' : 'Customize your application preferences.'}</DialogDescription>
          </DialogHeader>
          <div style={{ display: 'grid', gap: '16px', padding: '16px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', alignItems: 'center', gap: '16px' }}>
              <span style={{ textAlign: 'right', fontWeight: 500 }}>{effectiveLanguage === 'ar' ? 'المظهر' : 'Theme'}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => { document.documentElement.setAttribute('data-theme', 'light'); }}
                  style={{ flex: 1 }}
                >
                  {effectiveLanguage === 'ar' ? 'فاتح' : 'Light'}
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => { document.documentElement.setAttribute('data-theme', 'dark'); }}
                  style={{ flex: 1 }}
                >
                  {effectiveLanguage === 'ar' ? 'داكن' : 'Dark'}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSettingsOpen(false)}>{effectiveLanguage === 'ar' ? 'إغلاق' : 'Close'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Area - Takes remaining space */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'auto',
        }}
      >
        {!children ? (
          // CHAT MODE - Render messages or welcome screen
          <>
            <ScrollArea
              style={{
                flex: 1,
                minHeight: 0,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div className="chat-content-wrapper">
                {!hasMessages ? (
                  /* Welcome Screen */
                  <div className="welcome-screen">
                    {onToggleCanvas && (
                      <div
                        style={{
                          marginBottom: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          overflow: 'auto',
                        }}
                      >
                        <div className="canvas-toggle-small-wrapper" style={{ justifyContent: effectiveLanguage === 'ar' ? 'flex-start' : 'flex-end' }}>
                          <button
                            onClick={onToggleCanvas}
                            className="sidebar-icon-button clickable"
                            title={effectiveLanguage === 'ar' ? 'تبديل اللوحة' : 'Toggle canvas'}
                            aria-label={effectiveLanguage === 'ar' ? 'تبديل اللوحة' : 'Toggle canvas'}
                          >
                            <img src="/icons/menu.png" alt="Toggle canvas" className="sidebar-quickaction-icon sidebar-quickaction-small" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        flex: 1,
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <div className="welcome-avatar" style={{ backgroundImage: "url('/icons/josoor.png')" }} />

                      <h1 className="welcome-title tajawal">{translations.welcomeTitle}</h1>
                      <p className="welcome-sub cairo">{translations.welcomeSubtitle}</p>

                      {/* Example Prompts */}
                      <div className="example-grid" dir={effectiveLanguage === 'ar' ? 'rtl' : 'ltr'}>
                        <p className="example-intro">{translations.examplesTitle}</p>
                        <div className="example-list">
                          {translations.examples.map((example, index) => {
                            const isRTL = effectiveLanguage === 'ar';
                            return (
                              <button
                                key={index}
                                onClick={() => onSendMessage(example.text)}
                                className={`example-button clickable ${isRTL ? 'rtl-mode' : ''}`}
                                style={{
                                  flexDirection: isRTL ? 'row-reverse' : 'row',
                                  justifyContent: 'flex-start',
                                } as React.CSSProperties}
                              >
                                <example.icon
                                  className="example-icon"
                                  style={{ order: isRTL ? 2 : 0 }}
                                />
                                <span className="example-text cairo" style={{
                                  textAlign: isRTL ? 'right' : 'left',
                                  width: '100%',
                                  order: isRTL ? 1 : 0,
                                }}>
                                  {example.text}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Messages List */
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '24px',
                    }}
                  >
                    {messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isUser={message.role === 'user'}
                        language={effectiveLanguage}
                        showAvatar={true}
                        onCopy={() => {
                          // Copy handled internally in MessageBubble
                        }}
                        onFeedback={() => { }}
                        onOpenArtifact={(artifact, artifacts) => {
                          if (onOpenArtifact) onOpenArtifact(artifact, artifacts);
                        }}
                        onRetry={() => {
                          // Retry sends a short 'Try Again' prompt through the parent onSendMessage
                          if (onSendMessage) onSendMessage('Try Again');
                        }}
                      />
                    ))}

                    {/* Thinking Indicator */}
                    {isLoading && <ThinkingIndicator language={language} />}

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Chat Input - Only show in chat mode */}
            <div>
              <ChatInput
                onSend={onSendMessage}
                disabled={isLoading}
                language={effectiveLanguage}
              />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, overflow: 'auto' }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
});
