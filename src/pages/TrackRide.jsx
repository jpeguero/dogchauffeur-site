import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PawPrint, MapPin, CheckCircle2, Clock, Truck, Star } from "lucide-react";

const STATUS_STEPS = [
  { key: "requested",   label: "Ride Requested",   icon: Clock },
  { key: "confirmed",   label: "Driver Assigned",  icon: Star },
  { key: "in_progress", label: "Pet Picked Up",    icon: Truck },
  { key: "completed",   label: "Pet Delivered",    icon: CheckCircle2 },
];

function getStepIndex(status) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

export default function TrackRide() {
  const params = new URLSearchParams(window.location.search);
  const tripId = params.get("id");

  const [trip, setTrip] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!tripId) { setNotFound(true); setLoading(false); return; }

    const load = async () => {
      const trips = await base44.entities.Trip.filter({ id: tripId });
      if (!trips || trips.length === 0) { setNotFound(true); setLoading(false); return; }
      setTrip(trips[0]);
      const upds = await base44.entities.TripUpdate.filter({ trip_id: tripId });
      setUpdates(upds.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      setLoading(false);
    };
    load();

    // Real-time updates
    const unsub1 = base44.entities.Trip.subscribe((event) => {
      if (event.data?.id === tripId || event.id === tripId) {
        setTrip(event.data);
      }
    });
    const unsub2 = base44.entities.TripUpdate.subscribe((event) => {
      if (event.data?.trip_id === tripId) {
        setUpdates((prev) => {
          const exists = prev.find((u) => u.id === event.data.id);
          if (exists) return prev;
          return [...prev, event.data];
        });
      }
    });

    return () => { unsub1(); unsub2(); };
  }, [tripId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F3] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl forest-gradient flex items-center justify-center mx-auto mb-3 animate-pulse">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
          <p className="text-[#6B5B4F]">Loading ride details…</p>
        </div>
      </div>
    );
  }

  if (notFound || !trip) {
    return (
      <div className="min-h-screen bg-[#F9F7F3] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#EDF7F0] flex items-center justify-center mx-auto mb-4">
            <PawPrint className="w-8 h-8 text-[#2D6A4F]" />
          </div>
          <h2 className="text-xl font-bold text-[#1B4332] mb-2">Ride Not Found</h2>
          <p className="text-[#6B5B4F] text-sm">Check the link in your confirmation text and try again.</p>
        </div>
      </div>
    );
  }

  const currentStepIdx = getStepIndex(trip.status);

  const updateLabels = {
    pickup_completed: "🐾 Pet picked up",
    en_route: "🚗 En route to destination",
    potty_break: "🌿 Potty break stop",
    rest_stop: "☕ Rest stop",
    feeding: "🍖 Feeding time",
    near_destination: "📍 Almost there",
    final_delivery: "🏠 Arrived at destination",
  };

  return (
    <div className="min-h-screen bg-[#F9F7F3]">
      {/* Header */}
      <div className="forest-gradient px-6 pt-10 pb-8 text-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">DogChauffeur</h1>
            <p className="text-white/70 text-xs">Live Ride Tracking</p>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Tracking</p>
          <h2 className="text-2xl font-bold">{trip.pet_name || "Your Pet"}</h2>
          {trip.scheduled_date && (
            <p className="text-white/80 text-sm mt-1">
              {new Date(trip.scheduled_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              {trip.scheduled_time && ` · ${trip.scheduled_time}`}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto space-y-5">
        {/* Route */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EDF7F0]">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center mt-1">
              <div className="w-3 h-3 rounded-full bg-[#2D6A4F]" />
              <div className="w-0.5 h-8 bg-[#D8F3DC]" />
              <div className="w-3 h-3 rounded-full bg-[#1B4332]" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-[#6B5B4F] uppercase tracking-wider">Pickup</p>
                <p className="text-sm font-medium text-[#1B4332]">{trip.pickup_location}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B5B4F] uppercase tracking-wider">Drop-off</p>
                <p className="text-sm font-medium text-[#1B4332]">{trip.dropoff_location}</p>
              </div>
            </div>
          </div>
          {trip.driver_name && (
            <div className="mt-3 pt-3 border-t border-[#EDF7F0] flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#D8F3DC] flex items-center justify-center">
                <Truck className="w-3.5 h-3.5 text-[#2D6A4F]" />
              </div>
              <p className="text-sm text-[#6B5B4F]">Driver: <span className="font-medium text-[#1B4332]">{trip.driver_name}</span></p>
            </div>
          )}
        </div>

        {/* Status Steps */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EDF7F0]">
          <h3 className="text-sm font-semibold text-[#1B4332] mb-4">Ride Status</h3>
          <div className="space-y-4">
            {STATUS_STEPS.map((step, idx) => {
              const done = idx < currentStepIdx;
              const active = idx === currentStepIdx;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    done ? "bg-[#2D6A4F]" : active ? "forest-gradient" : "bg-[#EDF7F0]"
                  }`}>
                    <Icon className={`w-4 h-4 ${done || active ? "text-white" : "text-[#B7E4C7]"}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      active ? "text-[#1B4332]" : done ? "text-[#6B5B4F]" : "text-[#B7E4C7]"
                    }`}>{step.label}</p>
                  </div>
                  {active && (
                    <span className="text-xs bg-[#D8F3DC] text-[#1B4332] px-2 py-0.5 rounded-full font-medium">Now</span>
                  )}
                  {done && (
                    <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Driver Updates */}
        {updates.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EDF7F0]">
            <h3 className="text-sm font-semibold text-[#1B4332] mb-3">Updates from Driver</h3>
            <div className="space-y-3">
              {updates.map((upd) => (
                <div key={upd.id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#52B788] mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-[#1B4332]">{updateLabels[upd.update_type] || upd.update_type}</p>
                    {upd.message && <p className="text-xs text-[#6B5B4F] mt-0.5">{upd.message}</p>}
                    {upd.photo_url && (
                      <img src={upd.photo_url} alt="Update" className="mt-2 rounded-xl w-full max-w-xs object-cover" />
                    )}
                    <p className="text-xs text-[#6B5B4F]/60 mt-1">
                      {new Date(upd.created_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {trip.notes && (
          <div className="bg-[#EDF7F0] rounded-2xl p-4">
            <p className="text-xs text-[#6B5B4F] uppercase tracking-wider mb-1">Ride Notes</p>
            <p className="text-sm text-[#1B4332]">{trip.notes}</p>
          </div>
        )}

        <p className="text-center text-xs text-[#6B5B4F]/50 pb-4">DogChauffeur · Chicago's Pet Chauffeur 🐾</p>
      </div>
    </div>
  );
}