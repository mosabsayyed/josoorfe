import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MainAppProvider, useMainApp } from './MainAppContext';
import { MainHeader } from './MainHeader';
import { MainSidebar } from './MainSidebar';
import { useOnboardingTour } from './useOnboardingTour';
import '../../styles/theme.css';
import '../../styles/onboarding.css';
import 'driver.js/dist/driver.css';

const MainAppLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { year, quarter, isRTL } = useMainApp();
  const location = useLocation();
  
  useOnboardingTour();

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
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--component-bg-primary)',
      overflow: 'hidden',
      fontFamily: 'var(--component-font-family)',
      direction: isRTL ? 'rtl' : 'ltr'
    }}>
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
        <MainHeader 
          title={title}
          subtitle={subtitle}
        />

        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1.5rem',
          position: 'relative',
          backgroundColor: 'var(--component-bg-primary)'
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
