import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Loader2, Dog, Calendar, MapPin, Heart } from "lucide-react";

const RIDE_TYPES = [
  { value: "Vet Visit", label: "Vet Visit 🏥" },
  { value: "Grooming", label: "Grooming Appointment ✂️" },
  { value: "Daycare / Boarding", label: "Daycare & Boarding 🏡" },
  { value: "Airport Trip", label: "Airport Transport ✈️" },
  { value: "Urgent / Same-Day", label: "Urgent & Same-Day 🚨" },
  { value: "Other / Custom", label: "Other / Custom Ride 🐾" }
];

const PET_SIZES = [
  { value: "Small (<20 lbs)", label: "Small (<20 lbs)" },
  { value: "Medium (20-50 lbs)", label: "Medium (20-50 lbs)" },
  { value: "Large (50+ lbs)", label: "Large (50+ lbs)" }
];

const TIME_WINDOWS = [
  { value: "Morning (8-11 AM)", label: "Morning (8-11 AM)" },
  { value: "Midday (11 AM-2 PM)", label: "Midday (11 AM-2 PM)" },
  { value: "Afternoon (2-5 PM)", label: "Afternoon (2-5 PM)" },
  { value: "Evening (5-8 PM)", label: "Evening (5-8 PM)" },
  { value: "Anytime", label: "Anytime / Flexible" }
];

const CONSENT_TEXT = "I agree to receive booking updates and SMS alerts from Pawffeur™ at the number provided. Message & data rates may apply. Msg frequency varies. Reply STOP to opt out. View our Privacy Policy and Terms & Conditions.";

