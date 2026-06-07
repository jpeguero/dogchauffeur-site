import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Home, Truck, MessageCircle, PawPrint, Plus, Menu, X,
  LogOut, ChevronRight, User, Users, Globe, TrendingUp, AlertTriangle, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./components/auth/useAuth";
import DevRoleSwitcher from "./components/auth/DevRoleSwitcher";

// ─── Nav definitions per role ─────────────────────────────────────────────────
const NAV = {
  admin: [
    { name: "Control Tower",   page: "Dashboard",        icon: Home },
    { name: "All Trips",       page: "Trips",            icon: Truck },
    { name: "Revenue",         page: "RevenueAnalytics", icon: TrendingUp },
    { name: "Drivers",         page: "Drivers",          icon: Users },
    { name: "Messages",        page: "Messages",         icon: MessageCircle },
    { name: "Public Site",     page: "PublicSite",       icon: Globe },
  ],
  driver: [
    { name: "My Rides",       page: "DriverPortal",         icon: Truck },
    { name: "Health Logs",    page: "HealthLogs",           icon: ClipboardList },
    { name: "🚨 Emergency",   page: "EmergencyProtocols",   icon: AlertTriangle },
    { name: "Earnings",       page: "ContractorDashboard",  icon: TrendingUp },
    { name: "Messages",       page: "Messages",             icon: MessageCircle },
  ],
  customer: [
    { name: "Home",       page: "PublicSite",     icon: PawPrint },
    { name: "Dashboard",  page: "Dashboard",      icon: Home },
    { name: "My Trips",   page: "Trips",          icon: Truck },
    { name: "Book a Ride",page: "BookTrip",       icon: Plus },
    { name: "Messages",   page: "Messages",       icon: MessageCircle },
    { name: "My Pets",    page: "Pets",           icon: PawPrint },
  ],
};

// Pages accessible by each role (blocks wrong-role access)
const ROLE_PAGES = {
  admin:    ["Dashboard", "Trips", "RevenueAnalytics", "Drivers", "Messages", "PublicSite", "TripDetail", "DriverProfile", "VetPartners", "TrackRide"],
  driver:   ["DriverPortal", "HealthLogs", "EmergencyProtocols", "Messages", "TripDetail", "TrackRide", "ContractorDashboard"],
  customer: ["Dashboard", "Trips", "BookTrip", "BookingRequest", "Messages", "Pets", "PublicSite", "TripDetail", "TrackRide", "VetPartners"],
};

// Public pages — always accessible without login
const PUBLIC_PAGES = ["PublicSite", "VetPartners", "BookingRequest", "TrackRide", "SafetyStandards"];

// Default landing page per role
const ROLE_HOME = {
  admin:    "Dashboard",
  driver:   "DriverPortal",
  customer: "Dashboard",
};

export default function Layout({ children, currentPageName }) {
  const { effectiveUser, effectiveRole, authenticatedRole, isLoading, isDevMode, isDevModeActive, devRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const isPublicPage = PUBLIC_PAGES.includes(currentPageName);

  // ── Routing guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;

    // Not logged in & not on public page → send to PublicSite
    if (!effectiveUser && !isPublicPage) {
      navigate(createPageUrl("PublicSite"), { replace: true });
      return;
    }

    // Logged in but on wrong-role page → redirect to their home
    if (effectiveUser && effectiveRole) {
      const allowed = ROLE_PAGES[effectiveRole] || [];
      if (!isPublicPage && !allowed.includes(currentPageName)) {
        navigate(createPageUrl(ROLE_HOME[effectiveRole] || "PublicSite"), { replace: true });
      }
    }
  }, [effectiveUser, effectiveRole, isLoading, currentPageName]);

  // Public page: no sidebar
  if (!effectiveUser || isPublicPage && !effectiveUser) {
    return (
      <div className="min-h-screen bg-[#F9F7F3]">
        {children}
        {isDevMode && <DevRoleSwitcher />}
      </div>
    );
  }

  const navItems = NAV[effectiveRole] || NAV.customer;

  return (
    <div className="min-h-screen bg-[#F9F7F3]">
      <style>{`:root { --sidebar-width: 260px; }`}</style>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-[#D8F3DC]/60">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <img src="/assets/pawffeur-logo-icon.svg" alt="Pawffeur" className="w-8 h-8" />
            <span className="font-semibold text-[#1B4332] text-lg">Pawffeur™</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-[#1B4332]">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-[260px] bg-white border-r border-[#D8F3DC]/60
        transform transition-transform duration-300 ease-out lg:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-7 border-b border-[#EDF7F0]">
            <div className="flex items-center gap-3">
              <img src="/assets/pawffeur-logo-icon.svg" alt="Pawffeur" className="w-10 h-10" />
              <div>
                <h1 className="font-bold text-[#1B4332] text-lg tracking-tight">Pawffeur™</h1>
                <p className="text-xs text-[#6B5B4F]/70 capitalize">
                  {effectiveRole === "admin" ? "Operations" : effectiveRole === "driver" ? "Driver Portal" : "Pet Transport"}
                </p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                      ? "bg-[#1B4332] text-white shadow-lg shadow-[#1B4332]/20"
                      : "text-[#6B5B4F] hover:bg-[#EDF7F0] hover:text-[#1B4332]"}
                  `}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  <span>{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
                </Link>
              );
            })}
          </nav>

          {/* User card */}
          <div className="px-4 py-4 border-t border-[#EDF7F0]">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-9 h-9 rounded-full bg-[#D8F3DC] flex items-center justify-center">
                <User className="w-4 h-4 text-[#2D6A4F]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1B4332] truncate">
                  {effectiveUser?.full_name || "User"}
                </p>
                <p className="text-xs text-[#6B5B4F]/60 capitalize">{effectiveRole}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => base44.auth.logout()}
                className="h-8 w-8 text-[#6B5B4F]/50 hover:text-red-500 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Role debug badge — always visible in dev builds */}
          {isDevMode && (
            <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-[#EDF7F0] border border-[#D8F3DC] text-[10px] text-[#2D6A4F] space-y-0.5 font-mono">
              <div className="flex justify-between">
                <span className="opacity-60">Auth Role</span>
                <span className="font-bold">{authenticatedRole || "none"}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Rendered Role</span>
                <span className="font-bold">{effectiveRole || "none"}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Dev Override</span>
                <span className={`font-bold ${isDevModeActive ? "text-amber-600" : "text-gray-400"}`}>
                  {isDevModeActive ? `ON (${devRole || "none"})` : "OFF"}
                </span>
              </div>
            </div>
          )}

          {/* Developer Mode toggle + role switcher */}
          {isDevMode && <DevRoleSwitcher />}
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-[260px] min-h-screen pt-16 lg:pt-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}