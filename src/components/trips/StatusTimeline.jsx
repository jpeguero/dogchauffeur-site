import React from "react";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

export default function StatusTimeline({ trip, updates = [] }) {
  const statuses = [
    { key: "requested", label: "Requested", icon: "🟡" },
    { key: "confirmed", label: "Confirmed", icon: "🟡" },
    { key: "driver_assigned", label: "Driver Assigned", icon: "🟡" },
    { key: "en_route", label: "En Route", icon: "🟢" },
    { key: "pickup_completed", label: "Pet Picked Up", icon: "🟢" },
    { key: "completed", label: "Delivered", icon: "🟢" },
  ];

  const getCompletedStatuses = () => {
    const completed = [];

    if (trip?.status) {
      if (["confirmed", "in_progress", "completed"].includes(trip.status)) {
        completed.push("requested");
      }
      if (["confirmed", "in_progress", "completed"].includes(trip.status)) {
        completed.push("confirmed");
      }
      if (trip.driver_email && ["in_progress", "completed"].includes(trip.status)) {
        completed.push("driver_assigned");
      }
      if (["in_progress", "completed"].includes(trip.status)) {
        completed.push("en_route");
      }
    }

    // Check for pickup update
    if (updates?.some(u => u.update_type === "pickup_completed")) {
      completed.push("pickup_completed");
    }

    // Check for completion
    if (trip?.status === "completed") {
      completed.push("completed");
    }

    return completed;
  };

  const completedStatuses = getCompletedStatuses();
  const currentStatus = trip?.status || "requested";

  return (
    <div className="bg-white rounded-2xl border border-[#EDF7F0] p-6 md:p-8">
      <h3 className="text-lg font-semibold text-[#1B4332] mb-6">Ride Status</h3>

      <div className="space-y-4">
        {statuses.map((status, idx) => {
          const isCompleted = completedStatuses.includes(status.key);
          const isCurrent = currentStatus === status.key || 
                           (status.key === "en_route" && currentStatus === "in_progress");

          return (
            <div key={status.key} className="flex items-start gap-4">
              {/* Status icon */}
              <div className="flex flex-col items-center">
                <div className="text-2xl">{status.icon}</div>
                {/* Connector line */}
                {idx < statuses.length - 1 && (
                  <div className={`w-0.5 h-12 mt-2 ${
                    isCompleted ? "bg-[#2D6A4F]" : "bg-[#D8F3DC]"
                  }`} />
                )}
              </div>

              {/* Status label */}
              <div className="pt-1 flex-1">
                <p className={`font-medium ${
                  isCompleted 
                    ? "text-[#1B4332]" 
                    : isCurrent
                    ? "text-[#52B788]"
                    : "text-[#6B5B4F]/50"
                }`}>
                  {status.label}
                </p>
                {isCurrent && !isCompleted && (
                  <p className="text-xs text-[#52B788] font-semibold mt-1">In Progress</p>
                )}
                {isCompleted && (
                  <p className="text-xs text-[#2D6A4F]">✓ Completed</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}