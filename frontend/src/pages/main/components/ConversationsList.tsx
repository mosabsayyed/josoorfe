import React from 'react';
import type { ConversationSummary } from '../../../types/api';

interface ConversationsListProps {
  conversations: ConversationSummary[];
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onDeleteConversation: (id: number) => void;
  language: 'en' | 'ar';
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  language
}) => {
  const translations = {
    today: language === 'ar' ? 'اليوم' : 'Today',
    yesterday: language === 'ar' ? 'أمس' : 'Yesterday',
    previous7Days: language === 'ar' ? 'آخر 7 أيام' : 'Previous 7 days',
    older: language === 'ar' ? 'أقدم' : 'Older',
    noConversations: language === 'ar' ? 'لا توجد محادثات' : 'No conversations yet',
    messagesCount: (count: number) => language === 'ar' ? `${count} رسالة` : `${count} messages`,
    deleteConversation: language === 'ar' ? 'حذف' : 'Delete',
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

  const groupConversations = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    const groups: { title: string; items: ConversationSummary[] }[] = [
      { title: translations.today, items: [] },
      { title: translations.yesterday, items: [] },
      { title: translations.previous7Days, items: [] },
      { title: translations.older, items: [] },
    ];

    conversations.forEach(conv => {
      const convDate = new Date(conv.updated_at || conv.created_at);
      if (convDate >= today) {
        groups[0].items.push(conv);
      } else if (convDate >= yesterday) {
        groups[1].items.push(conv);
      } else if (convDate >= weekAgo) {
        groups[2].items.push(conv);
      } else {
        groups[3].items.push(conv);
      }
    });

    return groups.filter(g => g.items.length > 0);
  };

  const groupedConversations = groupConversations();

  if (conversations.length === 0) {
    return (
      <div style={{ 
        padding: '16px', 
        textAlign: 'center', 
        color: 'var(--text-secondary)',
        fontSize: '12px' 
      }}>
        {translations.noConversations}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
      {groupedConversations.map((group, idx) => (
        <div key={idx}>
          <div style={{ 
            fontSize: '10px', 
            color: 'var(--text-secondary)', 
            padding: '4px 12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600
          }}>
            {group.title}
          </div>
          {group.items.map(conv => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                marginBottom: '2px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: activeConversationId === conv.id 
                  ? 'var(--component-text-accent)' 
                  : 'transparent',
                color: activeConversationId === conv.id 
                  ? 'var(--component-text-on-accent)' 
                  : 'var(--component-text-primary)',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (activeConversationId !== conv.id) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeConversationId !== conv.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {conv.title || 'New Chat'}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: activeConversationId === conv.id 
                    ? 'rgba(255,255,255,0.7)' 
                    : 'var(--text-secondary)',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <span>{translations.messagesCount(conv.message_count || 0)}</span>
                  <span>·</span>
                  <span>{formatDate(conv.updated_at || conv.created_at)}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(language === 'ar' ? 'هل تريد حذف هذه المحادثة؟' : 'Delete this conversation?')) {
                    onDeleteConversation(conv.id);
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  opacity: 0.6,
                  fontSize: '14px'
                }}
                title={translations.deleteConversation}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ConversationsList;
