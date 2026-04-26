import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Droplets, Clock, Smile, Camera, ClipboardList } from "lucide-react";
import { format } from "date-fns";

const behaviorEmoji = { Calm: "😌", Anxious: "😰", Vocal: "🗣️", Sleeping: "😴", Playful: "🐾" };

export default function HealthLogViewer({ tripId }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["health-logs", tripId],
    queryFn: () => base44.entities.HealthLog.filter({ trip_id: tripId }),
    enabled: !!tripId,
  });

  if (isLoading) return null;
  if (logs.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#EDF7F0] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="w-5 h-5 text-[#2D6A4F]" />
        <h3 className="font-bold text-[#1B4332]">Pet Health Log</h3>
        <span className="ml-auto text-xs text-[#6B5B4F] bg-[#EDF7F0] rounded-full px-2 py-0.5">{logs.length} checkpoint{logs.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="space-y-4">
        {logs.map(log => (
          <div key={log.id} className="border border-[#EDF7F0] rounded-xl p-4 bg-[#F9F7F3]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-[#1B4332] bg-[#D8F3DC] rounded-full px-3 py-0.5">{log.checkpoint}</span>
              <span className="text-xs text-[#6B5B4F]">{format(new Date(log.created_date), "h:mm a · MMM d")}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {log.behavior && (
                <div className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-[#40916C]" />
                  <span className="text-sm text-[#1B4332]">{behaviorEmoji[log.behavior]} {log.behavior}</span>
                </div>
              )}
              {log.hydration_check !== null && log.hydration_check !== undefined && (
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-[#1B4332]">{log.hydration_check ? "Drank water ✅" : "Refused water ❌"}</span>
                </div>
              )}
              {log.bathroom_break_taken && (
                <div className="flex items-center gap-2 col-span-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-[#1B4332]">Break at {log.bathroom_break_time}{log.bathroom_break_note ? ` — ${log.bathroom_break_note}` : ""}</span>
                </div>
              )}
            </div>

            {log.photo_url && (
              <div className="mt-3 relative">
                <img src={log.photo_url} alt="Pet checkpoint" className="w-full h-48 object-cover rounded-xl" />
                <span className="absolute top-2 left-2 bg-black/60 text-white text-xs rounded-full px-2 py-0.5 flex items-center gap-1">
                  <Camera className="w-3 h-3" /> {format(new Date(log.created_date), "h:mm a")}
                </span>
              </div>
            )}

            {log.notes && (
              <p className="mt-2 text-xs text-[#6B5B4F] bg-white rounded-lg p-2 border border-gray-100 italic">"{log.notes}"</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 bg-[#EDF7F0] rounded-xl p-3 text-xs text-[#2D6A4F] font-medium text-center">
        🐾 This care report was logged by your DogChauffeur driver during transport.
      </div>
    </div>
  );
}