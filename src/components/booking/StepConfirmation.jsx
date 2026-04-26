import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, PawPrint, CheckCircle2, ChevronRight, Phone, Bell, Truck, Share2, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

function SummaryRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#EDF7F0] last:border-0">
      <Icon className="w-4 h-4 text-[#52B788] shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-[#6B5B4F]/60 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-[#1B4332] font-medium mt-0.5 text-sm">{value}</p>
      </div>
    </div>
  );
}

export default function StepConfirmation({ form, pet, tripId, userId, estimatedPrice }) {
  const [copied, setCopied] = useState(false);

  const referralLink = userId
    ? `${window.location.origin}${createPageUrl("BookingRequest")}?ref=${userId}`
    : null;

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
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
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Success icon */}
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-[#EDF7F0] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-[#2D6A4F]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1B4332]">Ride Requested!</h1>
        <p className="text-[#6B5B4F]/80 mt-2 text-sm max-w-xs mx-auto">
          We've received your ride request and will keep you updated on the next steps.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-[#EDF7F0] p-5">
        <SummaryRow icon={MapPin} label="Pickup" value={form.pickup_location} />
        <SummaryRow icon={MapPin} label="Drop-off" value={form.dropoff_location} />
        <SummaryRow icon={Calendar} label="Date" value={formattedDate} />
        <SummaryRow icon={Clock} label="Time" value={formattedTime || "Flexible"} />
        <SummaryRow icon={PawPrint} label="Pet" value={pet?.name || form.pet_id} />
        {estimatedPrice && (
          <div className="flex items-start gap-3 py-3">
            <span className="text-[#52B788] text-base shrink-0 mt-0.5">💰</span>
            <div>
              <p className="text-xs text-[#6B5B4F]/60 font-medium uppercase tracking-wide">Estimated Price</p>
              <p className="text-[#1B4332] font-bold text-lg mt-0.5">${estimatedPrice.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>

      {/* What happens next */}
      <div className="bg-[#EDF7F0] rounded-2xl p-5">
        <p className="text-sm font-semibold text-[#1B4332] mb-4">What happens next</p>
        <div className="space-y-3">
          {[
            { icon: Phone, text: "We'll review your request and follow up with confirmation details." },
            { icon: Bell, text: "You'll be notified once your ride is confirmed." },
            { icon: Truck, text: "Need to make a change? Contact us as soon as possible." },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <Icon className="w-4 h-4 text-[#52B788] shrink-0 mt-0.5" />
              <span className="text-sm text-[#6B5B4F]">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Referral section */}
      {referralLink && (
        <div className="bg-[#1B4332] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="w-4 h-4 text-[#74C69D]" />
            <p className="text-sm font-semibold">Know another pet owner who needs help getting to the vet?</p>
          </div>
          <p className="text-xs text-white/70 mb-4">Share your personal referral link and help a fellow pet parent find safe, reliable transportation.</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-xs text-white/80 truncate font-mono">
              {referralLink}
            </div>
            <Button
              onClick={handleCopy}
              size="sm"
              className="bg-white text-[#1B4332] hover:bg-[#EDF7F0] rounded-xl shrink-0 font-semibold"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="space-y-3 pt-2">
        <Link to={tripId ? `${createPageUrl("TripDetail")}?id=${tripId}` : createPageUrl("Trips")}>
          <Button className="w-full h-12 bg-[#1B4332] hover:bg-[#2D6A4F] active:bg-[#152E24] active:scale-[0.98] text-white rounded-2xl text-base font-semibold shadow-lg shadow-[#1B4332]/25 transition-all justify-between px-5">
            <span>View Ride Details</span>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </Link>
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" className="w-full h-11 text-[#6B5B4F] rounded-xl">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}