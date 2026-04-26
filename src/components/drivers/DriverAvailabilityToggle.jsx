import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const STATUS_CONFIG = {
  offline:   { label: "Offline",    dot: "bg-gray-400",  bg: "bg-gray-100 text-gray-700 border-gray-200" },
  available: { label: "Available",  dot: "bg-green-500", bg: "bg-green-100 text-green-800 border-green-200" },
  on_trip:   { label: "On Trip",    dot: "bg-blue-500",  bg: "bg-blue-100 text-blue-800 border-blue-200" },
};

export function DriverStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function DriverAvailabilityToggle({ user, onStatusChange }) {
  const status = user?.availability_status || "offline";
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = status === "offline" ? "available" : "offline";
    setLoading(true);
    try {
      await base44.auth.updateMe({ availability_status: next });
      toast.success(`You are now ${next === "available" ? "Available" : "Offline"}`);
      onStatusChange?.(next);
    } catch (e) {
      toast.error("Failed to update status");
    }
    setLoading(false);
  }

  const isOnline = status !== "offline";

  return (
    <div className="flex items-center gap-3">
      <DriverStatusBadge status={status} />
      <button
        onClick={toggle}
        disabled={loading || status === "on_trip"}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-50 ${
          isOnline ? "bg-[#52B788]" : "bg-gray-300"
        }`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin mx-auto text-white" />
        ) : (
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${isOnline ? "translate-x-6" : "translate-x-1"}`} />
        )}
      </button>
    </div>
  );
}