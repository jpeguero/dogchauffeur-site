import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl, IS_LLC_ACTIVE } from "@/utils";

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold text-[#273B2F] mb-2">Privacy Policy</h1>
          <p className="text-sm text-[#3A3F47]/60">Last updated: April 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#273B2F]/10 p-6 md:p-8 space-y-6 text-[#3A3F47]/80 text-sm leading-relaxed">

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#273B2F]">Information Collection</h2>
            <p>We collect various types of information in connection with the services we provide, including personal information you provide directly (such as name, email, phone number, and pet information) and information collected automatically (such as device information and usage data).</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#273B2F]">Use of Information</h2>
            <p>Your information is used to provide and improve our pet transportation services, communicate with you about bookings and updates, ensure the proper care of your pets during transport, and comply with legal obligations.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#273B2F]">Information Sharing</h2>
            <p>We may share your information with drivers assigned to your trips, veterinary partners when necessary, and service providers who assist in our operations. We do not sell your personal information to third parties.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#273B2F]">Cookies</h2>
            <p>We use cookies and similar technologies to enhance user experience, analyze site traffic, and personalize content. You can manage cookie preferences through your browser settings.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#273B2F]">Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#273B2F]">Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@pawffeur.com" className="text-[#273B2F] font-bold hover:text-[#E08A2B] transition-colors underline">support@pawffeur.com</a></p>
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
