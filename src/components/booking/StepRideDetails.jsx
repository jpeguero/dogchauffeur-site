import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, Clock, PawPrint, ChevronRight, PlusCircle, Phone, Calculator, AlertTriangle, Info } from "lucide-react";
import {
  calculatePrice,
  formatPriceDisplay,
  mapTemperamentToBehavior,
  SERVICE_TYPES,
} from "@/utils/pricing";

export default function StepRideDetails({ form, onChange, pets, onContinue, onAddPet, onPricingCalculated, selectedPetNeedsExpert }) {
  const [pricing, setPricing] = useState(null);
  const [isCalculating, setIsCalc] = useState(false);

  const selectedPet = pets.find(p => p.id === form.pet_id);
  const canCalculate = form.pickup_location && form.dropoff_location && form.pet_id;
  const isValid = form.pickup_location && form.dropoff_location && form.scheduled_date && form.pet_id && form.phone;

  // Determine behavior level from pet
  const behaviorLevel = selectedPet
    ? mapTemperamentToBehavior(selectedPet.temperament, selectedPetNeedsExpert)
    : 'calm';

  // Determine transport tier (recommend premium for reactive pets)
  const transportTier = selectedPetNeedsExpert || behaviorLevel === 'reactive' ? 'premium' : 'standard';

  // Reset pricing when addresses or pet change
  const resetPricing = () => {
    setPricing(null);
    onPricingCalculated && onPricingCalculated(null);
  };

  const handleAddressChange = (key, val) => {
    onChange(key, val);
    resetPricing();
  };

  const handlePetChange = (val) => {
    onChange("pet_id", val);
    resetPricing();
  };

  // Calculate price locally (no external API calls)
  const handleCalculatePrice = () => {
    setIsCalc(true);
    
    // Distance is not available in this MVP - will be added later via Vercel API route
    // For now, pricing is estimate-only without distance
    const distanceMiles = null;

    // Calculate price (works without distance)
    const priceResult = calculatePrice({
      transportTier,
      tripType: form.trip_type || 'one_way',
      serviceType: form.service_type || 'custom',
      behaviorLevel,
      distanceMiles,
    });

    setPricing(priceResult);
    
    if (onPricingCalculated) {
      onPricingCalculated(priceResult);
    }

    setIsCalc(false);
  };

  // Auto-recalculate when relevant form fields change (if we already have a price)
  useEffect(() => {
    if (pricing && canCalculate) {
      const priceResult = calculatePrice({
        transportTier,
        tripType: form.trip_type || 'one_way',
        serviceType: form.service_type || 'custom',
        behaviorLevel,
        distanceMiles: null,
      });
      setPricing(priceResult);
      if (onPricingCalculated) {
        onPricingCalculated(priceResult);
      }
    }
  }, [form.trip_type, form.service_type, transportTier, behaviorLevel]);

  const priceDisplay = formatPriceDisplay(pricing);

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
        <p className="text-xs text-[#40916C] font-medium mt-2">You will get a text confirmation as soon as we receive your request.</p>
      </div>

      {/* Service Type */}
      <div>
        <Label className="text-[#1B4332] font-medium flex items-center gap-2 mb-2">
          Service Type
        </Label>
        <Select value={form.service_type || ""} onValueChange={(v) => onChange("service_type", v)}>
          <SelectTrigger className="rounded-xl border-[#D8F3DC] h-12">
            <SelectValue placeholder="Select service type..." />
          </SelectTrigger>
          <SelectContent>
            {Object.values(SERVICE_TYPES).map((svc) => (
              <SelectItem key={svc.id} value={svc.id}>
                {svc.label} {svc.surcharge > 0 ? `(+$${svc.surcharge})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Trip Type */}
      <div>
        <Label className="text-[#1B4332] font-medium flex items-center gap-2 mb-2">
          Trip Type
        </Label>
        <Select value={form.trip_type || "one_way"} onValueChange={(v) => onChange("trip_type", v)}>
          <SelectTrigger className="rounded-xl border-[#D8F3DC] h-12">
            <SelectValue placeholder="Select trip type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one_way">One-way</SelectItem>
            <SelectItem value="round_trip">Round-trip (1.75x)</SelectItem>
          </SelectContent>
        </Select>
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
            <p className="text-sm text-[#6B5B4F] font-medium mb-3">You will need to add a pet profile before booking your first ride.</p>
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
                  Behavioral profile flagged — <strong>Behavior-Aware Transport</strong> recommended (+$15 base).
                </p>
              </div>
            )}
            {behaviorLevel === 'anxious' && !selectedPetNeedsExpert && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 font-medium">
                  Slightly anxious pet — a <strong>$15 handling surcharge</strong> will apply.
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
              {isCalculating ? "Calculating..." : pricing ? "Recalculate" : "Calculate"}
            </Button>
          </div>

          {/* Price Result */}
          {pricing && (
            <div className="px-4 py-4 bg-white border-t border-[#EDF7F0] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1B4332]">Estimated</span>
                <span className="text-lg font-bold text-[#1B4332]">
                  {priceDisplay?.priceRange}
                </span>
              </div>
              <p className="text-xs text-[#6B5B4F]">{priceDisplay?.subtitle}</p>

              {/* Breakdown */}
              <div className="pt-2 border-t border-[#EDF7F0] space-y-1.5 text-xs text-[#6B5B4F]">
                <div className="flex justify-between">
                  <span>{pricing.tier.label} base fare</span>
                  <span>${pricing.baseFare}</span>
                </div>
                {pricing.serviceSurcharge > 0 && (
                  <div className="flex justify-between">
                    <span>{pricing.service.label}</span>
                    <span>+${pricing.serviceSurcharge}</span>
                  </div>
                )}
                {pricing.behaviorSurcharge > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>{pricing.behavior.label} handling</span>
                    <span>+${pricing.behaviorSurcharge}</span>
                  </div>
                )}
                {pricing.hasDistance && pricing.extraMiles > 0 && (
                  <div className="flex justify-between">
                    <span>{pricing.extraMiles.toFixed(1)} extra miles @ $3/mi</span>
                    <span>+${pricing.distanceSurcharge.toFixed(0)}</span>
                  </div>
                )}
                {pricing.tripMultiplier > 1 && (
                  <div className="flex justify-between text-[#2D6A4F]">
                    <span>Round-trip</span>
                    <span>x{pricing.tripMultiplier}</span>
                  </div>
                )}
              </div>

              {/* Confirmation message - distance not yet available */}
              <div className="pt-2 border-t border-[#EDF7F0]">
                <p className="text-xs text-[#6B5B4F]">
                  We will confirm final pricing after booking
                </p>
              </div>
            </div>
          )}

          {/* Initial state - no price yet */}
          {!pricing && !isCalculating && (
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
          disabled={!isValid}
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
