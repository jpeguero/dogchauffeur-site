import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const DEV_ROLE_KEY = "dc_preview_role";
const DEV_MODE_KEY = "dc_dev_mode";
const IS_DEV = import.meta.env.DEV;

function isDevModeOn() {
  try { return localStorage.getItem(DEV_MODE_KEY) === "true"; } catch { return false; }
}

export function getDevRole() {
  // Only return a dev role if BOTH: it's a dev build AND the dev mode toggle is ON
  if (!IS_DEV || !isDevModeOn()) return null;
  try { return sessionStorage.getItem(DEV_ROLE_KEY); } catch { return null; }
}

export function setDevRole(role) {
  try {
    if (role) sessionStorage.setItem(DEV_ROLE_KEY, role);
    else sessionStorage.removeItem(DEV_ROLE_KEY);
  } catch {}
  window.location.reload();
}

export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const devRole = getDevRole(); // "admin" | "driver" | "customer" | null — only set when dev mode ON
  const isDevMode = IS_DEV;
  const isDevModeActive = IS_DEV && isDevModeOn();

  // If devRole is set, don't wait for real user load
  const isLoading = user === undefined && !devRole;

  let effectiveRole = null;
  let effectiveUser = null;

  if (devRole) {
    effectiveRole = devRole; // devRole is already the actual role string
    effectiveUser = {
      ...(user || {}),
      role: devRole,
      full_name: user?.full_name || `Preview ${devRole}`,
      email: user?.email || `preview-${devRole}@dev.local`,
    };
  } else if (user) {
    effectiveRole = user.role || "customer";
    effectiveUser = user;
  }

  const authenticatedRole = user?.role || null;

  return { user, effectiveUser, effectiveRole, authenticatedRole, isLoading, isDevMode, isDevModeActive, devRole };
}