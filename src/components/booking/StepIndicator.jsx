import React from "react";
import { Check } from "lucide-react";

const STEPS = ["Ride Details", "Your Pet", "Review", "Confirm"];

export default function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-between w-full mb-8">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const isDone = currentStep > step;
        const isActive = currentStep === step;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                isDone ? "bg-[#1B4332] text-white" :
                isActive ? "bg-[#1B4332] text-white ring-4 ring-[#1B4332]/20" :
                "bg-[#EDF7F0] text-[#6B5B4F]"
              }`}>
                {isDone ? <Check className="w-4 h-4" /> : step}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${isActive ? "text-[#1B4332]" : "text-[#6B5B4F]/70"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${currentStep > step ? "bg-[#1B4332]" : "bg-[#EDF7F0]"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}