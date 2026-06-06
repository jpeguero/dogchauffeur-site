import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Calculator, ChevronDown, Zap, Dog, MapPin, Users, CheckCircle2, Share2, MessageSquare, Mail, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

// --- Zone-based pricing matrix ---
const ZONES = [
  { id: "local",     label: "Local (within Chicago)",        miles: "0–10 mi",  base: 35 },
  { id: "suburban",  label: "Suburban (10–25 miles)",         miles: "10–25 mi", base: 55 },
  { id: "extended",  label: "Extended area (25–50 miles)",    miles: "25–50 mi", base: 85 },
  { id: "longdist",  label: "Long distance (50+ miles)",      miles: "50+ mi",   base: 120 },
];

const SERVICE_TYPES = [
  { id: "vet",       label: "🏥 Vet Visit",           multiplier: 1.0 },
  { id: "grooming",  label: "✂️ Grooming",            multiplier: 1.0 },
  { id: "daycare",   label: "🏠 Daycare",             multiplier: 1.0 },
  { id: "airport",   label: "✈️ Airport Trip",        multiplier: 1.15 },
  { id: "longtrip",  label: "🚗 Long Distance Reloc.", multiplier: 1.25 },
  { id: "emergency", label: "⚡ Emergency / Same-Day", multiplier: 1.5  },
];

const PET_TYPES = [
  { id: "dog_sm",  label: "🐕 Small Dog (<20 lbs)",   surcharge: 0   },
  { id: "dog_md",  label: "🐕 Medium Dog (20–50 lbs)", surcharge: 5   },
  { id: "dog_lg",  label: "🐕 Large Dog (50+ lbs)",    surcharge: 12  },
  { id: "cat",     label: "🐈 Cat",                    surcharge: 0   },
  { id: "other",   label: "🐾 Other Pet",              surcharge: 0   },
];

function petMultiSurcharge(count) {
  if (count === 1) return 0;
  if (count === 2) return 15;
  if (count === 3) return 25;
  return 35;
}

function calcEstimate(zone, service, petType, petCount, roundTrip) {
  if (!zone || !service || !petType) return null;
  const base = zone.base;
  const svcMult = service.multiplier;
  const petSur = petType.surcharge;
  const multiSur = petMultiSurcharge(petCount);
  const rtMult = roundTrip ? 1.8 : 1;
  const raw = (base + petSur + multiSur) * svcMult * rtMult;
  const lo = Math.floor(raw);
  const hi = Math.ceil(raw * 1.15);
  return { lo, hi };
}

