import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Calendar, PawPrint, MessageCircle, Truck, User } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import StatusTimeline from "../components/trips/StatusTimeline";
import DriverUpdateForm from "../components/trips/DriverUpdateForm";
import ChatWindow from "../components/messages/ChatWindow";
import PaymentPanel from "../components/payments/PaymentPanel";
import InvoicePanel from "../components/invoices/InvoicePanel";
import LiveTrackingMap from "../components/trips/LiveTrackingMap";
import HealthLogForm from "../components/health/HealthLogForm";
import HealthLogViewer from "../components/health/HealthLogViewer";

const statusConfig = {
  requested: { label: "Requested", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "In Transit", bg: "bg-[#D8F3DC] text-[#1B4332] border-[#B7E4C7]" },
  completed: { label: "Completed", bg: "bg-gray-100 text-gray-600 border-gray-200" },
  cancelled: { label: "Cancelled", bg: "bg-red-50 text-red-600 border-red-200" },
};

export default function TripDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("id");
  const [user, setUser] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isDriver = user?.role === "driver";
  const isAdmin = user?.role === "admin";

  const { data: trip } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      const trips = await base44.entities.Trip.filter({ id: tripId });
      return trips[0];
    },
    enabled: !!tripId,
  });

  const { data: updates = [] } = useQuery({
    queryKey: ["trip-updates", tripId],
    queryFn: () => base44.entities.TripUpdate.filter({ trip_id: tripId }, "created_date"),
    enabled: !!tripId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["trip-messages", tripId],
    queryFn: () => base44.entities.Message.filter({ trip_id: tripId }, "created_date"),
    enabled: !!tripId,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => base44.entities.User.filter({ role: "driver" }),
    enabled: isAdmin,
  });

  const assignMutation = useMutation({
    mutationFn: ({ driverId, driverName, driverEmail }) =>
      base44.entities.Trip.update(tripId, {
        driver_email: driverEmail,
        driver_name: driverName,
        status: "confirmed",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trip"] }),
  });

  const refreshUpdates = () => {
    queryClient.invalidateQueries({ queryKey: ["trip-updates", tripId] });
    queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
  };

  const refreshMessages = () => {
    queryClient.invalidateQueries({ queryKey: ["trip-messages", tripId] });
  };

  if (!trip) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const status = statusConfig[trip.status] || statusConfig.requested;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to={createPageUrl("Trips")} className="inline-flex items-center gap-2 text-sm text-[#6B5B4F]/60 hover:text-[#1B4332] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to trips
      </Link>

      {/* Trip header */}
      <div className="bg-white rounded-3xl border border-[#EDF7F0] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EDF7F0] flex items-center justify-center">
              <PawPrint className="w-7 h-7 text-[#2D6A4F]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#1B4332]">{trip.pet_name}'s Journey</h1>
              <p className="text-sm text-[#6B5B4F]/60">
                {trip.scheduled_date && format(new Date(trip.scheduled_date), "MMMM d, yyyy")}
                {trip.scheduled_time && ` at ${trip.scheduled_time}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${status.bg} border px-4 py-1.5 text-sm font-medium`}>
              {status.label}
            </Badge>
            <Button
              variant="outline"
              onClick={() => setShowChat(!showChat)}
              className="rounded-xl border-[#D8F3DC] text-[#1B4332] gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {showChat ? "Updates" : "Messages"}
              {messages.length > 0 && (
                <span className="bg-[#1B4332] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {messages.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Route info */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-[#52B788] mt-1.5 shrink-0" />
              <div>
                <p className="text-xs text-[#6B5B4F]/50 uppercase tracking-wider">Pickup</p>
                <p className="text-sm font-medium text-[#1B4332]">{trip.pickup_location}</p>
              </div>
            </div>
            <div className="ml-1.5 border-l-2 border-dashed border-[#D8F3DC] h-4" />
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-[#1B4332] mt-1.5 shrink-0" />
              <div>
                <p className="text-xs text-[#6B5B4F]/50 uppercase tracking-wider">Drop-off</p>
                <p className="text-sm font-medium text-[#1B4332]">{trip.dropoff_location}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {trip.driver_name && (
              <div className="flex items-center gap-3 bg-[#EDF7F0] rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-[#D8F3DC] flex items-center justify-center">
                  <User className="w-4 h-4 text-[#2D6A4F]" />
                </div>
                <div>
                  <p className="text-xs text-[#6B5B4F]/50">Driver</p>
                  <p className="text-sm font-medium text-[#1B4332]">{trip.driver_name}</p>
                </div>
              </div>
            )}
            {trip.notes && (
              <div className="bg-[#FEFAE0] rounded-xl p-3">
                <p className="text-xs text-amber-700 font-medium mb-1">Notes</p>
                <p className="text-sm text-[#6B5B4F]">{trip.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Admin: assign driver */}
        {isAdmin && trip.status === "requested" && (
          <div className="bg-[#EDF7F0] rounded-2xl p-5 mb-6">
            <h4 className="font-semibold text-[#1B4332] text-sm mb-3">Assign a Driver</h4>
            <Select
              onValueChange={(driverId) => {
                const driver = drivers.find(d => d.id === driverId);
                if (driver) {
                  assignMutation.mutate({
                    driverId: driver.id,
                    driverName: driver.full_name || driver.email,
                    driverEmail: driver.email,
                  });
                }
              }}
            >
              <SelectTrigger className="bg-white rounded-xl border-[#D8F3DC]">
                <SelectValue placeholder="Select a driver..." />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.full_name || d.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Map — always visible (live tracking when active, planned route otherwise) */}
      {trip.status !== "cancelled" && (
        <LiveTrackingMap trip={trip} isDriver={isDriver} />
      )}

      {/* Payment panel — visible to owner and admin */}
      {!isDriver && (
        <PaymentPanel trip={trip} isAdmin={isAdmin} />
      )}

      {/* Invoice — admin only, completed trips */}
      {isAdmin && trip.status === "completed" && (
        <InvoicePanel trip={trip} />
      )}

      {/* Health Log Form — driver only, active trips */}
      {isDriver && ["confirmed", "in_progress"].includes(trip.status) && (
        <HealthLogForm trip={trip} />
      )}

      {/* Health Log Viewer — owner & admin */}
      {!isDriver && (
        <HealthLogViewer tripId={tripId} />
      )}

      {/* Content area: updates or chat */}
      <div className="bg-white rounded-3xl border border-[#EDF7F0] overflow-hidden">
        {showChat ? (
          <div className="h-[500px]">
            <ChatWindow
              tripId={tripId}
              currentUser={user}
              messages={messages}
              onNewMessage={refreshMessages}
            />
          </div>
        ) : (
          <div className="p-6 md:p-8 space-y-6">
            <h3 className="font-bold text-[#1B4332] text-lg">Journey Updates</h3>
            {isDriver && ["confirmed", "in_progress"].includes(trip.status) && (
              <DriverUpdateForm
                tripId={tripId}
                driverEmail={user.email}
                onUpdate={refreshUpdates}
              />
            )}
            {updates.length === 0 && trip.status === "requested" ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
                  <Truck className="w-6 h-6 text-amber-500" />
                </div>
                <p className="font-medium text-[#1B4332] text-sm">Awaiting Confirmation</p>
                <p className="text-xs text-[#6B5B4F]/60 mt-1 max-w-xs mx-auto">
                  We're reviewing your request. Updates will appear here once your ride is confirmed.
                </p>
              </div>
            ) : (
               <StatusTimeline trip={trip} updates={updates} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}