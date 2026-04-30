import React from "react";
import { motion } from "framer-motion";
import { MapPin, Car, Plane, Zap, Route, Heart, Dog, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import PriceEstimator from "@/components/PriceEstimator";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

export default function PublicSite() {
  const [highlightPremium, setHighlightPremium] = React.useState(false);
  const [premiumSelected, setPremiumSelected] = React.useState(false);
  
  const scrollToEstimator = () => {
    document.getElementById("price-estimator")?.scrollIntoView({ behavior: "smooth" });
  };
  
  const scrollToPremium = (e) => {
    e.preventDefault();
    const premiumCard = document.getElementById("premium-card");
    if (premiumCard) {
      const offsetTop = premiumCard.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
      setHighlightPremium(true);
      setPremiumSelected(true);
      setTimeout(() => setHighlightPremium(false), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F3]">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#D8F3DC]/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl forest-gradient flex items-center justify-center">
              <Dog className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[#1B4332] text-lg">DogChauffeur</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("BookingRequest")}>
              <Button className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl text-sm">
                Book a Ride
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 forest-gradient" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #74C69D 0%, transparent 50%), radial-gradient(circle at 80% 20%, #52B788 0%, transparent 50%)" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-48 text-center text-white flex items-center justify-center min-h-[600px] md:min-h-[700px]">
          <div className="w-full">
            <motion.div {...fade(0)}>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-1.5 text-sm mb-8 border border-white/20">
                <MapPin className="w-3.5 h-3.5" /> Chicago, IL
              </div>
            </motion.div>
            <motion.div {...fade(0.1)} className="bg-white/8 backdrop-blur-lg rounded-3xl border border-white/10 px-6 md:px-12 py-12 md:py-16 max-w-4xl mx-auto">
              <motion.h1 {...fade(0.1)} className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6 text-white">
                Safe, Reliable Pet<br />Transportation in Chicago
              </motion.h1>
              <motion.p {...fade(0.2)} className="text-xl md:text-2xl text-white/95 max-w-3xl mx-auto mb-10 leading-relaxed">
                Door-to-door rides for dogs, cats, and other pets.
                <br />
                Vet visits • Grooming appointments • Airport trips • Daycare pickup.
              </motion.p>
              <motion.div {...fade(0.3)} className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={scrollToEstimator}
                  className="bg-white text-[#1B4332] hover:bg-[#E8F5E9] rounded-xl font-bold px-10 py-5 text-lg shadow-2xl transition"
                >
                  💰 Estimate a Ride Price
                </button>
                <Link to="/SafetyStandards">
                  <Button size="lg" variant="outline" className="border-2 border-white bg-white text-[#1B4332] hover:bg-[#E8F5E9] rounded-xl font-semibold px-10 py-5 text-base h-auto w-full sm:w-auto">
                    📋 View Our Safety Standards
                  </Button>
                </Link>
              </motion.div>
              <motion.div {...fade(0.4)} className="mt-8">
                <a href="tel:+13126209297" className="text-sm text-white/70 hover:text-white/90 transition">
                  📞 Questions before booking? Call or text our office at (312) 620-9297
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-10">

        {/* Our Services */}
        <motion.div {...fade(0)}>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B4332] mb-3">Our Services</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Car, title: "Vet Visits", desc: "Safe rides to veterinary appointments." },
              { icon: Zap, title: "Grooming Appointments", desc: "Door-to-door transportation to your groomer." },
              { icon: Route, title: "Daycare Pickup & Drop-off", desc: "Busy schedule? We'll handle the transport." },
              { icon: Plane, title: "Airport Pet Transport", desc: "Reliable rides for pets traveling with owners." },
              { icon: Heart, title: "Special Care Transport", desc: "Comfortable rides for senior or anxious pets." },
            ].map((service, i) => (
              <motion.div key={service.title} {...fade(0.05 + i * 0.03)}>
                <div className="bg-white rounded-2xl border border-[#EDF7F0] p-6 h-full flex flex-col card-hover">
                  <div className="w-10 h-10 rounded-xl bg-[#EDF7F0] flex items-center justify-center mb-4">
                    <service.icon className="w-5 h-5 text-[#2D6A4F]" />
                  </div>
                  <h3 className="font-semibold text-[#1B4332] mb-2">{service.title}</h3>
                  <p className="text-sm text-[#6B5B4F]/75 leading-relaxed">{service.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <Link to={createPageUrl("BookingRequest")}>
              <Button size="lg" className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl font-semibold px-10">
                Book Your Pet's Ride
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Safety Comes First �� Certification Trust Section */}
        <motion.div {...fade(0.05)}>
          <div className="bg-white rounded-3xl border border-[#EDF7F0] p-6 md:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-[#EDF7F0] rounded-full px-4 py-1.5 text-xs font-semibold text-[#2D6A4F] mb-4">
                <Shield className="w-3.5 h-3.5" />
                Certified • Insured • Pet Safety Focused
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1B4332] mb-3">Safety Comes First</h2>
              <p className="text-base text-[#6B5B4F]/80 max-w-xl mx-auto leading-relaxed">
                We're trained in canine behavior and safe handling, including working with anxious and reactive dogs.
                Your pet is handled with care, control, and experience.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { emoji: "🎓", title: "Certified in Canine Behavior & Safe Handling", desc: "Formal training in animal behavior ensures every pet is handled calmly and confidently." },
                { emoji: "🐕", title: "Experienced with High-Energy & Reactive Dogs", desc: "We understand the nuances of anxious and reactive dogs and know how to keep them comfortable." },
                { emoji: "🛡️", title: "Safety-Trained Pet Transport Specialist", desc: "From secure loading to calm handling, every step of the ride follows proven safety protocols." },
              ].map((item, i) => (
                <div key={i} className="bg-[#F9F7F3] rounded-2xl p-5 text-center flex flex-col items-center gap-3">
                  <span className="text-3xl">{item.emoji}</span>
                  <p className="font-semibold text-[#1B4332] text-sm leading-snug">{item.title}</p>
                  <p className="text-xs text-[#6B5B4F]/70 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Service Tiers - Decision-Guided Experience */}
        <motion.div {...fade(0.05)}>
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1B4332] mb-2">Choose Your Service Level</h2>
            <p className="text-sm text-[#6B5B4F]/70">Every dog is different. We have you covered either way.</p>
          </div>
          
          {/* Decision Helper Section */}
          <div className="bg-gradient-to-br from-[#EDF7F0] to-[#D8F3DC]/50 rounded-2xl p-6 mb-8 border border-[#B7E4C7]/30">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#1B4332] flex items-center justify-center">
                <span className="text-white text-sm">?</span>
              </div>
              <h3 className="text-base font-bold text-[#1B4332]">Not sure which service is right?</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 bg-white/60 rounded-xl p-4">
                <span className="text-xl shrink-0">🐕</span>
                <div>
                  <p className="text-sm font-medium text-[#1B4332]">Calm, well-behaved dogs</p>
                  <p className="text-xs text-[#6B5B4F]/70 mt-0.5">Standard Transport is perfect</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-[#1B4332]/10 rounded-xl p-4 ring-2 ring-[#1B4332]/20">
                <span className="text-xl shrink-0">🐾</span>
                <div>
                  <p className="text-sm font-medium text-[#1B4332]">Anxious, reactive, or first-time riders</p>
                  <p className="text-xs text-[#6B5B4F]/70 mt-0.5">Premium Behavior-Aware is recommended</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pricing Cards */}
          <div className="grid sm:grid-cols-2 gap-6 items-stretch">
            {/* Standard Card */}
            <div className="bg-white rounded-3xl border border-[#EDF7F0] p-7 flex flex-col">
              <div className="text-2xl mb-3">🐶</div>
              <h3 className="text-xl font-bold text-[#1B4332]">Standard Transport</h3>
              <p className="text-sm text-[#6B5B4F]/75 leading-relaxed mt-2">Reliable, everyday transport for calm, well-behaved dogs who settle easily in new environments.</p>
              <ul className="space-y-2 mt-4">
                {["Door-to-door service", "Real-time status updates", "Secured, clean vehicle", "Careful, professional handling"].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[#6B5B4F]">
                    <span className="w-5 h-5 rounded-full bg-[#EDF7F0] flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#52B788]" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              
              {/* Best for / Not recommended */}
              <div className="mt-4 pt-4 border-t border-[#EDF7F0] flex-1">
                <div className="mb-3">
                  <p className="text-xs font-semibold text-[#1B4332] mb-1.5">Best for:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-2 text-xs text-[#6B5B4F]">
                      <span className="text-[#52B788]">•</span>
                      Calm, well-socialized dogs
                    </li>
                    <li className="flex items-center gap-2 text-xs text-[#6B5B4F]">
                      <span className="text-[#52B788]">•</span>
                      Dogs comfortable with car rides
                    </li>
                  </ul>
                </div>
                <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200/40">
                  <p className="text-xs font-semibold text-amber-800 mb-1.5 flex items-center gap-1.5">
                    <span className="text-amber-500">&#9888;</span>
                    Not recommended for:
                  </p>
                  <ul className="space-y-1 mb-2.5">
                    <li className="flex items-center gap-2 text-xs text-amber-700">
                      <span className="text-amber-400">&#8226;</span>
                      Anxious or reactive dogs
                    </li>
                    <li className="flex items-center gap-2 text-xs text-amber-700">
                      <span className="text-amber-400">&#8226;</span>
                      First-time riders
                    </li>
                  </ul>
                  <a 
                    href="#premium-card" 
                    onClick={scrollToPremium}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] hover:text-[#52B788] pt-2 border-t border-amber-200/40 transition-colors cursor-pointer group"
                  >
                    <span className="text-[#52B788] group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                    For these cases, choose Behavior-Aware Transport
                  </a>
                  <p className="text-[10px] text-amber-600/80 mt-1.5 italic">Most chosen for first-time or anxious dogs</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-[#EDF7F0]">
                <Link to={createPageUrl("BookingRequest")}>
                  <Button className="w-full bg-white hover:bg-[#EDF7F0] text-[#1B4332] border-2 border-[#1B4332] rounded-xl font-semibold h-12">
                    Book Standard Ride
                  </Button>
                </Link>
                <a 
                  href="#premium-card" 
                  onClick={scrollToPremium}
                  className="block text-center text-[11px] text-[#6B5B4F]/70 mt-2 hover:text-[#1B4332] transition-colors cursor-pointer"
                >
                  Unsure? Most first-time riders choose <span className="font-medium text-[#1B4332]">Behavior-Aware Transport</span>.
                </a>
              </div>
            </div>
            
            {/* Premium Card - Highlighted */}
            <div 
              id="premium-card"
              className={`bg-[#1B4332] rounded-3xl p-7 flex flex-col text-white relative overflow-hidden sm:scale-[1.02] sm:-my-2 transition-all duration-300 ${
                highlightPremium 
                  ? 'ring-4 ring-[#52B788] shadow-2xl shadow-[#52B788]/30' 
                  : 'ring-4 ring-[#52B788]/30'
              }`}
            >
              {/* Decorative elements */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#2D6A4F]/50 pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-[#2D6A4F]/30 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col h-full">
                {/* Selection Confirmation Badge - shows after bridge click */}
                {highlightPremium && (
                  <div className="inline-flex items-center gap-1.5 bg-white/95 rounded-full px-3 py-1.5 text-xs font-semibold text-[#1B4332] mb-3 w-fit animate-pulse shadow-lg">
                    <span className="text-[#52B788]">&#10003;</span>
                    Best choice for anxious or first-time dogs
                  </div>
                )}
                
                {/* Recommended Badge */}
                <div className={`inline-flex items-center gap-1.5 bg-[#52B788] rounded-full px-3 py-1 text-xs font-bold text-white mb-3 w-fit ${highlightPremium ? 'opacity-0 h-0 mb-0 overflow-hidden' : ''}`}>
                  Recommended
                </div>
                
                <div className="text-2xl mb-3">🐕</div>
                <h3 className="text-xl font-bold text-white">Behavior-Aware Transport</h3>
                <p className="text-sm text-white/80 leading-relaxed mt-2">Designed for dogs that need extra patience, calm handling, and a low-stress transport experience.</p>
                
                {/* Strong recommendation line */}
                <div className="bg-[#52B788]/20 rounded-xl px-4 py-2.5 mt-4 border border-[#52B788]/30">
                  <p className="text-sm font-semibold text-[#B7E4C7]">Recommended for anxious, reactive, or first-time riders</p>
                </div>
                
                <ul className="space-y-2 mt-4 flex-1">
                  <li className="flex items-center gap-2.5 text-sm text-[#B7E4C7] font-medium">
                    <span className="w-5 h-5 rounded-full bg-[#52B788]/30 flex items-center justify-center shrink-0">
                      <span className="text-xs">✓</span>
                    </span>
                    Includes everything in Standard
                  </li>
                  {["Reduced stress during pickup and transport", "Certified behavior-aware handling", "Calm, low-stimulation environment", "Extra patience for nervous dogs"].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/85">
                      <span className="w-5 h-5 rounded-full bg-[#2D6A4F] flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#74C69D]" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6 pt-4 border-t border-white/10">
                  <Link to={createPageUrl("BookingRequest")}>
                    <Button className="w-full bg-[#52B788] hover:bg-[#74C69D] text-[#1B4332] rounded-xl font-bold h-12">
                      Choose Behavior-Aware Transport
                    </Button>
                  </Link>
                  {premiumSelected && !highlightPremium && (
                    <p className="text-[11px] text-[#B7E4C7] text-center mt-2 font-medium">
                      Recommended for your dog&apos;s needs
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Trust Line */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 bg-[#EDF7F0] rounded-full px-5 py-2.5">
              <Shield className="w-4 h-4 text-[#1B4332]" />
              <p className="text-sm text-[#1B4332] font-medium">Every ride is handled with safety-first protocols and real-time updates.</p>
            </div>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div {...fade(0.05)}>
          <div className="bg-white rounded-3xl border border-[#EDF7F0] p-6 md:p-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1B4332]">How It Works</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { n: "1", title: "Request a Ride", body: "Enter pickup, destination, and your pet details." },
                { n: "2", title: "We Confirm", body: "We review the request and confirm availability." },
                { n: "3", title: "Safe Ride for Your Pet", body: "Your pet is transported safely and comfortably." },
              ].map(step => (
                <div key={step.n} className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-lg font-bold mb-4">
                    {step.n}
                  </div>
                  <h3 className="text-lg font-semibold text-[#1B4332] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#6B5B4F]/75">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pet Safety Promise */}
        <motion.div {...fade(0.05)}>
          <div className="relative bg-[#1B4332] rounded-3xl overflow-hidden p-6 md:p-10 text-white">
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-[#2D6A4F]/40 pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-[#2D6A4F]/30 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-[#D8F3DC] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#1B4332]" />
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Our Pet Safety Promise</h2>
              <p className="text-white/70 text-center text-sm mb-8 max-w-md mx-auto">
                We treat every pet like our own. Here's what you can count on every single ride.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: "🔒", title: "Secure Transport Procedures", desc: "Pets are always secured and never left unattended during the ride." },
                  { icon: "🐾", title: "Experienced Handlers", desc: "Our drivers are trained in pet behavior and calm handling techniques." },
                  { icon: "🚗", title: "Door-to-Door Service", desc: "We come to you and deliver directly — no drop-offs at unfamiliar places." },
                  { icon: "📱", title: "Real-Time Communication", desc: "You'll hear from us at pickup and delivery so you're never left wondering." },
                ].map((item, i) => (
                  <div key={i} className="bg-white/10 rounded-2xl p-5 flex gap-4 items-start backdrop-blur-sm">
                    <span className="text-2xl shrink-0">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-white text-sm mb-1">{item.title}</p>
                      <p className="text-white/65 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Service Area */}
        <motion.div {...fade(0.05)}>
          <div className="bg-white rounded-3xl border border-[#EDF7F0] p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#1B4332] text-center">Serving Chicago & Surrounding Neighborhoods</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
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
                <div key={i} className="flex items-center gap-2 text-[#6B5B4F]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#52B788]" />
                  {neighborhood}
                </div>
              ))}
            </div>
            <p className="text-sm text-[#6B5B4F]/70 mt-6 pt-6 border-t border-[#EDF7F0]">
              Plus surrounding areas within our service zone. Outside these areas? <strong>Contact us</strong> — we may still be able to help.
            </p>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div {...fade(0.05)}>
          <div className="bg-white rounded-3xl border border-[#EDF7F0] p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#1B4332]">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-5">
              {[
                { q: "Do you transport cats?", a: "Yes. We transport dogs, cats, and other small household pets." },
                { q: "Can I ride with my pet?", a: "No. DogChauffeur is designed for pet-only transportation so we can keep the service focused, safe, and consistent." },
                { q: "How far in advance should I book?", a: "We recommend at least 24 hours notice when possible." },
              ].map((item, i) => (
                <div key={i} className="border-b border-[#EDF7F0] last:border-0 pb-5 last:pb-0">
                  <p className="text-sm font-semibold text-[#1B4332] mb-1">{item.q}</p>
                  <p className="text-sm text-[#6B5B4F]/75 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Price Estimator */}
        <motion.div {...fade(0.05)} id="price-estimator">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B4332] mb-3">How Much Will It Cost?</h2>
            <p className="text-lg text-[#6B5B4F]/70">Get an instant estimate — no signup needed.</p>
          </div>
          <PriceEstimator />
        </motion.div>



        {/* Testimonials */}
        <motion.div {...fade(0.05)}>
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B4332] mb-3">What Pet Owners Are Saying</h2>
            <p className="text-lg text-[#6B5B4F]/70">Real feedback from DogChauffeur customers across Chicago.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                name: "Jessica M.",
                location: "Lincoln Park",
                pet: "Benny, Golden Retriever",
                quote: "DogChauffeur made getting Benny to his vet appointments so easy. The driver was calm, professional, and sent updates throughout. I'll never scramble for a ride again.",
              },
              {
                name: "Carlos R.",
                location: "Wicker Park",
                pet: "Luna, French Bulldog",
                quote: "Luna gets anxious in cars, but she was totally relaxed when she arrived at the groomer. You can tell the driver knows how to handle dogs. Highly recommend.",
              },
              {
                name: "Diane T.",
                location: "Lakeview",
                pet: "Oscar, Tabby Cat",
                quote: "I was skeptical at first but the experience was seamless. Got a text when Oscar was picked up and another at drop-off. Exactly what a busy pet owner needs.",
              },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#EDF7F0] p-6 flex flex-col gap-4 shadow-sm">
                <p className="text-sm text-[#6B5B4F] leading-relaxed">"{t.quote}"</p>
                <div className="mt-auto pt-4 border-t border-[#EDF7F0]">
                  <p className="text-sm font-semibold text-[#1B4332]">{t.name}</p>
                  <p className="text-xs text-[#6B5B4F]/60">{t.pet} · {t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Final CTA */}
      <section className="forest-gradient text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <motion.div {...fade(0)}>
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Ready to Book a Ride for Your Pet?</h2>
            <Link to={createPageUrl("BookingRequest")}>
              <Button size="lg" className="bg-white text-[#1B4332] hover:bg-[#EDF7F0] rounded-xl font-semibold px-10">
                🟢 Request a Ride Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="bg-[#1B4332] text-white/70 text-center py-12">
         <div className="max-w-6xl mx-auto px-4 space-y-6">
           <div>
             <h3 className="text-xl font-bold text-white mb-2">DogChauffeur™</h3>
             <p className="text-sm text-white/80 font-medium mb-4">Safe Pet Transportation in Chicago</p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-white/80">
               <a href="tel:+17087735958" className="hover:text-white transition">📞 (708) 773-5958</a>
               <span className="hidden sm:inline text-white/40">•</span>
               <a href="mailto:support@dogchauffeur.com" className="hover:text-white transition">✉ support@dogchauffeur.com</a>
             </div>
           </div>
           <div className="flex justify-center gap-6 text-sm flex-wrap">
             <Link to={createPageUrl("PublicSite")} className="hover:text-white transition">Pet Owners</Link>
             <Link to={createPageUrl("VetPartners")} className="hover:text-white transition">Vet Clinics &amp; Partners</Link>
             <Link to={createPageUrl("BookingRequest")} className="hover:text-white transition">Book a Ride</Link>
           </div>
           <div className="border-t border-white/10 pt-6">
             <p className="text-xs text-white/50">A service of TirisiWay, Inc. © {new Date().getFullYear()} TirisiWay, Inc.</p>
           </div>
         </div>
       </footer>
    </div>
  );
}
