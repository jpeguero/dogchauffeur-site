import React from "react";
import { Building2, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function AdminReferrals() {
  const { data: partnerBookings = [] } = useQuery({
    queryKey: ["partner-bookings"],
    queryFn: () => base44.entities.Booking.filter({ referral_source: "partner" }, "-created_date"),
  });

  const { data: customerReferralBookings = [] } = useQuery({
    queryKey: ["customer-referral-bookings"],
    queryFn: () => base44.entities.Booking.filter({ referral_source: "customer" }, "-created_date"),
  });

  const { data: shareleads = [] } = useQuery({
    queryKey: ["share-leads"],
    queryFn: () => base44.entities.Lead.filter({ lead_source: "referral_share" }, "-created_date"),
  });

  const partnerCounts = partnerBookings.reduce((acc, b) => {
    const key = b.partner_name || b.partner_type || "Unknown Partner";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const customerCounts = customerReferralBookings.reduce((acc, b) => {
    const key = b.referrer_id || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {/* Share Link Visitors */}
      <div className="bg-white rounded-2xl border border-[#EDF7F0] p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🔗</span>
          <h3 className="font-bold text-[#1B4332] text-sm">Share Link Visits</h3>
        </div>
        <p className="text-3xl font-bold text-[#1B4332]">{shareleads.length}</p>
        <p className="text-xs text-[#6B5B4F]/60 mt-1">From referral_share links</p>
      </div>

      {/* Customer Referrals */}
      <div className="bg-white rounded-2xl border border-[#EDF7F0] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-[#2D6A4F]" />
          <h3 className="font-bold text-[#1B4332] text-sm">Customer Referrals</h3>
        </div>
        <p className="text-3xl font-bold text-[#1B4332]">{customerReferralBookings.length}</p>
        {Object.entries(customerCounts).slice(0, 3).map(([id, count]) => (
          <div key={id} className="flex items-center justify-between text-xs mt-1.5">
            <span className="text-[#6B5B4F] truncate max-w-[130px] font-mono">ref: {id}</span>
            <span className="font-semibold text-[#1B4332] bg-[#EDF7F0] px-2 py-0.5 rounded-full">{count}</span>
          </div>
        ))}
      </div>

      {/* Partner Referrals */}
      <div className="bg-white rounded-2xl border border-[#EDF7F0] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-[#2D6A4F]" />
          <h3 className="font-bold text-[#1B4332] text-sm">Partner Referrals</h3>
        </div>
        <p className="text-3xl font-bold text-[#1B4332]">{partnerBookings.length}</p>
        {Object.entries(partnerCounts).slice(0, 3).map(([type, count]) => (
          <div key={type} className="flex items-center justify-between text-xs mt-1.5">
            <span className="text-[#6B5B4F]">{type}</span>
            <span className="font-semibold text-[#1B4332] bg-[#EDF7F0] px-2 py-0.5 rounded-full">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}