import React, { Suspense, lazy } from "react";
import { BrowserRouter } from "react-router-dom";

const BookingRequest = lazy(() => import("../BookingRequest"));
const AuthenticatedApp = lazy(() => import("./AuthenticatedApp"));

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
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";

  if (pathname === "/BookingRequest") {
    return (
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <BookingRequest />
        </Suspense>
      </BrowserRouter>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthenticatedApp />
    </Suspense>
  );
}
