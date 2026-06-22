import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageCircle, PawPrint, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useAuth } from "../components/auth/useAuth";
import ChatWindow from "../components/messages/ChatWindow";

export default function Messages() {
  const { effectiveUser: authUser } = useAuth();
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [searchParams] = useSearchParams();
  const tripIdFromUrl = searchParams.get("tripId") || searchParams.get("trip");
  const tokenFromUrl = searchParams.get("token");
  const queryClient = useQueryClient();

  const user = authUser || (tokenFromUrl ? { role: "owner", email: "client@pawffeur.com", full_name: "Pet Owner" } : null);

  useEffect(() => {
    if (tokenFromUrl && tripIdFromUrl && !selectedTrip) {
      setSelectedTrip({ id: tripIdFromUrl, pet_name: "My Ride Chat" });
    }
  }, [tokenFromUrl, tripIdFromUrl, selectedTrip]);

  const isDriver = user?.role === "driver";
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const { data: trips = [] } = useQuery({
    queryKey: ["msg-trips", user?.email, isDriver, user?.role],
    queryFn: () => {
      if (isAdmin) {
        return base44.entities.Trip.filter({}, "-created_date");
      }
      if (isDriver) return base44.entities.Trip.filter({ driver_email: user.email }, "-created_date");
      return base44.entities.Trip.filter({ owner_email: user.email }, "-created_date");
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (tripIdFromUrl && trips.length > 0) {
      const match = trips.find(t => t.id === tripIdFromUrl);
      if (match) {
        setSelectedTrip(match);
      }
    }
  }, [tripIdFromUrl, trips]);

  const { data: messages = [] } = useQuery({
    queryKey: ["msg-messages", selectedTrip?.id],
    queryFn: () => base44.entities.Message.filter({ trip_id: selectedTrip.id }, "created_date"),
    enabled: !!selectedTrip,
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ["all-messages", user?.email],
    queryFn: async () => {
      const msgs = [];
      for (const trip of trips) {
        const tripMsgs = await base44.entities.Message.filter({ trip_id: trip.id }, "-created_date", 1);
        if (tripMsgs.length > 0) {
          msgs.push({ ...tripMsgs[0], tripId: trip.id });
        }
      }
      return msgs;
    },
    enabled: trips.length > 0,
  });

  const refreshMessages = () => {
    queryClient.invalidateQueries({ queryKey: ["msg-messages", selectedTrip?.id] });
  };

  const getLastMessage = (tripId) => {
    return allMessages.find(m => m.tripId === tripId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#1B4332]">Messages</h1>
        <p className="text-[#6B5B4F]/60 mt-1">
          {isAdmin 
            ? "Monitor and participate in active trip conversations" 
            : `Communicate with your ${isDriver ? "pet owners" : "drivers"} (Admin Dispatch is also in this channel)`}
        </p>
      </div>

      <div className="grid md:grid-cols-[360px_1fr] gap-4 h-[600px]">
        {/* Trip list */}
        <div className="bg-white rounded-2xl border border-[#EDF7F0] overflow-y-auto">
          {trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#6B5B4F]/40">
              <MessageCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#EDF7F0]">
              {trips.map((trip, i) => {
                const last = getLastMessage(trip.id);
                const isActive = selectedTrip?.id === trip.id;
                return (
                  <motion.button
                    key={trip.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedTrip(trip)}
                    className={`w-full text-left p-4 transition-colors ${
                      isActive ? "bg-[#EDF7F0]" : "hover:bg-[#F9F7F3]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#D8F3DC] flex items-center justify-center shrink-0">
                        <PawPrint className="w-5 h-5 text-[#2D6A4F]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-[#1B4332] text-sm truncate">{trip.pet_name || "Trip"}</p>
                          {last && (
                            <span className="text-[10px] text-[#6B5B4F]/40">
                              {format(new Date(last.created_date), "MMM d")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B5B4F]/50 truncate mt-0.5">
                          {last ? last.content : "No messages yet"}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#6B5B4F]/30 shrink-0" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="bg-white rounded-2xl border border-[#EDF7F0] overflow-hidden">
          {selectedTrip && user ? (
            <ChatWindow
              tripId={selectedTrip.id}
              currentUser={user}
              messages={messages}
              onNewMessage={refreshMessages}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#6B5B4F]/40">
              <MessageCircle className="w-10 h-10 mb-3" />
              <p className="text-sm">Select a trip to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}