import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { Trash2, Image } from "lucide-react";
import EarningsSummary from "@/components/contractor/EarningsSummary";
import ExpenseForm from "@/components/contractor/ExpenseForm";
import ExportTools from "@/components/contractor/ExportTools";

const CATEGORY_LABELS = {
  fuel: "⛽ Fuel", tolls: "🛣️ Tolls", parking: "🅿️ Parking",
  cleaning_supplies: "🧹 Cleaning", pet_equipment: "🐾 Pet Equipment",
  insurance: "🛡️ Insurance", phone_software: "📱 Phone/Software",
  maintenance: "🔧 Maintenance", other: "📦 Other",
};

export default function ContractorDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: mileageLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ["mileage-logs", user?.email],
    queryFn: () => base44.entities.TripMileageLog.filter({ driver_email: user.email }, "-date", 200),
    enabled: !!user,
  });

  const { data: expenses = [], refetch: refetchExpenses } = useQuery({
    queryKey: ["contractor-expenses", user?.email],
    queryFn: () => base44.entities.ContractorExpense.filter({ driver_email: user.email }, "-date", 200),
    enabled: !!user,
  });

  if (!user) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-[#1B4332]">Earnings & Expenses</h1>
        <p className="text-sm text-[#6B5B4F]/70 mt-1">Contractor tax & business tracking</p>
      </div>

      <EarningsSummary mileageLogs={mileageLogs} expenses={expenses} />

      <Tabs defaultValue="trips">
        <TabsList className="w-full rounded-xl bg-[#EDF7F0]">
          <TabsTrigger value="trips" className="flex-1 rounded-lg text-xs">Trip Log</TabsTrigger>
          <TabsTrigger value="expenses" className="flex-1 rounded-lg text-xs">Expenses</TabsTrigger>
          <TabsTrigger value="export" className="flex-1 rounded-lg text-xs">Export</TabsTrigger>
        </TabsList>

        {/* Trip Log Tab */}
        <TabsContent value="trips" className="mt-4 space-y-3">
          {mileageLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#EDF7F0] p-8 text-center text-sm text-[#6B5B4F]/60">
              No trips logged yet. Logs are created when you complete rides.
            </div>
          ) : (
            mileageLogs.map(log => (
              <div key={log.id} className="bg-white rounded-2xl border border-[#EDF7F0] p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm text-[#1B4332]">{log.pet_name || "Trip"}</p>
                    <p className="text-xs text-[#6B5B4F]">{log.date ? format(parseISO(log.date), "MMM d, yyyy") : ""}</p>
                  </div>
                  <span className="text-base font-bold text-[#1B4332]">${(log.amount_earned || 0).toFixed(2)}</span>
                </div>
                <div className="text-xs text-[#6B5B4F] space-y-0.5">
                  <p>📍 {log.pickup_location} → {log.dropoff_location}</p>
                  <div className="flex gap-3 pt-1">
                    {log.business_miles > 0 && <span className="bg-[#EDF7F0] rounded-lg px-2 py-0.5">🛣️ {log.business_miles} mi</span>}
                    {log.tolls > 0 && <span className="bg-amber-50 rounded-lg px-2 py-0.5">Tolls ${log.tolls}</span>}
                    {log.parking > 0 && <span className="bg-blue-50 rounded-lg px-2 py-0.5">Parking ${log.parking}</span>}
                  </div>
                  {log.notes && <p className="text-[#6B5B4F]/60 pt-1">{log.notes}</p>}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="mt-4 space-y-4">
          <ExpenseForm driverEmail={user.email} onSaved={refetchExpenses} />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#1B4332]">Recent Expenses</h3>
            {expenses.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#EDF7F0] p-6 text-center text-sm text-[#6B5B4F]/60">
                No expenses logged yet.
              </div>
            ) : (
              expenses.slice(0, 30).map(exp => (
                <div key={exp.id} className="bg-white rounded-2xl border border-[#EDF7F0] px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1B4332]">{CATEGORY_LABELS[exp.category] || exp.category}</p>
                    <p className="text-xs text-[#6B5B4F]">{exp.date ? format(parseISO(exp.date), "MMM d, yyyy") : ""}{exp.notes ? ` · ${exp.notes}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {exp.receipt_url && (
                      <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer">
                        <Image className="w-4 h-4 text-[#52B788]" />
                      </a>
                    )}
                    <span className="font-bold text-sm text-[#1B4332]">${exp.amount.toFixed(2)}</span>
                    <button onClick={async () => { await base44.entities.ContractorExpense.delete(exp.id); refetchExpenses(); }}
                      className="text-[#6B5B4F]/40 hover:text-red-400 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="mt-4">
          <ExportTools mileageLogs={mileageLogs} expenses={expenses} />
        </TabsContent>
      </Tabs>
    </div>
  );
}