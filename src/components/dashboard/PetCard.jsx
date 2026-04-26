import React from "react";
import { motion } from "framer-motion";
import { PawPrint, Heart, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const tempColors = {
  calm: "bg-blue-50 text-blue-700 border-blue-200",
  friendly: "bg-green-50 text-green-700 border-green-200",
  anxious: "bg-amber-50 text-amber-700 border-amber-200",
  energetic: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function PetCard({ pet, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white rounded-2xl border border-[#EDF7F0] overflow-hidden card-hover"
    >
      <div className="h-40 bg-gradient-to-br from-[#D8F3DC] to-[#B7E4C7] flex items-center justify-center relative">
        {pet.photo_url ? (
          <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
        ) : (
          <PawPrint className="w-16 h-16 text-[#2D6A4F]/30" />
        )}
        {pet.temperament && (
          <Badge className={`absolute top-3 right-3 ${tempColors[pet.temperament]} border text-xs font-medium`}>
            {pet.temperament}
          </Badge>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-[#1B4332]">{pet.name}</h3>
          <Heart className="w-4 h-4 text-[#52B788]" />
        </div>
        <p className="text-sm text-[#6B5B4F]/70 mb-3">{pet.breed} {pet.age ? `· ${pet.age} yrs` : ""} {pet.weight ? `· ${pet.weight} lbs` : ""}</p>
        {pet.special_care_instructions && (
          <div className="bg-[#FEFAE0] rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-[#6B5B4F] leading-relaxed">{pet.special_care_instructions}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}