function Select({ label, icon: Icon, options, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] uppercase tracking-wide">
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-[#D8F3DC] rounded-xl px-4 py-2.5 text-sm text-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#52B788] pr-9"
        >
          <option value="">— Select —</option>
          {options.map(o => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52B788] pointer-events-none" />
      </div>
    </div>
  );
}

export default function PriceEstimator() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ref") === "referral_share") {
      base44.entities.Lead.create({ lead_source: "referral_share", name: "Referral Visitor" });
    }
  }, []);

  const [zoneId, setZoneId]         = useState("");
  const [serviceId, setServiceId]   = useState("");
  const [petTypeId, setPetTypeId]   = useState("");
  const [petCount, setPetCount]     = useState(1);
  const [roundTrip, setRoundTrip]   = useState(false);

  const [leadName, setLeadName]     = useState("");
  const [leadPhone, setLeadPhone]   = useState("");
  const [leadEmail, setLeadEmail]   = useState("");
  const [leadUrgency, setLeadUrgency] = useState("");
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [copied, setCopied]         = useState(false);

  const zone    = ZONES.find(z => z.id === zoneId);
  const service = SERVICE_TYPES.find(s => s.id === serviceId);
  const petType = PET_TYPES.find(p => p.id === petTypeId);
  const estimate = calcEstimate(zone, service, petType, petCount, roundTrip);

  const ready = !!estimate;

  const shareUrl = `${window.location.origin}${createPageUrl("PublicSite")}?ref=referral_share`;
  const shareMsg = encodeURIComponent(`Hey! Check out Pawffeur — Chicago's pet transportation service. Get an instant price estimate here: ${shareUrl}`);

  function handleCopyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveLead(e) {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Lead.create({
      name: leadName,
      phone: leadPhone,
      email: leadEmail,
      lead_source: "price_estimator",
      estimate_zone: zone?.label,
      estimate_service: service?.label,
      estimate_low: estimate?.lo,
      estimate_high: estimate?.hi,
      urgency: leadUrgency || undefined,
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="bg-white rounded-3xl border border-[#EDF7F0] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-[#1B4332] px-6 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Instant Price Estimator</h3>
          <p className="text-white/65 text-xs">Get a rough quote before you book — no login required</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Zone */}
        <Select
          label="Where are you going?"
          icon={MapPin}
          options={ZONES}
          value={zoneId}
          onChange={setZoneId}
        />

        {/* Service */}
        <Select
          label="Type of service"
          icon={Dog}
          options={SERVICE_TYPES}
          value={serviceId}
          onChange={setServiceId}
        />

        {/* Pet type */}
        <Select
          label="Your pet"
          icon={Dog}
          options={PET_TYPES}
          value={petTypeId}
          onChange={setPetTypeId}
        />

        {/* Pet count + round-trip */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] uppercase tracking-wide">
              <Users className="w-3.5 h-3.5" /> # of Pets
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPetCount(c => Math.max(1, c - 1))}
                className="w-9 h-9 rounded-lg border border-[#D8F3DC] bg-[#EDF7F0] text-[#1B4332] font-bold text-lg flex items-center justify-center hover:bg-[#D8F3DC] transition"
              >−</button>
              <span className="w-8 text-center font-bold text-[#1B4332] text-lg">{petCount}</span>
              <button
                type="button"
                onClick={() => setPetCount(c => Math.min(6, c + 1))}
                className="w-9 h-9 rounded-lg border border-[#D8F3DC] bg-[#EDF7F0] text-[#1B4332] font-bold text-lg flex items-center justify-center hover:bg-[#D8F3DC] transition"
              >+</button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] uppercase tracking-wide">
              <Zap className="w-3.5 h-3.5" /> Trip type
            </label>
            <button
              type="button"
              onClick={() => setRoundTrip(r => !r)}
              className={`w-full py-2.5 rounded-xl border text-sm font-medium transition ${
                roundTrip
                  ? "bg-[#1B4332] text-white border-[#1B4332]"
                  : "bg-white text-[#6B5B4F] border-[#D8F3DC] hover:border-[#52B788]"
              }`}
            >
              {roundTrip ? "↩ Round Trip" : "→ One Way"}
            </button>
          </div>
        </div>

        {/* Result */}
        <AnimatePresence>
          {ready && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="mt-2"
            >
              <div className="bg-[#EDF7F0] border border-[#52B788] rounded-2xl p-5">
                <p className="text-xs text-[#2D6A4F] font-semibold uppercase tracking-wide mb-1">Estimated Price</p>
                <p className="text-4xl font-bold text-[#1B4332]">
                  ${estimate.lo} – ${estimate.hi}
                </p>
                <div className="mt-3 space-y-1 text-xs text-[#6B5B4F]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#52B788] shrink-0" />
                    Zone: {zone.label} ({zone.miles})
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#52B788] shrink-0" />
                    {service.label} {service.multiplier > 1 ? `(+${Math.round((service.multiplier - 1) * 100)}% rate)` : ""}
                  </div>
                  {petCount > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#52B788] shrink-0" />
                      {petCount} pets (+${petMultiSurcharge(petCount)} multi-pet fee)
                    </div>
                  )}
                  {roundTrip && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#52B788] shrink-0" />
                      Round trip (×1.8)
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#6B5B4F]/60 mt-3 leading-relaxed">
                  This is an estimate only. Final price confirmed after review. Prices may vary based on exact distance, traffic, and special needs.
                </p>
              </div>

              {/* Lead capture */}
              {!saved ? (
                <form onSubmit={handleSaveLead} className="mt-4 bg-[#F9F7F3] border border-[#D8F3DC] rounded-2xl p-5 space-y-3">
                  <div className="mb-1">
                    <p className="text-base font-bold text-[#1B4332]">Save this estimate for later</p>
                    <p className="text-xs text-[#6B5B4F] mt-1 leading-relaxed">Get your estimate by text or email so you have it when you need it.</p>
                  </div>
                  <input
                    required
                    placeholder="Name"
                    value={leadName}
                    onChange={e => setLeadName(e.target.value)}
                    className="w-full bg-white border border-[#D8F3DC] rounded-xl px-4 py-2.5 text-sm text-[#1B4332] placeholder-[#6B5B4F]/40 focus:outline-none focus:ring-2 focus:ring-[#52B788]"
                  />
                  <input
                    required
                    type="tel"
                    placeholder="Mobile phone"
                    value={leadPhone}
                    onChange={e => setLeadPhone(e.target.value)}
                    className="w-full bg-white border border-[#D8F3DC] rounded-xl px-4 py-2.5 text-sm text-[#1B4332] placeholder-[#6B5B4F]/40 focus:outline-none focus:ring-2 focus:ring-[#52B788]"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={leadEmail}
                    onChange={e => setLeadEmail(e.target.value)}
                    className="w-full bg-white border border-[#D8F3DC] rounded-xl px-4 py-2.5 text-sm text-[#1B4332] placeholder-[#6B5B4F]/40 focus:outline-none focus:ring-2 focus:ring-[#52B788]"
                  />
                  <div>
                    <p className="text-xs text-[#6B5B4F] mb-1.5 font-medium">When do you need this?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Today", "Within 3 days", "Within a week", "Just researching"].map(opt => (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => setLeadUrgency(opt)}
                          className={`text-xs px-3 py-2 rounded-xl border font-medium transition-all ${
                            leadUrgency === opt
                              ? "bg-[#1B4332] text-white border-[#1B4332]"
                              : "bg-white text-[#6B5B4F] border-[#D8F3DC] hover:border-[#52B788]"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" disabled={saving} className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl font-semibold h-11">
                    {saving ? "Saving…" : "Send My Estimate"}
                  </Button>
                  <p className="text-center text-xs text-[#6B5B4F]/60 pt-1">Not ready yet? No problem. Save it for when you need it.</p>
                </form>
              ) : (
                <div className="mt-4 bg-[#EDF7F0] border border-[#52B788] rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#40916C] shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#1B4332]">Estimate saved!</p>
                    <p className="text-xs text-[#6B5B4F]">We'll be in touch to confirm your booking.</p>
                  </div>
                </div>
              )}

              {/* Share section */}
              <div className="mt-4 bg-[#F9F7F3] border border-[#D8F3DC] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Share2 className="w-4 h-4 text-[#52B788]" />
                  <p className="text-sm font-bold text-[#1B4332]">Send to a 🧡 friend</p>
                </div>
                <p className="text-xs text-[#6B5B4F] mb-3">Know a pet owner who might need this? Send them the estimator.</p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`sms:?body=${shareMsg}`}
                    className="flex items-center justify-center gap-2 bg-white border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1B4332] hover:bg-[#EDF7F0] transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#52B788]" /> SMS
                  </a>
                  <a
                    href={`https://wa.me/?text=${shareMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-white border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1B4332] hover:bg-[#EDF7F0] transition"
                  >
                    <span className="text-base leading-none">💬</span> WhatsApp
                  </a>
                  <a
                    href={`mailto:?subject=Check%20out%20Pawffeur&body=${shareMsg}`}
                    className="flex items-center justify-center gap-2 bg-white border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1B4332] hover:bg-[#EDF7F0] transition"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#52B788]" /> Email
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 bg-white border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1B4332] hover:bg-[#EDF7F0] transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#52B788]" /> : <Copy className="w-3.5 h-3.5 text-[#52B788]" />}
                    {copied ? "Copied!" : "Copy link"}
                  </button>
                </div>
              </div>

              <Link to={createPageUrl("BookingRequest")} className="block mt-3">
                <Button variant="outline" className="w-full border-[#1B4332] text-[#1B4332] rounded-xl font-semibold h-11 hover:bg-[#EDF7F0]">
                  Book This Ride →
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {!ready && (
          <p className="text-center text-xs text-[#6B5B4F]/50 pt-1">Fill in the options above to see your estimate</p>
        )}
      </div>
    </div>
  );
}