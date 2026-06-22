import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PawPrint, Truck, CheckCircle2, Navigation, Phone, MapPin, Clock, FileText, ChevronDown, ChevronUp, AlertCircle, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import DriverAvailabilityToggle from "../components/drivers/DriverAvailabilityToggle";
import TripMileagePrompt from "../components/contractor/TripMileagePrompt";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "../components/auth/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [refusalLoading, setRefusalLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(trip.driver_action_status || trip.status);
  const [notesOpen, setNotesOpen] = useState(false);
  const [showMileagePrompt, setShowMileagePrompt] = useState(false);
  const [showSafetyCard, setShowSafetyCard] = useState(false);
  const [showObservationModal, setShowObservationModal] = useState(false);
  const { effectiveUser } = useAuth();
  const driverEmail = effectiveUser?.email || "preview-driver@dev.local";

  const { data: observation, refetch: refetchObservation } = useQuery({
    queryKey: ["post-trip-observation", trip.id, driverEmail],
    queryFn: async () => {
      const res = await fetch(`/api/chauffeur-post-trip-observation?ride_id=${trip.id}&driver_email=${driverEmail}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
    enabled: !!trip.passenger_profile_id && localStatus === "completed" && !!driverEmail,
  });

  const { data: verification, refetch: refetchVerification } = useQuery({
    queryKey: ["health-record-verification", trip.id],
    queryFn: async () => {
      const res = await fetch(`/api/chauffeur-health-record-verification?trip_id=${trip.id}`);
      if (!res.ok) return { record: null, pre_clearance_status: "blocked" };
      const json = await res.json();
      return { record: json.data || null, pre_clearance_status: json.pre_clearance_status || "blocked" };
    },
    enabled: !!trip.passenger_profile_id,
  });

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

  async function handleRefusal() {
    const confirmed = window.confirm(
      "Are you sure you want to refuse this ride due to an active pet medical emergency? This will cancel the trip and log a safety refusal."
    );
    if (!confirmed) return;

    setRefusalLoading(true);
    try {
      const res = await fetch("/api/chauffeur-refusal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ride_id: trip.id,
          driver_email: driverEmail
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to refuse ride");
      }

      await base44.auth.updateMe({ availability_status: "available" });

      setLocalStatus("cancelled");
      toast.success("Ride refused successfully. Safety log recorded.");
      onUpdated?.();
    } catch (e) {
      toast.error("Refusal failed: " + e.message);
    } finally {
      setRefusalLoading(false);
    }
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
          <Badge className={STATUS_COLORS[localStatus] || "bg-gray-100 text-gray-700"}>
            {localStatus?.replace(/_/g, " ")}
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
        <div className="space-y-2">
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

          <Link
            to={`/Messages?tripId=${trip.id}`}
            className="flex items-center justify-center gap-2 w-full bg-[#EDF7F0] rounded-xl py-2.5 text-sm font-semibold text-[#1B4332] hover:bg-[#D8F3DC] transition"
          >
            <MessageCircle className="w-4 h-4 text-[#2D6A4F]" /> Chat in App (Owner & Admin Dispatch)
          </Link>
        </div>

        {/* Safety Card button */}
        <Button
          onClick={() => setShowSafetyCard(true)}
          variant="outline"
          className="w-full border-amber-200 text-[#7F5539] hover:bg-amber-50 hover:text-[#7F5539] rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
        >
          📋 View Safety Card
        </Button>

        {/* Visual Safety Verification */}
        {trip.passenger_profile_id && (
          <DriverVisualSafetyVerificationCard
            trip={trip}
            verification={verification?.record}
            refetchVerification={refetchVerification}
            driverEmail={driverEmail}
          />
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
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-green-50 rounded-xl p-3.5 border border-green-200 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-bold">Ride Completed</span>
              </div>
              {trip.passenger_profile_id && observation && (
                <Badge className="bg-green-100 text-green-800 border-none px-2 py-1 rounded-lg text-xs font-semibold">
                  ✓ Observations Submitted
                </Badge>
              )}
            </div>
            {trip.passenger_profile_id && !observation && (
              <Button
                onClick={() => setShowObservationModal(true)}
                variant="outline"
                className="w-full border-green-200 text-green-800 hover:bg-green-50 hover:text-green-800 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition"
              >
                📝 Submit Post-Trip Observations
              </Button>
            )}
          </div>
        ) : step ? (
          <div className="space-y-2.5">
            <Button
              onClick={handleAction}
              disabled={loading || (!!trip.passenger_profile_id && (verification?.pre_clearance_status === "blocked" || verification?.pre_clearance_status === "Admin Override Eligible" || !verification?.record || verification.record.transport_decision !== "pass_visual_match"))}
              className={`w-full text-white font-bold rounded-xl h-14 text-base ${step.color}`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <step.icon className="w-5 h-5 mr-2" />}
              {loading ? "Updating…" : step.label}
            </Button>
            {["confirmed", "in_progress"].includes(localStatus) && (
              <Button
                onClick={handleRefusal}
                disabled={loading || refusalLoading}
                variant="destructive"
                className="w-full font-bold rounded-xl h-12 text-sm bg-red-600 hover:bg-red-700 text-white mt-2"
              >
                {refusalLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2 shrink-0" /> : "⚠️ Refuse Ride: Active Medical Emergency"}
              </Button>
            )}
            {trip.passenger_profile_id && (verification?.pre_clearance_status === "blocked" || verification?.pre_clearance_status === "Admin Override Eligible") ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-red-800 text-xs shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">
                    {verification?.pre_clearance_status === "Admin Override Eligible"
                      ? "Vaccine Appointment Override Required"
                      : "Document Pre-Clearance Pending"}
                  </p>
                  <p className="text-[11px] text-red-700 leading-normal">
                    {verification?.pre_clearance_status === "Admin Override Eligible"
                      ? "This ride requires a super-admin override approval signature to proceed."
                      : "Document Pre-Clearance Pending. Please contact Admin Dispatch to resolve."}
                  </p>
                </div>
              </div>
            ) : trip.passenger_profile_id && (!verification?.record || verification.record.transport_decision !== "pass_visual_match") ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-red-800 text-xs shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Visual Safety Verification Required</p>
                  <p className="text-[11px] text-red-700 leading-normal">
                    You must complete the Visual Safety Verification checklist and mark the status as 'Passed' to unlock trip progression.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : localStatus === "cancelled" ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-red-800 text-xs shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Ride Refused / Cancelled</p>
              <p className="text-[11px] text-red-700 leading-normal">
                This ride has been cancelled at curbside due to a medical safety refusal.
              </p>
            </div>
          </div>
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

        {showSafetyCard && (
          <ChauffeurRideSafetyCard
            trip={trip}
            driverEmail={driverEmail}
            isOpen={showSafetyCard}
            onClose={() => setShowSafetyCard(false)}
          />
        )}

        {showObservationModal && (
          <ChauffeurPostTripObservationModal
            trip={trip}
            driverEmail={driverEmail}
            isOpen={showObservationModal}
            onClose={() => {
              setShowObservationModal(false);
              refetchObservation();
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function DriverPortal() {
  const { effectiveUser } = useAuth();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("active");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (effectiveUser) {
      setUser(effectiveUser);
    }
  }, [effectiveUser]);

  function handleStatusChange(newStatus) {
    setUser(prev => ({ ...prev, availability_status: newStatus }));
  }

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["driver-portal-trips", user?.email],
    queryFn: () => base44.entities.Trip.filter({ driver_email: user?.email }, "-scheduled_date"),
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
          <p className="text-sm text-[#6B5B4F]/60 mt-0.5">{user?.full_name || "Driver"} · Pawffeur</p>
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

function ChauffeurRideSafetyCard({ trip, driverEmail, isOpen, onClose }) {
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Checklist local states
  const [confirmHarness, setConfirmHarness] = useState(false);
  const [confirmDoorsClosed, setConfirmDoorsClosed] = useState(false);
  const [confirmGloves, setConfirmGloves] = useState(false);
  const [confirmMedical, setConfirmMedical] = useState(false);

  const { data: safetyCard, error, isLoading } = useQuery({
    queryKey: ["safety-card", trip.id, driverEmail],
    queryFn: async () => {
      const res = await fetch(`/api/chauffeur-safety-card?ride_id=${trip.id}&driver_email=${driverEmail}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load safety card");
      }
      return json.data;
    },
    enabled: isOpen && !!driverEmail,
    retry: false,
  });

  // Prefill checklist details when safetyCard is loaded
  useEffect(() => {
    if (safetyCard) {
      const details = safetyCard.checklist_details || {};
      setConfirmHarness(!!details.confirm_harness);
      setConfirmDoorsClosed(!!details.confirm_doors_closed);
      setConfirmGloves(!!details.confirm_gloves);
      setConfirmMedical(!!details.confirm_medical);
    }
  }, [safetyCard]);

  async function handleAcknowledge() {
    setSubmitting(true);
    try {
      const checklistPayload = {};
      if (safetyCard.escape_risk) {
        checklistPayload.confirm_harness = confirmHarness;
        checklistPayload.confirm_doors_closed = confirmDoorsClosed;
      }
      if (safetyCard.bite_scratch_risk) {
        checklistPayload.confirm_gloves = confirmGloves;
      }
      if (safetyCard.medical_risk) {
        checklistPayload.confirm_medical = confirmMedical;
      }

      const res = await fetch("/api/chauffeur-acknowledgment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ride_id: trip.id,
          driver_email: driverEmail,
          checklist_details: checklistPayload,
          safety_requirements_updated_at: safetyCard.safety_requirements_updated_at,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to submit review");
      }
      toast.success("Safety details reviewed successfully!");
      // Invalidate queries to refresh the modal and trip card statuses
      queryClient.invalidateQueries({ queryKey: ["safety-card", trip.id, driverEmail] });
      queryClient.invalidateQueries({ queryKey: ["driver-portal-trips"] });
    } catch (err) {
      toast.error(err.message || "Failed to submit safety acknowledgment");
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto bg-white p-6 shadow-xl border border-gray-100">
        <DialogHeader className="border-b border-[#EDF7F0] pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-[#1B4332] flex items-center gap-2">
              🛡️ Passenger Safety Card
            </DialogTitle>
            <Badge variant="outline" className="bg-gray-100 text-gray-500 border border-gray-200 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0">
              Read-Only
            </Badge>
          </div>
        </DialogHeader>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-[#52B788] animate-spin" />
            <p className="text-sm text-[#6B5B4F]/70">Retrieving secure safety card...</p>
          </div>
        )}

        {error && (
          <div className="py-6 space-y-4">
            <div className="bg-red-50 border border-red-150 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-red-800">
                {error.message || "An error occurred while fetching the safety card."}
              </p>
            </div>
            <Button onClick={onClose} className="w-full bg-red-850 hover:bg-red-900 text-white rounded-xl py-2.5 font-semibold transition">
              Close Card
            </Button>
          </div>
        )}

        {safetyCard && (
          <div className="mt-4 space-y-5">
            {/* High-Risk warning banner */}
            {(safetyCard.escape_risk || safetyCard.bite_scratch_risk || safetyCard.medical_risk) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 shadow-sm text-red-900">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0 animate-pulse" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-800">
                    🚨 High-Risk Passenger Guidelines Apply
                  </p>
                  <p className="text-[10px] text-red-700 leading-relaxed font-semibold">
                    This passenger has active safety flags. You are required to confirm all security checklists below before starting.
                  </p>
                </div>
              </div>
            )}

            {/* Stale warning banner */}
            {safetyCard.requires_re_review && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 shadow-sm text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0 animate-pulse" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    ⚠️ Re-Review Required
                  </p>
                  <p className="text-[10px] text-amber-700 leading-relaxed font-semibold">
                    Safety details changed since last review. Safety requirements for this pet have been modified. Please review the updated details and complete the checklist again.
                  </p>
                </div>
              </div>
            )}

            {/* Identity section */}
            <div className="bg-[#EDF7F0]/40 rounded-2xl p-4 border border-[#EDF7F0]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl forest-gradient flex items-center justify-center shadow-sm">
                  <PawPrint className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1B4332]">{safetyCard.pet_name}</h3>
                  <p className="text-xs text-[#6B5B4F]/80">{safetyCard.species} · {safetyCard.breed || "Mixed Breed"}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2 pt-2 border-t border-[#EDF7F0]/60">
                <div className="bg-white rounded-lg p-2 border border-[#EDF7F0]/40">
                  <p className="text-[#6B5B4F]/60 font-medium">Weight</p>
                  <p className="font-bold text-[#1B4332] mt-0.5">{safetyCard.weight} lbs</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-[#EDF7F0]/40">
                  <p className="text-[#6B5B4F]/60 font-medium">Age Group</p>
                  <p className="font-bold text-[#1B4332] mt-0.5">{safetyCard.age_group}</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-[#EDF7F0]/40">
                  <p className="text-[#6B5B4F]/60 font-medium">Temperament</p>
                  <p className="font-bold text-[#1B4332] mt-0.5">{safetyCard.temperament}</p>
                </div>
              </div>
            </div>

            {/* Owner Contact */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#1B4332] uppercase tracking-wide">Owner Contact</h4>
              <div className="bg-white rounded-xl border border-gray-150 p-3 flex items-center justify-between gap-2 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-[#1B4332]">{safetyCard.emergency_contact_name}</p>
                  <p className="text-xs text-[#6B5B4F]/70">{safetyCard.emergency_contact_phone}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {safetyCard.emergency_contact_phone && (
                    <a
                      href={`tel:${safetyCard.emergency_contact_phone}`}
                      className="p-2 bg-[#EDF7F0] rounded-lg text-[#1B4332] hover:bg-[#D8F3DC] transition shadow-sm"
                      title="Call Owner"
                    >
                      <Phone className="w-4 h-4 text-[#2D6A4F]" />
                    </a>
                  )}
                  {safetyCard.emergency_contact_phone && (
                    <a
                      href={`sms:${safetyCard.emergency_contact_phone}`}
                      className="p-2 bg-[#EDF7F0] rounded-lg text-[#1B4332] hover:bg-[#D8F3DC] transition shadow-sm"
                      title="Text Owner"
                    >
                      💬
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Vet Info on File */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#1B4332] uppercase tracking-wide">Preferred Vet Clinic</h4>
              <div className="flex items-center gap-2">
                {safetyCard.vet_info_on_file ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-xl font-medium w-full flex items-center justify-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Preferred Vet: On File
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-medium w-full flex items-center justify-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Preferred Vet: Not Declared
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-[#6B5B4F]/60 text-center italic">
                * Clinical details are hidden for data minimization. Operation support has emergency clinical authorization.
              </p>
            </div>

            {/* Comfort Notes */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#1B4332] uppercase tracking-wide">Owner Comfort Notes</h4>
              <div className="bg-[#FEFAE0]/40 border border-[#FEFAE0]/80 rounded-xl p-4 shadow-sm">
                {safetyCard.comfort_notes ? (
                  <p className="text-xs text-[#6B5B4F] leading-relaxed whitespace-pre-line">
                    {safetyCard.comfort_notes}
                  </p>
                ) : (
                  <p className="text-xs text-[#6B5B4F]/60 italic text-center py-2">
                    No special comfort notes provided by the owner.
                  </p>
                )}
              </div>
            </div>

            {/* Past Chauffeur Observations Log History (Timeline) */}
            <div className="space-y-2 mt-4">
              <h4 className="text-xs font-bold text-[#1B4332] uppercase tracking-wide">Ride Observations History</h4>
              <div className="space-y-3">
                {safetyCard.observations && safetyCard.observations.length > 0 ? (
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {safetyCard.observations.map((obs) => (
                      <div key={obs.id} className="bg-white border border-gray-150 rounded-xl p-3 shadow-sm space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-[#1B4332]">{obs.chauffeur_id}</span>
                          <span className="text-gray-400">{new Date(obs.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] py-0 px-2 rounded-md font-semibold">
                            Behavior: {obs.behavior_summary}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] py-0 px-2 rounded-md font-semibold ${
                            obs.incident_severity === "none" ? "bg-green-50 text-green-700 border-green-100" :
                            obs.incident_severity === "minor" ? "bg-amber-50 text-amber-700 border-amber-100" :
                            obs.incident_severity === "moderate" ? "bg-orange-50 text-orange-700 border-orange-100" :
                            "bg-red-50 text-red-700 border-red-100"
                          }`}>
                            Severity: {obs.incident_severity}
                          </Badge>
                        </div>
                        {obs.handling_outcomes && obs.handling_outcomes.length > 0 && (
                          <div className="text-[10px] text-[#6B5B4F] leading-tight">
                            <strong>Outcomes:</strong> {obs.handling_outcomes.map(o => o.replace(/_/g, " ")).join(", ")}
                          </div>
                        )}
                        {obs.notes && (
                          <p className="text-[11px] text-[#6B5B4F] italic border-l-2 border-[#D8F3DC] pl-2 py-0.5 leading-snug">
                            "{obs.notes}"
                          </p>
                        )}
                        {(obs.recommend_profile_review || obs.recommend_risk_reassessment) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {obs.recommend_profile_review && (
                              <Badge className="bg-amber-100 text-amber-800 text-[8px] font-bold uppercase tracking-wider border-none py-0.5 px-1.5 rounded-full">
                                ⚠️ Review Recommended
                              </Badge>
                            )}
                            {obs.recommend_risk_reassessment && (
                              <Badge className="bg-red-100 text-red-800 text-[8px] font-bold uppercase tracking-wider border-none py-0.5 px-1.5 rounded-full">
                                🚨 Reassessment Recommended
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#F9F7F3] border border-[#EDE8D9] rounded-xl p-3 text-center">
                    <p className="text-xs text-[#6B5B4F]/60 italic">No past observations logged for this pet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mandatory Safety Checklist */}
            {(safetyCard.escape_risk || safetyCard.bite_scratch_risk || safetyCard.medical_risk) && (
              <div className="bg-[#F9F7F3] border border-[#EDE8D9] rounded-xl p-4 space-y-3 shadow-sm">
                <h4 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider border-b border-[#EDF7F0] pb-1 flex items-center gap-1.5">
                  🛡️ Pre-Pickup Safety Checklist
                </h4>
                <div className="space-y-3">
                  {safetyCard.escape_risk && (
                    <>
                      <div className="flex items-start gap-2.5">
                        <Checkbox
                          disabled={!!safetyCard.acknowledged_at}
                          id="confirm_harness"
                          checked={confirmHarness}
                          onCheckedChange={(checked) => setConfirmHarness(!!checked)}
                          className="border-red-200 text-[#1B4332] focus:ring-[#52B788] mt-0.5"
                        />
                        <Label htmlFor="confirm_harness" className="text-xs text-[#6B5B4F] cursor-pointer font-medium leading-tight">
                          Confirm passenger is wearing a secure harness or in an approved carrier.
                        </Label>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Checkbox
                          disabled={!!safetyCard.acknowledged_at}
                          id="confirm_doors_closed"
                          checked={confirmDoorsClosed}
                          onCheckedChange={(checked) => setConfirmDoorsClosed(!!checked)}
                          className="border-red-200 text-[#1B4332] focus:ring-[#52B788] mt-0.5"
                        />
                        <Label htmlFor="confirm_doors_closed" className="text-xs text-[#6B5B4F] cursor-pointer font-medium leading-tight">
                          I will keep vehicle doors closed until passenger leash is double-clipped.
                        </Label>
                      </div>
                    </>
                  )}
                  
                  {safetyCard.bite_scratch_risk && (
                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        disabled={!!safetyCard.acknowledged_at}
                        id="confirm_gloves"
                        checked={confirmGloves}
                        onCheckedChange={(checked) => setConfirmGloves(!!checked)}
                        className="border-red-200 text-[#1B4332] focus:ring-[#52B788] mt-0.5"
                      />
                      <Label htmlFor="confirm_gloves" className="text-xs text-[#6B5B4F] cursor-pointer font-medium leading-tight">
                        Confirm handler gloves are packed and active handling guidelines are reviewed.
                      </Label>
                    </div>
                  )}

                  {safetyCard.medical_risk && (
                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        disabled={!!safetyCard.acknowledged_at}
                        id="confirm_medical"
                        checked={confirmMedical}
                        onCheckedChange={(checked) => setConfirmMedical(!!checked)}
                        className="border-red-200 text-[#1B4332] focus:ring-[#52B788] mt-0.5"
                      />
                      <Label htmlFor="confirm_medical" className="text-xs text-[#6B5B4F] cursor-pointer font-medium leading-tight">
                        I have read the medical observations (seizure/illness precautions) and emergency routing guidelines.
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Acknowledgment & Read-Only Disclaimer */}
            <div className="border-t border-[#EDF7F0] pt-4 flex flex-col gap-3">
              {safetyCard.acknowledged_at ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 text-center space-y-1 shadow-sm">
                  <p className="text-xs font-bold text-green-800">✓ Safety Card Reviewed</p>
                  <p className="text-[10px] text-green-700 leading-normal">
                    Acknowledged by {safetyCard.acknowledged_by} on {new Date(safetyCard.acknowledged_at).toLocaleDateString()} at {new Date(safetyCard.acknowledged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-amber-800 leading-snug font-medium">
                    ⚠️ Please review the safety details above. You must explicitly acknowledge them before starting the trip.
                  </p>
                </div>
              )}

              {safetyCard.acknowledged_at ? (
                <Button disabled className="w-full bg-green-700 text-white rounded-xl py-2.5 font-semibold transition cursor-not-allowed">
                  ✓ Safety Details Reviewed
                </Button>
              ) : (
                <Button
                  onClick={handleAcknowledge}
                  disabled={submitting || (
                    (safetyCard.escape_risk && (!confirmHarness || !confirmDoorsClosed)) ||
                    (safetyCard.bite_scratch_risk && !confirmGloves) ||
                    (safetyCard.medical_risk && !confirmMedical)
                  )}
                  className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl py-2.5 font-semibold shadow transition"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2 shrink-0" />}
                  I've Reviewed These Details
                </Button>
              )}

              <Button onClick={onClose} variant="ghost" className="w-full text-[#6B5B4F] hover:bg-gray-50 rounded-xl py-2.5 font-semibold transition">
                Dismiss Safety Card
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChauffeurPostTripObservationModal({ trip, driverEmail, isOpen, onClose }) {
  const [submitting, setSubmitting] = useState(false);
  const [behavior, setBehavior] = useState("calm");
  const [severity, setSeverity] = useState("none");
  const [notes, setNotes] = useState("");
  const [recommendReview, setRecommendReview] = useState(false);
  const [recommendReassessment, setRecommendReassessment] = useState(false);

  // Handling outcomes checkboxes
  const [easyLoading, setEasyLoading] = useState(false);
  const [extraRestraint, setExtraRestraint] = useState(false);
  const [carrierIssue, setCarrierIssue] = useState(false);
  const [ownerMismatch, setOwnerMismatch] = useState(false);
  const [medicalConcern, setMedicalConcern] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const outcomes = [];
      if (easyLoading) outcomes.push("easy_loading");
      if (extraRestraint) outcomes.push("needed_extra_restraint");
      if (carrierIssue) outcomes.push("carrier_issue");
      if (ownerMismatch) outcomes.push("owner_instruction_mismatch");
      if (medicalConcern) outcomes.push("medical_concern_observed");

      const res = await fetch("/api/chauffeur-post-trip-observation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ride_id: trip.id,
          driver_email: driverEmail,
          behavior_summary: behavior,
          handling_outcomes: outcomes,
          incident_severity: severity,
          recommend_profile_review: recommendReview,
          recommend_risk_reassessment: recommendReassessment,
          notes: notes.trim() || null
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to submit observations");
      }

      toast.success("Post-trip observations saved successfully!");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to submit observations");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto bg-white p-6 shadow-xl border border-gray-100">
        <DialogHeader className="border-b border-[#EDF7F0] pb-3">
          <DialogTitle className="text-xl font-bold text-[#1B4332] flex items-center gap-2">
            📝 Post-Trip Observations
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          {/* Behavior summary */}
          <div className="space-y-1.5">
            <Label className="text-[#1B4332] font-semibold text-xs">Pet Behavior Summary *</Label>
            <select
              value={behavior}
              onChange={(e) => setBehavior(e.target.value)}
              className="w-full rounded-xl border border-gray-250 bg-white p-2.5 text-sm font-medium focus:ring-[#52B788] outline-none animate-none"
            >
              <option value="calm">Calm & Relaxed</option>
              <option value="anxious">Anxious / Nervous</option>
              <option value="vocal">Vocal (Barking/Whining/Meowing)</option>
              <option value="resistant">Resistant to Handling/Loading</option>
              <option value="aggressive">Aggressive / Nipping / Scratching</option>
              <option value="other">Other / Mixed</option>
            </select>
          </div>

          {/* Handling Outcomes */}
          <div className="space-y-2">
            <Label className="text-[#1B4332] font-semibold text-xs">Handling & Containment Outcomes</Label>
            <div className="bg-[#F9F7F3] border border-[#EDE8D9] rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox id="easy_loading" checked={easyLoading} onCheckedChange={(checked) => setEasyLoading(!!checked)} />
                <Label htmlFor="easy_loading" className="text-xs text-[#6B5B4F] cursor-pointer">Easy Loading & Transfer</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="extra_restraint" checked={extraRestraint} onCheckedChange={(checked) => setExtraRestraint(!!checked)} />
                <Label htmlFor="extra_restraint" className="text-xs text-[#6B5B4F] cursor-pointer">Needed Extra Restraint / Leash Help</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="carrier_issue" checked={carrierIssue} onCheckedChange={(checked) => setCarrierIssue(!!checked)} />
                <Label htmlFor="carrier_issue" className="text-xs text-[#6B5B4F] cursor-pointer">Carrier Issue / Escape Attempt</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="owner_mismatch" checked={ownerMismatch} onCheckedChange={(checked) => setOwnerMismatch(!!checked)} />
                <Label htmlFor="owner_mismatch" className="text-xs text-[#6B5B4F] cursor-pointer">Owner Care Instructions Mismatch</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="medical_concern" checked={medicalConcern} onCheckedChange={(checked) => setMedicalConcern(!!checked)} />
                <Label htmlFor="medical_concern" className="text-xs text-[#6B5B4F] cursor-pointer">Medical Concern Observed (Distress/Illness)</Label>
              </div>
            </div>
          </div>

          {/* Severity */}
          <div className="space-y-1.5">
            <Label className="text-[#1B4332] font-semibold text-xs">Incident Severity *</Label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full rounded-xl border border-gray-250 bg-white p-2.5 text-sm font-medium focus:ring-[#52B788] outline-none"
            >
              <option value="none">None (Standard Safe Transit)</option>
              <option value="minor">Minor (Tension, minimal risk)</option>
              <option value="moderate">Moderate (Strong resistance / near-incident)</option>
              <option value="urgent">Urgent (Safety issue, bite, escape attempt)</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-[#1B4332] font-semibold text-xs">Observational Notes (optional)</Label>
              <span className="text-[10px] text-[#6B5B4F]/60">{notes.length} / 1000</span>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              className="rounded-xl border-gray-250 resize-none text-xs"
              rows={3}
              placeholder="Describe pet behavior, vehicle adaptation details, and any containment issues..."
            />
          </div>

          {/* Recommendations */}
          <div className="space-y-2">
            <Label className="text-[#1B4332] font-semibold text-xs">Safety Recommendations</Label>
            <div className="bg-[#FEFAE0]/40 border border-[#FEFAE0]/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox id="recommend_review" checked={recommendReview} onCheckedChange={(checked) => setRecommendReview(!!checked)} />
                <Label htmlFor="recommend_review" className="text-xs text-amber-800 cursor-pointer font-medium">Recommend profile review by admin</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="recommend_reassessment" checked={recommendReassessment} onCheckedChange={(checked) => setRecommendReassessment(!!checked)} />
                <Label htmlFor="recommend_reassessment" className="text-xs text-red-800 cursor-pointer font-medium">Recommend safety risk flag reassessment</Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-[#EDF7F0] pt-4 flex gap-2">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl py-2.5 font-semibold transition"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2 shrink-0" /> : "Save Observations"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={onClose}
              className="border-gray-200 text-[#6B5B4F] hover:bg-gray-50 rounded-xl py-2.5 font-semibold transition"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DriverVisualSafetyVerificationCard({ trip, verification, refetchVerification, driverEmail }) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load passenger profile
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["passenger-profile", trip.passenger_profile_id],
    queryFn: async () => {
      const res = await fetch(`/api/passenger-profile?id=${trip.passenger_profile_id}`);
      if (!res.ok) throw new Error("Failed to fetch passenger profile");
      const json = await res.json();
      return json.data;
    },
    enabled: !!trip.passenger_profile_id && isOpen,
  });

  // Checklist states
  const [visualMatchConfirmed, setVisualMatchConfirmed] = useState(false);
  const [restraintHardwareConfirmed, setRestraintHardwareConfirmed] = useState(false);
  const [photoCaptureAttached, setPhotoCaptureAttached] = useState(false);

  // Decision states
  const [decision, setDecision] = useState("fail_visual_mismatch"); // 'pass_visual_match', 'fail_visual_mismatch'
  const [holdReason, setHoldReason] = useState("");
  const [notes, setNotes] = useState("");

  // Initialize checks from existing verification record if present
  useEffect(() => {
    if (verification) {
      setVisualMatchConfirmed(!!verification.visual_match_confirmed);
      setRestraintHardwareConfirmed(!!verification.restraint_hardware_confirmed);
      setPhotoCaptureAttached(!!verification.photo_capture_attached);
      setDecision(verification.transport_decision || "fail_visual_mismatch");
      setHoldReason(verification.hold_reason || "");
      setNotes(verification.verification_notes || "");
    }
  }, [verification]);

  const canClear = visualMatchConfirmed && restraintHardwareConfirmed && photoCaptureAttached;

  async function handleSave() {
    if (decision === "pass_visual_match" && !canClear) {
      toast.error("Cannot pass transport check: All checklist items must be confirmed");
      return;
    }
    if (decision !== "pass_visual_match" && !holdReason.trim()) {
      toast.error("Reason for mismatch/hold is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/chauffeur-health-record-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_id: trip.id,
          reviewed_by: driverEmail,
          reviewed_at: new Date().toISOString(),
          visual_match_confirmed: visualMatchConfirmed,
          restraint_hardware_confirmed: restraintHardwareConfirmed,
          photo_capture_attached: photoCaptureAttached,
          transport_decision: decision,
          hold_reason: decision === "pass_visual_match" ? "" : holdReason,
          verification_notes: notes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save verification");
      }

      toast.success("Visual safety verification saved!");
      refetchVerification();
    } catch (err) {
      toast.error(err.message || "Failed to save verification");
    } finally {
      setSaving(false);
    }
  }

  // Determine Badge display
  const getStatusBadge = () => {
    if (!verification) return <Badge className="bg-gray-100 text-gray-700 border border-gray-200">Pending Review</Badge>;
    if (verification.transport_decision === "pass_visual_match") {
      return <Badge className="bg-green-150 text-green-800 border border-green-200">Passed</Badge>;
    }
    return <Badge className="bg-amber-150 text-amber-800 border border-amber-200">On Hold</Badge>;
  };

  return (
    <div className="border border-[#EDF7F0] rounded-xl overflow-hidden shadow-sm bg-white">
      {/* Header (Toggle open/close) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#EDF7F0]/30 hover:bg-[#EDF7F0]/50 transition text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🛡️</span>
          <span className="font-bold text-[#1B4332] text-sm">Visual Safety Verification</span>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 border-t border-gray-100">
          {isProfileLoading ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <Loader2 className="w-6 h-6 text-[#52B788] animate-spin" />
              <p className="text-xs text-[#6B5B4F]/70">Loading pet safety profile...</p>
            </div>
          ) : (
            <>
              {/* Pet & Safety Details Read-only section */}
              {profile && (
                <div className="bg-[#EDF7F0]/40 rounded-xl p-3 border border-[#EDF7F0] space-y-2">
                  <p className="text-xs font-bold text-[#1B4332] uppercase tracking-wide">Expected Passenger Profile</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#6B5B4F]/80">Pet Name:</span> <strong className="text-[#1B4332]">{profile.pet_name}</strong>
                    </div>
                    <div>
                      <span className="text-[#6B5B4F]/80">Species/Breed:</span> <strong className="text-[#1B4332]">{profile.species} · {profile.breed || "Mixed"}</strong>
                    </div>
                    <div>
                      <span className="text-[#6B5B4F]/80">Weight:</span> <strong className="text-[#1B4332]">{profile.weight} lbs</strong>
                    </div>
                    <div>
                      <span className="text-[#6B5B4F]/80">Vet Consent:</span>{" "}
                      {profile.emergency_vet_consent ? (
                        <span className="text-green-700 font-bold">✓ Consented</span>
                      ) : (
                        <span className="text-slate-500">Not Declared</span>
                      )}
                    </div>
                  </div>
                  {profile.emergency_vet_name && (
                    <div className="text-xs border-t border-[#EDF7F0] pt-1.5 mt-1">
                      <span className="text-[#6B5B4F]/80">Preferred Vet Clinic:</span>{" "}
                      <strong className="text-[#1B4332]">{profile.emergency_vet_name}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Checklist */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-[#1B4332] uppercase tracking-wide">Verification Checklist</p>
                <div className="space-y-2 bg-[#F9F7F3] border border-[#EDE8D9] rounded-xl p-3">
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      id="visualMatchConfirmed"
                      checked={visualMatchConfirmed}
                      onCheckedChange={(checked) => setVisualMatchConfirmed(!!checked)}
                      className="border-gray-300 text-[#1B4332] focus:ring-[#52B788] mt-0.5"
                    />
                    <Label htmlFor="visualMatchConfirmed" className="text-xs text-[#6B5B4F] cursor-pointer font-medium leading-tight">
                      Visual Match (Species, Breed, Weight match record)
                    </Label>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      id="restraintHardwareConfirmed"
                      checked={restraintHardwareConfirmed}
                      onCheckedChange={(checked) => setRestraintHardwareConfirmed(!!checked)}
                      className="border-gray-300 text-[#1B4332] focus:ring-[#52B788] mt-0.5"
                    />
                    <Label htmlFor="restraintHardwareConfirmed" className="text-xs text-[#6B5B4F] cursor-pointer font-medium leading-tight">
                      Restraint Hardware Presence (Required securement device is present and anchored)
                    </Label>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      id="photoCaptureAttached"
                      checked={photoCaptureAttached}
                      onCheckedChange={(checked) => setPhotoCaptureAttached(!!checked)}
                      className="border-gray-300 text-[#1B4332] focus:ring-[#52B788] mt-0.5"
                    />
                    <Label htmlFor="photoCaptureAttached" className="text-xs text-[#6B5B4F] cursor-pointer font-medium leading-tight">
                      Photo Capture Verification (Timestamped photo of secured pet is attached)
                    </Label>
                  </div>
                </div>
              </div>

              {/* Decision selector */}
              <div className="space-y-1.5">
                <Label className="text-[#1B4332] font-semibold text-xs">Transport Decision *</Label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-full rounded-xl border border-gray-250 bg-white p-2.5 text-sm font-medium focus:ring-[#52B788] outline-none"
                >
                  <option value="fail_visual_mismatch">Visual Mismatch or Non-Compliant Hardware</option>
                  <option value="pass_visual_match">Visual Check Passed; Safety Restraint Anchored</option>
                </select>
                {decision === "pass_visual_match" && !canClear && (
                  <p className="text-[10px] text-red-600 font-semibold mt-1">
                    ⚠️ To select 'Passed', you must confirm Visual Match, Restraint Hardware Presence, and Photo Capture Verification.
                  </p>
                )}
              </div>

              {/* Hold Reason (conditional) */}
              {decision !== "pass_visual_match" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-[#1B4332] font-semibold text-xs text-red-700">Reason for Hold/Failure *</Label>
                    <span className="text-[10px] text-[#6B5B4F]/60">{holdReason.length} / 1000</span>
                  </div>
                  <Textarea
                    value={holdReason}
                    onChange={(e) => setHoldReason(e.target.value)}
                    maxLength={1000}
                    className="rounded-xl border-red-250 text-xs focus:ring-red-500"
                    rows={2}
                    placeholder="Describe what visual mismatch or hardware non-compliance was observed..."
                  />
                </div>
              )}

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-[#1B4332] font-semibold text-xs">Verification Notes (Optional)</Label>
                  <span className="text-[10px] text-[#6B5B4F]/60">{notes.length} / 1000</span>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={1000}
                  className="rounded-xl border-gray-250 text-xs focus:ring-[#52B788]"
                  rows={2}
                  placeholder="Any additional details or vehicle securement logs..."
                />
              </div>

              {/* Action Buttons */}
              <Button
                onClick={handleSave}
                disabled={saving || (decision === "pass_visual_match" && !canClear) || (decision !== "pass_visual_match" && !holdReason.trim())}
                className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl py-2 font-semibold shadow transition text-xs"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2 shrink-0" /> : null}
                Save Verification Decision
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}