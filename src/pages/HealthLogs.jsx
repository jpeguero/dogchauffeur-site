import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ClipboardList, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import HealthLogForm from "../components/health/HealthLogForm";
import HealthLogViewer from "../components/health/HealthLogViewer";

export default function HealthLogs() {
  const [user, setUser] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === "admin";

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["health-log-trips", user?.email],
    queryFn: () => isAdmin
      ? base44.entities.Trip.filter({ status: "in_progress" }, "-scheduled_date", 50)
      : base44.entities.Trip.filter({ driver_email: user.email, status: "in_progress" }),
    enabled: !!user,
  });

  const { data: completedTrips = [] } = useQuery({
    queryKey: ["health-log-completed-trips", user?.email],
    queryFn: () => isAdmin
      ? base44.entities.Trip.filter({ status: "completed" }, "-scheduled_date", 20)
      : base44.entities.Trip.filter({ driver_email: user.email, status: "completed" }, "-scheduled_date", 20),
    enabled: !!user,
  });

  const allTrips = [...trips, ...completedTrips];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-extrabold">Digital Health Logs</h1>
        </div>
        <p className="text-[#B7E4C7] text-sm">Log pet vitals at each checkpoint. Automatically attached to the trip record.</p>
      </div>

      {/* Trip Selector */}
      <div>
        <p className="text-xs font-semibold text-[#6B5B4F] uppercase tracking-wide mb-3">Select a Trip</p>
        {isLoading ? (
          <div className="text-sm text-[#6B5B4F]/60 py-4 text-center">Loading trips...</div>
        ) : allTrips.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-[#6B5B4F]/50 text-sm">
            No trips available for logging.
          </div>
        ) : (
          <div className="space-y-2">
            {allTrips.map(trip => (
              <button
                key={trip.id}
                onClick={() => { setSelectedTrip(trip); setShowForm(false); }}
                className={`w-full text-left bg-white border rounded-2xl px-4 py-3 transition-all shadow-sm hover:shadow-md ${selectedTrip?.id === trip.id ? "border-[#1B4332] ring-2 ring-[#1B4332]/20" : "border-gray-100"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#1B4332] text-sm">{trip.pet_name || "Pet"}</p>
                    <p className="text-xs text-[#6B5B4F]">{trip.pickup_location} → {trip.dropoff_location}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trip.status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                    {trip.status === "in_progress" ? "In Progress" : "Completed"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Log Panel */}
      {selectedTrip && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-[#1B4332] text-base">{selectedTrip.pet_name || "Pet"} — Logs</h2>
            {selectedTrip.status === "in_progress" && (
              <Button
                onClick={() => setShowForm(!showForm)}
                className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl h-9 px-4 text-sm font-bold gap-1"
              >
                {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Log</>}
              </Button>
            )}
          </div>

          <div className="p-5">
            {showForm ? (
              <HealthLogForm
                trip={selectedTrip}
                onSaved={() => setShowForm(false)}
              />
            ) : (
              <HealthLogViewer tripId={selectedTrip.id} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}