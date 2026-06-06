import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PawPrint } from "lucide-react";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-[#F9F7F3]">
      <nav className="bg-white/90 backdrop-blur border-b border-[#D8F3DC]/60 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={createPageUrl("PublicSite")} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl forest-gradient flex items-center justify-center">
              <PawPrint className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[#1B4332] text-lg">Pawffeur</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1B4332] mb-2">Terms and Conditions</h1>
          <p className="text-sm text-[#6B5B4F]/60">Last updated: April 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#EDF7F0] p-6 md:p-8 space-y-6 text-[#6B5B4F] text-sm leading-relaxed">

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#1B4332]">SMS Program</h2>
            <p>By requesting service from Pawffeur, you agree to receive SMS notifications related to your pet transportation service. These messages may include booking confirmations, reminders, driver updates, and service notifications.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#1B4332]">Message Frequency</h2>
            <p>Message frequency varies based on service activity.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#1B4332]">Rates</h2>
            <p>Message and data rates may apply.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#1B4332]">Opt-Out</h2>
            <p>You can opt out at any time by replying <strong>STOP</strong> to any message.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#1B4332]">Help & Support</h2>
            <p>For assistance, reply <strong>HELP</strong> to any message or contact us at <a href="mailto:support@pawffeur.com" className="text-[#2D6A4F] underline">support@pawffeur.com</a></p>
          </section>

        </div>

        <p className="text-center text-xs text-[#6B5B4F]/50">© {new Date().getFullYear()} TirisiWay, Inc. · Pawffeur™</p>
      </div>
    </div>
  );
}