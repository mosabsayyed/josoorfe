import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MainAppState {
  year: string;
  quarter: string;
  theme: 'light' | 'dark';
  language: 'en' | 'ar';
  isRTL: boolean;
  onboardingComplete: boolean;
  openEscalationsCount: number;
}

interface MainAppActions {
  setYear: (year: string) => void;
  setQuarter: (quarter: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  resetOnboarding: () => void;
  completeOnboarding: () => void;
  setOpenEscalationsCount: (count: number) => void;
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

  const value: MainAppContextType = {
    year,
    quarter,
    theme,
    language,
    isRTL,
    onboardingComplete,
    openEscalationsCount,
    setYear,
    setQuarter,
    setTheme,
    setLanguage,
    resetOnboarding,
    completeOnboarding,
    setOpenEscalationsCount,
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
