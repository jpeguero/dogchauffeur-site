import React, { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PublicSite from "../PublicSite";

const BookingRequest = lazy(() => import("../BookingRequest"));
const VetPartners = lazy(() => import("../VetPartners"));
const SafetyStandards = lazy(() => import("./pages/SafetyStandards"));

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

export default function AuthenticatedApp() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<PublicSite />} />
          <Route path="/PublicSite" element={<PublicSite />} />
          <Route path="/BookingRequest" element={<BookingRequest />} />
          <Route path="/VetPartners" element={<VetPartners />} />
          <Route path="/SafetyStandards" element={<SafetyStandards />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
