import React, { useState } from "react";
import { UserPlus, Phone, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const URGENCY_STYLE = {
  "Today": "bg-red-100 text-red-700",
  "Within 3 days": "bg-orange-100 text-orange-700",
  "Within a week": "bg-yellow-100 text-yellow-700",
  "Just researching": "bg-gray-100 text-gray-600",
};

const SOURCE_STYLE = {
  "price_estimator": "bg-blue-100 text-blue-700",
  "referral_share": "bg-purple-100 text-purple-700",
  "partner": "bg-green-100 text-green-700",
  "direct": "bg-gray-100 text-gray-600",
};

export default function AdminLeadsTable() {
  const [expanded, setExpanded] = useState(true);

  const { data: leads = [] } = useQuery({
    queryKey: ["all-leads-admin"],
    queryFn: () => base44.entities.Lead.list("-created_date", 50),
  });

  return (
    <div className="bg-white rounded-2xl border border-[#EDF7F0] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F9F7F3] transition"
      >
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#2D6A4F]" />
          <h2 className="text-base font-bold text-[#1B4332]">All Leads</h2>
          <span className="bg-[#EDF7F0] text-[#1B4332] text-xs font-semibold px-2.5 py-0.5 rounded-full">{leads.length}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-[#6B5B4F]" /> : <ChevronDown className="w-4 h-4 text-[#6B5B4F]" />}
      </button>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#EDF7F0]">
              <tr>
                <th className="text-left px-4 py-3 text-[#1B4332] font-semibold text-xs uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-[#1B4332] font-semibold text-xs uppercase tracking-wide hidden sm:table-cell">Contact</th>
                <th className="text-left px-4 py-3 text-[#1B4332] font-semibold text-xs uppercase tracking-wide hidden md:table-cell">Source</th>
                <th className="text-left px-4 py-3 text-[#1B4332] font-semibold text-xs uppercase tracking-wide hidden md:table-cell">Service</th>
                <th className="text-left px-4 py-3 text-[#1B4332] font-semibold text-xs uppercase tracking-wide hidden lg:table-cell">Urgency</th>
                <th className="text-right px-4 py-3 text-[#1B4332] font-semibold text-xs uppercase tracking-wide">Estimate</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#6B5B4F]/50 text-sm">No leads yet</td>
                </tr>
              ) : leads.map((lead, i) => (
                <tr key={lead.id} className={i % 2 === 0 ? "bg-white" : "bg-[#F9F7F3]"}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1B4332]">{lead.name || "—"}</p>
                    <p className="text-xs text-[#6B5B4F]/60">{new Date(lead.created_date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-[#2D6A4F] text-xs hover:underline">
                        <Phone className="w-3 h-3" /> {lead.phone}
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-[#6B5B4F] text-xs hover:underline mt-0.5">
                        <Mail className="w-3 h-3" /> {lead.email}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_STYLE[lead.lead_source] || "bg-gray-100 text-gray-600"}`}>
                      {lead.lead_source || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[#6B5B4F] text-xs">{lead.estimate_service || "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {lead.urgency ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${URGENCY_STYLE[lead.urgency] || "bg-gray-100 text-gray-600"}`}>
                        {lead.urgency}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#1B4332]">
                    {lead.estimate_low ? `$${lead.estimate_low}–$${lead.estimate_high}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}