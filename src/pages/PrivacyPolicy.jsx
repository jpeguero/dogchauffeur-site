import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PawPrint } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F9F7F3]">
      <nav className="bg-white/90 backdrop-blur border-b border-[#D8F3DC]/60 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={createPageUrl("PublicSite")} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl forest-gradient flex items-center justify-center">
              <PawPrint className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[#1B4332] text-lg">DogChauffeur</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1B4332] mb-2">Privacy Policy</h1>
          <p className="text-sm text-[#6B5B4F]/60">Last updated: April 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#EDF7F0] p-6 md:p-8 space-y-6 text-[#6B5B4F] text-sm leading-relaxed">

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#1B4332]">Information We Collect</h2>
            <p>DogChauffeur collects customer contact information, including phone numbers, when a user requests pet transportation services through our website or by phone.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#1B4332]">How We Use Your Information</h2>
            <p>We use this information solely to provide service-related SMS notifications such as booking confirmations, reminders, driver arrival updates, and delivery notifications.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#1B4332]">Data Sharing</h2>
            <p>We do not sell, rent, or share customer information with third parties for marketing purposes.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#1B4332]">SMS Consent</h2>
            <p>SMS consent is not shared with third parties or affiliates.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#1B4332]">Contact Us</h2>
            <p>For questions regarding this policy, contact: <a href="mailto:support@dogchauffeur.com" className="text-[#2D6A4F] underline">support@dogchauffeur.com</a></p>
          </section>

        </div>

        <p className="text-center text-xs text-[#6B5B4F]/50">© {new Date().getFullYear()} TirisiWay, Inc. · DogChauffeur™</p>
      </div>
    </div>
  );
}