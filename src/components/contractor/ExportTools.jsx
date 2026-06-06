import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { base44 } from "@/api/base44Client";

function toCSV(rows, headers) {
  const lines = [headers.join(",")];
  rows.forEach(r => lines.push(r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")));
  return lines.join("\n");
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ExportTools({ mileageLogs, expenses }) {
  const [generating, setGenerating] = useState(null);
  const now = new Date();
  const monthLabel = format(now, "MMMM yyyy");

  const exportMileageCSV = () => {
    const headers = ["Date", "Pet", "Pickup", "Drop-off", "Miles", "Tolls", "Parking", "Earned", "Notes"];
    const rows = mileageLogs.map(l => [
      l.date, l.pet_name, l.pickup_location, l.dropoff_location,
      l.business_miles, l.tolls, l.parking, l.amount_earned, l.notes
    ]);
    downloadBlob(toCSV(rows, headers), `mileage-log-${format(now, "yyyy-MM")}.csv`, "text/csv");
  };

  const exportExpensesCSV = () => {
    const headers = ["Date", "Category", "Amount", "Notes"];
    const rows = expenses.map(e => [e.date, e.category, e.amount, e.notes]);
    downloadBlob(toCSV(rows, headers), `expenses-${format(now, "yyyy-MM")}.csv`, "text/csv");
  };

  const exportMonthlyReport = async () => {
    setGenerating("report");
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthlyLogs = mileageLogs.filter(l => l.date && isWithinInterval(parseISO(l.date), { start: monthStart, end: monthEnd }));
    const monthlyExp = expenses.filter(e => e.date && isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd }));

    const totalEarned = monthlyLogs.reduce((a, l) => a + (l.amount_earned || 0), 0);
    const totalMiles = monthlyLogs.reduce((a, l) => a + (l.business_miles || 0), 0);
    const totalTolls = monthlyLogs.reduce((a, l) => a + (l.tolls || 0), 0);
    const totalParking = monthlyLogs.reduce((a, l) => a + (l.parking || 0), 0);
    const totalExpenses = monthlyExp.reduce((a, e) => a + (e.amount || 0), 0);
    const mileageDeduction = (totalMiles * 0.67).toFixed(2);

    const expByCategory = {};
    monthlyExp.forEach(e => {
      expByCategory[e.category] = (expByCategory[e.category] || 0) + e.amount;
    });

    const prompt = `
Create a clean monthly income & expense summary report for a self-employed pet transportation contractor.

Month: ${monthLabel}
Company: Pawffeur

INCOME:
- Total Earnings: $${totalEarned.toFixed(2)}
- Rides Completed: ${monthlyLogs.length}

MILEAGE:
- Business Miles: ${totalMiles.toFixed(1)}
- IRS Mileage Deduction (@ $0.67/mi): $${mileageDeduction}
- Trip Tolls: $${totalTolls.toFixed(2)}
- Trip Parking: $${totalParking.toFixed(2)}

EXPENSES BY CATEGORY:
${Object.entries(expByCategory).map(([k, v]) => `- ${k}: $${v.toFixed(2)}`).join("\n")}
- Total Expenses: $${totalExpenses.toFixed(2)}

NET INCOME (before mileage deduction): $${(totalEarned - totalExpenses).toFixed(2)}
NET INCOME (after mileage deduction): $${(totalEarned - totalExpenses - parseFloat(mileageDeduction)).toFixed(2)}

Format this as a clean, professional plain-text summary report. Include a disclaimer that this is for informational purposes and they should consult a tax professional.
    `;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    downloadBlob(result, `monthly-report-${format(now, "yyyy-MM")}.txt`, "text/plain");
    setGenerating(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EDF7F0] p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Download className="w-4 h-4 text-[#2D6A4F]" />
        <h3 className="font-bold text-[#1B4332]">Export</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={exportMileageCSV}
          className="rounded-xl border-[#D8F3DC] text-[#1B4332] text-xs h-10 hover:bg-[#EDF7F0]">
          📍 Mileage Log CSV
        </Button>
        <Button variant="outline" size="sm" onClick={exportExpensesCSV}
          className="rounded-xl border-[#D8F3DC] text-[#1B4332] text-xs h-10 hover:bg-[#EDF7F0]">
          💳 Expense Report CSV
        </Button>
        <Button variant="outline" size="sm"
          onClick={() => {
            const allCSV = toCSV(
              mileageLogs.map(l => [l.date, l.pet_name, l.pickup_location, l.dropoff_location, l.business_miles, l.amount_earned]),
              ["Date", "Pet", "Pickup", "Drop-off", "Miles", "Earned"]
            );
            downloadBlob(allCSV, `all-trips-${format(new Date(), "yyyy")}.csv`, "text/csv");
          }}
          className="rounded-xl border-[#D8F3DC] text-[#1B4332] text-xs h-10 hover:bg-[#EDF7F0]">
          📋 All Trips CSV
        </Button>
        <Button variant="outline" size="sm" onClick={exportMonthlyReport}
          disabled={generating === "report"}
          className="rounded-xl border-[#D8F3DC] text-[#1B4332] text-xs h-10 hover:bg-[#EDF7F0]">
          {generating === "report"
            ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Generating…</>
            : <><FileText className="w-3 h-3 mr-1" />{monthLabel} Report</>
          }
        </Button>
      </div>
      <p className="text-xs text-[#6B5B4F]/50">Reports are generated from your logged data. Consult a tax professional for filing.</p>
    </div>
  );
}