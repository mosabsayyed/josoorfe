import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MainAppProvider, useMainApp } from './MainAppContext';
import { FrameHeader } from '../josoor-sandbox/layout/FrameHeader';
import { MainSidebar } from './MainSidebar';
import { useOnboardingTour } from './useOnboardingTour';
import '../../styles/theme.css';
import '../../styles/onboarding.css';
import 'driver.js/dist/driver.css';

const MainAppLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('josoor_sidebar_collapsed') === 'true';
    } catch { return false; }
  });
  const { year, setYear, quarter, setQuarter, isRTL, onboardingComplete, resetOnboarding } = useMainApp();
  const location = useLocation();
  
  const { startTour } = useOnboardingTour();

  useEffect(() => {
    try {
      localStorage.setItem('josoor_sidebar_collapsed', String(isSidebarCollapsed));
    } catch {}
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (!onboardingComplete) {
      const timer = setTimeout(() => {
        startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [onboardingComplete, startTour]);

  const getPageInfo = () => {
    if (location.pathname.includes('/sector')) return { title: 'Sector Desk', subtitle: 'Sector Outcomes & Impact Monitoring' };
    if (location.pathname.includes('/enterprise')) return { title: 'Enterprise Desk', subtitle: 'Capability Prioritization & Health' };
    if (location.pathname.includes('/controls')) return { title: 'Controls Desk', subtitle: 'Deviation Signals & Risk Awareness' };
    if (location.pathname.includes('/planning')) return { title: 'Planning Desk', subtitle: 'Resource Allocation & Gap Analysis' };
    if (location.pathname.includes('/reporting')) return { title: 'Reporting Desk', subtitle: 'AI-Generated Insights & Reports' };
    if (location.pathname.includes('/knowledge')) return { title: 'Knowledge Series', subtitle: 'Build Understanding of Concepts' };
    if (location.pathname.includes('/roadmap')) return { title: 'Roadmap', subtitle: 'Product Architecture & Features' };
    if (location.pathname.includes('/graph')) return { title: 'Graph Explorer', subtitle: '3D Visualization & Governance Log' };
    if (location.pathname.includes('/chat')) return { title: 'Graph Chat', subtitle: 'Expert Agent Grounded with Knowledge Graph' };
    if (location.pathname.includes('/settings')) return { title: 'Settings', subtitle: 'Platform Configuration' };
    if (location.pathname.includes('/observability')) return { title: 'Observability', subtitle: 'System Monitoring & Logs' };
    return { title: 'JOSOOR', subtitle: 'Cognitive Twin for Enterprise Transformation' };
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div 
      id="main-app"
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#050912',
        overflow: 'hidden',
        fontFamily: '"Inter", sans-serif',
        direction: isRTL ? 'rtl' : 'ltr'
      }}
    >
      <MainSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        overflow: 'hidden'
      }}>
        <FrameHeader 
          year={year}
          quarter={quarter}
          onYearChange={setYear}
          onQuarterChange={setQuarter}
          title={title}
          subtitle={subtitle}
          onOnboardingReplay={() => {
            resetOnboarding();
            setTimeout(() => startTour(), 100);
          }}
        />

        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1.5rem',
          position: 'relative'
        }}>
          <Outlet context={{ year, quarter }} />
        </div>
      </div>
    </div>
  );
};

export const MainAppPage: React.FC = () => {
  return (
    <MainAppProvider>
      <MainAppLayout />
    </MainAppProvider>
  );
};

export default MainAppPage;
