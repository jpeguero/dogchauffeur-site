import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "./lib/query-client";
import { pagesConfig } from "./pages.config";
import PageNotFound from "./lib/PageNotFound";
import { Toaster } from "sonner";

const { Pages, Layout } = pagesConfig;

export default function AuthenticatedApp() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Routes>
        {/* Root path: default page or PublicSite */}
        <Route path="/" element={<Navigate to="/PublicSite" replace />} />
        
        {/* Dynamic registered pages */}
        {Object.entries(Pages).map(([name, Page]) => (
          <Route
            key={name}
            path={`/${name}`}
            element={
              <Layout currentPageName={name}>
                <Page />
              </Layout>
            }
          />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
