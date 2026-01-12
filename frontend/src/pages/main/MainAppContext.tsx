import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { chatService } from '../../services/chatService';
import * as authService from '../../services/authService';
import type { ConversationSummary } from '../../types/api';

interface MainAppState {
  year: string;
  quarter: string;
  theme: 'light' | 'dark';
  language: 'en' | 'ar';
  isRTL: boolean;
  onboardingComplete: boolean;
  openEscalationsCount: number;
  conversations: ConversationSummary[];
  activeConversationId: number | null;
}

interface MainAppActions {
  setYear: (year: string) => void;
  setQuarter: (quarter: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  resetOnboarding: () => void;
  completeOnboarding: () => void;
  setOpenEscalationsCount: (count: number) => void;
  setConversations: React.Dispatch<React.SetStateAction<ConversationSummary[]>>;
  setActiveConversationId: (id: number | null) => void;
  loadConversations: () => Promise<void>;
  handleNewChat: () => void;
  handleSelectConversation: (id: number) => void;
  handleDeleteConversation: (id: number) => Promise<void>;
}

type MainAppContextType = MainAppState & MainAppActions;

const MainAppContext = createContext<MainAppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  theme: 'josoor_theme',
  language: 'josoor_language',
  onboardingComplete: 'josoor_onboarding_complete',
  year: 'josoor_year',
  quarter: 'josoor_quarter',
} as const;

export function MainAppProvider({ children }: { children: ReactNode }) {
  const [year, setYearState] = useState<string>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.year);
    return stored || '2025';
  });
  const [quarter, setQuarterState] = useState<string>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.quarter);
    return stored || 'All';
  });
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.theme);
    return (stored === 'light' || stored === 'dark') ? stored : 'dark';
  });
  const [language, setLanguageState] = useState<'en' | 'ar'>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.language);
    return (stored === 'en' || stored === 'ar') ? stored : 'en';
  });
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.onboardingComplete) === 'true';
  });
  const [openEscalationsCount, setOpenEscalationsCount] = useState<number>(0);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.language, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.onboardingComplete, String(onboardingComplete));
  }, [onboardingComplete]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.year, year);
  }, [year]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.quarter, quarter);
  }, [quarter]);

  const loadConversations = useCallback(async () => {
    try {
      if (authService.isGuestMode()) {
        const guestConvos = authService.getGuestConversations();
        const adaptedConversations = (guestConvos || []).map((c: any) => ({
          id: c.id,
          title: c.title || 'New Chat',
          message_count: (c.messages || []).length,
          created_at: c.created_at || new Date().toISOString(),
          updated_at: c.updated_at || new Date().toISOString(),
          _isGuest: true,
        }));
        setConversations(adaptedConversations as any);
        return;
      }

      if (!authService.getToken()) {
        const guestConvos = authService.getGuestConversations();
        const adaptedConversations = (guestConvos || []).map((c: any) => ({
          id: c.id,
          title: c.title || 'New Chat',
          message_count: (c.messages || []).length,
          created_at: c.created_at || new Date().toISOString(),
          updated_at: c.updated_at || new Date().toISOString(),
          _isGuest: true,
        }));
        setConversations(adaptedConversations as any);
        return;
      }

      const data = await chatService.getConversations();
      const adaptedConversations = (data.conversations || []).map((c: any) => ({
        ...c,
        title: c.title || "New Chat",
        message_count: Array.isArray(c.messages) ? c.messages.length : (typeof c.message_count === 'number' ? c.message_count : 0),
        created_at: c.created_at || new Date().toISOString(),
        updated_at: c.updated_at || new Date().toISOString(),
      }));
      setConversations(adaptedConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      try {
        const guestConvos = authService.getGuestConversations();
        if (guestConvos && guestConvos.length > 0) {
          const adaptedConversations = (guestConvos || []).map((c: any) => ({
            id: c.id,
            title: c.title || 'New Chat',
            message_count: (c.messages || []).length,
            created_at: c.created_at || new Date().toISOString(),
            updated_at: c.updatedAt || new Date().toISOString(),
            _isGuest: true,
          }));
          setConversations(adaptedConversations as any);
        }
      } catch (err) {
        console.error('Failed to load guest conversations:', err);
      }
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const handleAuthChange = () => {
      loadConversations();
    };
    window.addEventListener('josoor_auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('josoor_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [loadConversations]);

  useEffect(() => {
    fetch('/api/v1/governance/open-escalations')
      .then(res => res.json())
      .then(data => setOpenEscalationsCount(data.count || 0))
      .catch(() => setOpenEscalationsCount(0));
  }, []);

  const setYear = (newYear: string) => {
    setYearState(newYear);
  };

  const setQuarter = (newQuarter: string) => {
    setQuarterState(newQuarter);
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  const setLanguage = (lang: 'en' | 'ar') => {
    setLanguageState(lang);
  };

  const resetOnboarding = () => {
    setOnboardingComplete(false);
  };

  const completeOnboarding = () => {
    setOnboardingComplete(true);
  };

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  const handleSelectConversation = useCallback((id: number) => {
    setActiveConversationId(id);
  }, []);

  const handleDeleteConversation = useCallback(async (id: number) => {
    try {
      if (authService.isGuestMode()) {
        const guestConvos = authService.getGuestConversations();
        const updatedRaw = guestConvos.filter((c: any) => c.id !== id);
        authService.saveGuestConversations(updatedRaw);
        const normalizedConversations = updatedRaw.map((c: any) => ({
          id: c.id,
          title: c.title || 'New Chat',
          message_count: (c.messages || []).length,
          created_at: c.created_at || new Date().toISOString(),
          updated_at: c.updated_at || new Date().toISOString(),
          _isGuest: true,
        }));
        setConversations(normalizedConversations as ConversationSummary[]);
      } else {
        await chatService.deleteConversation(id);
        setConversations(prev => prev.filter(c => c.id !== id));
      }
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }, [activeConversationId]);

  const value: MainAppContextType = {
    year,
    quarter,
    theme,
    language,
    isRTL,
    onboardingComplete,
    openEscalationsCount,
    conversations,
    activeConversationId,
    setYear,
    setQuarter,
    setTheme,
    setLanguage,
    resetOnboarding,
    completeOnboarding,
    setOpenEscalationsCount,
    setConversations,
    setActiveConversationId,
    loadConversations,
    handleNewChat,
    handleSelectConversation,
    handleDeleteConversation,
  };

  return (
    <MainAppContext.Provider value={value}>
      <div dir={isRTL ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </MainAppContext.Provider>
  );
}

export function useMainApp() {
  const context = useContext(MainAppContext);
  if (context === undefined) {
    throw new Error('useMainApp must be used within a MainAppProvider');
  }
  return context;
}
