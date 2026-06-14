import React from "react";
import { Shield, Thermometer, Sparkles, Award, CheckCircle2, Dog } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createPageUrl, IS_LLC_ACTIVE } from "@/utils";

const PILLARS = [
  {
    icon: Shield,
    color: "bg-[#1B4332]",
    iconColor: "text-[#95D5B2]",
    title: "Secure Containment",
    body: "Every pet travels in a professional, rotomolded crash-tested crate. These are physically anchored to the Jeep's factory steel D-rings using 1,000 lb. industrial ratchet straps to prevent movement during transport.",
  },
  {
    icon: Thermometer,
    color: "bg-[#2D6A4F]",
    iconColor: "text-[#B7E4C7]",
    title: "Climate Monitoring",
    body: "The vehicle is equipped with digital sensors that provide real-time cabin temperature alerts to the driver's phone, ensuring pets remain in a safe, climate-controlled environment at all times.",
  },
  {
    icon: Sparkles,
    color: "bg-[#40916C]",
    iconColor: "text-white",
    title: "Biosecurity & Hygiene",
    body: "We follow strict veterinary-grade sanitation protocols. All surfaces and crates are disinfected between every trip using non-toxic, accelerated hydrogen peroxide solutions that kill pathogens like Parvovirus and Kennel Cough in 60 seconds.",
  },
  {
    icon: Award,
    color: "bg-[#52B788]",
    iconColor: "text-white",
    title: "USDA Compliance",
    body: "We operate as a federally registered Animal Transporter, adhering to the rigorous safety and record-keeping standards of the Animal Welfare Act.",
  },
];

const PRODUCTS = [
  {
    name: "Rescue RTU Spray",
    bestFor: "Daily / Quick Clean",
    feature: "60-second kill time; breaks down into water & oxygen; no harsh fumes.",
    badge: "Recommended",
  },
  {
    name: "Virkon S Powder",
    bestFor: "Weekly Deep Clean",
    feature: "Economical concentrate; kills 99.9% of viruses including Parvo.",
    badge: "Deep Clean",
  },
  {
    name: "F10SC Concentrate",
    bestFor: "Sensitive Pets",
    feature: "Non-corrosive and non-irritating; safe to air dry without rinsing.",
    badge: "Gentle",
  },
];

export default function SafetyStandards() {
  return (
    <div className="min-h-screen bg-[#F9F7F3] flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#D8F3DC]/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={createPageUrl("PublicSite")} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl forest-gradient flex items-center justify-center">
              <Dog className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[#1B4332] text-lg">Pawffeur</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("BookingRequest")}>
              <Button className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl text-sm">
                Book a Ride
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 space-y-10">
        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden bg-[#EDF7F0] border border-[#D8F3DC] px-8 py-12 text-center">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 20%, #1B4332 0%, transparent 60%)" }} />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#1B4332]/10 flex items-center justify-center mx-auto mb-5">
              <Shield className="w-8 h-8 text-[#1B4332]" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#1B4332] mb-3">The Pawffeur Safety Standard</h1>
            <p className="text-[#2D6A4F] text-base max-w-xl mx-auto leading-relaxed">
              Your pet's safety is not a checkbox — it's our entire operating system.
              Every ride is engineered around four non-negotiable pillars.
            </p>
          </div>
        </div>

        {/* Four Pillars */}
        <div>
          <h2 className="text-xl font-bold text-[#1B4332] mb-5">Our Four Safety Pillars</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {PILLARS.map((p) => (
              <div key={p.title} className="bg-white rounded-2xl border border-[#EDF7F0] p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl ${p.color} flex items-center justify-center mb-4`}>
                  <p.icon className={`w-5 h-5 ${p.iconColor}`} />
                </div>
                <h3 className="font-bold text-[#1B4332] text-base mb-2">{p.title}</h3>
                <p className="text-[#6B5B4F] text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Audit-Ready Checklist */}
        <div className="bg-[#EDF7F0] rounded-2xl border border-[#D8F3DC] p-6">
          <h2 className="text-lg font-bold text-[#1B4332] mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#40916C]" />
            Audit-Ready Checklist
          </h2>
          <ul className="space-y-2.5">
            {[
              "Crash-tested crates secured with 1,000 lb. ratchet straps",
              "Real-time in-cabin temperature monitoring active",
              "Full disinfection log maintained between every trip",
              "USDA federal transporter registration on file",
              "Veterinary-grade, pet-safe cleaning products only",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-[#2D6A4F]">
                <CheckCircle2 className="w-4 h-4 text-[#52B788] mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cleaning Products */}
        <div>
          <h2 className="text-xl font-bold text-[#1B4332] mb-2">Professional Sanitation Arsenal</h2>
          <p className="text-sm text-[#6B5B4F] mb-5">
            Veterinary-grade disinfectants used on every trip — safer and more effective than household cleaners.
          </p>
          <div className="space-y-3">
            {PRODUCTS.map((prod) => (
              <div key={prod.name} className="bg-white rounded-2xl border border-[#EDF7F0] p-5 flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#EDF7F0] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-[#40916C]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-[#1B4332] text-sm">{prod.name}</h3>
                    <span className="text-xs bg-[#D8F3DC] text-[#1B4332] px-2 py-0.5 rounded-full font-semibold">{prod.badge}</span>
                  </div>
                  <p className="text-xs font-semibold text-[#40916C] mb-1">{prod.bestFor}</p>
                  <p className="text-xs text-[#6B5B4F] leading-relaxed">{prod.feature}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pro Tip */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-start">
          <div className="text-2xl">🚙</div>
          <div>
            <h3 className="font-bold text-amber-800 text-sm mb-1">Pro Tip — Protect the 2009 Jeep Wrangler Unlimited</h3>
            <p className="text-amber-700 text-xs leading-relaxed">
              Check the <strong>WeatherTech section of Facebook Marketplace</strong> in Chicago for a used cargo liner
              sized for a 2009–2018 Jeep Wrangler Unlimited. It protects your interior from heavy-duty cleaning
              solutions and keeps the vehicle inspection-ready.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1B4332] text-white/70 text-center py-12 mt-12">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <div>
            <img src="/assets/pawffeur-logo-tagline.svg" alt="Pawffeur: Every paw gets a chauffeur." className="h-10 w-auto mx-auto mb-4" />
            <div className="flex justify-center items-center text-sm text-white/80">
              <a href="mailto:support@pawffeur.com" className="hover:text-white transition">✉ support@pawffeur.com</a>
            </div>
          </div>
          <div className="flex justify-center gap-6 text-sm flex-wrap">
            <Link to={createPageUrl("PublicSite")} className="hover:text-white transition">Pet Owners</Link>
            <Link to={createPageUrl("VetPartners")} className="hover:text-white transition">Vet Clinics &amp; Partners</Link>
            <Link to={createPageUrl("BookingRequest")} className="hover:text-white transition">Book a Ride</Link>
          </div>
          <div className="border-t border-white/10 pt-6">
            {IS_LLC_ACTIVE ? (
              <p className="text-xs text-white/50">Pawffeur™ is operated by Pawffeur, LLC. &copy; 2026 Pawffeur, LLC. All rights reserved.</p>
            ) : (
              <p className="text-xs text-white/50">© 2026 Pawffeur™. All rights reserved.</p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}