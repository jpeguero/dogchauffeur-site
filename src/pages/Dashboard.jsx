import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Truck, Clock, CheckCircle2, PawPrint, ChevronRight, UserPlus, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from "../components/dashboard/StatCard";
import SignalRadar from "../components/dashboard/SignalRadar";
import TripCard from "../components/trips/TripCard";
import AdminLeadsTable from "../components/admin/AdminLeadsTable";
import AdminReferrals from "../components/admin/AdminReferrals";
import AdminUpcomingRides from "../components/admin/AdminUpcomingRides";
import DemandMap from "../components/dashboard/DemandMap";
import DispatchQueue from "../components/admin/DispatchQueue";
import ReferralCard from "../components/dashboard/ReferralCard";

// ── Admin Control Tower ──────────────────────────────────────────────────────
function AdminDashboard({ user, leads }) {
  const { data: allTrips = [] } = useQuery({
    queryKey: ["all-trips-stats"],
    queryFn: () => base44.entities.Trip.list("-created_date", 100),
  });

  const active = allTrips.filter(t => ["confirmed", "in_progress"].includes(t.status));
  const pending = allTrips.filter(t => t.status === "requested");
  const completed = allTrips.filter(t => t.status === "completed");
  const revenue = allTrips.filter(t => t.price).reduce((s, t) => s + (t.price || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B4332]">Control Tower 🗼</h1>
          <p className="text-[#6B5B4F]/70 mt-1 font-medium">Demand monitoring & dispatch</p>
        </div>
        <Link to={createPageUrl("Drivers")} className="hidden md:block">
          <Button variant="outline" className="border-[#D8F3DC] text-[#1B4332] rounded-xl">
            Manage Drivers
          </Button>
        </Link>
      </div>

      {/* Dispatch Queue */}
      <DispatchQueue />

      {/* Signal Radar */}
      <SignalRadar leads={leads} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Truck} label="Active Rides" value={active.length} color="bg-[#2D6A4F]" delay={0} />
        <StatCard icon={Clock} label="Awaiting Confirm" value={pending.length} color="bg-amber-500" delay={0.1} />
        <StatCard icon={CheckCircle2} label="Completed" value={completed.length} color="bg-[#52B788]" delay={0.2} />
        <StatCard icon={Zap} label="Est. Revenue" value={`$${revenue.toFixed(0)}`} color="bg-[#1B4332]" delay={0.3} />
      </div>

      {/* Service Demand Map */}
      <DemandMap leads={leads} />

      {/* Upcoming Rides + Assign Driver */}
      <AdminUpcomingRides />

      {/* Referrals */}
      <div>
        <h2 className="text-base font-bold text-[#1B4332] mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#2D6A4F]" /> Referral Sources
        </h2>
        <AdminReferrals />
      </div>

      {/* Leads Table */}
      <AdminLeadsTable />
    </div>
  );
}

// ── Owner Dashboard ──────────────────────────────────────────────────────────
function OwnerDashboard({ user }) {
  const { data: pets = [] } = useQuery({
    queryKey: ["pets", user.email],
    queryFn: async () => {
      const res = await fetch(`/api/passenger-profile?owner_email=${encodeURIComponent(user.email)}`);
      if (!res.ok) throw new Error("Failed to fetch passenger profiles");
      const result = await res.json();
      return (result.data || []).filter(p => p.lifecycle_state !== "Archived");
    },
  });

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["trips", user.email],
    queryFn: () => base44.entities.Trip.filter({ owner_email: user.email }, "-created_date"),
  });

  const activeTrips = trips.filter(t => ["confirmed", "in_progress"].includes(t.status));
  const pendingTrips = trips.filter(t => t.status === "requested");
  const completedTrips = trips.filter(t => t.status === "completed");

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B4332]">
            Welcome back, {user.full_name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-[#6B5B4F]/80 mt-1 font-medium">
            {trips.length === 0 ? "Book a ride for your pet." : "Here's what's happening with your rides."}
          </p>
        </div>
        <Link to={createPageUrl("BookTrip")} className="hidden md:block">
          <Button className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl shadow-md">
            Book a Ride <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <Link to={createPageUrl("BookTrip")} className="block md:hidden">
        <Button className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white h-12 text-base rounded-2xl shadow-lg justify-between px-5">
          <span>Book a Ride</span>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </Link>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Truck} label="Upcoming Rides" value={activeTrips.length} color="bg-[#2D6A4F]" delay={0} />
        <StatCard icon={Clock} label="Pending" value={pendingTrips.length} color="bg-amber-500" delay={0.1} />
        <StatCard icon={CheckCircle2} label="Completed" value={completedTrips.length} color="bg-[#52B788]" delay={0.2} />
        <StatCard icon={PawPrint} label="Pets" value={pets.length} color="bg-[#40916C]" delay={0.3} />
      </div>

      {activeTrips.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[#1B4332] mb-4">Active Journeys</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeTrips.map((trip, i) => <TripCard key={trip.id} trip={trip} delay={i * 0.08} />)}
          </div>
        </div>
      )}

      {pendingTrips.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[#1B4332] mb-4">Pending Requests</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingTrips.map((trip, i) => <TripCard key={trip.id} trip={trip} delay={i * 0.08} />)}
          </div>
        </div>
      )}

      {/* Refer-a-Friend */}
      <ReferralCard user={user} />

      {trips.length === 0 && !tripsLoading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-3xl bg-[#EDF7F0] flex items-center justify-center mx-auto mb-4">
            <PawPrint className="w-8 h-8 text-[#2D6A4F]/40" />
          </div>
          <h3 className="text-lg font-semibold text-[#1B4332]">No rides scheduled yet</h3>
          <p className="text-sm text-[#6B5B4F]/50 mt-1">Book your first safe pet ride for a vet visit, grooming, daycare, or more.</p>
        </div>
      )}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === "admin";
  const isDriver = user?.role === "driver";

  const { data: leads = [] } = useQuery({
    queryKey: ["leads-admin"],
    queryFn: () => base44.entities.Lead.list("-created_date", 50),
    enabled: isAdmin,
  });

  if (!user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (isDriver) {
    window.location.replace(createPageUrl("DriverPortal"));
    return null;
  }

  if (isAdmin) return <AdminDashboard user={user} leads={leads} />;
  return <OwnerDashboard user={user} />;
}