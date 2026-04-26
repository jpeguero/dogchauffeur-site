import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Truck, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import TripCard from "../components/trips/TripCard";
import { Skeleton } from "@/components/ui/skeleton";
import DriverCompliancePanel from "../components/drivers/DriverCompliancePanel";

export default function DriverProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const driverId = urlParams.get("id");
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: drivers = [], isLoading: driverLoading } = useQuery({
    queryKey: ["driver", driverId],
    queryFn: () => base44.entities.User.filter({ id: driverId }),
    enabled: !!driverId,
  });
  const driver = drivers[0];

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["driver-trips", driver?.email],
    queryFn: () => base44.entities.Trip.filter({ driver_email: driver.email }, "-created_date"),
    enabled: !!driver?.email,
  });

  const completedTrips = trips.filter((t) => t.status === "completed");
  const activeTrips = trips.filter((t) => ["confirmed", "in_progress"].includes(t.status));
  const pendingTrips = trips.filter((t) => t.status === "requested");

  if (driverLoading || !driver) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to={createPageUrl("Drivers")}
        className="inline-flex items-center gap-2 text-sm text-[#6B5B4F]/60 hover:text-[#1B4332] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Drivers
      </Link>

      {/* Profile header */}
      <div className="bg-white rounded-3xl border border-[#EDF7F0] p-6 md:p-8">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#D8F3DC] flex items-center justify-center text-2xl font-bold text-[#1B4332]">
            {(driver.full_name || driver.email)?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1B4332]">{driver.full_name || driver.email}</h1>
            <p className="text-sm text-[#6B5B4F]/60">{driver.email}</p>
            <Badge className="mt-1 bg-[#EDF7F0] text-[#2D6A4F] border-[#B7E4C7] border text-xs">Driver</Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#EDF7F0] rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-[#1B4332]">{trips.length}</div>
            <div className="text-xs text-[#6B5B4F]/60 mt-1 flex items-center justify-center gap-1">
              <Truck className="w-3 h-3" /> Total Trips
            </div>
          </div>
          <div className="bg-[#EDF7F0] rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-[#2D6A4F]">{completedTrips.length}</div>
            <div className="text-xs text-[#6B5B4F]/60 mt-1 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Completed
            </div>
          </div>
          <div className="bg-[#EDF7F0] rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{activeTrips.length}</div>
            <div className="text-xs text-[#6B5B4F]/60 mt-1 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> Active
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Panel */}
      <DriverCompliancePanel driver={driver} isAdmin={user?.role === "admin"} />

      {/* Active trips */}
      {activeTrips.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[#1B4332] mb-3">Active Trips</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeTrips.map((trip, i) => (
              <TripCard key={trip.id} trip={trip} delay={i * 0.08} />
            ))}
          </div>
        </div>
      )}

      {/* All trips */}
      <div>
        <h2 className="text-lg font-bold text-[#1B4332] mb-3">Trip History</h2>
        {tripsLoading ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : trips.length === 0 ? (
          <div className="text-center py-12 text-[#6B5B4F]/50 text-sm">No trips assigned yet.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {trips.map((trip, i) => (
              <TripCard key={trip.id} trip={trip} delay={i * 0.05} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}