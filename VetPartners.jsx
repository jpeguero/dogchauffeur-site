import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl, IS_LLC_ACTIVE } from "@/utils";
import {
  PawPrint, Phone, CheckCircle2, Calendar, Heart,
  Building2, Clock, Shield, ArrowRight, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

const USE_CASES = [
  { icon: Calendar, text: "Vet appointment drop-off and pickup" },
  { icon: Heart, text: "Surgery and post-op hospital transfers" },
  { icon: Building2, text: "Boarding facility drop-off and retrieval" },
  { icon: Star, text: "Grooming salon transportation" },
  { icon: PawPrint, text: "Airport pet transport for traveling owners" },
  { icon: Clock, text: "Same-day and urgent pet rides" },
];

const BENEFITS = [
  "Reduce missed appointments at your clinic or facility",
  "Help busy clients keep their scheduled visits",
  "Animals-only transport — no rideshare, no strangers",
  "Insured pet transportation service",
  "Real-time tracking link sent to pet owners via text",
  "Chicago-based — familiar with local clinics, groomers, and routes",
  "For scheduled appointments, grooming visits, boarding transfers, and airport pet transport",
];

const CLINICS = [
  "Wicker Park Veterinary Clinic",
  "Lincoln Park Animal Hospital",
  "Lakeview Animal Clinic",
  "Andersonville Cat Clinic",
  "Chicago Animal Hospital",
];

export default function VetPartners() {
  const handleReferral = () => {
    window.location.href = createPageUrl("BookingRequest") + "?ref=partner";
  };

  return (
    <div className="min-h-screen bg-[#F7F1E3] text-[#3A3F47] selection:bg-[#E08A2B] selection:text-white">
      {/* Nav */}
      <nav className="bg-[#F7F1E3]/95 backdrop-blur-md border-b border-[#273B2F]/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={createPageUrl("PublicSite")} className="flex items-center">
            {/* Desktop: Primary lockup */}
            <img 
              src="/assets/pawffeur-logo-primary.png" 
              alt="Pawffeur" 
              className="h-10 w-auto hidden sm:block"
            />
            {/* Mobile: Icon + Text */}
            <div className="flex items-center gap-2 sm:hidden">
              <img 
                src="/assets/pawffeur-icon.png" 
                alt="Pawffeur" 
                className="h-8 w-8"
              />
              <span className="font-bold text-[#273B2F] text-lg">Pawffeur™</span>
            </div>
          </Link>
          <a href="mailto:support@pawffeur.com" className="flex items-center gap-2 text-sm text-[#273B2F] font-semibold hover:text-[#E08A2B] transition-colors">
            support@pawffeur.com
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#273B2F] text-[#F7F1E3] px-6 py-20 relative overflow-hidden border-b border-[#273B2F]/20">
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 70% 20%, #E08A2B 0%, transparent 60%)" }}
        />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <span className="inline-block bg-[#F7F1E3]/10 backdrop-blur-md text-[#F7F1E3] text-xs font-semibold px-4 py-1.5 rounded-full tracking-wider uppercase border border-[#F7F1E3]/15">
                For Veterinary Clinics
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#E08A2B]/20 border border-[#E08A2B]/35 text-[#F7F1E3] text-xs font-semibold px-4 py-1.5 rounded-full">
                <Shield className="w-3.5 h-3.5 text-[#E08A2B]" /> Insured Pet Transportation Service
              </span>
            </div>
            <p className="text-[#F7F1E3]/70 text-sm mb-2">Animals-only transport · Insured · Chicago-based</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-[#F7F1E3]">
              Transportation for Veterinary Clinics<br />and Pet Care Partners
            </h1>
            <p className="text-xl text-[#F7F1E3]/85 max-w-2xl mx-auto mb-10 leading-relaxed">
              Pawffeur helps clinics, groomers, and boarding facilities reduce missed appointments by providing professional pet transportation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleReferral}
                className="bg-[#E08A2B] hover:bg-[#E08A2B]/90 text-white font-bold px-8 py-6 text-base rounded-full h-auto shadow-md transition-all duration-180 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 w-full sm:w-auto"
              >
                Refer a Client Ride <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <a href="mailto:support@pawffeur.com" className="w-full sm:w-auto">
                <Button variant="outline" className="border-[#F7F1E3]/40 text-[#F7F1E3] bg-white/5 hover:bg-white/10 px-8 py-6 text-base rounded-full h-auto w-full">
                  Email to Schedule
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-bold text-[#273B2F] text-center mb-3">Use Cases</h2>
          <p className="text-[#3A3F47]/70 text-center mb-10">We handle the transport — you focus on the care.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {USE_CASES.map(({ icon: Icon, text }) => (
              <div key={text} className="bg-[#F7F1E3] rounded-2xl p-6 border border-[#273B2F]/10 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#273B2F]/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#273B2F]" />
                </div>
                <p className="text-[#273B2F] font-semibold">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Benefits */}
      <section className="bg-[#273B2F]/5 py-16 px-6 border-y border-[#273B2F]/10">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold text-[#273B2F] text-center mb-3">Why Partner with Pawffeur</h2>
            <p className="text-[#3A3F47]/70 text-center mb-10">Give your clients one less reason to miss an appointment.</p>
            <div className="bg-[#F7F1E3] rounded-3xl p-8 shadow-sm border border-[#273B2F]/10 space-y-4">
              {BENEFITS.map((b) => (
                <div key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#E08A2B] mt-0.5 flex-shrink-0" />
                  <p className="text-[#273B2F] text-sm leading-relaxed">{b}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-bold text-[#273B2F] text-center mb-10">Simple Referral Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "You refer a client", desc: "Share our number or use the Refer a Client Ride button on this page." },
              { step: "2", title: "We pick up the pet", desc: "Our driver arrives on time, with care instructions noted." },
              { step: "3", title: "Client gets a tracking link", desc: "Owners follow along via text — no calls needed." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-[#F7F1E3] rounded-2xl p-6 border border-[#273B2F]/10 shadow-sm text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-[#273B2F] text-[#F7F1E3] font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-bold text-[#273B2F] mb-2">{title}</h3>
                <p className="text-xs text-[#3A3F47]/80 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Trust badges */}
      <section className="bg-[#273B2F] text-[#F7F1E3] py-12 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: Shield, label: "Insured Drivers" },
            { icon: Clock, label: "On-Time Pickup" },
            { icon: PawPrint, label: "Comfort-Managed Vehicles" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#E08A2B]" />
              </div>
              <p className="font-semibold text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-bold text-[#273B2F] mb-4">Ready to refer a client?</h2>
          <p className="text-[#3A3F47]/70 mb-8 leading-relaxed">Submit a ride request on their behalf, or share our email link.</p>
          <Button
            onClick={handleReferral}
            className="bg-[#E08A2B] hover:bg-[#E08A2B]/90 text-white font-bold px-10 py-6 text-base rounded-full h-auto shadow-md transition-all duration-180 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
          >
            Refer a Client Ride <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <p className="mt-4 text-sm text-[#3A3F47]/70">Or email: <a href="mailto:support@pawffeur.com" className="text-[#273B2F] font-bold hover:text-[#E08A2B] transition-colors">support@pawffeur.com</a></p>
        </motion.div>
      </section>

      <footer className="border-t border-[#273B2F]/10 bg-[#F7F1E3] py-8 px-6 text-center text-sm text-[#3A3F47]/70">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src="/assets/pawffeur-icon.png" alt="Pawffeur" className="w-6 h-6" />
          <span className="font-bold text-[#273B2F]">Pawffeur™</span>
        </div>
        <div className="flex justify-center gap-6 mb-3 flex-wrap">
          <Link to={createPageUrl("PublicSite")} className="hover:text-[#273B2F] transition-colors">Pet Owners</Link>
          <Link to={createPageUrl("VetPartners")} className="hover:text-[#273B2F] font-semibold text-[#273B2F]">Vet Clinics</Link>
          <a href="mailto:support@pawffeur.com" className="hover:text-[#273B2F] transition-colors">Contact</a>
        </div>
        {IS_LLC_ACTIVE ? (
          <p>Pawffeur™ is operated by Pawffeur, LLC. &copy; 2026 Pawffeur, LLC. All rights reserved.</p>
        ) : (
          <p>&copy; 2026 Pawffeur™. All rights reserved.</p>
        )}
      </footer>
    </div>
  );
}