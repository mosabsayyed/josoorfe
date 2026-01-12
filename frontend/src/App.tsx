import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import ChatAppPage from "./pages/ChatAppPage";
import { LoginPage } from "./pages/LoginPage";
import LandingPage from './pages/LandingPage';
import WelcomeEntry from './pages/WelcomeEntry';
import CanvasTestPage from './pages/CanvasTestPage';
import FounderLetterPage from './pages/FounderLetterPage';
import ContactUsPage from './pages/ContactUsPage';
import ArchitecturePage from './pages/ArchitecturePage';
import JosoorDashboardPage from './pages/josoor-dashboards/JosoorDashboardPage';
import { JosoorPage } from './pages/josoor-restored-safe/JosoorPage';
// import { JosoorSandboxPage } from './pages/josoor-sandbox/JosoorPage'; // Deprecated
import { JosoorFrame } from './pages/josoor-sandbox/layout/JosoorFrame';
import { ControlTower } from './pages/josoor-sandbox/components/ControlTower';
import { DependencyDesk } from './pages/josoor-sandbox/components/DependencyDesk';
import RiskDesk from './pages/josoor-sandbox/components/RiskDesk';
import { PlanningDesk } from './pages/josoor-sandbox/components/PlanningDesk';
import { ReportingDesk } from './pages/josoor-sandbox/components/ReportingDesk';
import InvestorDemoHub from './components/content/InvestorDemoHub';
import TwinKnowledge from './components/content/TwinKnowledge';
import ProductRoadmap from './components/content/ProductRoadmap';
import PlanYourJourney from './components/content/PlanYourJourney';

import { JosoorV2Page } from './pages/josoor-v2/JosoorV2Page';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ObservabilityPage from './pages/ObservabilityPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import SystemObservabilityPage from './pages/SystemObservabilityPage';
import ObservabilityDashboardPage from './pages/ObservabilityDashboardPage';

import { MainAppPage } from './pages/main/MainAppPage';
import { SectorDesk } from './pages/main/sections/SectorDesk';
import { EnterpriseDesk } from './pages/main/sections/EnterpriseDesk';
import { ControlsDesk } from './pages/main/sections/ControlsDesk';
import { PlanningDesk as MainPlanningDesk } from './pages/main/sections/PlanningDesk';
import { ReportingDesk as MainReportingDesk } from './pages/main/sections/ReportingDesk';
import { KnowledgeSeries } from './pages/main/sections/KnowledgeSeries';
import { Roadmap } from './pages/main/sections/Roadmap';
import { GraphExplorer } from './pages/main/sections/GraphExplorer';
import { GraphChat } from './pages/main/sections/GraphChat';
import { Settings as MainSettings } from './pages/main/sections/Settings';
import { Observability as MainObservability } from './pages/main/sections/Observability';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  return null;
}


function ProtectedRoute({ children, allowGuest = false }: { children: React.ReactElement; allowGuest?: boolean }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    if (allowGuest) {
      // Allow guest access for this route
      return children;
    }
    return <Navigate to="/landing" replace />;
  }
  return children;
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const isWelcomePage = location.pathname === "/";

  const handleLogin = () => {
    try {
      localStorage.setItem("josoor_authenticated", "true");
    } catch {}
    navigate('/chat', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <ScrollToTop />

      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute allowGuest={true}>
              <LandingPage />
            </ProtectedRoute>
          }
        />

        <Route path="/welcome" element={<WelcomeEntry/>} />

        <Route path="/landing" element={<Navigate to="/" replace />} />

        <Route path="/chat" element={
          <ProtectedRoute allowGuest={true}>
            <ChatAppPage />
          </ProtectedRoute>
        } />

        <Route path="/architecture" element={<ArchitecturePage />} />

        <Route path="/canvas-test" element={<CanvasTestPage />} />

        <Route path="/josoor-dashboards" element={<JosoorDashboardPage />} />
        <Route path="/josoor-review" element={<JosoorPage />} />
        <Route path="/josoor" element={<JosoorPage />} />
        <Route path="/josoor-v2" element={<JosoorV2Page />} />
        
        {/* New Josoor Sandbox with Frame */}
        <Route path="/josoor-sandbox" element={<JosoorFrame />}>
            <Route index element={<Navigate to="executives" replace />} />
            <Route path="executives" element={<ControlTower />} />
            <Route path="dependencies" element={<DependencyDesk />} />
            <Route path="risks" element={<RiskDesk />} />
            <Route path="planning" element={<PlanningDesk />} />
            <Route path="reporting" element={<ReportingDesk />} />
            <Route path="knowledge/hub" element={<TwinKnowledge />} />
            <Route path="knowledge/demo" element={<InvestorDemoHub />} />
            <Route path="knowledge/design" element={<ProductRoadmap />} />
            <Route path="knowledge/journey" element={<PlanYourJourney />} />
            <Route path="admin/settings" element={<AdminSettingsPage />} />
            <Route path="admin/observability" element={<ObservabilityDashboardPage />} />
        </Route>

        {/* NEW: Main App Page with unified layout */}
        <Route path="/main" element={
          <ProtectedRoute allowGuest={true}>
            <MainAppPage />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="sector" replace />} />
          <Route path="sector" element={<SectorDesk />} />
          <Route path="enterprise" element={<EnterpriseDesk />} />
          <Route path="controls" element={<ControlsDesk />} />
          <Route path="planning" element={<MainPlanningDesk />} />
          <Route path="reporting" element={<MainReportingDesk />} />
          <Route path="knowledge" element={<KnowledgeSeries />} />
          <Route path="roadmap" element={<Roadmap />} />
          <Route path="graph" element={<GraphExplorer />} />
          <Route path="chat" element={<GraphChat />} />
          <Route path="settings" element={<MainSettings />} />
          <Route path="observability" element={<MainObservability />} />
        </Route>

        <Route path="/founder-letter" element={<FounderLetterPage />} />

        <Route path="/contact-us" element={<ContactUsPage />} />

        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

        {/* Legacy admin routes - redirect to josoor-sandbox */}
        <Route path="/admin" element={<Navigate to="/josoor-sandbox/admin/settings" replace />} />
        <Route path="/admin/settings" element={<Navigate to="/josoor-sandbox/admin/settings" replace />} />
        <Route path="/admin/observability" element={<Navigate to="/josoor-sandbox/admin/observability" replace />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <JosoorDashboardPage />
          </ProtectedRoute>
        } />

        {/* JOSOOR PLATFORM MAIN ENTRY */}
        <Route path="/josoor-review" element={<JosoorPage />} />
        <Route path="/josoor" element={
           <ProtectedRoute>
              <JosoorPage />
           </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </div>
  );
}

export default function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <AppRoutes />
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
