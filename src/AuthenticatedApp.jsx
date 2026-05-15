import React from "react";
import { BrowserRouter } from "react-router-dom";
import PublicSite from "../PublicSite";

export default function AuthenticatedApp() {
  return (
    <BrowserRouter>
      <PublicSite />
    </BrowserRouter>
  );
}
