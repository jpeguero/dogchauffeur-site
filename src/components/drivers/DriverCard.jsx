import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Truck, CheckCircle2, Clock, ChevronRight, AlertTriangle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getInsuranceStatus } from "./DriverCompliancePanel";
import { DriverStatusBadge } from "./DriverAvailabilityToggle";

export default function DriverCard({ driver, trips = [], delay = 0 }) {
  const completed = trips.filter((t) => t.status === "completed").length;
  const active = trips.filter((t) => ["confirmed", "in_progress"].includes(t.status)).length;
  const insuranceStatus = getInsuranceStatus(driver);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <Link to={createPageUrl(`DriverProfile?id=${driver.id}`)}>
        <div className="bg-white rounded-2xl border border-[#EDF7F0] p-5 card-hover cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#D8F3DC] flex items-center justify-center text-lg font-bold text-[#1B4332]">
              {(driver.full_name || driver.email)?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#1B4332] truncate">{driver.full_name || "Driver"}</h3>
              <p className="text-xs text-[#6B5B4F]/60 truncate">{driver.email}</p>
              <div className="mt-1">
                <DriverStatusBadge status={driver.availability_status || "offline"} />
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B5B4F]/40 shrink-0" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[#EDF7F0] rounded-xl py-2">
              <div className="text-sm font-bold text-[#1B4332]">{trips.length}</div>
              <div className="text-xs text-[#6B5B4F]/50 flex items-center justify-center gap-0.5 mt-0.5">
                <Truck className="w-3 h-3" /> Total
              </div>
            </div>
            <div className="bg-[#EDF7F0] rounded-xl py-2">
              <div className="text-sm font-bold text-[#2D6A4F]">{completed}</div>
              <div className="text-xs text-[#6B5B4F]/50 flex items-center justify-center gap-0.5 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> Done
              </div>
            </div>
            <div className="bg-[#EDF7F0] rounded-xl py-2">
              <div className="text-sm font-bold text-amber-600">{active}</div>
              <div className="text-xs text-[#6B5B4F]/50 flex items-center justify-center gap-0.5 mt-0.5">
                <Clock className="w-3 h-3" /> Active
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center flex-wrap gap-2">
            {active > 0 && (
              <Badge className="bg-[#D8F3DC] text-[#1B4332] border-[#B7E4C7] border text-xs">
                {active} trip{active > 1 ? "s" : ""} in progress
              </Badge>
            )}
            <Badge className={`border text-xs ${insuranceStatus.color}`}>
              {insuranceStatus.status === "valid" ? <Shield className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
              {insuranceStatus.label}
            </Badge>
          </div>
          {driver.vehicle_type && (
            <p className="text-xs text-[#6B5B4F]/50 mt-2 flex items-center gap-1">
              <Truck className="w-3 h-3" />
              {[driver.vehicle_year, driver.vehicle_make, driver.vehicle_model, driver.vehicle_type].filter(Boolean).join(" ")}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}