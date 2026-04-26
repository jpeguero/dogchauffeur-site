import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { MapPin, Calendar, Clock, ChevronRight, PawPrint } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const statusConfig = {
  requested: { label: "Requested", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "In Transit", bg: "bg-[#D8F3DC] text-[#1B4332] border-[#B7E4C7]" },
  completed: { label: "Completed", bg: "bg-gray-100 text-gray-600 border-gray-200" },
  cancelled: { label: "Cancelled", bg: "bg-red-50 text-red-600 border-red-200" },
};

export default function TripCard({ trip, delay = 0 }) {
  const status = statusConfig[trip.status] || statusConfig.requested;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <Link to={createPageUrl(`TripDetail?id=${trip.id}`)}>
        <div className="bg-white rounded-2xl border border-[#EDF7F0] p-5 card-hover cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EDF7F0] flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-[#2D6A4F]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1B4332]">{trip.pet_name || "Pet"}</h3>
                <p className="text-xs text-[#6B5B4F]/60">
                  {trip.scheduled_date && format(new Date(trip.scheduled_date), "MMM d, yyyy")}
                  {trip.scheduled_time && ` · ${trip.scheduled_time}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Badge className={`${status.bg} border text-xs font-medium`}>{status.label}</Badge>
              {trip.price && (
                <Badge className={`border text-xs font-medium ${
                  trip.payment_status === "paid"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : trip.payment_status === "refunded"
                    ? "bg-gray-100 text-gray-500 border-gray-200"
                    : "bg-red-50 text-red-600 border-red-200"
                }`}>
                  ${trip.price.toFixed(2)} · {trip.payment_status === "paid" ? "Paid" : trip.payment_status === "refunded" ? "Refunded" : "Unpaid"}
                </Badge>
              )}
              <ChevronRight className="w-4 h-4 text-[#6B5B4F]/40" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-[#52B788]" />
              <span className="text-[#6B5B4F]/80 truncate">{trip.pickup_location}</span>
            </div>
            <div className="ml-1 border-l-2 border-dashed border-[#D8F3DC] h-3" />
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-[#1B4332]" />
              <span className="text-[#6B5B4F]/80 truncate">{trip.dropoff_location}</span>
            </div>
          </div>
          {trip.driver_name && (
            <div className="mt-4 pt-3 border-t border-[#EDF7F0] flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#D8F3DC] flex items-center justify-center">
                <span className="text-xs font-medium text-[#2D6A4F]">{trip.driver_name?.[0]}</span>
              </div>
              <span className="text-xs text-[#6B5B4F]/70">Driver: {trip.driver_name}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}