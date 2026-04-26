import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  UserPlus, Zap, AlertTriangle, Radio,
  Clock, MapPin, Phone, MessageCircle, ExternalLink,
  ChevronDown, ChevronUp, Truck, Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isDriverAssignable } from "../drivers/DriverCompliancePanel";
import { DriverStatusBadge } from "../drivers/DriverAvailabilityToggle";

// ── Helpers ──────────────────────────────────────────────────────────────────
function isWithinMinutes(trip, mins) {
  if (!trip.scheduled_date) return false;
  const scheduled = new Date(`${trip.scheduled_date}T${trip.scheduled_time || "00:00"}`);
  const now = new Date();
  const diff = (scheduled - now) / 60000;
  return diff >= 0 && diff <= mins;
}

function isStartingSoon(trip) {
  return isWithinMinutes(trip, 60);
}

function isActiveNow(trip) {
  return ["in_progress", "confirmed"].includes(trip.status) &&
    trip.driver_action_status && ["in_progress", "picked_up"].includes(trip.driver_action_status);
}

function needsAttention(trip) {
  if (trip.status === "cancelled") return true;
  if (trip.status === "requested" && !trip.driver_email) {
    // Unconfirmed > 1 hour old
    const created = new Date(trip.created_date);
    return (Date.now() - created) > 3600000;
  }
  return false;
}

