import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "./lib/query-client";

const BookingRequest = lazy(() => import("../BookingRequest"));
const SafetyStandards = lazy(() => import("./pages/SafetyStandards"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AuthenticatedApp = lazy(() => import("./AuthenticatedApp"));

const PawffeurEstimator = lazy(() => import("./components/PawffeurEstimator"));

function LoadingSpinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#F9F7F3",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: "4px solid #D8F3DC",
          borderTopColor: "#1B4332",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/BookingRequest" element={<BookingRequest />} />
          <Route path="/bookingrequest" element={<BookingRequest />} />
          <Route path="/SafetyStandards" element={<SafetyStandards />} />
          <Route path="/estimate-preview" element={
            <div className="min-h-screen bg-[#F9F7F3] py-12 px-4">
              <PawffeurEstimator />
            </div>
          } />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/early-access" element={<Navigate to="/PublicSite#early-access" replace />} />
          <Route path="/earlyaccess" element={<Navigate to="/PublicSite#early-access" replace />} />
          <Route path="*" element={<AuthenticatedApp />} />
        </Routes>
      </Suspense>
    </QueryClientProvider>
  );
}
