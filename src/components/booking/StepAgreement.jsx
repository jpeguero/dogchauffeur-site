import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Shield, FileText } from "lucide-react";

const AGREEMENT_SECTIONS = [
  {
    title: "1. Scope of Service (The \u201cSolo\u201d Clause)",
    body: "Client acknowledges that DogChauffeur is a specialized pet transportation and behavioral logistics service. To comply with commercial insurance regulations and maintain a focused, stress-free environment for the animals, no human passengers are permitted to ride in the vehicle during transport.",
  },
  {
    title: "2. Expert Handling & Behavior",
    body: "As a Certified Dog Trainer, the Driver will use professional judgment to ensure the pet's safety. Client must disclose all known behavioral issues, including aggression, high anxiety, or \"escape artist\" tendencies. DogChauffeur reserves the right to refuse transport if a pet poses an immediate danger to itself or the handler.",
  },
  {
    title: "3. Health & Vaccinations",
    body: "Client warrants that the pet is in good health and current on all required vaccinations (Rabies, Distemper, Parvovirus, and Bordetella). A copy of the pet's vaccination record must be uploaded to the DogChauffeur app prior to pickup.",
  },
  {
    title: "4. Emergency Medical Authorization",
    body: "In the event of a medical emergency during transport, DogChauffeur is authorized to seek immediate veterinary care at the nearest available facility. All costs associated with emergency care, including transport to a vet, are the sole responsibility of the Client.",
  },
  {
    title: "5. Liability Waiver",
    body: "DogChauffeur utilizes crash-tested crates and industrial-grade securement. However, Client acknowledges the inherent risks of vehicle travel. Client agrees to release DogChauffeur from liability for any injury, illness, or death of the pet unless caused by gross negligence or willful misconduct.",
  },
  {
    title: "6. Safe Containment",
    body: "For the safety of the pet and the driver, all pets will be secured in professional-grade crates or via specialized safety harnesses for the duration of the trip.",
  },
];

export default function StepAgreement({ onAccept, onBack }) {
  const [agreed, setAgreed] = useState(false);

  const handleConfirm = () => {
    if (!agreed) return;
    onAccept(new Date().toISOString());
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#EDF7F0] flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#1B4332]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Safety Agreement</h1>
        </div>
        <p className="text-[#6B5B4F]/80 text-sm mt-1">Please read and accept the DogChauffeur Pet Transport & Safety Agreement before confirming your ride.</p>
      </div>

      {/* Agreement text */}
      <div className="bg-white rounded-2xl border border-[#EDF7F0] overflow-hidden">
        <div className="bg-[#1B4332] px-5 py-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#D8F3DC]" />
          <span className="text-sm font-bold text-white">DogChauffeur: Pet Transport & Safety Agreement</span>
        </div>
        <div className="px-5 py-4 max-h-72 overflow-y-auto space-y-4">
          {AGREEMENT_SECTIONS.map((s) => (
            <div key={s.title}>
              <p className="text-xs font-bold text-[#1B4332] mb-1">{s.title}</p>
              <p className="text-xs text-[#6B5B4F]/80 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Checkbox */}
      <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
        agreed ? "border-[#1B4332] bg-[#EDF7F0]" : "border-[#D8F3DC] bg-white hover:border-[#74C69D]"
      }`}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[#1B4332] shrink-0"
        />
        <span className="text-sm text-[#1B4332] font-medium leading-relaxed">
          I have read and agree to the DogChauffeur Safety Agreement, including the Solo-Pet Transport and Emergency Vet clauses.
        </span>
      </label>

      {/* CTAs */}
      <div className="space-y-3">
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={!agreed}
          className="w-full h-12 bg-[#1B4332] hover:bg-[#2D6A4F] disabled:opacity-50 text-white rounded-2xl text-base font-semibold shadow-lg shadow-[#1B4332]/25 transition-all justify-between px-5"
        >
          <span>Confirm & Submit Ride</span>
          <ChevronRight className="w-5 h-5" />
        </Button>
        <Button
          type="button" variant="ghost"
          onClick={onBack}
          className="w-full h-11 text-[#6B5B4F] rounded-xl flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Review
        </Button>
      </div>
    </div>
  );
}