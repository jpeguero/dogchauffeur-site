import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, Clock, PawPrint, ChevronRight, PlusCircle, Phone, Calculator, AlertTriangle } from "lucide-react";

export default function StepRideDetails({ form, onChange, pets, onContinue, onAddPet, onPricingCalculated, selectedPetNeedsExpert }) {
  const [pricing, setPricing]         = useState(null);
  const [isCalculating, setIsCalc]    = useState(false);
  const [pricingError, setPricingErr] = useState(null);

  const selectedPet  = pets.find(p => p.id === form.pet_id);
  const canCalculate = form.pickup_location && form.dropoff_location && form.pet_id;
  const isValid      = form.pickup_location && form.dropoff_location && form.scheduled_date && form.pet_id && form.phone;
  const isBlocked    = pricing?.out_of_service_area;

  const resetPricing = () => { setPricing(null); onPricingCalculated && onPricingCalculated(null); };

  const handleAddressChange = (key, val) => { onChange(key, val); resetPricing(); };
  const handlePetChange     = (val) => { onChange("pet_id", val); resetPricing(); };

  const handleCalculatePrice = async () => {
    setIsCalc(true);
    setPricingErr(null);
    setPricing(null);
    try {
      const res = await base44.functions.invoke('calculateDistance', {
        pickup:     form.pickup_location,
        dropoff:    form.dropoff_location,
        pet_weight: selectedPet?.weight || 0,
      });
      const data = res.data;
      setPricing(data);
      if (!data.out_of_service_area && onPricingCalculated) onPricingCalculated(data);
    } catch {
      setPricingErr("price_unavailable");
    }
    setIsCalc(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B4332]">Book a Ride</h1>
        <p className="text-[#6B5B4F]/80 mt-1 text-sm">Safe transportation for dogs, cats, and other household pets</p>
      </div>

      {/* Phone */}
      <div className="bg-[#EDF7F0] rounded-2xl p-4 border border-[#D8F3DC]">
        <Label className="text-[#1B4332] font-medium flex items-center gap-2 mb-2">
          <Phone className="w-4 h-4 text-[#52B788]" /> Your Mobile Phone Number *
        </Label>
        <Input
          required type="tel"
          value={form.phone || ""}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="(312) 555-1234"
          className="rounded-xl border-[#D8F3DC] h-12 bg-white"
        />
        <p className="text-xs text-[#40916C] font-medium mt-2">📱 You'll get a text confirmation as soon as we receive your request.</p>
      </div>

      {/* Pickup */}
      <div>
        <Label className="text-[#1B4332] font-medium flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-[#52B788]" /> Pickup Location
        </Label>
        <Input
          value={form.pickup_location}
          onChange={(e) => handleAddressChange("pickup_location", e.target.value)}
          placeholder="e.g., 123 Oak Street, Chicago, IL"
          className="rounded-xl border-[#D8F3DC] h-12"
        />
      </div>

      {/* Drop-off */}
      <div>
        <Label className="text-[#1B4332] font-medium flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-[#1B4332]" /> Drop-off Location
        </Label>
        <Input
          value={form.dropoff_location}
          onChange={(e) => handleAddressChange("dropoff_location", e.target.value)}
          placeholder="e.g., Wicker Park Vet Clinic, Chicago, IL"
          className="rounded-xl border-[#D8F3DC] h-12"
        />
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-[#1B4332] font-medium flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-[#52B788]" /> Date
          </Label>
          <Input type="date" value={form.scheduled_date}
            onChange={(e) => onChange("scheduled_date", e.target.value)}
            className="rounded-xl border-[#D8F3DC] h-12" />
        </div>
        <div>
          <Label className="text-[#1B4332] font-medium flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#52B788]" /> Time
          </Label>
          <Input type="time" value={form.scheduled_time}
            onChange={(e) => onChange("scheduled_time", e.target.value)}
            className="rounded-xl border-[#D8F3DC] h-12" />
        </div>
      </div>

      {/* Pet */}
      <div>
        <Label className="text-[#1B4332] font-medium flex items-center gap-2 mb-2">
          <PawPrint className="w-4 h-4 text-[#52B788]" /> Pet
        </Label>
        {pets.length === 0 ? (
          <div className="bg-[#EDF7F0] rounded-2xl p-5 text-center border border-[#D8F3DC]">
            <PawPrint className="w-8 h-8 text-[#52B788]/50 mx-auto mb-2" />
            <p className="text-sm text-[#6B5B4F] font-medium mb-3">You'll need to add a pet profile before booking your first ride.</p>
            <Button type="button" onClick={onAddPet} className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl text-sm">
              <PlusCircle className="w-4 h-4" /> Add a Pet
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Select value={form.pet_id} onValueChange={handlePetChange}>
              <SelectTrigger className="rounded-xl border-[#D8F3DC] h-12">
                <SelectValue placeholder="Select your pet..." />
              </SelectTrigger>
              <SelectContent>
                {pets.map((pet) => (
                  <SelectItem key={pet.id} value={pet.id}>
                    {pet.name}{pet.breed ? ` — ${pet.breed}` : ""}{pet.weight ? ` (${pet.weight} lbs)` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPet?.weight > 75 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 font-medium">
                  Large pet ({selectedPet.weight} lbs) — a <strong>$15 large crate surcharge</strong> will apply.
                </p>
              </div>
            )}
            {selectedPetNeedsExpert && (
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0" />
                <p className="text-xs text-purple-700 font-medium">
                  Behavioral profile flagged — a <strong>$50 Expert Handling surcharge</strong> will apply.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Price Estimator */}
      {canCalculate && (
        <div className="border border-[#D8F3DC] rounded-2xl overflow-hidden">
          <div className="bg-[#EDF7F0] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#2D6A4F]" />
              <span className="text-sm font-semibold text-[#1B4332]">Price Estimate</span>
            </div>
            <Button
              type="button" size="sm"
              onClick={handleCalculatePrice}
              disabled={isCalculating}
              className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-lg text-xs h-7 px-3"
            >
              {isCalculating ? "Calculating…" : pricing ? "Recalculate" : "Calculate"}
            </Button>
          </div>

          {pricingError && (
            <div className="px-4 py-4 bg-[#EDF7F0] border-t border-[#D8F3DC]">
              <p className="text-sm font-medium text-[#1B4332]">We'll confirm pricing shortly after booking</p>
              <p className="text-xs text-[#6B5B4F] mt-1">You can continue with your booking — we'll reach out with the final price.</p>
            </div>
          )}

          {pricing?.out_of_service_area && (
            <div className="px-4 py-4 bg-amber-50 border-t border-amber-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Out of standard service area</p>
                  <p className="text-xs text-amber-700 mt-1">
                    This pickup is {pricing.home_to_pickup_miles} miles from our service center (25-mile limit).
                    Contact us for a custom long-distance quote.
                  </p>
                  <a href="tel:+17087735958" className="mt-2 inline-block text-xs font-semibold text-amber-800 underline">(708) 773-5958</a>
                </div>
              </div>
            </div>
          )}

          {pricing && !pricing.out_of_service_area && (
            <div className="px-4 py-4 bg-white border-t border-[#EDF7F0] space-y-2">
              <div className="flex justify-between text-sm text-[#6B5B4F]">
                <span>Base fare (first 5 mi)</span>
                <span>$25.00</span>
              </div>
              {pricing.extra_miles > 0 && (
                <div className="flex justify-between text-sm text-[#6B5B4F]">
                  <span>{pricing.extra_miles} extra mi × $2.50</span>
                  <span>${pricing.per_mile_charge?.toFixed(2)}</span>
                </div>
              )}
              {pricing.heavy_surcharge > 0 && (
                <div className="flex justify-between text-sm text-amber-700">
                  <span>Large crate surcharge</span>
                  <span>+$15.00</span>
                </div>
              )}
              {pricing.expert_surcharge > 0 && (
                <div className="flex justify-between text-sm text-purple-700">
                  <span>⚡ Expert Handling surcharge</span>
                  <span>+${pricing.expert_surcharge?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[#1B4332] text-base pt-2 border-t border-[#EDF7F0]">
                <span>Estimated Total</span>
                <span>${pricing.price?.toFixed(2)}</span>
              </div>
              <p className="text-xs text-[#6B5B4F]/60 pt-1">{pricing.distance_text} · {pricing.duration_text}</p>
            </div>
          )}

          {!pricing && !pricingError && !isCalculating && (
            <div className="px-4 py-3 bg-white border-t border-[#EDF7F0]">
              <p className="text-xs text-[#6B5B4F]/60">Click Calculate to see your ride price.</p>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <Label className="text-[#1B4332] font-medium mb-2 block">Ride Notes <span className="text-[#6B5B4F]/50 font-normal">(optional)</span></Label>
        <Textarea
          value={form.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          placeholder="Any special instructions for the driver..."
          className="rounded-xl border-[#D8F3DC] resize-none"
          rows={3}
        />
      </div>

      {/* CTAs */}
      <div className="space-y-3 pt-2">
        <Button
          type="button"
          disabled={!isValid || !!isBlocked}
          onClick={onContinue}
          className="w-full h-12 bg-[#1B4332] hover:bg-[#2D6A4F] active:bg-[#152E24] active:scale-[0.98] text-white rounded-2xl text-base font-semibold shadow-lg shadow-[#1B4332]/25 transition-all justify-between px-5"
        >
          <span>Continue</span>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <Link to={createPageUrl("Dashboard")}>
          <Button type="button" variant="ghost" className="w-full h-11 text-[#6B5B4F] rounded-xl">Cancel</Button>
        </Link>
      </div>
    </div>
  );
}
