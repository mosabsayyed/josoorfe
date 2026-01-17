import { useState } from 'react';
import { LeftNavigation } from './components/LeftNavigation';
import { DashboardSidebar } from './components/DashboardSidebar';
import { SaudiMap } from './components/SaudiMap';
// Import EnterpriseDesk
import { EnterpriseDesk } from './components/EnterpriseDesk';
// Import ControlsDesk
import { ControlsDesk } from './components/ControlsDesk';
// Import PlanningDesk
import { PlanningDesk } from './components/PlanningDesk';
// Import ReportingDesk
import { ReportingDesk } from './components/ReportingDesk';
import './App.css';

export default function App() {
  const [activeView, setActiveView] = useState('sector-desk');

  return (
    <div className="app-container">
      {/* Left Navigation Sidebar */}
      <LeftNavigation activeView={activeView} onNavigate={setActiveView} />

      {/* Content Area */}
      {activeView === 'sector-desk' ? (
        <div className="content-area-flex">
          {/* Dashboard Sidebar */}
          <DashboardSidebar />

          {/* Map Area */}
          <SaudiMap />
        </div>
      ) : activeView === 'enterprise-desk' ? (
        <div className="content-area">
          <EnterpriseDesk />
        </div>
      ) : activeView === 'controls-desk' ? (
        <div className="content-area">
          <ControlsDesk />
        </div>
      ) : activeView === 'planning-desk' ? (
        <div className="content-area">
          <PlanningDesk />
        </div>
      ) : activeView === 'reporting-desk' ? (
        <div className="content-area">
          <ReportingDesk />
        </div>
      ) : (
        <div className="loading-container">
          <div className="loading-content">
            <h2 className="loading-title">Coming Soon</h2>
            <p className="loading-text">This section is under development</p>
          </div>
        </div>
      )}
    </div>
  );
}