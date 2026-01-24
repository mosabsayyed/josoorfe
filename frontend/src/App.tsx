import React, { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, Navigate, useLocation, BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { LoginPage } from './pages/LoginPage';
import { ProviderManagement } from './pages/admin/ProviderManagement';
import { ABTesting } from './pages/admin/ABTesting';
import { MonitoringDashboard } from './pages/admin/MonitoringDashboard';
import LandingPage from './pages/LandingPage';
import ChatAppPage from './pages/ChatAppPage';
import BuilderPage from './pages/BuilderPage';
import JosoorShell from './app/josoor/JosoorShell';
import './index.css';

// Legacy desk imports (for backwards compatibility with /desk routes)
import { SectorDesk } from './components/desks/SectorDesk';
import { ControlsDesk } from './components/desks/ControlsDesk';
import { PlanningDesk } from './components/desks/PlanningDesk';
import { EnterpriseDesk } from './components/desks/EnterpriseDesk';
import { ReportingDesk } from './components/desks/ReportingDesk';

const KnowledgeSeries = () => <div className="p-10 text-xl">Knowledge Series (Coming Soon)</div>;
const Roadmap = () => <div className="p-10 text-xl">Roadmap (Coming Soon)</div>;

import { ExplorerDesk } from './components/desks/ExplorerDesk';

function ProtectedRoute({ children, allowGuest = false }: { children: React.ReactElement; allowGuest?: boolean }) {
  const { user, loading } = useAuth();

  // TEMP: Auth disabled for development
  const AUTH_DISABLED = true;
  if (AUTH_DISABLED) return children;

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    if (allowGuest) return children;
    return <Navigate to="/landing" replace />;
  }
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (user) return <Navigate to="/josoor" replace />;
  return <LandingPage />;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* NEW JOSOOR ROUTE - The unified shell */}
      <Route path="/josoor" element={
        <ProtectedRoute>
          <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Loading...</div>}>
            <JosoorShell />
          </Suspense>
        </ProtectedRoute>
      } />

      {/* LEGACY: CHAT ROUTE - The "Pure" Chat Experience */}
      <Route path="/chat" element={
        <ProtectedRoute>
          <ChatAppPage />
        </ProtectedRoute>
      } />

      {/* LEGACY: DESK ROUTES - The "Integrated" Experience (ChatAppPage as Layout) */}
      <Route path="/desk" element={
        <ProtectedRoute>
          <ChatAppPage />
        </ProtectedRoute>
      }>
        <Route path="sector" element={<SectorDesk />} />
        <Route path="controls" element={<ControlsDesk />} />
        <Route path="planning" element={<PlanningDesk />} />
        <Route path="enterprise" element={<EnterpriseDesk />} />
        <Route path="reporting" element={<ReportingDesk />} />
        <Route path="knowledge" element={<KnowledgeSeries />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="explorer" element={<ExplorerDesk />} />
        {/* Default redirect inside /desk */}
        <Route index element={<Navigate to="sector" replace />} />
      </Route>

      {/* ADMIN ROUTES */}
      <Route path="/admin">
        <Route path="providers" element={
          <ProtectedRoute>
            <ProviderManagement />
          </ProtectedRoute>
        } />
        <Route path="ab-testing" element={
          <ProtectedRoute>
            <ABTesting />
          </ProtectedRoute>
        } />
        <Route path="monitoring" element={
          <ProtectedRoute>
            <MonitoringDashboard />
          </ProtectedRoute>
        } />
      </Route>

      {/* Fallback */}
      <Route path="/builder" element={<BuilderPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}



const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
