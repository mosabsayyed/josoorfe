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
import { useTranslation } from 'react-i18next';
import { MessageBubble, ThinkingIndicator } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ChatToolbar } from './ChatToolbar';
import { CondensationIndicator } from './CondensationIndicator';
import { ScrollArea } from '../ui/scroll-area';
import { BarChart3, FileText, Table, MessageSquare } from 'lucide-react';
import type { Message as APIMessage } from '../../types/api';
import { useLanguage } from '../../contexts/LanguageContext';
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
  // Toolbar props
  selectedPersona?: string | null;
  onPersonaChange?: (persona: string) => void;
  isPersonaLocked?: boolean;
  selectedTools?: string[];
  onToolsChange?: (tools: string[]) => void;
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
  year = '2029',
  quarter = 'All',
  onYearChange,
  onQuarterChange,
  children,
  title,
  subtitle,
  availableYears = ['2025', '2026', '2027', '2028', '2029'],
  selectedPersona,
  onPersonaChange,
  isPersonaLocked = false,
  selectedTools = [],
  onToolsChange,
}: ChatContainerProps) {
  const { t } = useTranslation();
  const [showCondensationDetails, setShowCondensationDetails] = useState(false);
  const [condensationMetadata, setCondensationMetadata] = useState<any>(null);

  // Detect condensation metadata in messages
  useEffect(() => {
    for (const msg of messages) {
      if (msg.metadata?.condenser_result) {
        setCondensationMetadata(msg.metadata.condenser_result);
        break;
      }
      if (
        msg.role === 'system' &&
        msg.content.includes('PRIOR CONTEXT (compressed)')
      ) {
        setCondensationMetadata({
          found: true,
          inSystemMessage: true,
        });
        break;
      }
    }
  }, [messages]);
  const { language: ctxLanguage } = useLanguage();
  const effectiveLanguage = language ?? ctxLanguage;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Combine regular messages with streaming message
  const displayMessages = useMemo(() => {
    return streamingMessage ? [...messages, streamingMessage] : messages;
  }, [messages, streamingMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, isLoading]);

  const translations = {
    welcomeTitle: t('josoor.chat.welcomeTitle'),
    welcomeSubtitle: t('josoor.chat.welcomeSubtitle'),
    examplesTitle: t('josoor.chat.tryExamples'),
    examples: [
      {
        icon: BarChart3,
        text: t('josoor.chat.exampleTransformation'),
      },
      {
        icon: Table,
        text: t('josoor.chat.exampleCapabilities'),
      },
      {
        icon: FileText,
        text: t('josoor.chat.exampleReport'),
      },
      {
        icon: MessageSquare,
        text: t('josoor.chat.exampleGovernance'),
      },
    ],
  };

  const hasMessages = displayMessages.length > 0;

  return (
    <div className="chat-container-root">
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
                            title={t('josoor.chat.toggleCanvas')}
                            aria-label={t('josoor.chat.toggleCanvas')}
                          >
                            <img src="/icons/menu.png" alt={t('josoor.chat.toggleCanvas')} className="sidebar-quickaction-icon sidebar-quickaction-small" />
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
                    {/* Condensation Indicator - Show if condensation detected */}
                    {condensationMetadata && (
                      <CondensationIndicator
                        originalCount={condensationMetadata.original_message_count}
                        condensedCount={condensationMetadata.condensed_message_count}
                        tokensSaved={condensationMetadata.tokens_freed}
                        language={effectiveLanguage}
                        expanded={showCondensationDetails}
                        onToggleExpanded={setShowCondensationDetails}
                      />
                    )}

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
                          if (onSendMessage) onSendMessage(t('josoor.chat.tryAgain'));
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

            {/* Toolbar + Chat Input - Only show in chat mode */}
            <div>
              {onPersonaChange && onToolsChange && (
                <ChatToolbar
                  selectedPersona={selectedPersona ?? null}
                  onPersonaChange={onPersonaChange}
                  isPersonaLocked={isPersonaLocked}
                  selectedTools={selectedTools}
                  onToolsChange={onToolsChange}
                />
              )}
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