// ── Queue Item Card ───────────────────────────────────────────────────────────
function QueueItem({ trip, drivers, onAssign, urgencyLabel }) {
  const [assigning, setAssigning] = useState(false);

  const pickupArea = trip.pickup_location?.split(",").slice(-2).join(",").trim() || trip.pickup_location;
  const scheduledDisplay = [trip.scheduled_date, trip.scheduled_time].filter(Boolean).join(" · ");

  return (
    <div className="bg-white border border-[#EDF7F0] rounded-2xl p-4 space-y-3 hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[#1B4332] text-sm">{trip.pet_name || "Pet"}</span>
            <span className="text-[#6B5B4F]/50 text-xs">·</span>
            <span className="text-xs text-[#6B5B4F]/70">{trip.owner_email?.split("@")[0]}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {trip.service_type && (
              <Badge className="bg-[#EDF7F0] text-[#2D6A4F] text-[10px] px-2 py-0">{trip.service_type}</Badge>
            )}
            {urgencyLabel && (
              <Badge className="bg-red-50 text-red-600 border border-red-200 text-[10px] px-2 py-0">
                {urgencyLabel}
              </Badge>
            )}
          </div>
        </div>

        {/* Time */}
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 text-xs text-[#6B5B4F]/70 justify-end">
            <Clock className="w-3 h-3" />
            <span>{scheduledDisplay || "No time set"}</span>
          </div>
          {trip.price && <p className="text-xs font-bold text-[#1B4332] mt-0.5">${trip.price}</p>}
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 text-xs text-[#6B5B4F]/80">
        <MapPin className="w-3 h-3 text-[#52B788] shrink-0" />
        <span className="truncate">{pickupArea}</span>
      </div>

      {/* Driver row */}
      <div className="flex items-center gap-2">
        {trip.driver_name ? (
          <div className="flex items-center gap-1.5 text-xs bg-[#EDF7F0] text-[#2D6A4F] px-2.5 py-1.5 rounded-lg flex-1">
            <Truck className="w-3 h-3" />
            <span className="font-medium truncate">{trip.driver_name}</span>
          </div>
        ) : assigning ? (
          <select
            className="flex-1 text-xs border border-[#D8F3DC] rounded-lg px-2 py-1.5 text-[#1B4332] bg-white focus:outline-none"
            defaultValue=""
            onChange={e => { if (e.target.value) { onAssign(trip.id, e.target.value); setAssigning(false); } }}
            autoFocus
            onBlur={() => setAssigning(false)}
          >
            <option value="">Select driver…</option>
            {drivers.filter(isDriverAssignable).sort((a, b) => {
              const order = { available: 0, on_trip: 1, offline: 2 };
              return (order[a.availability_status] ?? 2) - (order[b.availability_status] ?? 2);
            }).map(d => (
              <option key={d.id} value={d.email}>
                {d.full_name || d.email}{d.availability_status === "available" ? " ✓" : d.availability_status === "on_trip" ? " (On Trip)" : " (Offline)"}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-[#6B5B4F]/50 italic flex-1">Unassigned</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[#EDF7F0]">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs px-2 border-[#D8F3DC] text-[#1B4332] gap-1"
          onClick={() => setAssigning(true)}
        >
          <UserPlus className="w-3 h-3" /> Assign
        </Button>

        {trip.owner_phone && (
          <a href={`sms:${trip.owner_phone}`}>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2 border-[#D8F3DC] text-[#1B4332] gap-1">
              <MessageCircle className="w-3 h-3" /> Message
            </Button>
          </a>
        )}

        {trip.driver_phone && (
          <a href={`tel:${trip.driver_phone}`}>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2 border-amber-200 text-amber-700 gap-1">
              <Phone className="w-3 h-3" /> Call Driver
            </Button>
          </a>
        )}

        <Link to={createPageUrl("TripDetail") + `?id=${trip.id}`} className="ml-auto">
          <Button size="sm" className="h-7 text-xs px-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white gap-1">
            <ExternalLink className="w-3 h-3" /> Details
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ── Queue Section ─────────────────────────────────────────────────────────────
function QueueSection({ icon: Icon, title, color, bgColor, trips, drivers, onAssign, emptyText, urgencyLabel }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`rounded-2xl border ${bgColor} overflow-hidden`}>
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:opacity-80 transition-opacity"
      >
        <Icon className={`w-4 h-4 ${color}`} />
        <span className={`font-bold text-sm ${color}`}>{title}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60 ${color}`}>{trips.length}</span>
        <span className="ml-auto">
          {collapsed ? <ChevronDown className={`w-4 h-4 ${color}`} /> : <ChevronUp className={`w-4 h-4 ${color}`} />}
        </span>
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 space-y-2">
          {trips.length === 0 ? (
            <p className="text-center text-xs text-[#6B5B4F]/50 py-4 bg-white/50 rounded-xl">{emptyText}</p>
          ) : (
            trips.map(trip => (
              <QueueItem
                key={trip.id}
                trip={trip}
                drivers={drivers}
                onAssign={onAssign}
                urgencyLabel={urgencyLabel}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Dispatch Queue ───────────────────────────────────────────────────────
export default function DispatchQueue() {
  const queryClient = useQueryClient();

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["dispatch-trips"],
    queryFn: () => base44.entities.Trip.list("-scheduled_date", 100),
    refetchInterval: 60000,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers-list"],
    queryFn: () => base44.entities.User.filter({ role: "driver" }),
  });

  async function handleAssign(tripId, driverEmail) {
    const driver = drivers.find(d => d.email === driverEmail);
    await base44.entities.Trip.update(tripId, {
      driver_email: driverEmail,
      driver_name: driver?.full_name || driverEmail,
      status: "confirmed",
    });
    queryClient.invalidateQueries({ queryKey: ["dispatch-trips"] });
    queryClient.invalidateQueries({ queryKey: ["all-trips-admin"] });
  }

  const activeTrips = trips.filter(t => !["completed", "cancelled"].includes(t.status));

  const needsAssignment = activeTrips.filter(t => !t.driver_email);
  const startingSoon = activeTrips.filter(t => t.driver_email && isStartingSoon(t));
  const activeNow = activeTrips.filter(t => isActiveNow(t));
  const attention = activeTrips.filter(t => needsAttention(t));

  const availableDrivers = drivers.filter(d => d.availability_status === "available");
  const onTripDrivers = drivers.filter(d => d.availability_status === "on_trip");
  const offlineDrivers = drivers.filter(d => !d.availability_status || d.availability_status === "offline");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Radio className="w-5 h-5 text-[#2D6A4F]" />
        <h2 className="text-base font-bold text-[#1B4332]">Dispatch Queue</h2>
        <span className="text-xs text-[#6B5B4F]/50 ml-1">Live · refreshes every 60s</span>
      </div>

      {/* Driver Status Panel */}
      <div className="bg-white border border-[#EDF7F0] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-[#2D6A4F]" />
          <span className="text-sm font-bold text-[#1B4332]">Driver Status</span>
        </div>
        <div className="flex gap-4 text-center mb-3">
          <div className="flex-1 bg-green-50 rounded-xl py-2 border border-green-100">
            <div className="text-lg font-bold text-green-700">{availableDrivers.length}</div>
            <div className="text-xs text-green-600">Available</div>
          </div>
          <div className="flex-1 bg-blue-50 rounded-xl py-2 border border-blue-100">
            <div className="text-lg font-bold text-blue-700">{onTripDrivers.length}</div>
            <div className="text-xs text-blue-600">On Trip</div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-xl py-2 border border-gray-100">
            <div className="text-lg font-bold text-gray-500">{offlineDrivers.length}</div>
            <div className="text-xs text-gray-400">Offline</div>
          </div>
        </div>
        {drivers.length > 0 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {[...availableDrivers, ...onTripDrivers, ...offlineDrivers].map(d => (
              <div key={d.id} className="flex items-center justify-between gap-2 text-xs py-1">
                <span className="text-[#1B4332] font-medium truncate">{d.full_name || d.email}</span>
                <DriverStatusBadge status={d.availability_status || "offline"} />
              </div>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center text-sm text-[#6B5B4F]/50 py-8">Loading dispatch data…</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <QueueSection
            icon={UserPlus}
            title="Needs Assignment"
            color="text-red-700"
            bgColor="border-red-100 bg-red-50"
            trips={needsAssignment}
            drivers={drivers}
            onAssign={handleAssign}
            emptyText="All trips have drivers assigned ✓"
          />
          <QueueSection
            icon={Clock}
            title="Starting Soon"
            color="text-amber-700"
            bgColor="border-amber-100 bg-amber-50"
            trips={startingSoon}
            drivers={drivers}
            onAssign={handleAssign}
            emptyText="No trips starting in the next 60 minutes"
            urgencyLabel="< 60 min"
          />
          <QueueSection
            icon={Zap}
            title="Active Now"
            color="text-[#2D6A4F]"
            bgColor="border-[#D8F3DC] bg-[#EDF7F0]"
            trips={activeNow}
            drivers={drivers}
            onAssign={handleAssign}
            emptyText="No active trips right now"
          />
          <QueueSection
            icon={AlertTriangle}
            title="Needs Attention"
            color="text-orange-700"
            bgColor="border-orange-100 bg-orange-50"
            trips={attention}
            drivers={drivers}
            onAssign={handleAssign}
            emptyText="No issues detected ✓"
          />
        </div>
      )}
    </div>
  );
}