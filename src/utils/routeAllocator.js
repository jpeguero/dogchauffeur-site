/**
 * Pet Fit & Route Allocator
 * Determines travel compatibility and routing constraints for pet passengers
 * based on biometrics, temperament, and vehicle capabilities.
 * 
 * Returns eligibility status, warnings, reason codes, and human-review flags.
 */

export function allocateRoute({ pet, vehicle, activePassengers = [] }) {
  const result = {
    eligible: true,
    reviewRequired: false,
    requiredHumanReview: false,
    reasonCodes: [],
    warnings: []
  };

  // Ensure robust input values
  const weight = parseFloat(pet.weight_lbs) || 0;
  const height = parseFloat(pet.height_inches) || null;
  const length = parseFloat(pet.length_inches) || null;
  const temperament = pet.temperament || 'Calm';
  const isReactive = temperament === 'Reactive' || !!pet.is_reactive;
  const requiresIsolation = !!pet.requires_isolation;
  const isCat = String(pet.pet_type || pet.species || '').toLowerCase() === 'cat';
  const isDog = String(pet.pet_type || pet.species || '').toLowerCase() === 'dog';

  // 1. Weight capacity check
  if (weight > vehicle.max_weight_capacity_lbs) {
    result.eligible = false;
    result.reasonCodes.push('VEHICLE_WEIGHT_CAPACITY_EXCEEDED');
  }

  const activeWeight = activePassengers.reduce((sum, p) => sum + (parseFloat(p.weight_lbs) || 0), 0);
  if (result.eligible && (activeWeight + weight) > vehicle.max_weight_capacity_lbs) {
    result.eligible = false;
    result.reasonCodes.push('VEHICLE_TOTAL_PAYLOAD_LIMIT_EXCEEDED');
  }

  // 2. Ramp requirements
  if (pet.ramp_required && !vehicle.has_ramp_equipment) {
    result.eligible = false;
    result.reasonCodes.push('VEHICLE_MISSING_RAMP');
  }

  // 3. Volumetric checks (1.25x length and 1.15x height space-planning buffers)
  if (height !== null && vehicle.cargo_height_inches) {
    const requiredHeight = height * 1.15;
    if (requiredHeight > vehicle.cargo_height_inches) {
      result.eligible = false;
      result.reasonCodes.push('INSUFFICIENT_COMPARTMENT_HEIGHT');
    }
  }

  if (length !== null && vehicle.cargo_length_inches) {
    const requiredLength = length * 1.25;
    if (requiredLength > vehicle.cargo_length_inches) {
      result.eligible = false;
      result.reasonCodes.push('INSUFFICIENT_COMPARTMENT_LENGTH');
    }
  }

  // 4. Temperament & Reactivity Isolation flags (triggers human-review)
  if (isReactive) {
    result.reviewRequired = true;
    result.requiredHumanReview = true;
    result.warnings.push('REACTIVE_PET_ISOLATION_REQUIRED');
  }

  if (requiresIsolation) {
    result.reviewRequired = true;
    result.requiredHumanReview = true;
    result.warnings.push('MOBILITY_RECOVERY_EXCLUSIVITY');
  }

  // 5. Crate Training Compatibility
  if (!pet.crate_trained) {
    result.reviewRequired = true;
    result.requiredHumanReview = true;
    if (pet.vehicle_space_preference === 'standard') {
      result.warnings.push('CRATE_TRAINING_MISMATCH');
    } else {
      result.warnings.push('CRATE_FREE_TRANSIT');
    }
  }

  // 6. Multi-species Cohabitation checks (Dogs & Cats sharing a cabin)
  const hasCatPassenger = activePassengers.some(p => String(p.pet_type || p.species || '').toLowerCase() === 'cat');
  const hasDogPassenger = activePassengers.some(p => String(p.pet_type || p.species || '').toLowerCase() === 'dog');

  if ((isCat && hasDogPassenger) || (isDog && hasCatPassenger)) {
    result.reviewRequired = true;
    result.requiredHumanReview = true;
    result.warnings.push('MULTI_SPECIES_COHABITATION');
  }

  // 7. Active slot counts validation
  const isXlPreference = pet.vehicle_space_preference === 'xl_bay';
  const maxSlots = isXlPreference ? vehicle.xl_bay_capacity : vehicle.standard_bay_capacity;
  const activeSamePreferenceCount = activePassengers.filter(p => p.vehicle_space_preference === pet.vehicle_space_preference).length;

  if (result.eligible && activeSamePreferenceCount >= maxSlots) {
    result.eligible = false;
    result.reasonCodes.push('VEHICLE_COMPARTMENT_SLOTS_FULL');
  }

  return result;
}