export default function LeadForm() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null);

  // Form Fields State
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    pet_name: "",
    pet_type: "Dog",
    pet_size: "Small (<20 lbs)",
    ride_type: "Vet Visit",
    pickup_address: "",
    dropoff_address: "",
    preferred_date: "",
    preferred_time_window: "Anytime",
    is_urgent: false,
    how_heard: "",
    notes: "",
    consent: false,
    consent_text: CONSENT_TEXT,
    weight_lbs: "",
    height_inches: "",
    length_inches: "",
    ramp_required: false,
    crate_trained: true,
    temperament: "Calm",
    vehicle_space_preference: "standard"
  });

  // Honeypot state
  const [honeypot, setHoneypot] = useState({
    website: "",
    fax: ""
  });

  // Pull URL tracking parameters
  useEffect(() => {
    const partner_id = searchParams.get("partner_id") || searchParams.get("partner") || "";
    const qr_id = searchParams.get("qr_id") || searchParams.get("qr") || "";
    const campaign_id = searchParams.get("campaign_id") || "";
    const utm_source = searchParams.get("utm_source") || "";
    const utm_medium = searchParams.get("utm_medium") || "";
    const utm_campaign = searchParams.get("utm_campaign") || "";
    const source = searchParams.get("source") || "";

    setForm((prev) => ({
      ...prev,
      partner_id,
      qr_id,
      campaign_id,
      utm_source,
      utm_medium,
      utm_campaign,
      source
    }));
  }, [searchParams]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleWeightChange = (val) => {
    const numeric = parseFloat(val);
    let size = "Small (<20 lbs)";
    if (!isNaN(numeric)) {
      if (numeric >= 50) {
        size = "Large (50+ lbs)";
      } else if (numeric >= 20) {
        size = "Medium (20-50 lbs)";
      }
    }
    setForm((prev) => ({ 
      ...prev, 
      weight_lbs: val,
      pet_size: size
    }));
  };

  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!form.full_name.trim() || !form.phone.trim()) {
        setError("Please fill in your name and phone number.");
        return;
      }
      const emailVal = form.email.trim();
      if (emailVal) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailVal)) {
          setError("Please enter a valid email address or leave it blank.");
          return;
        }
      }
      if (!form.consent) {
        setError("Please accept the terms and SMS consent to proceed.");
        return;
      }
    } else if (step === 2) {
      if (!form.weight_lbs) {
        setError("Please enter your pet's weight.");
        return;
      }
      const weightNum = parseFloat(form.weight_lbs);
      if (isNaN(weightNum) || weightNum <= 0) {
        setError("Please enter a valid positive number for weight.");
        return;
      }
      if (form.height_inches) {
        const heightNum = parseFloat(form.height_inches);
        if (isNaN(heightNum) || heightNum <= 0) {
          setError("Please enter a valid positive height or leave it blank.");
          return;
        }
      }
      if (form.length_inches) {
        const lengthNum = parseFloat(form.length_inches);
        if (isNaN(lengthNum) || lengthNum <= 0) {
          setError("Please enter a valid positive length or leave it blank.");
          return;
        }
      }
    } else if (step === 3) {
      if (!form.pickup_address.trim() || !form.dropoff_address.trim() || !form.preferred_date) {
        setError("Pickup, drop-off, and preferred date are required.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setError("");
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Send submission to API lead pipe endpoint
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // Include honeypot values
          website: honeypot.website,
          fax: honeypot.fax
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Something went wrong. Please try again.");
      }

      setSuccessData(result);
    } catch (err) {
      setError(err.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-full max-w-xl mx-auto bg-white rounded-3xl border border-[#EDF7F0] p-8 md:p-10 text-center shadow-lg"
      >
        <div className="w-16 h-16 rounded-full bg-[#D8F3DC] text-[#1B4332] flex items-center justify-center mx-auto mb-6 text-3xl">
          ✓
        </div>
        <h2 className="text-3xl font-extrabold text-[#1B4332] mb-3">Ride Request Submitted!</h2>
        <p className="text-sm text-[#6B5B4F] mb-6 leading-relaxed">
          Thank you, {form.full_name}. We have received your ride request for <strong>{form.pet_name || "your pet"}</strong>. 
          Our dispatch team is reviewing it right now.
        </p>

        <div className="bg-[#EDF7F0] border border-[#B7E4C7] rounded-2xl p-5 mb-8">
          <p className="text-xs text-[#2D6A4F] uppercase tracking-wider font-semibold mb-1">Lead Reference Number</p>
          <p className="text-3xl font-black text-[#1B4332] tracking-tight">{successData.leadRef}</p>
        </div>

        <p className="text-xs text-[#6B5B4F]/70 mb-8 leading-relaxed">
          Please keep this reference number handy. We will contact you at <strong>{form.phone}</strong> or <strong>{form.email}</strong> shortly to confirm pricing and finalize pickup times.
        </p>

        <Link to="/">
          <Button className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl px-8 py-5 h-auto font-bold shadow-md">
            Return to Homepage
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-3xl border border-[#EDF7F0] p-6 md:p-10 shadow-lg relative overflow-hidden">
      
      {/* Honeypot Fields (Hidden from humans) */}
      <div className="hidden" aria-hidden="true" style={{ display: "none" }}>
        <input 
          type="text" 
          name="website" 
          value={honeypot.website} 
          onChange={(e) => setHoneypot(prev => ({ ...prev, website: e.target.value }))} 
          tabIndex="-1" 
          autoComplete="off" 
        />
        <input 
          type="text" 
          name="fax" 
          value={honeypot.fax} 
          onChange={(e) => setHoneypot(prev => ({ ...prev, fax: e.target.value }))} 
          tabIndex="-1" 
          autoComplete="off" 
        />
      </div>

      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold text-[#2D6A4F] uppercase tracking-wider">Step {step} of 4</span>
          <span className="text-xs text-[#6B5B4F] font-medium">Request My Pet Ride</span>
        </div>
        <div className="w-full bg-[#EDF7F0] h-2 rounded-full overflow-hidden">
          <motion.div 
            className="bg-[#1B4332] h-full" 
            initial={{ width: "25%" }}
            animate={{ width: `${step * 25}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 text-rose-800 text-sm mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: CUSTOMER INFO */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2 text-center sm:text-left mb-6">
                <h3 className="text-2xl font-bold text-[#1B4332]">Contact Information</h3>
                <p className="text-sm text-[#6B5B4F]">Let's start with how we can reach you.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-[#1B4332] font-semibold">Your Full Name *</Label>
                <Input 
                  id="full_name"
                  placeholder="e.g. Sarah Johnson" 
                  value={form.full_name} 
                  onChange={(e) => handleChange("full_name", e.target.value)} 
                  className="rounded-xl border-[#D8F3DC] focus-visible:ring-[#52B788]"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-[#1B4332] font-semibold">Mobile Phone *</Label>
                  <Input 
                    id="phone"
                    placeholder="(312) 555-0199" 
                    value={form.phone} 
                    onChange={(e) => handleChange("phone", e.target.value)} 
                    className="rounded-xl border-[#D8F3DC] focus-visible:ring-[#52B788]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[#1B4332] font-semibold">Email Address (Optional)</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="sarah@example.com" 
                    value={form.email} 
                    onChange={(e) => handleChange("email", e.target.value)} 
                    className="rounded-xl border-[#D8F3DC] focus-visible:ring-[#52B788]"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#F9F7F3] rounded-2xl p-4 border border-[#EDE8D9] mt-6">
                <Checkbox 
                  id="consent" 
                  checked={form.consent}
                  onCheckedChange={(checked) => handleChange("consent", !!checked)}
                  className="border-[#D8F3DC] text-[#1B4332] focus:ring-[#52B788] mt-0.5"
                />
                <Label htmlFor="consent" className="text-xs text-[#6B5B4F] leading-relaxed cursor-pointer font-medium">
                  {CONSENT_TEXT}
                </Label>
              </div>
            </motion.div>
          )}

          {/* STEP 2: PET INFO */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2 text-center sm:text-left mb-6">
                <h3 className="text-2xl font-bold text-[#1B4332]">Pet Details & Biometrics</h3>
                <p className="text-sm text-[#6B5B4F]">Help us check if your pet is a perfect fit for our vehicles.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pet_name" className="text-[#1B4332] font-semibold">Pet's Name</Label>
                  <Input 
                    id="pet_name"
                    placeholder="e.g. Luna" 
                    value={form.pet_name} 
                    onChange={(e) => handleChange("pet_name", e.target.value)} 
                    className="rounded-xl border-[#D8F3DC] focus-visible:ring-[#52B788]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pet_type" className="text-[#1B4332] font-semibold">Pet Type</Label>
                  <Select value={form.pet_type} onValueChange={(val) => handleChange("pet_type", val)}>
                    <SelectTrigger id="pet_type" className="rounded-xl border-[#D8F3DC] focus:ring-[#52B788]">
                      <SelectValue placeholder="Dog" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dog">Dog 🐶</SelectItem>
                      <SelectItem value="Cat">Cat 🐱</SelectItem>
                      <SelectItem value="Other">Other 🐾</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="weight_lbs" className="text-[#1B4332] font-semibold text-xs">Weight (lbs) *</Label>
                  <Input 
                    id="weight_lbs"
                    type="number"
                    placeholder="e.g. 45" 
                    value={form.weight_lbs} 
                    onChange={(e) => handleWeightChange(e.target.value)} 
                    className="rounded-xl border-[#D8F3DC] focus-visible:ring-[#52B788]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="height_inches" className="text-[#1B4332] font-semibold text-xs">Height (in, optional)</Label>
                  <Input 
                    id="height_inches"
                    type="number"
                    placeholder="e.g. 24" 
                    value={form.height_inches} 
                    onChange={(e) => handleChange("height_inches", e.target.value)} 
                    className="rounded-xl border-[#D8F3DC] focus-visible:ring-[#52B788]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="length_inches" className="text-[#1B4332] font-semibold text-xs">Length (in, optional)</Label>
                  <Input 
                    id="length_inches"
                    type="number"
                    placeholder="e.g. 30" 
                    value={form.length_inches} 
                    onChange={(e) => handleChange("length_inches", e.target.value)} 
                    className="rounded-xl border-[#D8F3DC] focus-visible:ring-[#52B788]"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="temperament" className="text-[#1B4332] font-semibold">Pet Temperament</Label>
                  <Select value={form.temperament} onValueChange={(val) => handleChange("temperament", val)}>
                    <SelectTrigger id="temperament" className="rounded-xl border-[#D8F3DC] focus:ring-[#52B788]">
                      <SelectValue placeholder="Calm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Calm">Calm & Friendly 🟢</SelectItem>
                      <SelectItem value="Excited">Energetic / Excited 🟡</SelectItem>
                      <SelectItem value="Anxious">Anxious / Nervous 🟡</SelectItem>
                      <SelectItem value="Fearful">Fearful 🟠</SelectItem>
                      <SelectItem value="Reactive">Reactive / Protective 🔴</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vehicle_space_preference" className="text-[#1B4332] font-semibold">Space Preference</Label>
                  <Select value={form.vehicle_space_preference} onValueChange={(val) => handleChange("vehicle_space_preference", val)}>
                    <SelectTrigger id="vehicle_space_preference" className="rounded-xl border-[#D8F3DC] focus:ring-[#52B788]">
                      <SelectValue placeholder="Standard Crate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Secure Crate</SelectItem>
                      <SelectItem value="xl_bay">XL Rear Cargo Bay (Giant Breeds)</SelectItem>
                      <SelectItem value="cabin_floor">Cabin Floor Harness (Crate-free)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-[#F9F7F3] rounded-2xl p-4 border border-[#EDE8D9]">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="ramp_required" 
                    checked={form.ramp_required}
                    onCheckedChange={(checked) => handleChange("ramp_required", !!checked)}
                    className="border-[#D8F3DC] text-[#1B4332] focus:ring-[#52B788]"
                  />
                  <Label htmlFor="ramp_required" className="text-xs text-[#6B5B4F] font-semibold cursor-pointer">
                    Requires ramp loading
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="crate_trained" 
                    checked={form.crate_trained}
                    onCheckedChange={(checked) => handleChange("crate_trained", !!checked)}
                    className="border-[#D8F3DC] text-[#1B4332] focus:ring-[#52B788]"
                  />
                  <Label htmlFor="crate_trained" className="text-xs text-[#6B5B4F] font-semibold cursor-pointer">
                    Comfortable in a crate
                  </Label>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: RIDE DETAILS */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2 text-center sm:text-left mb-6">
                <h3 className="text-2xl font-bold text-[#1B4332]">Ride Logistics</h3>
                <p className="text-sm text-[#6B5B4F]">Specify where and when the ride takes place.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ride_type" className="text-[#1B4332] font-semibold">Service Type *</Label>
                <Select value={form.ride_type} onValueChange={(val) => handleChange("ride_type", val)}>
                  <SelectTrigger id="ride_type" className="rounded-xl border-[#D8F3DC] focus:ring-[#52B788]">
                    <SelectValue placeholder="Vet Visit" />
                  </SelectTrigger>
                  <SelectContent>
                    {RIDE_TYPES.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pickup_address" className="text-[#1B4332] font-semibold">Pickup Address or ZIP *</Label>
                  <Input 
                    id="pickup_address"
                    placeholder="e.g. 1000 N Clark St" 
                    value={form.pickup_address} 
                    onChange={(e) => handleChange("pickup_address", e.target.value)} 
                    className="rounded-xl border-[#D8F3DC] focus-visible:ring-[#52B788]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dropoff_address" className="text-[#1B4332] font-semibold">Drop-off Address or ZIP *</Label>
                  <Input 
                    id="dropoff_address"
                    placeholder="e.g. Lincoln Park Zoo" 
                    value={form.dropoff_address} 
                    onChange={(e) => handleChange("dropoff_address", e.target.value)} 
                    className="rounded-xl border-[#D8F3DC] focus-visible:ring-[#52B788]"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="preferred_date" className="text-[#1B4332] font-semibold">Preferred Date *</Label>
                  <Input 
                    id="preferred_date"
                    type="date"
                    value={form.preferred_date} 
                    onChange={(e) => handleChange("preferred_date", e.target.value)} 
                    className="rounded-xl border-[#D8F3DC] focus-visible:ring-[#52B788]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preferred_time" className="text-[#1B4332] font-semibold">Preferred Time Window</Label>
                  <Select value={form.preferred_time_window} onValueChange={(val) => handleChange("preferred_time_window", val)}>
                    <SelectTrigger id="preferred_time" className="rounded-xl border-[#D8F3DC] focus:ring-[#52B788]">
                      <SelectValue placeholder="Anytime" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_WINDOWS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-amber-50/50 rounded-2xl p-4 border border-amber-100 mt-4">
                <Checkbox 
                  id="is_urgent" 
                  checked={form.is_urgent}
                  onCheckedChange={(checked) => handleChange("is_urgent", !!checked)}
                  className="border-amber-400 text-amber-800 focus:ring-amber-500"
                />
                <Label htmlFor="is_urgent" className="text-sm font-semibold text-amber-800 cursor-pointer">
                  This request is urgent / same-day (+$35 surcharge)
                </Label>
              </div>
            </motion.div>
          )}

          {/* STEP 4: NOTES & SOURCE */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2 text-center sm:text-left mb-6">
                <h3 className="text-2xl font-bold text-[#1B4332]">Additional Information</h3>
                <p className="text-sm text-[#6B5B4F]">Almost done! Let us know any special requirements.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="how_heard" className="text-[#1B4332] font-semibold">How did you hear about Pawffeur? *</Label>
                <Input 
                  id="how_heard"
                  placeholder="e.g. Google, Veterinarian, Instagram, Friend" 
                  value={form.how_heard} 
                  onChange={(e) => handleChange("how_heard", e.target.value)} 
                  className="rounded-xl border-[#D8F3DC] focus-visible:ring-[#52B788]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-[#1B4332] font-semibold">Notes / Special Needs</Label>
                <Textarea 
                  id="notes"
                  placeholder="Tell us about special instructions, behavior notes, crate preferences, anxiety concerns, etc." 
                  value={form.notes} 
                  onChange={(e) => handleChange("notes", e.target.value)} 
                  className="rounded-xl border-[#D8F3DC] h-32 focus-visible:ring-[#52B788]"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons / Actions */}
        <div className="flex justify-between gap-4 pt-4 border-t border-[#EDF7F0]">
          {step > 1 ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep}
              className="border-[#D8F3DC] text-[#1B4332] hover:bg-[#EDF7F0] rounded-xl px-5 py-4 h-auto font-semibold flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button 
              type="button" 
              onClick={nextStep}
              className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl px-6 py-4 h-auto font-semibold flex items-center gap-2"
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              type="submit"
              disabled={loading}
              className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl px-8 py-4 h-auto font-bold flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  🟢 Request Pet Ride
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
