import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2 } from "lucide-react";

const updateTypes = [
  { value: "pickup_completed", label: "🚗 Pickup Completed" },
  { value: "en_route", label: "🛣️ En Route" },
  { value: "potty_break", label: "🌳 Potty Break" },
  { value: "rest_stop", label: "☕ Rest Stop" },
  { value: "feeding", label: "🍖 Feeding" },
  { value: "near_destination", label: "📍 Near Destination" },
  { value: "final_delivery", label: "✅ Final Delivery" },
];

export default function DriverUpdateForm({ tripId, driverEmail, onUpdate }) {
  const [updateType, setUpdateType] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!updateType) return;
    setSaving(true);
    await base44.entities.TripUpdate.create({
      trip_id: tripId,
      driver_email: driverEmail,
      update_type: updateType,
      message: message || undefined,
    });

    if (updateType === "final_delivery") {
      await base44.entities.Trip.update(tripId, { status: "completed" });
    } else if (updateType === "pickup_completed" || updateType === "en_route") {
      await base44.entities.Trip.update(tripId, { status: "in_progress" });
    }

    setUpdateType("");
    setMessage("");
    setSaving(false);
    onUpdate?.();
  };

  return (
    <div className="bg-[#EDF7F0] rounded-2xl p-5 space-y-4">
      <h4 className="font-semibold text-[#1B4332] text-sm">Post Status Update</h4>
      <Select value={updateType} onValueChange={setUpdateType}>
        <SelectTrigger className="bg-white border-[#D8F3DC] rounded-xl">
          <SelectValue placeholder="Select update type..." />
        </SelectTrigger>
        <SelectContent>
          {updateTypes.map((t) => (
            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Add a note (optional)..."
        className="bg-white border-[#D8F3DC] rounded-xl resize-none"
        rows={2}
      />
      <Button
        onClick={handleSubmit}
        disabled={!updateType || saving}
        className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl"
      >
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
        Post Update
      </Button>
    </div>
  );
}