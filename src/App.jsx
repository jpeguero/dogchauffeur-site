import React, { Suspense, lazy } from "react";
import { BrowserRouter } from "react-router-dom";

// Hard pathname gate - check BEFORE any heavy imports
const path = window.location.pathname;
const isBookingRequestRoute = path === "/BookingRequest";

// Loading spinner
function LoadingSpinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F9F7F3" }}>
      <div style={{ width: 32, height: 32, border: "4px solid #D8F3DC", borderTopColor: "#1B4332", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Error boundary
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
          <h1 style={{ color: "#1B4332" }}>Something went wrong</h1>
          <pre style={{ background: "#fee", padding: 16, borderRadius: 8, fontSize: 12 }}>{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: "10px 20px", background: "#1B4332", color: "white", border: "none", borderRadius: 8 }}>Refresh</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy imports
const BookingRequest = lazy(() => import("../BookingRequest"));

// For BookingRequest route - render standalone
if (isBookingRequestRoute) {
  function BookingRequestApp() {
    return (
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <BookingRequest />
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    );
  }
  export default BookingRequestApp;
}

// For all other routes - use original app structure
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { pagesConfig } from "./pages.config";
import { Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import Layout from "./Layout";

const { Pages, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => <Layout currentPageName={currentPageName}>{children}</Layout>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  if (isLoadingPublicSettings || isLoadingAuth) return <LoadingSpinner />;
  if (authError) return <UserNotRegisteredError />;
  
  return (
    <Routes>
      {Object.entries(Pages || {}).map(([path, Page]) => (
        <Route key={path} path={path} element={<LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>} />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClientInstance}>
        <AuthProvider>
          <BrowserRouter>
            <AuthenticatedApp />
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
