import React, { Suspense, lazy } from "react";
import { BrowserRouter } from "react-router-dom";

// Hard pathname gate - MUST be checked before ANY Base44/analytics code runs
const path = window.location.pathname;
const isBookingRequestRoute = path === "/BookingRequest";

// Loading spinner component
function LoadingSpinner() {
  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      height: "100vh", 
      background: "#F9F7F3" 
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: "4px solid #D8F3DC",
        borderTopColor: "#1B4332",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Error boundary class
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[App] ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
          <h1 style={{ color: "#1B4332" }}>Something went wrong</h1>
          <p style={{ color: "#6B5B4F" }}>Please refresh the page or try again later.</p>
          <details style={{ textAlign: "left", background: "#fee", padding: 16, borderRadius: 8, marginTop: 20 }} open>
            <summary style={{ cursor: "pointer", fontWeight: "bold", color: "#c00" }}>Error Details</summary>
            <pre style={{ whiteSpace: "pre-wrap", color: "#900", fontSize: 12 }}>{this.state.error?.toString()}</pre>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: 20, padding: "10px 20px", background: "#1B4332", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy imports - only loaded when needed
const BookingRequest = lazy(() => import("../BookingRequest"));
const AuthenticatedApp = lazy(() => import("./AuthenticatedApp"));

// Dynamic imports for libraries only needed by the full app
let QueryClientProvider, QueryClient, Toaster, queryClient;

function App() {
  const [ready, setReady] = React.useState(isBookingRequestRoute);
  
  React.useEffect(() => {
    if (!isBookingRequestRoute && !ready) {
      // Only load full app dependencies when NOT on BookingRequest
      Promise.all([
        import("@tanstack/react-query"),
        import("sonner")
      ]).then(([queryMod, sonnerMod]) => {
        QueryClientProvider = queryMod.QueryClientProvider;
        QueryClient = queryMod.QueryClient;
        Toaster = sonnerMod.Toaster;
        queryClient = new QueryClient({
          defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } }
        });
        setReady(true);
      });
    }
  }, [ready]);
  
  // /BookingRequest route - render standalone, no Base44, no analytics
  if (isBookingRequestRoute) {
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
  
  // Other routes - wait for dependencies to load
  if (!ready) {
    return <LoadingSpinner />;
  }
  
  // Full app with all providers
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <AuthenticatedApp />
          </Suspense>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
