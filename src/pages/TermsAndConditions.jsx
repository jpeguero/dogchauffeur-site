import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl, IS_LLC_ACTIVE } from "@/utils";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-[#F7F1E3] text-[#3A3F47] selection:bg-[#E08A2B] selection:text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#F7F1E3]/95 backdrop-blur-md border-b border-[#273B2F]/10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={createPageUrl("PublicSite")} className="flex items-center">
            <img src="/assets/pawffeur-logo-primary.png" alt="Pawffeur" className="h-[40px] w-auto" />
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#273B2F] mb-2">Terms and Conditions</h1>
          <p className="text-sm text-[#3A3F47]/60">Last updated: April 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#273B2F]/10 p-6 md:p-8 space-y-6 text-[#3A3F47]/80 text-sm leading-relaxed">

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#273B2F]">SMS Program</h2>
            <p>By requesting service from Pawffeur, you agree to receive SMS notifications related to your pet transportation service. These messages may include booking confirmations, reminders, driver updates, and service notifications.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#273B2F]">Message Frequency</h2>
            <p>Message frequency varies based on service activity.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#273B2F]">Rates</h2>
            <p>Message and data rates may apply.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#273B2F]">Opt-Out</h2>
            <p>You can opt out at any time by replying <strong>STOP</strong> to any message.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#273B2F]">Help & Support</h2>
            <p>For assistance, reply <strong>HELP</strong> to any message or contact us at <a href="mailto:support@pawffeur.com" className="text-[#273B2F] font-bold hover:text-[#E08A2B] transition-colors underline">support@pawffeur.com</a></p>
          </section>

        </div>

        {IS_LLC_ACTIVE ? (
          <p className="text-center text-xs text-[#3A3F47]/50">Pawffeur™ is operated by Pawffeur, LLC. &copy; 2026 Pawffeur, LLC. All rights reserved.</p>
        ) : (
          <p className="text-center text-xs text-[#3A3F47]/50">&copy; 2026 Pawffeur™. All rights reserved.</p>
        )}
      </div>
    </div>
  );
}