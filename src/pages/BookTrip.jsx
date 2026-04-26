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
  });

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
              onConfirm={() => setStep(STEP_AGREEMENT)}
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
    </div>
  );
}