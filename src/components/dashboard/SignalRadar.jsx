import React from "react";
import { Radio, UserPlus, AlertTriangle, TrendingUp } from "lucide-react";

function signal(icon, label, value, color, bg) {
  return { icon, label, value, color, bg };
}

export default function SignalRadar({ leads }) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const todayLeads = leads.filter(l => new Date(l.created_date) >= startOfToday);
  const weekLeads  = leads.filter(l => new Date(l.created_date) >= startOfWeek);
  const urgentToday = todayLeads.filter(l => l.urgency === "Today");

  const signals = [
    signal(Radio,        "Estimator Uses Today",    todayLeads.length, "text-blue-600",   "bg-blue-50 border-blue-100"),
    signal(UserPlus,     "Leads Captured Today",    todayLeads.length, "text-[#2D6A4F]",  "bg-[#EDF7F0] border-[#D8F3DC]"),
    signal(AlertTriangle,"Urgent Requests",         urgentToday.length,"text-red-600",    "bg-red-50 border-red-100"),
    signal(TrendingUp,   "Total Signals This Week", weekLeads.length,  "text-purple-600", "bg-purple-50 border-purple-100"),
  ];

  return (
    <div className="bg-white border border-[#EDF7F0] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-5 h-5 text-[#2D6A4F]" />
        <h2 className="text-base font-bold text-[#1B4332] tracking-tight">Signal Radar</h2>
        <span className="text-xs text-[#6B5B4F]/50 ml-1">— today's activity at a glance</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {signals.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`flex flex-col gap-2 rounded-xl border p-4 ${bg}`}>
            <Icon className={`w-5 h-5 ${color}`} />
            <span className={`text-3xl font-extrabold ${color}`}>{value}</span>
            <span className="text-xs text-[#6B5B4F] font-medium leading-snug">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}