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
  { icon: Clock, text: "Same-day and emergency pet rides" },
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
    <div className="min-h-screen bg-[#F9F7F3]">
      {/* Nav */}
      <nav className="bg-white/90 backdrop-blur-lg border-b border-[#D8F3DC]/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={createPageUrl("PublicSite")} className="flex items-center">
            {/* Desktop: Primary lockup */}
            <img 
              src="/assets/pawffeur-logo-primary.svg" 
              alt="Pawffeur" 
              className="h-9 w-auto hidden sm:block"
            />
            {/* Mobile: Icon + Text */}
            <div className="flex items-center gap-2 sm:hidden">
              <img 
                src="/assets/pawffeur-icon.svg" 
                alt="Pawffeur" 
                className="h-8 w-8"
              />
              <span className="font-bold text-[#1B4332] text-lg">Pawffeur™</span>
            </div>
          </Link>
          <a href="tel:+13126209297" className="flex items-center gap-2 text-sm text-[#2D6A4F] font-medium">
            <Phone className="w-4 h-4" />
            (312) 620-9297
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="forest-gradient text-white px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <span className="inline-block bg-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full tracking-wider uppercase">
                For Veterinary Clinics
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#D8F3DC]/20 border border-white/30 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                <Shield className="w-3.5 h-3.5" /> Insured Pet Transportation Service
              </span>
            </div>
            <p className="text-white/70 text-sm mb-2">Animals-only transport · Insured · Chicago-based</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Transportation for Veterinary Clinics<br />and Pet Care Partners
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
              Pawffeur helps clinics, groomers, and boarding facilities reduce missed appointments by providing safe pet transportation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleReferral}
                className="bg-white text-[#1B4332] hover:bg-[#EDF7F0] font-semibold px-8 py-6 text-base rounded-xl h-auto"
              >
                Refer a Client Ride <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <a href="tel:+13126209297">
                <Button variant="outline" className="border-white/40 text-white bg-white/10 hover:bg-white/20 px-8 py-6 text-base rounded-xl h-auto w-full sm:w-auto">
                  <Phone className="w-4 h-4 mr-2" /> Call or Text to Schedule
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold text-[#1B4332] text-center mb-3">Use Cases</h2>
          <p className="text-[#6B5B4F] text-center mb-10">We handle the transport — you focus on the care.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {USE_CASES.map(({ icon: Icon, text }) => (
              <div key={text} className="bg-white rounded-2xl p-6 border border-[#EDF7F0] flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl forest-gradient flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-[#1B4332] font-medium">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Benefits */}
      <section className="bg-[#EDF7F0] py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-bold text-[#1B4332] text-center mb-3">Why Partner with Pawffeur</h2>
            <p className="text-[#6B5B4F] text-center mb-10">Give your clients one less reason to miss an appointment.</p>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#D8F3DC] space-y-4">
              {BENEFITS.map((b) => (
                <div key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2D6A4F] mt-0.5 flex-shrink-0" />
                  <p className="text-[#1B4332]">{b}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold text-[#1B4332] text-center mb-10">Simple Referral Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "You refer a client", desc: "Share our number or use the Refer a Client Ride button on this page." },
              { step: "2", title: "We pick up the pet", desc: "Our driver arrives on time, with care instructions noted." },
              { step: "3", title: "Client gets a tracking link", desc: "Owners follow along via text — no calls needed." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-6 border border-[#EDF7F0] shadow-sm text-center">
                <div className="w-10 h-10 rounded-full forest-gradient text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-[#1B4332] mb-2">{title}</h3>
                <p className="text-sm text-[#6B5B4F]">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Trust badges */}
      <section className="bg-[#1B4332] text-white py-12 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: Shield, label: "Insured Drivers" },
            { icon: Clock, label: "On-Time Pickup" },
            { icon: PawPrint, label: "Pet-Safe Vehicles" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-bold text-[#1B4332] mb-4">Ready to refer a client?</h2>
          <p className="text-[#6B5B4F] mb-8">Submit a ride request on their behalf, or share our number directly.</p>
          <Button
            onClick={handleReferral}
            className="forest-gradient text-white font-semibold px-10 py-6 text-base rounded-xl h-auto shadow-lg"
          >
            Refer a Client Ride <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <p className="mt-4 text-sm text-[#6B5B4F]">Or call/text: <a href="tel:+13126209297" className="text-[#2D6A4F] font-medium">(312) 620-9297</a></p>
        </motion.div>
      </section>

      <footer className="border-t border-[#D8F3DC] bg-white py-8 px-6 text-center text-sm text-[#6B5B4F]">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src="/assets/pawffeur-icon.svg" alt="Pawffeur" className="w-6 h-6" />
          <span className="font-semibold text-[#1B4332]">Pawffeur™</span>
        </div>
        <div className="flex justify-center gap-6 mb-3 flex-wrap">
          <Link to={createPageUrl("PublicSite")} className="hover:text-[#1B4332]">Pet Owners</Link>
          <Link to={createPageUrl("VetPartners")} className="hover:text-[#1B4332] font-medium text-[#2D6A4F]">Vet Clinics</Link>
          <a href="tel:+13126209297" className="hover:text-[#1B4332]">Contact</a>
        </div>
        {IS_LLC_ACTIVE ? (
          <p>Pawffeur™ is operated by Pawffeur, LLC. &copy; {new Date().getFullYear()} Pawffeur, LLC. All rights reserved.</p>
        ) : (
          <p>&copy; {new Date().getFullYear()} Pawffeur™ &middot; Chicago, IL</p>
        )}
      </footer>
    </div>
  );
}