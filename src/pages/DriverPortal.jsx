import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PawPrint, Truck, CheckCircle2, Navigation, Phone, MapPin, Clock, FileText, ChevronDown, ChevronUp } from "lucide-react";
import DriverAvailabilityToggle from "../components/drivers/DriverAvailabilityToggle";
import TripMileagePrompt from "../components/contractor/TripMileagePrompt";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const STEP_CONFIG = {
  confirmed:   { label: "▶ Start — En Route",  nextAction: "in_progress",  sms: "en_route",       color: "bg-blue-600 hover:bg-blue-700",   icon: Navigation },
  in_progress: { label: "🐾 Pet Picked Up",    nextAction: "picked_up",    sms: "pet_picked_up",  color: "bg-amber-500 hover:bg-amber-600",  icon: PawPrint   },
  picked_up:   { label: "✓ Mark Delivered",    nextAction: "completed",    sms: "pet_delivered",  color: "bg-[#1B4332] hover:bg-[#2D6A4F]", icon: CheckCircle2},
};

const STATUS_COLORS = {
  requested: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  picked_up: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function DriverTripCard({ trip, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(trip.driver_action_status || trip.status);
  const [notesOpen, setNotesOpen] = useState(false);
  const [showMileagePrompt, setShowMileagePrompt] = useState(false);

  const step = STEP_CONFIG[localStatus];

  async function handleAction() {
    setLoading(true);
    try {
      const nextActionStatus = localStatus === "confirmed" ? "in_progress"
        : localStatus === "in_progress" ? "picked_up"
        : "completed";

      const updatePayload = {
        status: step.nextAction === "picked_up" ? "in_progress" : step.nextAction,
        driver_action_status: nextActionStatus,
      };
      if (nextActionStatus === "completed") {
        updatePayload.completed_at = new Date().toISOString();
      }
      await base44.entities.Trip.update(trip.id, updatePayload);

      // Update driver availability status
      if (nextActionStatus === "in_progress") {
        await base44.auth.updateMe({ availability_status: "on_trip" });
      } else if (nextActionStatus === "completed") {
        await base44.auth.updateMe({ availability_status: "available" });
      }

      if (trip.owner_phone) {
        await base44.functions.invoke("sendSMS", {
          phone: trip.owner_phone,
          pet_name: trip.pet_name || "your pet",
          event_type: step.sms,
          driver_name: trip.driver_name,
          dropoff_address: trip.dropoff_location,
          trip_id: trip.id,
        });
      }

      setLocalStatus(nextActionStatus);
      if (nextActionStatus === "completed") setShowMileagePrompt(true);
      toast.success("Status updated! Owner notified.");
      onUpdated?.();
    } catch (e) {
      toast.error("Update failed: " + e.message);
    }
    setLoading(false);
  }

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    localStatus === "confirmed" ? trip.pickup_location : trip.dropoff_location
  )}`;

  return (
    <div className="bg-white rounded-2xl border border-[#EDF7F0] shadow-sm overflow-hidden">
      {/* Colored top bar by status */}
      <div className={`h-1.5 w-full ${localStatus === "completed" ? "bg-green-400" : localStatus === "picked_up" ? "bg-orange-400" : localStatus === "in_progress" ? "bg-amber-400" : "bg-blue-400"}`} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-[#52B788]" />
              <p className="font-bold text-[#1B4332] text-lg">{trip.pet_name || "Pet"}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3 h-3 text-[#6B5B4F]/50" />
              <span className="text-xs text-[#6B5B4F]/70">
                {trip.scheduled_date}{trip.scheduled_time ? ` · ${trip.scheduled_time}` : ""}
              </span>
            </div>
          </div>
          <Badge className={STATUS_COLORS[trip.status] || "bg-gray-100 text-gray-700"}>
            {trip.status?.replace(/_/g, " ")}
          </Badge>
        </div>

        {/* Route */}
        <div className="bg-[#F9F7F3] rounded-xl p-3 space-y-2">
          <div className="flex items-start gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#52B788] mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#1B4332] uppercase tracking-wide mb-0.5">Pickup</p>
              <p className="text-sm text-[#6B5B4F]">{trip.pickup_location}</p>
            </div>
          </div>
          <div className="ml-1 h-4 border-l-2 border-dashed border-[#D8F3DC]" />
          <div className="flex items-start gap-2.5">
            <MapPin className="w-3.5 h-3.5 text-red-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#1B4332] uppercase tracking-wide mb-0.5">Drop-off</p>
              <p className="text-sm text-[#6B5B4F]">{trip.dropoff_location}</p>
            </div>
          </div>
        </div>

        {/* Navigation button */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full border border-[#D8F3DC] rounded-xl py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-[#EDF7F0] transition"
        >
          <Navigation className="w-4 h-4 text-[#52B788]" />
          Navigate to {localStatus === "confirmed" ? "Pickup" : "Drop-off"}
        </a>

        {/* Customer contact */}
        {(trip.owner_phone || trip.owner_email) && (
          <div className="flex items-center gap-2">
            {trip.owner_phone && (
              <a
                href={`tel:${trip.owner_phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-[#EDF7F0] rounded-xl py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-[#D8F3DC] transition"
              >
                <Phone className="w-4 h-4 text-[#2D6A4F]" /> Call Owner
              </a>
            )}
            {trip.owner_phone && (
              <a
                href={`sms:${trip.owner_phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-[#EDF7F0] rounded-xl py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-[#D8F3DC] transition"
              >
                💬 Text Owner
              </a>
            )}
          </div>
        )}

        {/* Notes toggle */}
        {trip.notes && (
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className="w-full flex items-center justify-between text-xs text-[#6B5B4F] bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-medium text-amber-800">Ride Notes</span>
            </div>
            {notesOpen ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-500" />}
          </button>
        )}
        {notesOpen && trip.notes && (
          <p className="text-xs bg-amber-50 text-amber-800 rounded-xl px-3 py-2.5 border border-amber-100">
            {trip.notes}
          </p>
        )}

        {/* Action button */}
        {localStatus === "completed" ? (
          <div className="flex items-center justify-center gap-2 bg-green-50 rounded-xl py-3.5 border border-green-200">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-bold">Ride Completed</span>
          </div>
        ) : step ? (
          <Button
            onClick={handleAction}
            disabled={loading}
            className={`w-full text-white font-bold rounded-xl h-14 text-base ${step.color}`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <step.icon className="w-5 h-5 mr-2" />}
            {loading ? "Updating…" : step.label}
          </Button>
        ) : null}

        {!trip.owner_phone && step && (
          <p className="text-xs text-amber-600 text-center">⚠️ No owner phone on file — SMS skipped</p>
        )}

        {showMileagePrompt && (
          <TripMileagePrompt
            trip={trip}
            onSaved={() => setShowMileagePrompt(false)}
            onDismiss={() => setShowMileagePrompt(false)}
          />
        )}
      </div>
    </div>
  );
}

export default function DriverPortal() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("active");
  const queryClient = useQueryClient();

  function handleStatusChange(newStatus) {
    setUser(prev => ({ ...prev, availability_status: newStatus }));
  }

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["driver-portal-trips", user?.email],
    queryFn: () => base44.entities.Trip.filter({ driver_email: user.email }, "-scheduled_date"),
    enabled: !!user,
  });

  const active = trips.filter(t => ["confirmed", "in_progress"].includes(t.status));
  const completed = trips.filter(t => t.status === "completed");

  const displayed = tab === "active" ? active : tab === "completed" ? completed : trips;

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">My Rides</h1>
          <p className="text-sm text-[#6B5B4F]/60 mt-0.5">{user?.full_name || "Driver"} · DogChauffeur</p>
        </div>
        <div className="flex items-center gap-3">
          {user && <DriverAvailabilityToggle user={user} onStatusChange={handleStatusChange} />}
          <div className="w-10 h-10 rounded-2xl forest-gradient flex items-center justify-center shadow-md">
            <Truck className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Status flow guide */}
      <div className="bg-[#EDF7F0] rounded-2xl p-4 border border-[#D8F3DC]">
        <p className="text-xs font-bold text-[#1B4332] mb-2 uppercase tracking-wide">Ride Flow</p>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-medium">1 → En Route</span>
          <span className="text-[#6B5B4F]">→</span>
          <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-medium">2 → Picked Up</span>
          <span className="text-[#6B5B4F]">→</span>
          <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">3 → Delivered ✓</span>
        </div>
        <p className="text-xs text-[#6B5B4F]/70 mt-2">Each tap sends an automatic SMS to the owner.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", value: active.length, color: "text-blue-600" },
          { label: "Completed", value: completed.length, color: "text-green-600" },
          { label: "Total", value: trips.length, color: "text-[#2D6A4F]" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#EDF7F0] p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#6B5B4F]/60 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#EDF7F0] rounded-xl p-1">
        {[
          { key: "active", label: `Active (${active.length})` },
          { key: "completed", label: "Completed" },
          { key: "all", label: "All" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              tab === t.key ? "bg-[#1B4332] text-white shadow" : "text-[#6B5B4F] hover:text-[#1B4332]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-[#EDF7F0] flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-[#2D6A4F]/40" />
          </div>
          <h3 className="text-lg font-semibold text-[#1B4332]">No rides here</h3>
          <p className="text-sm text-[#6B5B4F]/50 mt-1">
            {tab === "active" ? "No active rides assigned yet." : "Nothing in this category."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(trip => (
            <DriverTripCard
              key={trip.id}
              trip={trip}
              onUpdated={() => queryClient.invalidateQueries({ queryKey: ["driver-portal-trips"] })}
            />
          ))}
        </div>
      )}
    </div>
  );
}