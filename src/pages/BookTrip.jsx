import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import StepIndicator from "@/components/booking/StepIndicator";
import StepRideDetails from "@/components/booking/StepRideDetails";
import StepAddPet from "@/components/booking/StepAddPet";
import StepReview from "@/components/booking/StepReview";
import StepConfirmation from "@/components/booking/StepConfirmation";
import StepAgreement from "@/components/booking/StepAgreement";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

const STEP_RIDE = 1;
const STEP_PET = 2;
const STEP_REVIEW = 3;
const STEP_AGREEMENT = 4;
const STEP_CONFIRM = 5;

export default function BookTrip() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(STEP_RIDE);
  const [createdTripId, setCreatedTripId] = useState(null);

  const [pricing, setPricing] = useState(null);

  const [form, setForm] = useState({
    pet_id: "",
    phone: "",
    pickup_location: "",
    dropoff_location: "",
    scheduled_date: "",
    scheduled_time: "",
    notes: "",
    trip_intent: "standard",
  });

  const [showScreener, setShowScreener] = useState(false);
  const [screenerAnswers, setScreenerAnswers] = useState({
    bleeding: null,
    seizures: null,
    breathing: null,
    collapse: null,
    unresponsiveness: null,
  });
  const [attestations, setAttestations] = useState({
    stable: false,
    nonEmergency: false,
  });

  const handleScreenerClose = () => {
    setShowScreener(false);
    setScreenerAnswers({
      bleeding: null,
      seizures: null,
      breathing: null,
      collapse: null,
      unresponsiveness: null,
    });
    setAttestations({
      stable: false,
      nonEmergency: false,
    });
  };

  const hasEmergencySymptom = Object.values(screenerAnswers).some(val => val === "yes");
  const allNo = Object.values(screenerAnswers).every(val => val === "no");
  const canContinue = allNo && attestations.stable && attestations.nonEmergency;

  const [newPet, setNewPet] = useState({
    name: "",
    type: "",
    breed: "",
    age: "",
    weight: "",
    special_care_instructions: "",
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: pets = [], refetch: refetchPets } = useQuery({
    queryKey: ["pets-for-booking", user?.email],
    queryFn: () => base44.entities.Pet.filter({ owner_email: user.email }),
    enabled: !!user,
  });

  const savePetMutation = useMutation({
    mutationFn: (petData) => base44.entities.Pet.create(petData),
    onSuccess: async (saved) => {
      await refetchPets();
      setForm((f) => ({ ...f, pet_id: saved.id }));
      setStep(STEP_REVIEW);
    },
  });

  const createTripMutation = useMutation({
    mutationFn: (data) => base44.entities.Trip.create(data),
    onSuccess: async (trip, variables) => {
      setCreatedTripId(trip.id);
      if (variables.phone) {
        try {
          await base44.functions.invoke('sendSMS', {
            phone: variables.phone,
            pet_name: variables.pet_name || "your pet",
            event_type: "ride_received",
            trip_id: trip.id
          });
        } catch (e) { console.error("SMS error", e); }
      }
      setStep(STEP_CONFIRM);
    },
  });

  const selectedPet = pets.find((p) => p.id === form.pet_id);
  const selectedPetNeedsExpert = selectedPet?.leash_reactive || selectedPet?.human_aggressive;

  const handleFormChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const handlePetChange = (key, value) => setNewPet((p) => ({ ...p, [key]: value }));

  const EXPERT_SURCHARGE = 50;
  const petNeedsExpert = newPet.leash_reactive || newPet.human_aggressive;

  const handleSavePet = () => {
    const savedPet = {
      ...newPet,
      age: newPet.age ? Number(newPet.age) : undefined,
      weight: newPet.weight ? Number(newPet.weight) : undefined,
      owner_email: user.email,
    };
    savePetMutation.mutate(savedPet);
    // If expert handling needed, apply surcharge to pricing
    if (petNeedsExpert && pricing) {
      setPricing(prev => prev ? { ...prev, price: (prev.price || 0) + EXPERT_SURCHARGE, expert_surcharge: EXPERT_SURCHARGE } : prev);
    } else if (petNeedsExpert) {
      setPricing({ price: EXPERT_SURCHARGE, expert_surcharge: EXPERT_SURCHARGE });
    }
  };

  const handleAgreementAccepted = (timestamp) => {
    setForm(f => ({ ...f, agreement_accepted_at: timestamp }));
    setStep(STEP_CONFIRM);
    const pet = pets.find((p) => p.id === form.pet_id);
    createTripMutation.mutate({
      ...form,
      pet_name: pet?.name || "",
      owner_email: user.email,
      status: "requested",
      price: pricing?.price || undefined,
      agreement_accepted_at: timestamp,
    });
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="py-2 mb-2">
        <StepIndicator currentStep={step === STEP_PET ? 2 : step} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
        >
          {step === STEP_RIDE && (
            <StepRideDetails
              form={form}
              onChange={handleFormChange}
              pets={pets}
              onContinue={() => {
                // Apply expert surcharge for existing pet if needed
                if (selectedPetNeedsExpert && pricing) {
                  const base = pricing.expert_surcharge ? pricing.price : (pricing.price || 0) + EXPERT_SURCHARGE;
                  setPricing(prev => prev ? { ...prev, price: base, expert_surcharge: EXPERT_SURCHARGE } : prev);
                }
                setStep(STEP_REVIEW);
              }}
              onAddPet={() => setStep(STEP_PET)}
              onPricingCalculated={setPricing}
              selectedPetNeedsExpert={selectedPetNeedsExpert}
            />
          )}
          {step === STEP_PET && (
            <StepAddPet
              pet={newPet}
              onChange={handlePetChange}
              onSave={handleSavePet}
              onBack={() => setStep(STEP_RIDE)}
              isSaving={savePetMutation.isPending}
            />
          )}
          {step === STEP_REVIEW && (
            <StepReview
              form={form}
              pet={selectedPet}
              pricing={pricing}
              onConfirm={() => {
                if (form.trip_intent === "vaccine_appointment" || form.trip_intent === "vet_visit") {
                  setShowScreener(true);
                } else {
                  setStep(STEP_AGREEMENT);
                }
              }}
              onEdit={() => setStep(STEP_RIDE)}
              isSubmitting={false}
            />
          )}
          {step === STEP_AGREEMENT && (
            <StepAgreement
              onAccept={handleAgreementAccepted}
              onBack={() => setStep(STEP_REVIEW)}
            />
          )}
          {step === STEP_CONFIRM && (
            <StepConfirmation
              form={form}
              pet={selectedPet}
              tripId={createdTripId}
              userId={user?.id}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <Dialog open={showScreener} onOpenChange={(open) => { if (!open) handleScreenerClose(); }}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto bg-white p-6 shadow-xl border border-gray-100">
          <DialogHeader className="border-b border-[#EDF7F0] pb-3">
            <DialogTitle className="text-xl font-bold text-[#1B4332] flex items-center gap-2">
              🛡️ Medical Safety Gating
            </DialogTitle>
          </DialogHeader>
          
          {hasEmergencySymptom ? (
            <div className="mt-4 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-sm text-red-900">
                <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold uppercase tracking-wider text-red-800">Emergency Detected</p>
                  <p className="text-xs text-red-700 leading-relaxed font-semibold">
                    Booking Blocked: Emergency Detected. Our service is for non-emergency transport only. Your pet may need immediate veterinary stabilization. Please contact the nearest 24/7 emergency animal hospital or a specialized pet ambulance service now.
                  </p>
                </div>
              </div>
              <Button onClick={handleScreenerClose} className="w-full bg-red-700 hover:bg-red-800 text-white rounded-xl py-2.5 font-semibold transition">
                Understand & Close
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              <p className="text-sm text-[#6B5B4F]/90 font-medium">
                Because this ride is vet-related, we must complete a quick medical safety screening.
              </p>
              
              <div className="space-y-3.5">
                <p className="text-xs font-bold text-[#1B4332] uppercase tracking-wider">
                  Is your pet experiencing any of these symptoms?
                </p>
                
                {[
                  { key: "bleeding", label: "Active Bleeding" },
                  { key: "seizures", label: "Seizures" },
                  { key: "breathing", label: "Trouble Breathing / Respiratory Distress" },
                  { key: "collapse", label: "Collapse / Shock" },
                  { key: "unresponsiveness", label: "Unresponsiveness / Lethargy" }
                ].map(symptom => (
                  <div key={symptom.key} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <span className="text-xs font-semibold text-[#1B4332]">{symptom.label}</span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={screenerAnswers[symptom.key] === "yes" ? "destructive" : "outline"}
                        className="h-8 rounded-lg text-xs"
                        onClick={() => setScreenerAnswers(prev => ({ ...prev, [symptom.key]: "yes" }))}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={screenerAnswers[symptom.key] === "no" ? "default" : "outline"}
                        className={`h-8 rounded-lg text-xs ${screenerAnswers[symptom.key] === "no" ? "bg-[#1B4332] text-white hover:bg-[#2D6A4F]" : ""}`}
                        onClick={() => setScreenerAnswers(prev => ({ ...prev, [symptom.key]: "no" }))}
                      >
                        No
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {allNo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 border-t border-gray-150 pt-4"
                >
                  <p className="text-xs font-bold text-[#1B4332] uppercase tracking-wider">
                    Non-Emergency Transport Attestations
                  </p>
                  
                  <div className="space-y-3 bg-[#F9F7F3] border border-[#EDE8D9] rounded-xl p-3">
                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        id="attest_stable"
                        checked={attestations.stable}
                        onCheckedChange={(checked) => setAttestations(prev => ({ ...prev, stable: !!checked }))}
                        className="border-gray-300 text-[#1B4332] focus:ring-[#52B788] mt-0.5"
                      />
                      <Label htmlFor="attest_stable" className="text-xs text-[#6B5B4F] cursor-pointer font-medium leading-tight">
                        I attest that my pet is medically stable and fit for standard, non-emergency transport.
                      </Label>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        id="attest_nonEmergency"
                        checked={attestations.nonEmergency}
                        onCheckedChange={(checked) => setAttestations(prev => ({ ...prev, nonEmergency: !!checked }))}
                        className="border-gray-300 text-[#1B4332] focus:ring-[#52B788] mt-0.5"
                      />
                      <Label htmlFor="attest_nonEmergency" className="text-xs text-[#6B5B4F] cursor-pointer font-medium leading-tight">
                        I understand that Pawffeur is a specialty transport service, NOT an ambulance, and cannot provide medical treatment in transit.
                      </Label>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="border-t border-[#EDF7F0] pt-4 flex gap-2">
                <Button
                  type="button"
                  disabled={!canContinue}
                  onClick={() => {
                    setStep(STEP_AGREEMENT);
                    setShowScreener(false);
                  }}
                  className="flex-1 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl py-2.5 font-semibold transition"
                >
                  Continue to Checkout
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleScreenerClose}
                  className="border-gray-200 text-[#6B5B4F] hover:bg-gray-50 rounded-xl py-2.5 font-semibold transition"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}