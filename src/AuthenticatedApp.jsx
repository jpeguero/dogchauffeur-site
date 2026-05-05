import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { pagesConfig } from "./pages.config";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import SafetyStandardsPage from "./pages/SafetyStandards";
import RevenueAnalyticsPage from "./pages/RevenueAnalytics";
import EmergencyProtocolsPage from "./pages/EmergencyProtocols";
import HealthLogsPage from "./pages/HealthLogs";
import ContractorDashboardPage from "./pages/ContractorDashboard";
import PrivacyPolicyPage from "./pages/PrivacyPolicy";
import TermsAndConditionsPage from "./pages/TermsAndConditions";
import Layout from "./Layout";

const { Pages, Layout: _, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : () => <></>;

const LayoutWrapper = ({ children, currentPageName }) => (
  <Layout currentPageName={currentPageName}>{children}</Layout>
);

const AuthenticatedAppInner = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {Object.entries(Pages || {}).map(([path, Page]) => (
        <Route
          key={path}
          path={path}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/SafetyStandards" element={<LayoutWrapper currentPageName="SafetyStandards"><SafetyStandardsPage /></LayoutWrapper>} />
      <Route path="/RevenueAnalytics" element={<LayoutWrapper currentPageName="RevenueAnalytics"><RevenueAnalyticsPage /></LayoutWrapper>} />
      <Route path="/EmergencyProtocols" element={<LayoutWrapper currentPageName="EmergencyProtocols"><EmergencyProtocolsPage /></LayoutWrapper>} />
      <Route path="/HealthLogs" element={<LayoutWrapper currentPageName="HealthLogs"><HealthLogsPage /></LayoutWrapper>} />
      <Route path="/ContractorDashboard" element={<LayoutWrapper currentPageName="ContractorDashboard"><ContractorDashboardPage /></LayoutWrapper>} />
      <Route path="/PrivacyPolicy" element={<LayoutWrapper currentPageName="PrivacyPolicy"><PrivacyPolicyPage /></LayoutWrapper>} />
      <Route path="/TermsAndConditions" element={<LayoutWrapper currentPageName="TermsAndConditions"><TermsAndConditionsPage /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default function AuthenticatedApp() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedAppInner />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
