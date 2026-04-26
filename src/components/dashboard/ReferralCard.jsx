import React, { useState } from "react";
import { Gift, Copy, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function generateCode(userId) {
  // Deterministic, human-friendly code from user ID
  return "DC-" + userId.slice(-6).toUpperCase();
}

export default function ReferralCard({ user }) {
  const [copied, setCopied] = useState(false);
  const code = generateCode(user?.id || "XXXX");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-2xl p-6 text-white overflow-hidden relative">
      {/* Decorative circle */}
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -right-2 bottom-0 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Gift className="w-5 h-5 text-[#95D5B2]" />
          </div>
          <div>
            <h3 className="font-bold text-base">Refer a Friend</h3>
            <p className="text-[#95D5B2] text-xs">They save $10 · you earn $10 off your next ride</p>
          </div>
        </div>

        <p className="text-white/75 text-sm mb-4 leading-relaxed">
          Share your personal code with a friend. When they book their first ride and mention your code, 
          you both get <strong className="text-white">$10 off</strong>.
        </p>

        {/* Code display */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 font-mono font-bold text-lg tracking-widest text-center">
            {code}
          </div>
          <Button
            type="button"
            onClick={handleCopy}
            className="h-12 px-4 bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-[#95D5B2]" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/60">
          <span>Ask your friend to mention this code when booking.</span>
        </div>

        <Link to={createPageUrl("BookTrip")} className="mt-4 block">
          <Button className="w-full bg-white text-[#1B4332] hover:bg-white/90 font-semibold rounded-xl h-11 justify-between px-5">
            <span>Book Your Next Ride</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}