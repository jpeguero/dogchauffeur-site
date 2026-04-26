import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { DollarSign, TrendingUp, MapPin, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const GREENS = ["#1B4332", "#2D6A4F", "#40916C", "#52B788", "#74C69D", "#95D5B2", "#B7E4C7"];
const HEAVY_SURCHARGE = 15;
const BASE_FEE = 25;
const RATE_PER_MILE = 2.5;

// Extract zip codes from an address string
function extractZip(address = "") {
  const match = address.match(/\b(6\d{4})\b/);
  return match ? match[1] : "Unknown";
}

function StatCard({ icon: Icon, label, value, sub, color = "bg-[#1B4332]" }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EDF7F0] p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm text-[#6B5B4F] font-medium">{label}</span>
      </div>
      <p className="text-2xl font-extrabold text-[#1B4332]">{value}</p>
      {sub && <p className="text-xs text-[#6B5B4F]/60 mt-1">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#D8F3DC] rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-bold text-[#1B4332] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === "number" ? (p.name?.includes("$") || p.name?.toLowerCase().includes("earn") || p.name?.toLowerCase().includes("revenue") ? `$${p.value.toFixed(2)}` : p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function RevenueAnalytics() {
  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["analytics-trips"],
    queryFn: () => base44.entities.Trip.filter({ status: "completed" }, "-scheduled_date", 200),
  });

  const { data: pets = [] } = useQuery({
    queryKey: ["analytics-pets"],
    queryFn: () => base44.entities.Pet.list("-created_date", 500),
  });

  const petWeightMap = useMemo(() => {
    const m = {};
    pets.forEach(p => { m[p.id] = p.weight || 0; });
    return m;
  }, [pets]);

  // ── Derived analytics ────────────────────────────────────────────────────
  const { epmData, surchargeData, zipData, stats } = useMemo(() => {
    if (!trips.length) return { epmData: [], surchargeData: [], zipData: [], stats: {} };

    let totalRevenue = 0, totalMiles = 0, heavyCount = 0, standardCount = 0;
    let heavyRevenue = 0, standardRevenue = 0;
    const zipCounts = {};
    const monthlyMap = {};

    trips.forEach(trip => {
      const price = trip.price || 0;
      const miles = trip.estimated_miles || 0;
      const weight = petWeightMap[trip.pet_id] || 0;
      const isHeavy = weight > 75;

      totalRevenue += price;
      totalMiles += miles;

      if (isHeavy) {
        heavyCount++;
        heavyRevenue += price;
      } else {
        standardCount++;
        standardRevenue += price;
      }

      // Zip code from pickup
      const zip = extractZip(trip.pickup_location);
      zipCounts[zip] = (zipCounts[zip] || 0) + 1;

      // Earnings per mile — group by month
      const month = trip.scheduled_date
        ? trip.scheduled_date.slice(0, 7)
        : "Unknown";
      if (!monthlyMap[month]) monthlyMap[month] = { revenue: 0, miles: 0, trips: 0 };
      monthlyMap[month].revenue += price;
      monthlyMap[month].miles += miles;
      monthlyMap[month].trips += 1;
    });

    // Earnings per mile by month
    const epmData = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d]) => ({
        month: month.slice(5) + "/" + month.slice(2, 4), // MM/YY
        "Earnings/Mile": d.miles > 0 ? parseFloat((d.revenue / d.miles).toFixed(2)) : 0,
        Revenue: parseFloat(d.revenue.toFixed(2)),
        Trips: d.trips,
      }));

    // Surcharge breakdown
    const surchargeData = [
      { name: "Standard Transport", value: parseFloat(standardRevenue.toFixed(2)), count: standardCount },
      { name: "Heavy Pet (+$15)", value: parseFloat(heavyRevenue.toFixed(2)), count: heavyCount },
    ];

    // Top zip codes (sorted by bookings)
    const zipData = Object.entries(zipCounts)
      .filter(([zip]) => zip !== "Unknown")
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12)
      .map(([zip, count], i) => ({
        zip,
        Bookings: count,
        fill: GREENS[i % GREENS.length],
      }));

    const avgEpm = totalMiles > 0 ? (totalRevenue / totalMiles).toFixed(2) : "0.00";

    return {
      epmData,
      surchargeData,
      zipData,
      stats: {
        totalRevenue: totalRevenue.toFixed(2),
        avgEpm,
        heavyPct: trips.length ? ((heavyCount / trips.length) * 100).toFixed(0) : 0,
        totalTrips: trips.length,
      },
    };
  }, [trips, petWeightMap]);

  if (tripsLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const PIE_COLORS = ["#1B4332", "#74C69D"];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1B4332]">Revenue Analytics</h1>
        <p className="text-sm text-[#6B5B4F]/60 mt-1">Based on {stats.totalTrips} completed trips</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${stats.totalRevenue}`} sub="All completed trips" color="bg-[#1B4332]" />
        <StatCard icon={TrendingUp} label="Avg Earn / Mile" value={`$${stats.avgEpm}`} sub="Across all trips" color="bg-[#2D6A4F]" />
        <StatCard icon={Zap} label="Heavy Pet Trips" value={`${stats.heavyPct}%`} sub="+$15 surcharge applied" color="bg-[#40916C]" />
        <StatCard icon={MapPin} label="Top Zip" value={zipData[0]?.zip || "—"} sub={`${zipData[0]?.Bookings || 0} bookings`} color="bg-[#52B788]" />
      </div>

      {/* Earnings Per Mile by Month */}
      <div className="bg-white rounded-2xl border border-[#EDF7F0] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#1B4332] mb-1">Earnings Per Mile — Monthly Trend</h2>
        <p className="text-xs text-[#6B5B4F]/60 mb-5">How efficiently each mile is monetized over time</p>
        {epmData.length === 0 ? (
          <p className="text-sm text-center text-[#6B5B4F]/50 py-16">No completed trip data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={epmData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF7F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B5B4F" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B5B4F" }} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="Earnings/Mile"
                stroke="#1B4332"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#1B4332" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Revenue"
                stroke="#74C69D"
                strokeWidth={2}
                dot={{ r: 3, fill: "#74C69D" }}
                strokeDasharray="4 2"
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Surcharge Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#EDF7F0] p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#1B4332] mb-1">Revenue Breakdown</h2>
          <p className="text-xs text-[#6B5B4F]/60 mb-5">Standard vs. Heavy Pet (+$15 surcharge) income</p>
          {surchargeData.every(d => d.value === 0) ? (
            <p className="text-sm text-center text-[#6B5B4F]/50 py-16">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={surchargeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {surchargeData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`$${val.toFixed(2)}`, "Revenue"]} />
                <Legend
                  formatter={(value, entry) => (
                    <span style={{ fontSize: 12, color: "#6B5B4F" }}>
                      {value} ({entry.payload.count} trips)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Surcharge bar comparison */}
        <div className="bg-white rounded-2xl border border-[#EDF7F0] p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#1B4332] mb-1">Trip Count by Type</h2>
          <p className="text-xs text-[#6B5B4F]/60 mb-5">How many trips carry the heavy pet surcharge</p>
          {surchargeData.every(d => d.count === 0) ? (
            <p className="text-sm text-center text-[#6B5B4F]/50 py-16">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={surchargeData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF7F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B5B4F" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B5B4F" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Trips" radius={[8, 8, 0, 0]}>
                  {surchargeData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Zip Code Heatmap */}
      <div className="bg-white rounded-2xl border border-[#EDF7F0] p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#1B4332] mb-1">Booking Density by Zip Code</h2>
        <p className="text-xs text-[#6B5B4F]/60 mb-5">Which neighborhoods generate the most pickups</p>
        {zipData.length === 0 ? (
          <p className="text-sm text-center text-[#6B5B4F]/50 py-16">No zip code data yet — ensure pickup addresses include 5-digit zip codes.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={zipData} margin={{ top: 4, right: 16, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF7F0" />
                <XAxis dataKey="zip" tick={{ fontSize: 11, fill: "#6B5B4F" }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: "#6B5B4F" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Bookings" radius={[8, 8, 0, 0]}>
                  {zipData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend-style grid */}
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {zipData.map((d, i) => (
                <div key={d.zip} className="flex items-center gap-2 text-xs text-[#6B5B4F]">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: d.fill }} />
                  <span className="font-mono">{d.zip}</span>
                  <span className="font-bold text-[#1B4332]">{d.Bookings}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}