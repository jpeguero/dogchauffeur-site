import React from "react";
import { motion } from "framer-motion";
import { PawPrint, Heart, AlertCircle, Shield, ShieldCheck, ShieldAlert, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../auth/useAuth";

const tempColors = {
  Calm: "bg-blue-50 text-blue-700 border-blue-200",
  Excited: "bg-purple-50 text-purple-700 border-purple-200",
  Anxious: "bg-amber-50 text-amber-700 border-amber-200",
  Fearful: "bg-orange-50 text-orange-700 border-orange-200",
  Reactive: "bg-red-50 text-red-700 border-red-200",
  // Support legacy lower-cased keys
  calm: "bg-blue-50 text-blue-700 border-blue-200",
  friendly: "bg-green-50 text-green-700 border-green-200",
  anxious: "bg-amber-50 text-amber-700 border-amber-200",
  energetic: "bg-purple-50 text-purple-700 border-purple-200",
};

const stateColors = {
  Active: "bg-green-100 text-green-800 border-green-200",
  Draft: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function PetCard({ pet, delay = 0 }) {
  const { effectiveUser } = useAuth();
  
  // Resolve properties with legacy fallbacks
  const petName = pet.pet_name || pet.name || "Unnamed Pet";
  const species = pet.species || pet.pet_type || "Other";
  const breed = pet.breed || "Unknown Breed";
  const weight = pet.weight ? `${pet.weight} lbs` : "";
  const ageInfo = pet.age_group || (pet.age ? `${pet.age} yrs` : "");
  const temperament = pet.temperament;
  const notes = pet.write_in_feedback?.notes || pet.special_care_instructions;
  const state = pet.lifecycle_state || "Active";
  const hasConsent = !!pet.emergency_vet_consent;

  // Resolve co-ownership and suggestions
  const isCoOwned = pet.owner_email && effectiveUser?.email && pet.owner_email !== effectiveUser.email;
  const hasPendingSuggestions = pet.suggested_changes && Object.keys(pet.suggested_changes).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white rounded-2xl border border-[#EDF7F0] overflow-hidden card-hover flex flex-col justify-between h-full shadow-sm"
    >
      <div>
        <div className="h-40 bg-gradient-to-br from-[#D8F3DC] to-[#B7E4C7] flex items-center justify-center relative">
          {pet.photo_url ? (
            <img src={pet.photo_url} alt={petName} className="w-full h-full object-cover" />
          ) : (
            <PawPrint className="w-16 h-16 text-[#2D6A4F]/30" />
          )}

          {/* Vet Consent Shield */}
          <div className="absolute top-3 left-3 flex gap-2 items-center">
            {hasConsent ? (
              <div className="bg-green-50/90 backdrop-blur-sm border border-green-200 rounded-xl p-1.5 shadow-sm flex items-center gap-1.5 text-[10px] font-bold text-green-700" title="Emergency Vet Consent Authorized">
                <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                <span className="hidden sm:inline">Authorized</span>
              </div>
            ) : (
              <div className="bg-slate-50/90 backdrop-blur-sm border border-slate-200 rounded-xl p-1.5 shadow-sm flex items-center gap-1.5 text-[10px] font-bold text-slate-500" title="No Emergency Vet Consent">
                <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="hidden sm:inline">Unverified Vet</span>
              </div>
            )}

            {/* Co-Owner Badge on Header */}
            {isCoOwned && (
              <div className="bg-blue-50/90 backdrop-blur-sm border border-blue-200 rounded-xl p-1.5 shadow-sm flex items-center gap-1.5 text-[10px] font-bold text-blue-700" title="Co-Owned Profile">
                <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="hidden sm:inline">Co-Owner</span>
              </div>
            )}
          </div>

          {/* Temperament Badge */}
          {temperament && (
            <Badge className={`absolute top-3 right-3 ${tempColors[temperament] || "bg-gray-50 text-gray-700"} border text-xs font-medium`}>
              {temperament}
            </Badge>
          )}
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#1B4332] truncate max-w-[120px]">{petName}</h3>
              <Badge className="bg-[#EDF7F0] text-[#2D6A4F] hover:bg-[#D8F3DC] text-[10px] font-semibold border-none px-2 py-0.5 rounded-full capitalize">
                {species}
              </Badge>
            </div>
            {/* Lifecycle State Badge */}
            <Badge className={`${stateColors[state] || "bg-slate-100 text-slate-700"} border text-[10px] font-medium px-2 py-0.5 rounded-full`}>
              {state}
            </Badge>
          </div>

          <p className="text-xs text-[#6B5B4F]/70 font-medium">
            {breed} {ageInfo ? `· ${ageInfo}` : ""} {weight ? `· ${weight}` : ""}
          </p>

          {/* Safety Risk Badges */}
          {(pet.escape_risk || pet.bite_scratch_risk || pet.medical_risk || pet.carrier_required) && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {pet.escape_risk && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-500 shrink-0" />
                  Escape Risk
                </Badge>
              )}
              {pet.bite_scratch_risk && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-orange-500 shrink-0" />
                  Bite Risk
                </Badge>
              )}
              {pet.medical_risk && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
                  Medical Risk
                </Badge>
              )}
              {pet.carrier_required && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <PawPrint className="w-3 h-3 text-blue-500 shrink-0" />
                  Carrier Req.
                </Badge>
              )}
            </div>
          )}

          {notes && (
            <div className="bg-[#FEFAE0] rounded-xl p-3 flex items-start gap-2 border border-[#E9E4CE]/30">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-[#6B5B4F] leading-relaxed line-clamp-3">{notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Suggestion Queue Warning Banner */}
      {hasPendingSuggestions && (
        <div className="bg-amber-50 border-t border-amber-100 px-5 py-2.5 flex items-center justify-between text-xs text-amber-800 font-semibold rounded-b-2xl">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            {isCoOwned ? "Pending primary owner review" : "Suggestion pending approval"}
          </span>
        </div>
      )}
    </motion.div>
  );
}