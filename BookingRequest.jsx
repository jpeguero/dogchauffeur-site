import React from "react";
import LeadForm from "@/components/LeadForm";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BookingRequest() {
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

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#273B2F] mb-2">Book a Ride or Request a Quote</h1>
          <p className="text-[#3A3F47]/65">Provide your pet's travel details and our team will coordinate the rest.</p>
        </div>

        <LeadForm />
      </div>
    </div>
  );
}