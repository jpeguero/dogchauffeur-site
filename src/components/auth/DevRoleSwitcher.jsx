import React, { useState } from "react";
import { setDevRole, getDevRole } from "./useAuth";
import { FlaskConical } from "lucide-react";

const ROLES = [
  { id: null,       label: "Public",   color: "bg-gray-400",    text: "text-gray-700" },
  { id: "admin",    label: "Admin",    color: "bg-[#1B4332]",   text: "text-[#1B4332]" },
  { id: "driver",   label: "Driver",   color: "bg-amber-500",   text: "text-amber-700" },
  { id: "customer", label: "Customer", color: "bg-blue-500",    text: "text-blue-700" },
];

const DEV_MODE_KEY = "dc_dev_mode";

export function isDevModeEnabled() {
  try { return localStorage.getItem(DEV_MODE_KEY) === "true"; } catch { return false; }
}

export function toggleDevMode() {
  try {
    const current = localStorage.getItem(DEV_MODE_KEY) === "true";
    if (current) {
      localStorage.removeItem(DEV_MODE_KEY);
      // Also clear dev role
      sessionStorage.removeItem("dc_preview_role");
    } else {
      localStorage.setItem(DEV_MODE_KEY, "true");
    }
    window.location.reload();
  } catch {}
}

// Inline sidebar component
export default function DevRoleSwitcher() {
  const current = getDevRole();
  const devMode = isDevModeEnabled();

  return (
    <div className="border-t border-[#EDF7F0] px-4 py-3">
      {/* Toggle row */}
      <button
        onClick={toggleDevMode}
        className="w-full flex items-center gap-2 text-xs text-[#6B5B4F]/60 hover:text-[#1B4332] transition-colors mb-2"
      >
        <FlaskConical className="w-3.5 h-3.5" />
        <span className="font-medium">Developer Mode</span>
        <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold ${devMode ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
          {devMode ? "ON" : "OFF"}
        </span>
      </button>

      {/* Role switcher — only when dev mode is on */}
      {devMode && (
        <div className="grid grid-cols-2 gap-1">
          {ROLES.map(role => {
            const isActive = current === role.id;
            return (
              <button
                key={String(role.id)}
                onClick={() => setDevRole(role.id)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isActive
                    ? `${role.color} text-white border-transparent`
                    : `bg-white ${role.text} border-gray-200 hover:border-gray-300`
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-white/70" : role.color}`} />
                {role.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}