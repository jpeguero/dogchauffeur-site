import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapPin, Clock, User, Truck, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { isDriverAssignable } from "../drivers/DriverCompliancePanel";

const STATUS_COLORS = {
  requested: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const URGENCY_BADGE = {
  "Today": "bg-red-100 text-red-700",
  "Within 3 days": "bg-orange-100 text-orange-700",
};

export default function AdminUpcomingRides() {
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["all-trips-admin"],
    queryFn: () => base44.entities.Trip.list("-scheduled_date", 30),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers-list"],
    queryFn: () => base44.entities.User.filter({ role: "driver" }),
  });

  const queryClient = useQueryClient();

  const upcoming = trips.filter(t => !["completed", "cancelled"].includes(t.status));
  const completed = trips.filter(t => t.status === "completed");

  async function assignDriver(tripId, driverEmail) {
    const driver = drivers.find(d => d.email === driverEmail);
    await base44.entities.Trip.update(tripId, {
      driver_email: driverEmail,
      driver_name: driver?.full_name || driverEmail,
      status: "confirmed",
    });
    queryClient.invalidateQueries({ queryKey: ["all-trips-admin"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-[#2D6A4F]" />
          <h2 className="text-base font-bold text-[#1B4332]">Upcoming Rides</h2>
          <span className="bg-[#EDF7F0] text-[#1B4332] text-xs font-semibold px-2.5 py-0.5 rounded-full">{upcoming.length}</span>
        </div>
        <span className="text-xs text-[#6B5B4F]/60">{completed.length} completed</span>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-[#EDF7F0] p-6 text-center text-sm text-[#6B5B4F]/50">Loading…</div>
      ) : upcoming.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EDF7F0] p-6 text-center text-sm text-[#6B5B4F]/50">No upcoming rides</div>
      ) : (
        <div className="space-y-3">
          {upcoming.map(trip => (
            <div key={trip.id} className="bg-white rounded-2xl border border-[#EDF7F0] p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-[#1B4332]">{trip.pet_name || "Pet"}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-[#6B5B4F]/50" />
                    <span className="text-xs text-[#6B5B4F]/70">{trip.scheduled_date}{trip.scheduled_time ? ` · ${trip.scheduled_time}` : ""}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={STATUS_COLORS[trip.status] || "bg-gray-100 text-gray-700"}>
                    {trip.status?.replace("_", " ")}
                  </Badge>
                  {trip.price && <span className="text-xs font-bold text-[#1B4332]">${trip.price}</span>}
                </div>
              </div>

              {/* Route */}
              <div className="space-y-1.5 text-sm">
                <div className="flex items-start gap-2 text-[#6B5B4F]">
                  <div className="w-2 h-2 rounded-full bg-[#52B788] mt-1.5 flex-shrink-0" />
                  <span className="text-xs">{trip.pickup_location}</span>
                </div>
                <div className="flex items-start gap-2 text-[#6B5B4F]">
                  <MapPin className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">{trip.dropoff_location}</span>
                </div>
              </div>

              {/* Owner contact */}
              {trip.owner_email && (
                <div className="flex items-center gap-1.5 text-xs text-[#6B5B4F]/70">
                  <User className="w-3 h-3" />
                  <span>{trip.owner_email}</span>
                  {trip.owner_phone && (
                    <a href={`tel:${trip.owner_phone}`} className="text-[#2D6A4F] font-medium hover:underline ml-1">{trip.owner_phone}</a>
                  )}
                </div>
              )}

              {/* Assign Driver */}
              <div className="flex items-center gap-2">
                {trip.driver_name ? (
                  <div className="flex items-center gap-1.5 text-xs text-[#2D6A4F] bg-[#EDF7F0] px-3 py-1.5 rounded-lg flex-1">
                    <Truck className="w-3 h-3" />
                    <span>Driver: <strong>{trip.driver_name}</strong></span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <select
                      className="flex-1 text-xs border border-[#D8F3DC] rounded-lg px-3 py-1.5 text-[#1B4332] bg-white focus:outline-none focus:border-[#52B788]"
                      defaultValue=""
                      onChange={e => e.target.value && assignDriver(trip.id, e.target.value)}
                    >
                      <option value="">Assign driver…</option>
                      {drivers.filter(isDriverAssignable).map(d => (
                        <option key={d.id} value={d.email}>{d.full_name || d.email}</option>
                      ))}
                    </select>
                  </div>
                )}
                <Link to={createPageUrl("TripDetail") + `?id=${trip.id}`}>
                  <button className="text-xs text-[#2D6A4F] hover:underline flex items-center gap-0.5">
                    View <ChevronRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}