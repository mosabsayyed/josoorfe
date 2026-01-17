import React, { useState, useEffect } from 'react';
import { Globe, User, LogOut, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMainApp } from './MainAppContext';
import { getUser, logout as authLogout } from '../../services/authService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface MainHeaderProps {
  title?: string;
  subtitle?: string;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ 
  title = "JOSOOR",
  subtitle = "Cognitive Twin for Enterprise Transformation"
}) => {
  const navigate = useNavigate();
  const { 
    year, 
    quarter, 
    theme, 
    language, 
    isRTL,
    setYear, 
    setQuarter, 
    setTheme, 
    setLanguage,
    resetOnboarding 
  } = useMainApp();
  
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

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4', 'All'];
  const years = ['2025', '2026', '2027', '2028', '2029', '2030'];

  const isGuest = !currentUser;

  const handleOnboardingReplay = () => {
    resetOnboarding();
  };

  return (
    <div 
      id="main-header"
      style={{
        height: '70px',
        backgroundColor: 'var(--canvas-header-bg)',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        zIndex: 90,
        direction: isRTL ? 'rtl' : 'ltr'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ 
          color: 'var(--text-primary)', 
          fontSize: '1.25rem', 
          fontWeight: 700, 
          margin: 0,
          letterSpacing: '0.5px'
        }}>
          {title}
        </h2>
        <div style={{ 
          color: 'var(--color-gold)', 
          fontSize: '0.75rem', 
          marginTop: '2px',
          opacity: 0.8,
          fontWeight: 500
        }}>
          {subtitle}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          backgroundColor: 'rgba(255,255,255,0.03)', 
          padding: '0.3rem', 
          borderRadius: '8px', 
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <select 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              padding: '0 0.5rem'
            }}
          >
            {years.map(y => (
              <option key={y} value={y} style={{color: '#000'}}>{y}</option>
            ))}
          </select>
          <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <select 
            value={quarter} 
            onChange={(e) => setQuarter(e.target.value)}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-gold)',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              padding: '0 0.5rem'
            }}
          >
            {quarters.map(q => (
              <option key={q} value={q} style={{color: '#000'}}>{q}</option>
            ))}
          </select>
        </div>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            title="Export Report" 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '0.4rem', 
              borderRadius: '6px', 
              color: 'var(--text-secondary)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>📥</span>
          </button>
          <button 
            title="Share View" 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '0.4rem', 
              borderRadius: '6px', 
              color: 'var(--text-secondary)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🔗</span>
          </button>
        </div>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button 
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            style={{ 
              background: 'rgba(255,255,255,0.1)', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '0.3rem 0.6rem', 
              borderRadius: '4px',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Globe size={14} />
            {language === 'ar' ? 'EN' : 'عربي'}
          </button>
        </div>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

        <button 
          onClick={handleOnboardingReplay}
          title="Replay Onboarding Tour"
          style={{ 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer', 
            padding: '0.4rem',
            borderRadius: '50%',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <HelpCircle size={20} />
        </button>

        <div id="header-profile" style={{ paddingLeft: '0.5rem' }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.8rem', 
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: '2rem',
                backgroundColor: isGuest ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.05)',
                border: isGuest ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: isGuest ? 'transparent' : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {currentUser?.user_metadata?.avatar_url ? (
                    <img src={currentUser.user_metadata.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={18} color={isGuest ? '#FFD700' : 'var(--text-primary)'} />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {currentUser?.user_metadata?.full_name || (isGuest ? (language === 'ar' ? 'ضيف' : 'Guest') : 'User')}
                  </span>
                  {isGuest && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-gold)', opacity: 0.9 }}>
                      {language === 'ar' ? 'سجل لحفظ العمل' : 'Login to Save'}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ backgroundColor: 'var(--component-panel-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}>
              <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-default)' }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>
                  {currentUser?.user_metadata?.full_name || (isGuest ? (language === 'ar' ? 'وضع الضيف' : 'Guest Mode') : 'User')}
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {currentUser?.email || (isGuest ? 'Local Session' : '')}
                </p>
              </div>
              
              {isGuest ? (
                <DropdownMenuItem className="cursor-pointer hover:bg-white/5" onClick={() => navigate('/login')}>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>🔐 Login / Sign Up</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="cursor-pointer hover:bg-white/5 text-red-400" onClick={async () => {
                  await authLogout();
                  navigate('/login');
                }}>
                  <LogOut size={16} style={{ marginRight: '8px' }} />
                  <span>Logout</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default MainHeader;
