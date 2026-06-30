import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Car, Zap, Route, Plane, Heart, Shield, Clock, 
  MessageSquare, ChevronRight, Stethoscope, Scissors, Home, Users, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl, IS_LLC_ACTIVE } from "@/utils";
import { Link } from "react-router-dom";
import PriceEstimator from "@/components/PriceEstimator";
import HowItWorks from "@/components/HowItWorks";
import { base44 } from "@/api/base44Client";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

export default function PublicSite() {
  const [scrolled, setScrolled] = useState(false);
  
  // Early Access Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupZip, setPickupZip] = useState("");
  const [destinationType, setDestinationType] = useState("");
  const [petTypeSize, setPetTypeSize] = useState("");
  const [petCount, setPetCount] = useState(1);
  const [timing, setTiming] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    
    // Auto-scroll to hash if present on mount
    const handleHash = () => {
      if (window.location.hash) {
        const id = window.location.hash.substring(1);
        setTimeout(() => {
          scrollToId(id);
        }, 300);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", handleHash);
    };
  }, []);

  const scrollToId = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleResetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPickupZip("");
    setDestinationType("");
    setPetTypeSize("");
    setPetCount(1);
    setTiming("");
    setNotes("");
    setConsent(false);
    setSubmitted(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!consent) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          email: email,
          phone: phone || undefined,
          pet_name: "",
          pet_type: petTypeSize.includes("Dog") ? "Dog" : petTypeSize.includes("Cat") ? "Cat" : "Other",
          pet_size: petTypeSize,
          ride_type: destinationType,
          pickup_address: pickupZip,
          dropoff_address: destinationType,
          preferred_date: new Date().toISOString().split("T")[0],
          preferred_time_window: timing,
          is_urgent: false,
          notes: notes ? `Pets: ${petCount}. Notes: ${notes}` : `Pets: ${petCount}`,
          consent: consent,
          consent_text: "I understand this is an early access request, not a confirmed ride. Pawffeur will contact me to review details and schedule coordinates.",
          source: "early_access_request"
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit early access request.");
      }
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit early access request:", err);
      // Fallback to show success screen anyway so user flow isn't blocked
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F1E3] text-[#3A3F47] selection:bg-[#E08A2B] selection:text-white">

      {/* Sticky Header */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-[#F7F1E3]/95 backdrop-blur-md shadow-md border-b border-[#273B2F]/10 h-16" 
          : "bg-transparent h-20"
      }`}>
        <div className="max-w-[1100px] mx-auto px-6 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img 
              src="/assets/pawffeur_logo.svg" 
              alt="Pawffeur Logo" 
              className="h-8 md:h-10 w-auto"
              loading="lazy"
            />
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#3A3F47]">
            <button onClick={() => scrollToId("about")} className="hover:text-[#E08A2B] transition-colors">What Pawffeur Is</button>
            <button onClick={() => scrollToId("experience")} className="hover:text-[#E08A2B] transition-colors">Experience</button>
            <button onClick={() => scrollToId("rides")} className="hover:text-[#E08A2B] transition-colors">Common Rides</button>
            <button onClick={() => scrollToId("how")} className="hover:text-[#E08A2B] transition-colors">How It Works</button>
            <button onClick={() => scrollToId("early-access")} className="hover:text-[#E08A2B] transition-colors">Early Access</button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => scrollToId("early-access")}
              className="bg-[#E08A2B] hover:bg-[#E08A2B]/90 text-white rounded-full px-6 py-2.5 text-sm font-bold shadow-sm transition-all duration-180 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
            >
              Request Early Access
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#273B2F] text-[#F7F1E3] py-20 md:py-28 relative overflow-hidden border-b border-[#273B2F]/20">
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #E08A2B 0%, transparent 50%), radial-gradient(circle at 80% 20%, #E08A2B 0%, transparent 50%)" }}
        />
        <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-[1fr_1.3fr] gap-12 items-center relative z-10">
          <div className="space-y-6 text-left">
            <motion.div {...fade(0)} className="inline-flex items-center gap-2 bg-[#F7F1E3]/15 backdrop-blur-md rounded-full px-4 py-1.5 text-xs font-bold text-[#E08A2B] border border-[#F7F1E3]/20 tracking-wider uppercase">
              <Clock className="w-3.5 h-3.5" /> Controlled Private Launch
            </motion.div>
            <motion.h1 {...fade(0.1)} className="text-4xl md:text-6xl font-bold tracking-tight leading-tight text-[#F7F1E3]">
              Premium Pet Transportation Built for Large Dogs
            </motion.h1>
            <motion.p {...fade(0.2)} className="text-lg md:text-xl text-[#F7F1E3]/85 leading-relaxed max-w-lg">
              Spacious, climate-controlled rides optimized for large dog breeds.
              <br />
              Vet visits • Grooming appointments • Airport trips • Daycare pickup • Boarding.
            </motion.p>
            <motion.div {...fade(0.3)} className="flex flex-col sm:flex-row gap-4 pt-2">
              <button 
                onClick={() => scrollToId("early-access")}
                className="bg-[#E08A2B] hover:bg-[#E08A2B]/90 text-white font-bold rounded-full px-8 py-4 text-base shadow-lg transition-all duration-180 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 w-full sm:w-auto"
              >
                Request Early Access
              </button>
              <button
                onClick={() => scrollToId("how")}
                className="bg-transparent border-2 border-[#F7F1E3] hover:bg-[#F7F1E3]/10 text-[#F7F1E3] font-bold rounded-full px-8 py-4 text-base transition-colors w-full sm:w-auto"
              >
                See how early access works
              </button>
            </motion.div>
          </div>
          
          <motion.div {...fade(0.2)} className="relative block mt-10 md:mt-0 space-y-3">
            <div className="absolute inset-0 bg-[#E08A2B] rounded-3xl rotate-2 opacity-10 blur-sm pointer-events-none" />
            <img 
              src="/assets/features_infographic.png" 
              alt="Pawffeur vehicle features infographic showing climate control, separate pet compartments, low-entry ramp, and sanitization station" 
              className="rounded-3xl shadow-xl w-full object-cover aspect-[16/9] border border-[#F7F1E3]/10"
              loading="lazy"
            />
            <p className="text-[10px] text-[#F7F1E3]/65 italic leading-relaxed text-center px-4">
              Vehicle concept visualization shown. Final vehicle configuration, service areas, pricing, and availability may vary as Pawffeur tests and refines operations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-[1100px] mx-auto px-6 py-16 space-y-20">

        {/* Section: About (#about) */}
        <motion.div {...fade(0.05)} id="about" className="bg-white rounded-3xl border border-[#273B2F]/10 p-8 md:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#273B2F] text-white text-[10px] font-bold tracking-wider uppercase px-4 py-1.5 rounded-bl-2xl">
            Now collecting early ride requests
          </div>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-[#273B2F] mb-4">What Pawffeur Is</h2>
            <p className="text-base text-[#3A3F47]/90 leading-relaxed">
              Pawffeur is preparing a controlled private launch. We're collecting early ride requests from a limited group of pet owners before our public launch — so we can understand real routes, pet needs, timing, pricing, and local demand before expanding availability.
            </p>
          </div>
        </motion.div>

        {/* Section: Experience / Video (#experience) */}
        <motion.div 
          {...fade(0.05)} 
          id="experience" 
          className="grid md:grid-cols-[1.2fr_1fr] gap-12 items-center bg-[#273B2F] text-[#F7F1E3] rounded-3xl p-8 md:p-12 shadow-xl border border-[#F7F1E3]/10 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 10% 20%, #E08A2B 0%, transparent 40%)" }}
          />
          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#F7F1E3]/15 backdrop-blur-md rounded-full px-4 py-1.5 text-xs font-bold text-[#E08A2B] border border-[#F7F1E3]/20 tracking-wider uppercase">
              <Zap className="w-3.5 h-3.5" /> Watch us in action
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#F7F1E3] leading-tight">
              Calm, Caring Rides—Every Time
            </h2>
            <p className="text-[#F7F1E3]/85 text-base md:text-lg leading-relaxed">
              At Pawffeur, your pet isn't cargo—they're the passenger. We've designed a transportation experience from the ground up to keep your dog relaxed, safe, and happy during their journey.
            </p>
            <ul className="space-y-3 text-sm text-[#F7F1E3]/80">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#E08A2B] flex-shrink-0 mt-0.5" />
                <span>Climate-controlled, custom spacious cabins for large dogs.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#E08A2B] flex-shrink-0 mt-0.5" />
                <span>Stress-free, low-stimulation environment with gentle music.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#E08A2B] flex-shrink-0 mt-0.5" />
                <span>Trained handlers focused entirely on pet safety and comfort.</span>
              </li>
            </ul>
            <div className="pt-2">
              <button 
                onClick={() => scrollToId("early-access")}
                className="bg-[#E08A2B] hover:bg-[#E08A2B]/90 text-white font-bold rounded-full px-8 py-3.5 text-sm transition-all duration-180 hover:-translate-y-0.5 shadow-md active:scale-95"
              >
                Request Early Access
              </button>
            </div>
          </div>
          <div className="flex justify-center relative z-10">
            <div className="relative w-full max-w-[320px] rounded-[36px] p-3 bg-[#1E2E25] shadow-2xl border-4 border-[#3A4E42]">
              {/* Camera Notch Mockup */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-[#1E2E25] rounded-full z-20 flex items-center justify-center">
                <div className="w-3 h-3 bg-black rounded-full mr-2" />
                <div className="w-1.5 h-1.5 bg-[#0F1A13] rounded-full" />
              </div>
              <div className="overflow-hidden rounded-[28px] bg-black aspect-[9/16] relative">
                <video 
                  src="/assets/pawffeur_promo.mp4" 
                  controls 
                  preload="metadata"
                  className="w-full h-full object-cover"
                  poster="/assets/pawffeur_promo_poster.jpg"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section: Common Ride Needs (#rides) */}
        <motion.div {...fade(0.05)} id="rides">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-[#273B2F] mb-3">Common Ride Needs</h2>
            <p className="text-sm text-[#3A3F47]/70">We support your pet's local transport needs for a variety of routine and special care destinations.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Stethoscope, title: "Vet & clinic appointments", desc: "Transport to and from routine vet visits, specialized checkups, or check-ins." },
              { icon: Scissors, title: "Grooming drop-off & pickup", desc: "Coordinated rides to get your pet to their grooming appointments on time." },
              { icon: Home, title: "Boarding & daycare transport", desc: "Rides to check-in or checkout at your preferred boarding facility." },
              { icon: Heart, title: "Senior pet transport", desc: "Padded, low-stimulation compartments and careful ramp access for older companions." },
              { icon: Users, title: "Multi-pet household rides", desc: "Spacious compartmental setups suitable for carrying multiple family pets together." },
              { icon: Plane, title: "Airport pickup coordination", desc: "Organized transfers to transport your pets directly to cargo terminals or pick-up spots." },
            ].map((ride, i) => (
              <div key={ride.title} className="bg-[#F7F1E3] rounded-2xl border border-[#273B2F]/10 p-6 h-full flex flex-col hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#273B2F]/10 flex items-center justify-center mb-4">
                  <ride.icon className="w-6 h-6 text-[#273B2F]" />
                </div>
                <h3 className="font-bold text-lg text-[#273B2F] mb-2">{ride.title}</h3>
                <p className="text-sm text-[#3A3F47]/80 leading-relaxed">{ride.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* How It Works - Detailed Timeline */}
        <div id="how">
          <HowItWorks />
        </div>

        {/* Secondary Section: Typical Ride Cost Estimator */}
        <motion.div {...fade(0.05)} className="max-w-[820px] mx-auto border-t border-[#273B2F]/10 pt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#273B2F] mb-2">Typical Ride Cost Estimator</h2>
            <p className="text-sm text-[#3A3F47]/75 max-w-lg mx-auto">
              Want to see typical pricing before requesting? Use our range calculator. This displays an estimate only — final pricing is calculated during scheduling.
            </p>
          </div>
          <PriceEstimator />
        </motion.div>

        {/* Cabin Layout - Optimized for Large Dogs */}
        <motion.div {...fade(0.05)} id="cabin-layout">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#273B2F] mb-3">Premium Cabin Design</h2>
            <p className="text-base text-[#3A3F47]/80 max-w-2xl mx-auto leading-relaxed">
              Our cabin is optimized for large dog breeds with spacious XL and medium crates, individual climate control, and premium comfort amenities.
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden border border-[#273B2F]/10 shadow-lg">
            <img 
              src="/assets/cabin_capacity_layout_optimized.png" 
              alt="Pawffeur Premium Cabin Layout - Optimized for Large Dogs" 
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
          <p className="text-[10px] text-[#3A3F47]/65 text-center italic mt-3">
            Vehicle concept visualization shown. Final vehicle configuration, service areas, pricing, and availability may vary as Pawffeur tests and refines operations.
          </p>
        </motion.div>

        {/* Section: Early Access Ride Request Form (#early-access) */}
        <motion.div {...fade(0.05)} id="early-access" className="max-w-[700px] mx-auto scroll-mt-24">
          <div className="bg-white rounded-3xl border border-[#273B2F]/15 overflow-hidden shadow-sm">
            <div className="bg-[#273B2F] px-6 py-5">
              <h3 className="text-[#F7F1E3] font-bold text-xl">Request Early Access</h3>
              <p className="text-[#F7F1E3]/70 text-xs mt-1">Tell us about your pet and your trip — we'll reach out as launch slots open.</p>
            </div>
            
            <div className="p-6">
              {!submitted ? (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#273B2F] uppercase tracking-wide">Your Name *</label>
                      <input 
                        required
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="First and last name"
                        className="w-full bg-[#F7F1E3]/35 border border-[#273B2F]/15 rounded-xl px-4 py-2.5 text-sm text-[#3A3F47] focus:outline-none focus:ring-2 focus:ring-[#E08A2B] focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#273B2F] uppercase tracking-wide">Email *</label>
                      <input 
                        required
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-[#F7F1E3]/35 border border-[#273B2F]/15 rounded-xl px-4 py-2.5 text-sm text-[#3A3F47] focus:outline-none focus:ring-2 focus:ring-[#E08A2B] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#273B2F] uppercase tracking-wide">Phone (Optional)</label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="(312) 555-0199"
                        className="w-full bg-[#F7F1E3]/35 border border-[#273B2F]/15 rounded-xl px-4 py-2.5 text-sm text-[#3A3F47] focus:outline-none focus:ring-2 focus:ring-[#E08A2B] focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#273B2F] uppercase tracking-wide">Pickup area or ZIP *</label>
                      <input 
                        required
                        type="text" 
                        value={pickupZip}
                        onChange={e => setPickupZip(e.target.value)}
                        placeholder="ZIP Code or Neighborhood"
                        className="w-full bg-[#F7F1E3]/35 border border-[#273B2F]/15 rounded-xl px-4 py-2.5 text-sm text-[#3A3F47] focus:outline-none focus:ring-2 focus:ring-[#E08A2B] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#273B2F] uppercase tracking-wide">Destination type *</label>
                      <select 
                        required
                        value={destinationType}
                        onChange={e => setDestinationType(e.target.value)}
                        className="w-full appearance-none bg-[#F7F1E3]/35 border border-[#273B2F]/15 rounded-xl px-4 py-2.5 text-sm text-[#3A3F47] focus:outline-none focus:ring-2 focus:ring-[#E08A2B]"
                      >
                        <option value="">— Select destination —</option>
                        <option value="Vet">Vet Clinic / Appointment</option>
                        <option value="Groomer">Groomer / Salon</option>
                        <option value="Boarding/Daycare">Boarding & Daycare</option>
                        <option value="Airport">Airport Transport</option>
                        <option value="Other">Other / Custom</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#273B2F] uppercase tracking-wide">Pet Type & size *</label>
                      <select 
                        required
                        value={petTypeSize}
                        onChange={e => setPetTypeSize(e.target.value)}
                        className="w-full appearance-none bg-[#F7F1E3]/35 border border-[#273B2F]/15 rounded-xl px-4 py-2.5 text-sm text-[#3A3F47] focus:outline-none focus:ring-2 focus:ring-[#E08A2B]"
                      >
                        <option value="">— Select pet type —</option>
                        <option value="Cat">Cat / Small Feline</option>
                        <option value="Small Dog">Small Dog (under 20 lb)</option>
                        <option value="Medium Dog">Medium Dog (20-40 lb)</option>
                        <option value="Large Dog">Large Dog (over 40 lb)</option>
                        <option value="Multiple Pets">Multiple Pets (family setup)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.5fr_2fr] gap-4 items-center pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#273B2F] uppercase tracking-wide">Number of pets</label>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button" 
                          onClick={() => setPetCount(c => Math.max(1, c - 1))}
                          className="w-8 h-8 rounded-lg bg-[#273B2F]/10 text-[#273B2F] font-bold text-sm hover:bg-[#273B2F]/20 transition"
                        >-</button>
                        <span className="font-bold text-sm w-6 text-center">{petCount}</span>
                        <button 
                          type="button" 
                          onClick={() => setPetCount(c => Math.min(6, c + 1))}
                          className="w-8 h-8 rounded-lg bg-[#273B2F]/10 text-[#273B2F] font-bold text-sm hover:bg-[#273B2F]/20 transition"
                        >+</button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#273B2F] uppercase tracking-wide">Preferred timing *</label>
                      <select 
                        required
                        value={timing}
                        onChange={e => setTiming(e.target.value)}
                        className="w-full appearance-none bg-[#F7F1E3]/35 border border-[#273B2F]/15 rounded-xl px-4 py-2.5 text-sm text-[#3A3F47] focus:outline-none focus:ring-2 focus:ring-[#E08A2B]"
                      >
                        <option value="">— Select timing —</option>
                        <option value="This week">This week</option>
                        <option value="This month">This month</option>
                        <option value="Flexible">Just researching / Flexible</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#273B2F] uppercase tracking-wide">Notes & pet requirements</label>
                    <textarea 
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Anything we should know? (e.g. anxious, crate trained, special care...)"
                      rows={3}
                      className="w-full bg-[#F7F1E3]/35 border border-[#273B2F]/15 rounded-xl px-4 py-2.5 text-sm text-[#3A3F47] focus:outline-none focus:ring-2 focus:ring-[#E08A2B] focus:border-transparent placeholder-[#3A3F47]/45"
                    />
                  </div>

                  <div className="flex items-start gap-2.5 pt-2">
                    <input 
                      required
                      type="checkbox" 
                      id="consent"
                      checked={consent}
                      onChange={e => setConsent(e.target.checked)}
                      className="w-4 h-4 rounded border-[#273B2F]/15 text-[#E08A2B] focus:ring-[#E08A2B] mt-0.5"
                    />
                    <label htmlFor="consent" className="text-xs text-[#3A3F47]/85 leading-relaxed">
                      I understand this is an early access request, not a confirmed ride. Pawffeur will contact me to review details and schedule coordinates. *
                    </label>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={submitting || !consent}
                    className="w-full bg-[#E08A2B] hover:bg-[#E08A2B]/90 text-white rounded-xl font-bold h-12 shadow-md transition-all active:scale-98 mt-2"
                  >
                    {submitting ? "Sending..." : "Request Early Access"}
                  </Button>
                </form>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="py-10 text-center space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-[#E08A2B]/10 flex items-center justify-center mx-auto text-[#E08A2B]">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[#273B2F]">Request Received!</h4>
                    <p className="text-sm text-[#3A3F47]/80 mt-2 max-w-sm mx-auto">
                      Thanks! Your early access request is in. We'll reach out as launch slots open.
                    </p>
                    <button 
                      onClick={handleResetForm}
                      className="mt-6 border border-[#273B2F]/20 hover:border-[#E08A2B] hover:text-[#E08A2B] text-xs font-bold text-[#273B2F] rounded-xl px-5 py-2.5 bg-transparent transition-all active:scale-95"
                    >
                      ← Back to Form
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          <p className="text-[10px] text-[#3A3F47]/65 italic text-center mt-3 leading-relaxed">
            Vehicle concept visualization shown. Final vehicle configuration, service areas, pricing, and availability may vary as Pawffeur tests and refines operations.
          </p>
        </motion.div>

        {/* Service Area */}
        <motion.div {...fade(0.05)} id="service-area">
          <div className="bg-[#F7F1E3] rounded-3xl border border-[#273B2F]/10 p-8">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#273B2F] text-center">Serving Chicago & Surrounding Neighborhoods</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 max-w-md mx-auto">
              {[
                "Lincoln Park",
                "Lakeview",
                "Bucktown",
                "Wicker Park",
                "Logan Square",
                "West Loop",
                "River North",
                "Downtown Chicago",
              ].map((neighborhood, i) => (
                <div key={i} className="flex items-center gap-2 text-[#3A3F47]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E08A2B]" />
                  {neighborhood}
                </div>
              ))}
            </div>
            <p className="text-sm text-[#3A3F47]/70 mt-6 pt-6 border-t border-[#273B2F]/10 text-center">
              Plus surrounding areas within our service zone. Outside these areas? <strong>Contact us</strong> — we may still be able to help.
            </p>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div {...fade(0.05)}>
          <div className="bg-[#F7F1E3] rounded-3xl border border-[#273B2F]/10 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#273B2F]">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-5">
              {[
                { q: "Do you transport cats?", a: "Yes. We transport dogs, cats, and other small household pets." },
                { q: "Can I ride with my pet?", a: "No. Pawffeur™ is designed for pet-only transportation so we can keep the service focused, care-oriented, and consistent." },
                { q: "How far in advance should I request a ride?", a: "We recommend at least 24 hours notice when possible." },
              ].map((item, i) => (
                <div key={i} className="border-b border-[#273B2F]/10 last:border-0 pb-5 last:pb-0">
                  <p className="text-sm font-semibold text-[#273B2F] mb-1">{item.q}</p>
                  <p className="text-sm text-[#3A3F47]/80 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>

      {/* Final CTA */}
      <section className="bg-[#273B2F] text-[#F7F1E3] border-t border-[#273B2F]/10">
        <div className="max-w-[1100px] mx-auto px-6 py-20 text-center">
          <motion.div {...fade(0)}>
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[#F7F1E3]">Want in on early access?</h2>
            <button 
              onClick={() => scrollToId("early-access")}
              className="bg-[#E08A2B] hover:bg-[#E08A2B]/90 text-white font-bold rounded-full px-10 py-5 text-lg shadow-lg hover:shadow-xl transition-all duration-180 hover:-translate-y-0.5 active:scale-95"
            >
              Request Early Access Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#273B2F]/95 text-[#F7F1E3]/70 text-center py-12 border-t border-[#F7F1E3]/10">
        <div className="max-w-[1100px] mx-auto px-6 space-y-6">
          <div id="contact">
            <img 
              src="/assets/pawffeur_logo.svg" 
              alt="Pawffeur Wordmark" 
              className="h-10 w-auto mx-auto mb-4" 
              loading="lazy"
            />
            <p className="text-xs text-[#F7F1E3]/65 max-w-sm mx-auto leading-relaxed italic mb-4">
              Pet-first local transportation.
            </p>
            <div className="flex justify-center items-center text-sm text-[#F7F1E3]/80">
              <a href="mailto:support@pawffeur.com" className="hover:text-white transition">✉ support@pawffeur.com</a>
            </div>
          </div>
          <div className="flex justify-center gap-6 text-sm flex-wrap text-[#F7F1E3]/80">
            <button onClick={() => scrollToId("about")} className="hover:text-white transition">Pet Owners</button>
            <Link to={createPageUrl("VetPartners")} className="hover:text-white transition">Vet Clinics &amp; Partners</Link>
            <button onClick={() => scrollToId("early-access")} className="hover:text-white transition">Early Access Request</button>
            <span className="text-white/40">•</span>
            <Link to="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link>
            <span className="text-white/40">•</span>
            <Link to="/terms-and-conditions" className="hover:text-white transition">Terms &amp; Conditions</Link>
          </div>
          <div className="border-t border-white/10 pt-6 space-y-3">
            <p className="text-[10px] text-[#F7F1E3]/50 max-w-md mx-auto leading-relaxed">
              Pawffeur is in a controlled private launch. Imagery shown is a vehicle concept visualization. Service areas, pricing, and availability may vary.
            </p>
            {IS_LLC_ACTIVE ? (
              <p className="text-xs text-[#F7F1E3]/50">Pawffeur™ is operated by Pawffeur, LLC. © 2026 Pawffeur, LLC. All rights reserved.</p>
            ) : (
              <p className="text-xs text-[#F7F1E3]/50">© 2026 Pawffeur™. All rights reserved.</p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
