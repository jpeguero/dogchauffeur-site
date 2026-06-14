import React from "react";
import LeadForm from "@/components/LeadForm";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BookingRequest() {
  return (
    <div className="min-h-screen bg-[#F9F7F3]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#D8F3DC]/60">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={createPageUrl("PublicSite")} className="flex items-center">
            <img src="/assets/pawffeur-logo-primary.svg" alt="Pawffeur" className="h-11 w-auto" />
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1B4332] mb-2">Book a Ride or Request a Quote</h1>
          <p className="text-[#6B5B4F]/65">Provide your pet's travel details and our team will coordinate the rest.</p>
        </div>

        <LeadForm />
      </div>
    </div>
  );
}