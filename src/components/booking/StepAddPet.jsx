import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, ChevronLeft, Loader2, Brain, AlertTriangle } from "lucide-react";

const EXPERT_SURCHARGE = 50;

export default function StepAddPet({ pet, onChange, onSave, onBack, isSaving }) {
  const isValid = pet.name && pet.type;
  const needsExpertHandling = pet.leash_reactive || pet.human_aggressive;
  const hasAnyBehaviorFlag = pet.crate_trained === false || pet.leash_reactive || pet.human_aggressive;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B4332]">Add a Pet</h1>
        <p className="text-[#6B5B4F]/80 mt-1 text-sm">Tell us about the pet we'll be transporting</p>
      </div>

      {/* Name */}
      <div>
        <Label className="text-[#1B4332] font-medium mb-2 block">Pet Name</Label>
        <Input
          value={pet.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g., Bella"
          className="rounded-xl border-[#D8F3DC] h-12"
        />
      </div>

      {/* Type */}
      <div>
        <Label className="text-[#1B4332] font-medium mb-2 block">Pet Type</Label>
        <Select value={pet.type} onValueChange={(v) => onChange("type", v)}>
          <SelectTrigger className="rounded-xl border-[#D8F3DC] h-12">
            <SelectValue placeholder="Select pet type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Dog">Dog</SelectItem>
            <SelectItem value="Cat">Cat</SelectItem>
            <SelectItem value="Other">Other household pet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Breed & Age */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-[#1B4332] font-medium mb-2 block">Breed <span className="text-[#6B5B4F]/50 font-normal">(optional)</span></Label>
          <Input
            value={pet.breed}
            onChange={(e) => onChange("breed", e.target.value)}
            placeholder="e.g., Golden Retriever"
            className="rounded-xl border-[#D8F3DC] h-12"
          />
        </div>
        <div>
          <Label className="text-[#1B4332] font-medium mb-2 block">Age <span className="text-[#6B5B4F]/50 font-normal">(optional)</span></Label>
          <Input
            type="number"
            value={pet.age}
            onChange={(e) => onChange("age", e.target.value)}
            placeholder="Years"
            className="rounded-xl border-[#D8F3DC] h-12"
          />
        </div>
      </div>

      {/* Weight */}
      <div>
        <Label className="text-[#1B4332] font-medium mb-2 block">Weight (lbs) <span className="text-[#6B5B4F]/50 font-normal">(optional)</span></Label>
        <Input
          type="number"
          value={pet.weight}
          onChange={(e) => onChange("weight", e.target.value)}
          placeholder="e.g., 45"
          className="rounded-xl border-[#D8F3DC] h-12"
        />
      </div>

      {/* Behavioral Profile */}
      <div className="bg-[#EDF7F0] rounded-2xl border border-[#D8F3DC] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#2D6A4F]" />
          <Label className="text-[#1B4332] font-semibold text-sm">Behavioral Profile</Label>
        </div>
        <p className="text-xs text-[#6B5B4F]/70 -mt-1">Check all that apply — this helps us assign the right handler.</p>

        {[
          { key: "crate_trained", label: "Crate-trained", desc: "Comfortable in a crate for transit" },
          { key: "leash_reactive", label: "Leash-reactive", desc: "Reacts to other dogs or stimuli on leash" },
          { key: "human_aggressive", label: "Human-aggressive", desc: "Has displayed aggression toward people" },
        ].map(({ key, label, desc }) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!pet[key]}
              onChange={(e) => onChange(key, e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#1B4332] rounded"
            />
            <div>
              <p className="text-sm font-medium text-[#1B4332]">{label}</p>
              <p className="text-xs text-[#6B5B4F]/60">{desc}</p>
            </div>
          </label>
        ))}

        {needsExpertHandling && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Expert Handling Required</p>
              <p className="text-xs text-amber-700 mt-0.5">
                An <strong>Expert Handling surcharge of +${EXPERT_SURCHARGE}</strong> will be added to this trip.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <Label className="text-[#1B4332] font-medium mb-2 block">
          Special Handling Notes <span className="text-[#6B5B4F]/50 font-normal">(optional)</span>
        </Label>
        <Textarea
          value={pet.special_care_instructions}
          onChange={(e) => onChange("special_care_instructions", e.target.value)}
          placeholder="Leash requirements, crate needs, anxiety, medications, or other important details"
          className="rounded-xl border-[#D8F3DC] resize-none"
          rows={3}
        />
      </div>

      {/* CTAs */}
      <div className="space-y-3 pt-2">
        <Button
          type="button"
          disabled={!isValid || isSaving}
          onClick={onSave}
          className="w-full h-12 bg-[#1B4332] hover:bg-[#2D6A4F] active:bg-[#152E24] active:scale-[0.98] text-white rounded-2xl text-base font-semibold shadow-lg shadow-[#1B4332]/25 transition-all justify-between px-5"
        >
          {isSaving ? (
            <><Loader2 className="w-5 h-5 animate-spin" /><span>Saving...</span><span /></>
          ) : (
            <><span>Save Pet and Continue</span><ChevronRight className="w-5 h-5" /></>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="w-full h-11 text-[#6B5B4F] rounded-xl flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
      </div>
    </div>
  );
}