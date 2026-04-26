import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, X } from "lucide-react";
import { format } from "date-fns";

export default function TripMileagePrompt({ trip, onSaved, onDismiss }) {
  const [form, setForm] = useState({ business_miles: "", tolls: "", parking: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.TripMileageLog.create({
      trip_id: trip.id,
      driver_email: trip.driver_email,
      date: trip.scheduled_date || format(new Date(), "yyyy-MM-dd"),
      business_miles: Number(form.business_miles) || 0,
      tolls: Number(form.tolls) || 0,
      parking: Number(form.parking) || 0,
      notes: form.notes,
      pet_name: trip.pet_name,
      pickup_location: trip.pickup_location,
      dropoff_location: trip.dropoff_location,
      amount_earned: trip.price || 0,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => onSaved?.(), 1500);
  };

  if (saved) {
    return (
      <div className="bg-[#EDF7F0] border border-[#52B788] rounded-2xl p-5 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#40916C]" />
        <p className="text-sm font-semibold text-[#1B4332]">Trip log saved!</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#D8F3DC] rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-[#1B4332] px-5 py-3 flex items-center justify-between">
        <span className="text-sm font-bold text-white">📋 Log Trip Details for Tax Records</span>
        <button onClick={onDismiss} className="text-white/60 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 space-y-4">
        <div className="bg-[#F9F7F3] rounded-xl p-3 text-xs text-[#6B5B4F] space-y-1">
          <p><strong>{trip.pet_name}</strong></p>
          <p>📍 {trip.pickup_location} → {trip.dropoff_location}</p>
          {trip.price && <p>💵 Earned: ${trip.price.toFixed(2)}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-[#1B4332] font-semibold">Business Miles</Label>
            <Input type="number" min="0" step="0.1" value={form.business_miles}
              onChange={e => set("business_miles", e.target.value)}
              placeholder="0" className="rounded-xl border-[#D8F3DC] h-10 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-[#1B4332] font-semibold">Tolls ($)</Label>
            <Input type="number" min="0" step="0.01" value={form.tolls}
              onChange={e => set("tolls", e.target.value)}
              placeholder="0.00" className="rounded-xl border-[#D8F3DC] h-10 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-[#1B4332] font-semibold">Parking ($)</Label>
            <Input type="number" min="0" step="0.01" value={form.parking}
              onChange={e => set("parking", e.target.value)}
              placeholder="0.00" className="rounded-xl border-[#D8F3DC] h-10 text-sm" />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-[#1B4332] font-semibold">Notes (optional)</Label>
          <Textarea value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder="Any notes for this trip..." rows={2}
            className="rounded-xl border-[#D8F3DC] text-sm resize-none" />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}
            className="flex-1 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl h-10 text-sm font-semibold">
            {saving ? "Saving…" : "Save Trip Log"}
          </Button>
          <Button onClick={onDismiss} variant="ghost"
            className="text-[#6B5B4F] rounded-xl h-10 text-sm">
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}