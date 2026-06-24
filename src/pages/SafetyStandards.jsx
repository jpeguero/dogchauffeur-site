import React from "react";
import { Shield, Thermometer, Sparkles, Award, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createPageUrl, IS_LLC_ACTIVE } from "@/utils";

const PILLARS = [
  {
    icon: Shield,
    color: "bg-[#273B2F]",
    iconColor: "text-[#D8F3DC]",
    title: "Secure Containment",
    body: "Every pet travels in a professional, rotomolded crate. These are physically anchored to the vehicle's factory steel D-rings using 1,000 lb. industrial ratchet straps to prevent movement during transport.",
  },
  {
    icon: Thermometer,
    color: "bg-[#273B2F]/80",
    iconColor: "text-[#B7E4C7]",
    title: "Climate Monitoring",
    body: "The vehicle is equipped with digital sensors that provide real-time cabin temperature alerts to the driver's phone, ensuring pets remain in a climate-monitored cabin at all times.",
  },
  {
    icon: Sparkles,
    color: "bg-[#273B2F]/70",
    iconColor: "text-white",
    title: "Hygiene Protocols",
    body: "We follow strict sanitation protocols. All surfaces and crates are disinfected between every trip using non-toxic, accelerated hydrogen peroxide solutions that kill pathogens like Parvovirus in 60 seconds.",
  },
  {
    icon: Award,
    color: "bg-[#273B2F]/60",
    iconColor: "text-white",
    title: "USDA Compliance",
    body: "We operate as a federally registered Animal Transporter, adhering to the rigorous care and record-keeping standards of the Animal Welfare Act.",
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
    feature: "Non-corrosive and non-irritating; gentle to air dry without rinsing.",
    badge: "Gentle",
  },
];

export default function SafetyStandards() {
  return (
    <div className="min-h-screen bg-[#F7F1E3] flex flex-col text-[#3A3F47]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#F7F1E3]/95 backdrop-blur border-b border-[#273B2F]/10">
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={createPageUrl("PublicSite")} className="flex items-center">
            <img 
              src="/assets/pawffeur-logo-primary.png" 
              alt="Pawffeur" 
              className="h-[40px] w-auto"
              loading="lazy"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("BookingRequest")}>
              <button className="bg-[#273B2F] hover:bg-[#273B2F]/90 text-white rounded-full px-6 py-2 text-xs font-bold shadow-sm transition-all duration-180 hover:-translate-y-0.5 hover:shadow-md active:scale-95">
                Book a Ride
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 space-y-10">
        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden bg-[#273B2F] border border-[#273B2F]/10 px-8 py-12 text-center text-[#F7F1E3]">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 20%, #E08A2B 0%, transparent 60%)" }} />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#F7F1E3]/15 flex items-center justify-center mx-auto mb-5">
              <Shield className="w-8 h-8 text-[#E08A2B]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">The Pawffeur Operational Standard</h1>
            <p className="text-[#F7F1E3]/85 text-base max-w-xl mx-auto leading-relaxed">
              Your pet's care is not a checkbox — it's our entire operating system.
              Every ride is engineered around four non-negotiable pillars.
            </p>
          </div>
        </div>

        {/* Four Pillars */}
        <div>
          <h2 className="text-xl font-bold text-[#273B2F] mb-5">Our Four Operational Pillars</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {PILLARS.map((p) => (
              <div key={p.title} className="bg-[#F7F1E3] rounded-2xl border border-[#273B2F]/10 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl ${p.color} flex items-center justify-center mb-4`}>
                  <p.icon className={`w-5 h-5 ${p.iconColor}`} />
                </div>
                <h3 className="font-bold text-[#273B2F] text-base mb-2">{p.title}</h3>
                <p className="text-[#3A3F47]/80 text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Audit-Ready Checklist */}
        <div className="bg-[#273B2F]/5 rounded-2xl border border-[#273B2F]/10 p-6">
          <h2 className="text-lg font-bold text-[#273B2F] mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#E08A2B]" />
            Audit-Ready Checklist
          </h2>
          <ul className="space-y-2.5">
            {[
              "Individual crates secured with 1,000 lb. ratchet straps",
              "Real-time in-cabin temperature monitoring active",
              "Full disinfection log maintained between every trip",
              "USDA federal transporter registration on file",
              "Veterinary-grade, gentle cleaning products only",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-[#3A3F47]">
                <CheckCircle2 className="w-4 h-4 text-[#E08A2B] mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cleaning Products */}
        <div>
          <h2 className="text-xl font-bold text-[#273B2F] mb-2">Professional Sanitation Arsenal</h2>
          <p className="text-sm text-[#3A3F47]/80 mb-5">
            Veterinary-grade disinfectants used on every trip — highly effective and non-irritating.
          </p>
          <div className="space-y-3">
            {PRODUCTS.map((prod) => (
              <div key={prod.name} className="bg-[#F7F1E3] rounded-2xl border border-[#273B2F]/10 p-5 flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[#273B2F]/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-[#273B2F]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-[#273B2F] text-sm">{prod.name}</h3>
                    <span className="text-xs bg-[#273B2F]/10 text-[#273B2F] px-2 py-0.5 rounded-full font-semibold">{prod.badge}</span>
                  </div>
                  <p className="text-xs font-semibold text-[#E08A2B] mb-1">{prod.bestFor}</p>
                  <p className="text-xs text-[#3A3F47]/80 leading-relaxed">{prod.feature}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pro Tip */}
        <div className="bg-[#E08A2B]/10 border border-[#E08A2B]/20 rounded-2xl p-5 flex gap-4 items-start">
          <div className="text-2xl">🚙</div>
          <div>
            <h3 className="font-bold text-[#E08A2B] text-sm mb-1">Pro Tip — Protect the Cabin</h3>
            <p className="text-[#3A3F47]/80 text-xs leading-relaxed">
              Check for a custom cargo liner sized for your transport vehicle. It protects the interior from heavy-duty cleaning solutions and keeps the vehicle inspection-ready.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#273B2F] text-[#F7F1E3]/70 text-center py-12 mt-12 border-t border-[#F7F1E3]/10">
        <div className="max-w-[1100px] mx-auto px-6 space-y-6">
          <div>
            <img src="/assets/pawffeur-logo-tagline.png" alt="Pawffeur: Every paw gets a chauffeur." className="h-10 w-auto mx-auto mb-4" />
            <div className="flex justify-center items-center text-sm text-[#F7F1E3]/80">
              <a href="mailto:support@pawffeur.com" className="hover:text-white transition">✉ support@pawffeur.com</a>
            </div>
          </div>
          <div className="flex justify-center gap-6 text-sm flex-wrap text-[#F7F1E3]/80">
            <Link to={createPageUrl("PublicSite")} className="hover:text-white transition">Pet Owners</Link>
            <Link to={createPageUrl("VetPartners")} className="hover:text-white transition">Vet Clinics &amp; Partners</Link>
            <Link to={createPageUrl("BookingRequest")} className="hover:text-white transition">Book a Ride</Link>
          </div>
          <div className="border-t border-white/10 pt-6">
            {IS_LLC_ACTIVE ? (
              <p className="text-xs text-[#F7F1E3]/50">Pawffeur™ is operated by Pawffeur, LLC. &copy; 2026 Pawffeur, LLC. All rights reserved.</p>
            ) : (
              <p className="text-xs text-[#F7F1E3]/50">© 2026 Pawffeur™. All rights reserved.</p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}