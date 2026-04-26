import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Droplets, Clock, Smile, Camera, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const BEHAVIORS = ["Calm", "Anxious", "Vocal", "Sleeping", "Playful"];
const CHECKPOINTS = ["Pickup", "Halfway", "Near Destination", "Delivery"];

export default function HealthLogForm({ trip, onSaved }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    hydration_check: null,
    bathroom_break_taken: false,
    bathroom_break_time: format(new Date(), "HH:mm"),
    bathroom_break_note: "",
    behavior: "",
    checkpoint: "Halfway",
    notes: "",
    photo_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.HealthLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-logs", trip.id] });
      setSaved(true);
      toast.success("Health log saved!");
      onSaved?.();
    },
  });

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, photo_url: file_url }));
    setUploading(false);
    toast.success("Photo uploaded!");
  }

  function handleSubmit() {
    if (!form.behavior) { toast.error("Please select a behavior."); return; }
    mutation.mutate({
      trip_id: trip.id,
      pet_id: trip.pet_id,
      pet_name: trip.pet_name,
      logged_by: trip.driver_email,
      ...form,
    });
  }

  if (saved) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
        <p className="font-bold text-green-800">Health log saved!</p>
        <p className="text-sm text-green-600 mt-1">This log will appear on the owner's trip summary.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#EDF7F0] p-5 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#EDF7F0] flex items-center justify-center">
          <Smile className="w-4 h-4 text-[#2D6A4F]" />
        </div>
        <div>
          <h3 className="font-bold text-[#1B4332] text-sm">Log Pet Vitals</h3>
          <p className="text-xs text-[#6B5B4F]">{trip.pet_name}</p>
        </div>
      </div>

      {/* Checkpoint */}
      <div>
        <p className="text-xs font-semibold text-[#6B5B4F] uppercase tracking-wide mb-2">Checkpoint</p>
        <div className="flex flex-wrap gap-2">
          {CHECKPOINTS.map(c => (
            <button
              key={c}
              onClick={() => setForm(f => ({ ...f, checkpoint: c }))}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                form.checkpoint === c
                  ? "bg-[#1B4332] text-white border-[#1B4332]"
                  : "bg-white text-[#6B5B4F] border-gray-200 hover:border-[#2D6A4F]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Hydration */}
      <div>
        <p className="text-xs font-semibold text-[#6B5B4F] uppercase tracking-wide mb-2 flex items-center gap-1">
          <Droplets className="w-3 h-3" /> Hydration Check
        </p>
        <div className="flex gap-3">
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => setForm(f => ({ ...f, hydration_check: val }))}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                form.hydration_check === val
                  ? val ? "bg-blue-500 text-white border-blue-500" : "bg-red-400 text-white border-red-400"
                  : "bg-white text-[#6B5B4F] border-gray-200"
              }`}
            >
              {val ? "✅ Drank Water" : "❌ Refused Water"}
            </button>
          ))}
        </div>
      </div>

      {/* Bathroom Break */}
      <div>
        <p className="text-xs font-semibold text-[#6B5B4F] uppercase tracking-wide mb-2 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Bathroom Break
        </p>
        <label className="flex items-center gap-2 mb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.bathroom_break_taken}
            onChange={e => setForm(f => ({ ...f, bathroom_break_taken: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm text-[#1B4332] font-medium">Break was taken</span>
        </label>
        {form.bathroom_break_taken && (
          <div className="flex gap-2 mt-1">
            <input
              type="time"
              value={form.bathroom_break_time}
              onChange={e => setForm(f => ({ ...f, bathroom_break_time: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-[#40916C]"
            />
            <input
              type="text"
              placeholder="Quick note (e.g. normal, no issues)"
              value={form.bathroom_break_note}
              onChange={e => setForm(f => ({ ...f, bathroom_break_note: e.target.value }))}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
            />
          </div>
        )}
      </div>

      {/* Behavior */}
      <div>
        <p className="text-xs font-semibold text-[#6B5B4F] uppercase tracking-wide mb-2">Behavior</p>
        <div className="flex flex-wrap gap-2">
          {BEHAVIORS.map(b => (
            <button
              key={b}
              onClick={() => setForm(f => ({ ...f, behavior: b }))}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                form.behavior === b
                  ? "bg-[#40916C] text-white border-[#40916C]"
                  : "bg-white text-[#6B5B4F] border-gray-200 hover:border-[#40916C]"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Photo Upload */}
      <div>
        <p className="text-xs font-semibold text-[#6B5B4F] uppercase tracking-wide mb-2 flex items-center gap-1">
          <Camera className="w-3 h-3" /> Photo
        </p>
        {form.photo_url ? (
          <div className="relative">
            <img src={form.photo_url} alt="Pet condition" className="w-full h-40 object-cover rounded-xl" />
            <span className="absolute top-2 left-2 bg-black/60 text-white text-xs rounded-full px-2 py-0.5">
              {format(new Date(), "h:mm a · MMM d")}
            </span>
            <button onClick={() => setForm(f => ({ ...f, photo_url: "" }))} className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded-full px-2 py-0.5">Remove</button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 w-full h-28 border-2 border-dashed border-[#D8F3DC] rounded-xl cursor-pointer hover:bg-[#EDF7F0] transition-colors">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin text-[#2D6A4F]" /> : <><Camera className="w-5 h-5 text-[#2D6A4F]" /><span className="text-sm text-[#6B5B4F]">Tap to add photo</span></>}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
          </label>
        )}
      </div>

      {/* Notes */}
      <textarea
        placeholder="Additional notes (optional)..."
        value={form.notes}
        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        rows={2}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C] resize-none"
      />

      <Button
        onClick={handleSubmit}
        disabled={mutation.isPending}
        className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl h-11 font-bold"
      >
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Health Log"}
      </Button>
    </div>
  );
}