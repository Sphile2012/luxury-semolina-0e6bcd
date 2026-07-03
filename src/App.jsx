import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import Login from './pages/Login.jsx';
import FindMyPhone from './pages/FindMyPhone.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsAndConditions from './pages/TermsAndConditions.jsx';
import Watch from './pages/Watch.jsx';
import FAQ from './pages/FAQ.jsx';
import Complaints from './pages/Complaints.jsx';
import AlertHistory from './pages/AlertHistory.jsx';
import Subscriptions from './pages/Subscriptions.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import PaymentCancel from './pages/PaymentCancel.jsx';
import Journey from './pages/Journey.jsx';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout
  ? <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[#555] text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {/* Main app pages */}
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route key={path} path={`/${path}`} element={
          <LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>
        } />
      ))}

      {/* Auth */}
      <Route path="/Login" element={<Login />} />
      <Route path="/login" element={<Navigate to="/Login" replace />} />

      {/* Standalone pages (no nav layout) */}
      <Route path="/FindMyPhone" element={<FindMyPhone />} />
      <Route path="/Watch" element={<LayoutWrapper currentPageName="Watch"><Watch /></LayoutWrapper>} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/FAQ" element={<FAQ />} />
      <Route path="/complaints" element={<LayoutWrapper currentPageName="Complaints"><Complaints /></LayoutWrapper>} />
      <Route path="/AlertHistory" element={<LayoutWrapper currentPageName="AlertHistory"><AlertHistory /></LayoutWrapper>} />
      <Route path="/Subscriptions" element={<LayoutWrapper currentPageName="Subscriptions"><Subscriptions /></LayoutWrapper>} />
      <Route path="/Journey" element={<LayoutWrapper currentPageName="Journey"><Journey /></LayoutWrapper>} />
      <Route path="/journey" element={<Navigate to="/Journey" replace />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsAndConditions />} />

      {/* Payment callbacks */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />

      {/* Redirects */}
      <Route path="/guide" element={<Navigate to="/Guide" replace />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/profile" element={<Navigate to="/Settings" replace />} />
      <Route path="/emergency-contacts" element={<Navigate to="/Contacts" replace />} />
      <Route path="/add-contact" element={<Navigate to="/Contacts" replace />} />
      <Route path="/ring-control" element={<Navigate to="/Settings" replace />} />
      <Route path="/register" element={<Navigate to="/Login" replace />} />
      <Route path="/reset-password" element={<Navigate to="/Login" replace />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <PWAInstallPrompt />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
