import React from "react";
import { DollarSign, TrendingUp, Calendar, Route } from "lucide-react";
import { startOfWeek, startOfMonth, startOfYear, isAfter, parseISO } from "date-fns";

function StatCard({ icon: Icon, label, value, sub, color = "bg-[#EDF7F0]" }) {
  return (
    <div className={`${color} rounded-2xl p-4 flex flex-col gap-1`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-[#2D6A4F]" />
        <span className="text-xs font-semibold text-[#6B5B4F] uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[#1B4332]">{value}</p>
      {sub && <p className="text-xs text-[#6B5B4F]/70">{sub}</p>}
    </div>
  );
}

export default function EarningsSummary({ mileageLogs, expenses }) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const sum = (logs, from) =>
    logs
      .filter(l => l.date && isAfter(parseISO(l.date), from))
      .reduce((acc, l) => acc + (l.amount_earned || 0), 0);

  const sumExpenses = (exps, from) =>
    exps
      .filter(e => e.date && isAfter(parseISO(e.date), from))
      .reduce((acc, e) => acc + (e.amount || 0), 0);

  const totalMiles = (logs, from) =>
    logs
      .filter(l => l.date && isAfter(parseISO(l.date), from))
      .reduce((acc, l) => acc + (l.business_miles || 0), 0);

  const weeklyEarnings = sum(mileageLogs, weekStart);
  const monthlyEarnings = sum(mileageLogs, monthStart);
  const ytdEarnings = sum(mileageLogs, yearStart);
  const monthlyExpenses = sumExpenses(expenses, monthStart);
  const monthlyMiles = totalMiles(mileageLogs, monthStart);
  const ytdMiles = totalMiles(mileageLogs, yearStart);

  // IRS standard mileage rate 2024
  const mileageDeduction = (ytdMiles * 0.67).toFixed(2);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={DollarSign} label="This Week" value={`$${weeklyEarnings.toFixed(2)}`} />
        <StatCard icon={Calendar} label="This Month" value={`$${monthlyEarnings.toFixed(2)}`} />
        <StatCard icon={TrendingUp} label="Year to Date" value={`$${ytdEarnings.toFixed(2)}`} color="bg-[#D8F3DC]" />
        <StatCard icon={DollarSign} label="Monthly Expenses" value={`$${monthlyExpenses.toFixed(2)}`} color="bg-amber-50" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Route} label="Miles (Month)" value={monthlyMiles.toFixed(1)} sub="business miles" />
        <StatCard icon={Route} label="YTD Mileage Deduction" value={`$${mileageDeduction}`} sub={`${ytdMiles.toFixed(1)} mi × $0.67`} color="bg-blue-50" />
      </div>
    </div>
  );
}