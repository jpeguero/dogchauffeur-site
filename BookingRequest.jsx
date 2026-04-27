import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Dog, Plus, Calculator, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const ADMIN_EMAIL = "jpeguero@gmail.com";

const emailStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #2D2D2D; line-height: 1.6; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1B4332; padding-bottom: 20px; }
  .brand { font-size: 24px; font-weight: bold; color: #1B4332; margin: 0; }
  .tagline { font-size: 13px; color: #6B5B4F; margin: 5px 0 0 0; }
  .greeting { margin: 20px 0; font-size: 15px; }
  .section { margin: 25px 0; }
  .section-title { font-size: 13px; font-weight: bold; color: #1B4332; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
  .detail-row { display: flex; margin-bottom: 10px; font-size: 14px; }
  .detail-label { font-weight: 600; color: #1B4332; min-width: 100px; }
  .detail-value { color: #6B5B4F; flex: 1; }
  .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #EDF7F0; text-align: center; font-size: 12px; color: #6B5B4F; }
  .footer-brand { font-weight: bold; color: #1B4332; margin: 15px 0 5px 0; }
`;

const generateCustomerEmail = (form) => `
<!DOCTYPE html>
<html>
<head><style>${emailStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <p class="brand">DogChauffeur™</p>
      <p class="tagline">Safe Pet Transportation</p>
    </div>

    <div class="greeting">
      <p>Hi ${form.full_name},</p>
      <p>We've received your ride request for <strong>${form.pet_name || "your pet"}</strong>.</p>
      <p>Your request is currently awaiting confirmation. We'll review the details and follow up shortly.</p>
    </div>

    <div class="section">
      <div class="section-title">Ride Details</div>
      <div class="detail-row">
        <div class="detail-label">Pickup</div>
        <div class="detail-value">${form.pickup_address}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Drop-off</div>
        <div class="detail-value">${form.dropoff_address}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Date</div>
        <div class="detail-value">${form.preferred_date}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Time</div>
        <div class="detail-value">${form.preferred_time_window || "To be arranged"}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Pet</div>
        <div class="detail-value">${form.pet_name || "Not specified"}</div>
      </div>
    </div>

    <p style="font-size: 14px; color: #6B5B4F;">If you need to make a change, please contact us as soon as possible.</p>
    <p style="font-size: 14px; color: #6B5B4F;">Thank you for choosing DogChauffeur™.</p>

    <div class="footer">
      <p class="footer-brand">DogChauffeur™</p>
      <p>Safe Pet Transportation</p>
      <p>© 2026 TirisiWay, Inc.</p>
    </div>
  </div>
</body>
</html>
`;

const generateAdminEmail = (form) => `
<!DOCTYPE html>
<html>
<head><style>${emailStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <p class="brand">DogChauffeur™</p>
      <p class="tagline">Admin Notification</p>
    </div>

    <p style="font-size: 15px;">A new ride request has been submitted.</p>

    <div class="section">
      <div class="detail-row">
        <div class="detail-label">Customer</div>
        <div class="detail-value">${form.full_name}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Email</div>
        <div class="detail-value">${form.email}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Phone</div>
        <div class="detail-value">${form.phone || "Not provided"}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Ride Details</div>
      <div class="detail-row">
        <div class="detail-label">Service</div>
        <div class="detail-value">${form.service_type}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Pet</div>
        <div class="detail-value">${form.pet_name || "Not specified"}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Pickup</div>
        <div class="detail-value">${form.pickup_address}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Drop-off</div>
        <div class="detail-value">${form.dropoff_address}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Date</div>
        <div class="detail-value">${form.preferred_date}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Time</div>
        <div class="detail-value">${form.preferred_time_window || "To be arranged"}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Urgent</div>
        <div class="detail-value">${form.is_urgent ? "⚠️ YES" : "No"}</div>
      </div>
      ${form.notes ? `<div class="detail-row"><div class="detail-label">Notes</div><div class="detail-value">${form.notes}</div></div>` : ""}
    </div>

    <div class="footer">
      <p class="footer-brand">DogChauffeur™</p>
      <p>Safe Pet Transportation</p>
    </div>
  </div>
</body>
</html>
`;

const SERVICE_TYPES = [
  "Vet", "Grooming", "Daycare", "Airport",
  "Long Distance – Pets Only", "Vehicle + Pets Relocation",
  "Fly-Out Pickup", "Emergency / Same-Day"
];

const DOG_SIZES = ["Small", "Medium", "Large", "Small & Medium", "Small & Large", "Medium & Large", "Mixed sizes"];

const RIDE_TYPES = ["Vet Visit", "Grooming", "Daycare / Boarding", "Airport Trip", "Custom Ride"];

const calculatePrice = (form) => {
  if (form.ride_type === "Custom Ride") return null;
  
  let price = 35; // Base fee
  
  // Additional pets
  const numDogs = parseInt(form.number_of_dogs) || 1;
  if (numDogs > 1) price += (numDogs - 1) * 10;
  
  // Airport trip
  if (form.ride_type === "Airport Trip") price += 15;
  
  // Same-day/rush
  if (form.is_urgent) price += 15;
  
  return price;
};

const VET_CLINICS = [
  "Wicker Park Veterinary Clinic",
  "Lincoln Park Animal Hospital",
  "Lakeview Animal Clinic",
  "Andersonville Cat Clinic",
  "Chicago Animal Hospital",
  "Other",
];

export default function BookingRequest() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const urlRef = new URLSearchParams(window.location.search).get("ref");
  const isPartnerRef = urlRef === "partner";
  const isCustomerRef = urlRef && urlRef !== "partner";

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: pets = [] } = useQuery({
    queryKey: ["booking-pets", user?.email],
    queryFn: () => base44.entities.Pet.filter({ owner_email: user.email }),
    enabled: !!user,
  });

  const [form, setForm] = useState({
    full_name: "", phone: "", email: "",
    service_type: "", trip_direction: "", ride_type: "",
    pickup_address: "", dropoff_address: "",
    preferred_date: "", preferred_time_window: "",
    number_of_dogs: "", dog_sizes: "", notes: "", is_urgent: false, pet_id: "", pet_name: "",
    pet_breed: "", pet_weight: "", pet_temperament: "",
    referral_source: isPartnerRef ? "partner" : isCustomerRef ? "customer" : "",
    referrer_id: isCustomerRef ? urlRef : "",
    partner_type: "",
    partner_name: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [priceEstimate, setPriceEstimate] = useState(null); // { price, miles, distance_text, duration_text }
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [priceError, setPriceError] = useState(null);

  const calculatePrice = async () => {
    if (!form.pickup_address || !form.dropoff_address) return;
    setCalculatingPrice(true);
    setPriceError(null);
    setPriceEstimate(null);
    try {
      const res = await base44.functions.invoke('calculateDistance', {
        pickup: form.pickup_address,
        dropoff: form.dropoff_address,
      });
      setPriceEstimate(res.data);
    } catch (err) {
      setPriceError("Could not calculate price. Please check the addresses.");
    }
    setCalculatingPrice(false);
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handlePetSelection = (petId) => {
    if (petId === "add-new") {
      navigate(createPageUrl("Pets"));
      return;
    }
    const pet = pets.find(p => p.id === petId);
    if (pet) {
      set("pet_id", petId);
      set("pet_name", pet.name || "");
      set("pet_breed", pet.breed || "");
      set("pet_weight", pet.weight ? String(pet.weight) : "");
      set("pet_temperament", pet.temperament || "");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const data = {
      ...form,
      number_of_dogs: Number(form.number_of_dogs) || 1,
      ...(priceEstimate ? { estimated_price: priceEstimate.price, estimated_miles: priceEstimate.miles } : {}),
    };
    await base44.entities.Booking.create(data);

    try {
      // Send professional customer confirmation email
      await base44.integrations.Core.SendEmail({
        to: form.email,
        subject: `DogChauffeur™ Ride Request Received – ${form.pet_name || "Your Pet"}`,
        body: generateCustomerEmail(form),
      });

      // Send admin notification email
      await base44.integrations.Core.SendEmail({
        to: ADMIN_EMAIL,
        subject: `New DogChauffeur Ride Request – ${form.pet_name || "New Booking"}${form.is_urgent ? " 🚨 URGENT" : ""}`,
        body: generateAdminEmail(form),
      });

      // Send SMS notification if phone is provided
      if (form.phone) {
        try {
          await base44.functions.invoke('sendSMS', {
            phone: form.phone,
            pet_name: form.pet_name || "your pet",
            event_type: "ride_received"
          });
        } catch (smsError) {
          console.error("SMS notification error:", smsError);
        }
      }
    } catch (e) {
      console.error("Notification error:", e);
    }

    toast.success(`Thanks, ${form.full_name}! We got your request and will be in touch shortly.`);
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F9F7F3] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-[#EDF7F0] p-10 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-3xl bg-[#D8F3DC] flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-[#1B4332]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1B4332] mb-2">Request Received!</h2>
          <p className="text-[#6B5B4F]/70 mb-4">
            Thanks, {form.full_name}! We got your request and will be in touch shortly to confirm the details.
          </p>
          {priceEstimate && (
            <div className="bg-[#EDF7F0] rounded-xl px-5 py-3 mb-6 text-center">
              <p className="text-xs text-[#6B5B4F] mb-1">Estimated Ride Price</p>
              <p className="text-3xl font-bold text-[#1B4332]">${priceEstimate.price.toFixed(2)}</p>
              <p className="text-xs text-[#40916C] mt-1">{priceEstimate.distance_text} · {priceEstimate.duration_text}</p>
            </div>
          )}
          <Link to={createPageUrl("PublicSite")}>
            <Button className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl w-full">
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F3]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#D8F3DC]/60">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={createPageUrl("PublicSite")} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl forest-gradient flex items-center justify-center">
              <Dog className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[#1B4332] text-lg">DogChauffeur</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1B4332] mb-2">Book a Ride or Request a Quote</h1>
            <p className="text-[#6B5B4F]/60">Fill in the details below and we'll get back to you promptly.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#EDF7F0] p-6 md:p-8 space-y-5">

            {/* Partner Referral Banner */}
            {isPartnerRef && (
              <div className="bg-[#EDF7F0] border border-[#B7E4C7] rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-[#1B4332]">🏥 Referred by a veterinary clinic or pet care partner</p>
                <div className="space-y-1.5">
                  <Label className="text-[#1B4332]">Partner Type *</Label>
                  <Select required value={form.partner_type} onValueChange={v => set("partner_type", v)}>
                    <SelectTrigger className="rounded-xl border-[#D8F3DC] bg-white">
                      <SelectValue placeholder="Select partner type…" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Veterinary Clinic", "Groomer", "Boarding Facility", "Other Partner"].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#1B4332]">Clinic / Partner Name *</Label>
                  <input
                    required
                    value={form.partner_name}
                    onChange={e => set("partner_name", e.target.value)}
                    placeholder="e.g. Lincoln Park Animal Hospital"
                    className="w-full rounded-xl border border-[#D8F3DC] px-3 py-2 text-sm focus:outline-none focus:border-[#40916C]"
                  />
                </div>
              </div>
            )}

            {/* Contact Info - FIRST */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1B4332] uppercase tracking-wide">Your Contact Info</h3>
              <div className="space-y-1.5">
                <Label className="text-[#1B4332]">Your Name *</Label>
                <Input required value={form.full_name} onChange={e => set("full_name", e.target.value)}
                  placeholder="e.g., Sarah Johnson" className="rounded-xl border-[#D8F3DC]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#1B4332]">Mobile Phone Number *</Label>
                <Input required value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="(312) 555-1234" className="rounded-xl border-[#D8F3DC]" />
                <p className="text-xs text-[#40916C] font-medium">📱 You'll get a text confirmation as soon as we receive your request.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#1B4332]">Email Address <span className="text-[#6B5B4F]/50 font-normal">(optional)</span></Label>
                <Input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="sarah@email.com" className="rounded-xl border-[#D8F3DC]" />
              </div>
            </div>

            <div className="border-t border-[#EDF7F0]" />

            {/* Service & Ride Type */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[#1B4332]">Ride Type *</Label>
                <Select required value={form.ride_type} onValueChange={v => set("ride_type", v)}>
                  <SelectTrigger className="rounded-xl border-[#D8F3DC]">
                    <SelectValue placeholder="Select ride type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {RIDE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#1B4332]">One-way or Round-trip?</Label>
                <Select value={form.trip_direction} onValueChange={v => set("trip_direction", v)}>
                  <SelectTrigger className="rounded-xl border-[#D8F3DC]">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {["One-way", "Round-trip", "Not applicable"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Addresses + Price Calculator */}
            <div className="space-y-1.5">
              <Label className="text-[#1B4332]">Pickup Address *</Label>
              <Input required value={form.pickup_address} onChange={e => { set("pickup_address", e.target.value); setPriceEstimate(null); }}
                placeholder="123 Main St, Chicago, IL" className="rounded-xl border-[#D8F3DC]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#1B4332]">Drop-off Address or Destination *</Label>
              <Input required value={form.dropoff_address} onChange={e => { set("dropoff_address", e.target.value); setPriceEstimate(null); }}
                placeholder="456 Elm Ave, Chicago, IL or Denver, CO" className="rounded-xl border-[#D8F3DC]" />
            </div>

            {/* Price estimate trigger */}
            {form.pickup_address && form.dropoff_address && !priceEstimate && (
              <Button
                type="button"
                variant="outline"
                onClick={calculatePrice}
                disabled={calculatingPrice}
                className="w-full border-[#40916C] text-[#1B4332] rounded-xl hover:bg-[#EDF7F0]"
              >
                {calculatingPrice
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calculating…</>
                  : <><Calculator className="w-4 h-4 mr-2" /> Get Price Estimate</>
                }
              </Button>
            )}
            {priceError && <p className="text-sm text-red-500">{priceError}</p>}

            {/* Price estimate result */}
            {priceEstimate && (
              <div className="bg-[#D8F3DC] border border-[#40916C] rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#1B4332] font-semibold text-sm">Estimated Ride Price</span>
                  <span className="text-2xl font-bold text-[#1B4332]">${priceEstimate.price.toFixed(2)}</span>
                </div>
                <div className="flex gap-4 text-xs text-[#2D6A4F]">
                  <span>📍 {priceEstimate.distance_text}</span>
                  <span>🕐 {priceEstimate.duration_text}</span>
                </div>
                <p className="text-xs text-[#2D6A4F] mt-2">Final price confirmed after request review. Base $20 + $2.25/mi, minimum $25.</p>
                <button type="button" onClick={() => { setPriceEstimate(null); }} className="text-xs text-[#40916C] underline mt-1">Recalculate</button>
              </div>
            )}

            {/* Date & Time */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[#1B4332]">Preferred Date *</Label>
                <Input required type="date" value={form.preferred_date} onChange={e => set("preferred_date", e.target.value)}
                  className="rounded-xl border-[#D8F3DC]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#1B4332]">Preferred Time Window</Label>
                <Input value={form.preferred_time_window} onChange={e => set("preferred_time_window", e.target.value)}
                  placeholder="e.g. 8–10 AM" className="rounded-xl border-[#D8F3DC]" />
              </div>
            </div>

            {/* Pet selector */}
             <div className="space-y-3">
               <Label className="text-[#1B4332]">Select a Pet Profile (optional)</Label>
               <Select value={form.pet_id} onValueChange={handlePetSelection}>
                 <SelectTrigger className="rounded-xl border-[#D8F3DC]">
                   <SelectValue placeholder={pets.length > 0 ? "Choose from your saved pets…" : "Create a pet profile first"} />
                 </SelectTrigger>
                 <SelectContent>
                   {pets.map(p => (
                     <SelectItem key={p.id} value={p.id}>{p.name}{p.breed ? ` — ${p.breed}` : p.pet_type ? ` (${p.pet_type})` : ""}</SelectItem>
                   ))}
                   <SelectItem value="add-new" className="flex items-center gap-2">
                     <Plus className="w-3.5 h-3.5" /> Add New Pet
                   </SelectItem>
                 </SelectContent>
               </Select>

               {form.pet_id && form.pet_id !== "add-new" && (() => {
                 const pet = pets.find(p => p.id === form.pet_id);
                 if (!pet) return null;
                 return (
                   <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-2">
                     <div className="grid sm:grid-cols-2 gap-3 text-sm">
                       {pet.breed && <div><span className="font-semibold text-blue-900">Breed:</span> <span className="text-blue-800">{pet.breed}</span></div>}
                       {pet.weight && <div><span className="font-semibold text-blue-900">Weight:</span> <span className="text-blue-800">{pet.weight} lbs</span></div>}
                       {pet.temperament && <div><span className="font-semibold text-blue-900">Temperament:</span> <span className="text-blue-800 capitalize">{pet.temperament}</span></div>}
                       {pet.age && <div><span className="font-semibold text-blue-900">Age:</span> <span className="text-blue-800">{pet.age} years</span></div>}
                     </div>
                     {(pet.medical_notes || pet.behavioral_notes || pet.special_care_instructions) && (
                       <div className="border-t border-blue-100 pt-2 space-y-1 text-xs">
                         {pet.medical_notes && <p><strong>Medical:</strong> {pet.medical_notes}</p>}
                         {pet.behavioral_notes && <p><strong>Behavioral:</strong> {pet.behavioral_notes}</p>}
                         {pet.special_care_instructions && <p><strong>Special Care:</strong> {pet.special_care_instructions}</p>}
                       </div>
                     )}
                   </div>
                 );
               })()}
             </div>

            {/* Dogs */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[#1B4332]">Number of Dogs</Label>
                <Input type="number" min={1} value={form.number_of_dogs} onChange={e => set("number_of_dogs", e.target.value)}
                  placeholder="1" className="rounded-xl border-[#D8F3DC]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#1B4332]">Dog Size(s)</Label>
                <Select value={form.dog_sizes} onValueChange={v => set("dog_sizes", v)}>
                  <SelectTrigger className="rounded-xl border-[#D8F3DC]">
                    <SelectValue placeholder="Select size…" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOG_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-[#1B4332]">Notes / Special Needs</Label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                placeholder="Medication, anxiety, crate preference, anything we should know…"
                className="rounded-xl border-[#D8F3DC] h-24" />
            </div>

            {/* Urgent */}
            <div className="flex items-center gap-3 bg-amber-50 rounded-xl p-4">
              <Checkbox
                id="urgent"
                checked={form.is_urgent}
                onCheckedChange={v => set("is_urgent", v)}
                className="border-amber-400"
              />
              <label htmlFor="urgent" className="text-sm font-medium text-amber-800 cursor-pointer">
                This is urgent / same-day (+$15 rush fee)
              </label>
            </div>



            {/* Trust section */}
            <div className="bg-[#F9F7F3] rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-[#1B4332]">What to expect</p>
              <ul className="space-y-1.5">
                {["Pickup and drop-off confirmation", "Safe transportation for your pet", "Clear communication after your request is submitted"].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#6B5B4F]">
                    <span className="text-[#40916C] mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[#6B5B4F]/70 pt-1">
                Questions before booking?{" "}
                <a href="tel:3126209297" className="text-[#1B4332] font-medium hover:underline">Call or text (312) 620-9297</a>
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl h-11 text-base font-semibold"
            >
              {submitting ? "Sending…" : "Request Ride"}
            </Button>

            <p className="text-xs text-center text-[#6B5B4F]/50">
              We'll review your request and reach out to confirm pricing and timing.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}