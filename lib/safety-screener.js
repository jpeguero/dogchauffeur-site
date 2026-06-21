export const SCREENER_SYMPTOMS = [
  { key: "bleeding", label: "Active Bleeding" },
  { key: "seizures", label: "Seizures" },
  { key: "breathing", label: "Trouble Breathing / Respiratory Distress" },
  { key: "collapse", label: "Collapse / Shock" },
  { key: "unresponsiveness", label: "Unresponsiveness / Lethargy" }
];

export const SCREENER_ATTESTATIONS = [
  { key: "stable", label: "I attest that my pet is medically stable and fit for standard, non-emergency transport." },
  { key: "non_emergency", label: "I understand that Pawffeur is a specialty transport service, NOT an ambulance, and cannot provide medical treatment in transit." }
];

export const EMERGENCY_BLOCK_COPY = "Booking Blocked: Emergency Detected. Our service is for non-emergency transport only. Your pet may need immediate veterinary stabilization. Please contact the nearest 24/7 emergency animal hospital or a specialized pet ambulance service now.";

/**
 * Validates safety screener disclosures and attestations.
 * Returns { valid: true } or { valid: false, error: string }
 */
export function validateSafetyScreener(tripIntent, safetyAttestations) {
  if (tripIntent !== "vaccine_appointment" && tripIntent !== "vet_visit") {
    return { valid: true };
  }

  if (!safetyAttestations) {
    return {
      valid: false,
      error: "Booking Blocked: Non-emergency transport attestations must be acknowledged to proceed."
    };
  }

  const {
    symptom_bleeding,
    symptom_seizures,
    symptom_breathing,
    symptom_collapse,
    symptom_unresponsiveness,
    attestation_stable,
    attestation_non_emergency
  } = safetyAttestations;

  if (
    symptom_bleeding === true || symptom_bleeding === "yes" || symptom_bleeding === "true" ||
    symptom_seizures === true || symptom_seizures === "yes" || symptom_seizures === "true" ||
    symptom_breathing === true || symptom_breathing === "yes" || symptom_breathing === "true" ||
    symptom_collapse === true || symptom_collapse === "yes" || symptom_collapse === "true" ||
    symptom_unresponsiveness === true || symptom_unresponsiveness === "yes" || symptom_unresponsiveness === "true"
  ) {
    return {
      valid: false,
      error: EMERGENCY_BLOCK_COPY
    };
  }

  const stableAttested = attestation_stable === true || attestation_stable === "yes" || attestation_stable === "true";
  const nonEmergAttested = attestation_non_emergency === true || attestation_non_emergency === "yes" || attestation_non_emergency === "true";

  if (!stableAttested || !nonEmergAttested) {
    return {
      valid: false,
      error: "Booking Blocked: Non-emergency transport attestations must be acknowledged to proceed."
    };
  }

  return { valid: true };
}
