import React, { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, Navigate, useLocation, BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import LandingPage from './pages/LandingPage';
import FounderLetterPage from './pages/FounderLetterPage';
import ContactUsPage from './pages/ContactUsPage';
import './index.css';

const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const ProviderManagement = lazy(() => import('./pages/admin/ProviderManagement').then((module) => ({ default: module.ProviderManagement })));
const ABTesting = lazy(() => import('./pages/admin/ABTesting').then((module) => ({ default: module.ABTesting })));
const MonitoringDashboard = lazy(() => import('./pages/admin/MonitoringDashboard').then((module) => ({ default: module.MonitoringDashboard })));
const ChatAppPage = lazy(() => import('./pages/ChatAppPage'));
const BuilderPage = lazy(() => import('./pages/BuilderPage'));
const JosoorShell = lazy(() => import('./app/josoor/JosoorShell'));
const SectorDesk = lazy(() => import('./components/desks/SectorDesk').then((module) => ({ default: module.SectorDesk })));
const ControlsDesk = lazy(() => import('./components/desks/ControlsDesk').then((module) => ({ default: module.ControlsDesk })));
const PlanningDesk = lazy(() => import('./components/desks/PlanningDesk').then((module) => ({ default: module.PlanningDesk })));
const EnterpriseDesk = lazy(() => import('./components/desks/EnterpriseDesk').then((module) => ({ default: module.EnterpriseDesk })));
const ReportingDesk = lazy(() => import('./components/desks/ReportingDesk').then((module) => ({ default: module.ReportingDesk })));
const ExplorerDesk = lazy(() => import('./components/desks/ExplorerDesk').then((module) => ({ default: module.ExplorerDesk })));
const ChainDeskAura = lazy(() => import('./components/desks/ChainDeskAura').then((module) => ({ default: module.ChainDeskAura })));
const JosoorDesktopPage = React.lazy(() => import('./pages/JosoorDesktopPage'));

const KnowledgeSeries = () => <div className="p-10 text-xl">Knowledge Series (Coming Soon)</div>;
const Roadmap = () => <div className="p-10 text-xl">Roadmap (Coming Soon)</div>;

function RouteFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      Loading...
    </div>
  );
}

function ProtectedRoute({ children, allowGuest = false }: { children: React.ReactElement; allowGuest?: boolean }) {
  const { user, loading } = useAuth();

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
  if (user) return <Navigate to="/josoor-desktop" replace />;
  return <LandingPage />;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/founder-letter" element={<FounderLetterPage />} />
      <Route path="/contact-us" element={<ContactUsPage />} />
      <Route path="/login" element={<Suspense fallback={<RouteFallback />}><LoginPage /></Suspense>} />

      {/* DESKTOP — JosoorOS */}
      <Route path="/josoor-desktop" element={
        <ProtectedRoute>
          <Suspense fallback={<RouteFallback />}>
            <JosoorDesktopPage />
          </Suspense>
        </ProtectedRoute>
      } />

      {/* NEW JOSOOR ROUTE - The unified shell */}
      <Route path="/josoor" element={
        <ProtectedRoute>
          <Suspense fallback={<RouteFallback />}>
            <JosoorShell />
          </Suspense>
        </ProtectedRoute>
      } />

      {/* LEGACY: CHAT ROUTE - The "Pure" Chat Experience */}
      <Route path="/chat" element={
        <ProtectedRoute>
          <Suspense fallback={<RouteFallback />}>
            <ChatAppPage />
          </Suspense>
        </ProtectedRoute>
      } />

      {/* LEGACY: DESK ROUTES - The "Integrated" Experience (ChatAppPage as Layout) */}
      <Route path="/desk" element={
        <ProtectedRoute>
          <Suspense fallback={<RouteFallback />}>
            <ChatAppPage />
          </Suspense>
        </ProtectedRoute>
      }>
        <Route path="sector" element={<Suspense fallback={<RouteFallback />}><SectorDesk /></Suspense>} />
        <Route path="controls" element={<Suspense fallback={<RouteFallback />}><ControlsDesk /></Suspense>} />
        <Route path="planning" element={<Suspense fallback={<RouteFallback />}><PlanningDesk /></Suspense>} />
        <Route path="enterprise" element={<Suspense fallback={<RouteFallback />}><EnterpriseDesk /></Suspense>} />
        <Route path="reporting" element={<Suspense fallback={<RouteFallback />}><ReportingDesk /></Suspense>} />
        <Route path="knowledge" element={<KnowledgeSeries />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="explorer" element={<Suspense fallback={<RouteFallback />}><ExplorerDesk /></Suspense>} />
        <Route path="chain-aura" element={<Suspense fallback={<RouteFallback />}><ChainDeskAura /></Suspense>} />
        {/* Default redirect inside /desk */}
        <Route index element={<Navigate to="sector" replace />} />
      </Route>

      {/* ADMIN ROUTES */}
      <Route path="/admin">
        <Route path="providers" element={
          <ProtectedRoute>
            <Suspense fallback={<RouteFallback />}>
              <ProviderManagement />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="ab-testing" element={
          <ProtectedRoute>
            <Suspense fallback={<RouteFallback />}>
              <ABTesting />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="monitoring" element={
          <ProtectedRoute>
            <Suspense fallback={<RouteFallback />}>
              <MonitoringDashboard />
            </Suspense>
          </ProtectedRoute>
        } />
      </Route>

      {/* Fallback */}
      <Route path="/builder" element={<Suspense fallback={<RouteFallback />}><BuilderPage /></Suspense>} />
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
