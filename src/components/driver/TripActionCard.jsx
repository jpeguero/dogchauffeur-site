import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, CheckCircle2, Loader2, Navigation, PawPrint, Package } from "lucide-react";
import { toast } from "sonner";

const ACTIONS = {
  confirmed: { label: "Start Ride → En Route", next: "in_progress", sms: "en_route", color: "bg-blue-600 hover:bg-blue-700", icon: Navigation },
  in_progress: { label: "Pet Picked Up", next: "in_progress", sms: "pet_picked_up", color: "bg-amber-500 hover:bg-amber-600", icon: PawPrint },
  picked_up: { label: "Mark Delivered ✓", next: "completed", sms: "pet_delivered", color: "bg-[#1B4332] hover:bg-[#2D6A4F]", icon: CheckCircle2 },
};

const STATUS_COLORS = {
  requested: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function TripActionCard({ trip, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(trip.driver_action_status || trip.status);

  // driver_action_status tracks sub-steps: confirmed → in_progress → picked_up → completed
  const action = ACTIONS[localStatus];

  const handleAction = async () => {
    setLoading(true);
    try {
      const nextActionStatus = localStatus === "confirmed" ? "in_progress"
        : localStatus === "in_progress" ? "picked_up"
        : "completed";

      const tripUpdate = { status: action.next };

      await base44.entities.Trip.update(trip.id, tripUpdate);

      // Send SMS if owner has a phone (stored in notes or we use a dedicated field)
      if (trip.owner_phone) {
        await base44.functions.invoke("sendSMS", {
          phone: trip.owner_phone,
          pet_name: trip.pet_name || "your pet",
          event_type: action.sms,
          driver_name: trip.driver_name,
          dropoff_address: trip.dropoff_location,
          trip_id: trip.id,
        });
      }

      // Log a TripUpdate record
      await base44.entities.TripUpdate.create({
        trip_id: trip.id,
        driver_email: trip.driver_email,
        update_type: action.sms === "en_route" ? "en_route"
          : action.sms === "pet_picked_up" ? "pickup_completed"
          : "final_delivery",
        message: action.sms === "en_route" ? "Driver is on the way"
          : action.sms === "pet_picked_up" ? "Pet has been picked up"
          : "Pet delivered successfully",
      });

      setLocalStatus(nextActionStatus);
      toast.success(action.label + " — SMS sent!");
      onUpdated?.();
    } catch (e) {
      toast.error("Update failed: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDF7F0] p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-[#1B4332] text-lg">{trip.pet_name || "Pet"}</p>
          <p className="text-xs text-[#6B5B4F]/60">{trip.scheduled_date} {trip.scheduled_time && `· ${trip.scheduled_time}`}</p>
        </div>
        <Badge className={STATUS_COLORS[trip.status] || "bg-gray-100 text-gray-700"}>
          {trip.status?.replace("_", " ")}
        </Badge>
      </div>

      {/* Route */}
      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2 text-[#6B5B4F]">
          <div className="w-2 h-2 rounded-full bg-[#52B788] mt-1.5 flex-shrink-0" />
          <span>{trip.pickup_location}</span>
        </div>
        <div className="flex items-start gap-2 text-[#6B5B4F]">
          <MapPin className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
          <span>{trip.dropoff_location}</span>
        </div>
      </div>

      {trip.notes && (
        <p className="text-xs bg-amber-50 text-amber-800 rounded-lg px-3 py-2 border border-amber-100">
          📋 {trip.notes}
        </p>
      )}

      {/* Action Button */}
      {action && localStatus !== "completed" ? (
        <Button
          onClick={handleAction}
          disabled={loading}
          className={`w-full text-white font-semibold rounded-xl h-12 text-base ${action.color}`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <action.icon className="w-4 h-4 mr-2" />}
          {loading ? "Updating…" : action.label}
        </Button>
      ) : localStatus === "completed" ? (
        <div className="flex items-center justify-center gap-2 bg-green-50 rounded-xl py-3 border border-green-100">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-700 font-semibold text-sm">Ride Completed</span>
        </div>
      ) : null}

      {!trip.owner_phone && action && (
        <p className="text-xs text-amber-600 text-center">⚠️ No owner phone — SMS will be skipped</p>
      )}
    </div>
  );
}