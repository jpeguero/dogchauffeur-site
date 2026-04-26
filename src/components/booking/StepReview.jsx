import React from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, PawPrint, ChevronRight, ChevronLeft, CheckCircle2, Shield, Truck, DollarSign } from "lucide-react";
import { format } from "date-fns";

function ReviewRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#EDF7F0] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[#EDF7F0] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-[#2D6A4F]" />
      </div>
      <div>
        <p className="text-xs text-[#6B5B4F]/60 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-[#1B4332] font-medium mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

export default function StepReview({ form, pet, pricing, expertSurcharge, isTrainingSession, totalPrice, onConfirm, onEdit, isSubmitting }) {
  const formattedDate = form.scheduled_date
    ? format(new Date(form.scheduled_date + "T00:00:00"), "EEEE, MMMM d, yyyy")
    : "";

  const formattedTime = form.scheduled_time
    ? (() => {
        const [h, m] = form.scheduled_time.split(":");
        const d = new Date(); d.setHours(+h, +m);
        return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      })()
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B4332]">Review Your Ride</h1>
        <p className="text-[#6B5B4F]/80 mt-1 text-sm">Review the details before confirming your ride.</p>
      </div>

      {/* Ride summary */}
      <div className="bg-white rounded-2xl border border-[#EDF7F0] p-5">
        <ReviewRow icon={MapPin}      label="Pickup"     value={form.pickup_location} />
        <ReviewRow icon={MapPin}      label="Drop-off"   value={form.dropoff_location} />
        <ReviewRow icon={Calendar}    label="Date"       value={formattedDate} />
        <ReviewRow icon={Clock}       label="Time"       value={formattedTime || "Flexible"} />
        <ReviewRow icon={PawPrint}    label="Pet"        value={pet?.name || form.pet_id} />
        {form.notes && <ReviewRow icon={CheckCircle2}   label="Ride Notes"  value={form.notes} />}
      </div>

      {/* Price breakdown */}
      {(pricing || isTrainingSession) ? (
        <div className="bg-white rounded-2xl border border-[#D8F3DC] overflow-hidden">
          <div className="bg-[#EDF7F0] px-4 py-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#2D6A4F]" />
            <span className="text-sm font-semibold text-[#1B4332]">Price Summary</span>
          </div>
          <div className="px-4 py-4 space-y-2">
            {isTrainingSession ? (
              <div className="flex justify-between text-sm text-[#6B5B4F]">
                <span>Transport + 30-Min Training Session</span><span>$150.00</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm text-[#6B5B4F]">
                  <span>Base fare (first 5 mi)</span><span>$25.00</span>
                </div>
                {pricing.extra_miles > 0 && (
                  <div className="flex justify-between text-sm text-[#6B5B4F]">
                    <span>{pricing.extra_miles} extra mi × $2.50</span>
                    <span>${pricing.per_mile_charge?.toFixed(2)}</span>
                  </div>
                )}
                {pricing.heavy_surcharge > 0 && (
                  <div className="flex justify-between text-sm text-amber-700">
                    <span>Large crate surcharge</span><span>+$15.00</span>
                  </div>
                )}
              </>
            )}
            {expertSurcharge > 0 && (
              <div className="flex justify-between text-sm text-purple-700">
                <span>⚡ Expert Handling surcharge</span><span>+$50.00</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[#1B4332] text-base pt-2 border-t border-[#EDF7F0]">
              <span>Total Estimate</span><span>${totalPrice?.toFixed(2)}</span>
            </div>
            {!isTrainingSession && pricing && (
              <p className="text-xs text-[#6B5B4F]/60">{pricing.distance_text} · {pricing.duration_text}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#EDF7F0] rounded-2xl px-4 py-3 text-sm text-[#6B5B4F]">
          💡 Pricing will be confirmed by your driver before the ride.
        </div>
      )}

      {/* Trust section */}
      <div className="bg-[#EDF7F0] rounded-2xl p-5">
        <p className="text-sm font-semibold text-[#1B4332] mb-4">What to expect</p>
        <div className="space-y-3">
          {[
            { icon: CheckCircle2, text: "Pickup and drop-off confirmation" },
            { icon: Shield,       text: "Safe transportation for your pet" },
            { icon: Truck,        text: "Clean, pet-ready vehicle standards" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-[#52B788] shrink-0" />
              <span className="text-sm text-[#6B5B4F]">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <Button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="w-full h-12 bg-[#1B4332] hover:bg-[#2D6A4F] active:bg-[#152E24] active:scale-[0.98] text-white rounded-2xl text-base font-semibold shadow-lg shadow-[#1B4332]/25 transition-all justify-between px-5"
        >
          <span>Review Agreement & Submit</span><ChevronRight className="w-5 h-5" />
        </Button>
        <Button
          type="button" variant="ghost"
          onClick={onEdit}
          className="w-full h-11 text-[#6B5B4F] rounded-xl flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Edit Ride
        </Button>
      </div>
    </div>
  );
}