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
            <h2 className="text-base font-bold text-[#1B4332]">Information Collection</h2>
            <p>We collect various types of information in connection with the services we provide, including personal information you provide directly (such as name, email, phone number, and pet information) and information collected automatically (such as device information and usage data).</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#1B4332]">Use of Information</h2>
            <p>Your information is used to provide and improve our pet transportation services, communicate with you about bookings and updates, ensure the safety of your pets during transport, and comply with legal obligations.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#1B4332]">Information Sharing</h2>
            <p>We may share your information with drivers assigned to your trips, veterinary partners when necessary, and service providers who assist in our operations. We do not sell your personal information to third parties.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#1B4332]">Cookies</h2>
            <p>We use cookies and similar technologies to enhance user experience, analyze site traffic, and personalize content. You can manage cookie preferences through your browser settings.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#1B4332]">Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#1B4332]">Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@dogchauffeur.com" className="text-[#2D6A4F] underline">support@dogchauffeur.com</a></p>
          </section>

        </div>

        <p className="text-center text-xs text-[#6B5B4F]/50">&copy; {new Date().getFullYear()} TirisiWay, Inc. &middot; DogChauffeur&trade;</p>
      </div>
    </div>
  );
}
