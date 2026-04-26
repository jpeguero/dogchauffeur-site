import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck } from "lucide-react";
import TripCard from "../components/trips/TripCard";

export default function Trips() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isDriver = user?.role === "driver";

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["all-trips", user?.email, isDriver],
    queryFn: () => {
      if (isDriver) return base44.entities.Trip.filter({ driver_email: user.email }, "-created_date");
      return base44.entities.Trip.filter({ owner_email: user.email }, "-created_date");
    },
    enabled: !!user,
  });

  const filtered = tab === "all" ? trips : trips.filter((t) => t.status === tab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#1B4332]">
          {isDriver ? "My Assignments" : "My Trips"}
        </h1>
        <p className="text-[#6B5B4F]/60 mt-1">Track all your pet transport journeys</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-[#EDF7F0] rounded-xl p-1">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-[#1B4332] data-[state=active]:text-white">All</TabsTrigger>
          <TabsTrigger value="requested" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white">Requested</TabsTrigger>
          <TabsTrigger value="in_progress" className="rounded-lg data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white">In Transit</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-[#52B788] data-[state=active]:text-white">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-[#EDF7F0] flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-[#2D6A4F]/40" />
          </div>
          <h3 className="text-lg font-semibold text-[#1B4332]">No trips found</h3>
          <p className="text-sm text-[#6B5B4F]/50 mt-1">
            {tab === "all" ? "You don't have any trips yet." : `No ${tab.replace("_", " ")} trips.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((trip, i) => (
            <TripCard key={trip.id} trip={trip} delay={i * 0.06} />
          ))}
        </div>
      )}
    </div>
  );
}