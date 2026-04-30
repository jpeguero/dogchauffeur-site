// ─────────────────────────────────────────────────────────────────────────────
// DogChauffeur MVP Pricing Calculator
// ─────────────────────────────────────────────────────────────────────────────
// This module calculates ride prices based on:
// 1. Transport tier (Standard vs Premium/Behavior-Aware)
// 2. Trip type (one-way vs round-trip)
// 3. Service type (vet, grooming, daycare, airport)
// 4. Behavior level (calm, anxious, reactive)
// 5. Distance (if available)
//
// If distance calculation fails, fallback pricing is used without blocking.
// ─────────────────────────────────────────────────────────────────────────────

// ── US State Abbreviations (for address normalization) ───────────────────────
const STATE_ABBREVS = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
  oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
  'district of columbia': 'DC',
};

/**
 * Normalizes an address string for consistent formatting.
 * - Trims whitespace and collapses multiple spaces
 * - Ensures proper spacing after commas ("Chicago,IL" → "Chicago, IL")
 * - Uppercases state abbreviations
 * - Converts full state names to abbreviations
 */
export function normalizeAddress(address) {
  if (!address) return address;

  // Trim and collapse multiple spaces
  let normalized = address.trim().replace(/\s+/g, ' ');

  // Ensure space after commas
  normalized = normalized.replace(/,(\S)/g, ', $1');

  // Uppercase state abbreviations at end
  normalized = normalized.replace(
    /,\s*([a-zA-Z]{2})(\s+\d{5}(-\d{4})?)?$/,
    (_, state, zip) => `, ${state.toUpperCase()}${zip || ''}`
  );

  // Convert full state names to abbreviations
  for (const [fullName, abbrev] of Object.entries(STATE_ABBREVS)) {
    const regex = new RegExp(`,\\s*${fullName}(\\s+\\d{5}(-\\d{4})?)?$`, 'i');
    if (regex.test(normalized)) {
      normalized = normalized.replace(regex, (_, zip) => `, ${abbrev}${zip || ''}`);
      break;
    }
  }

  return normalized;
}

// ── Pricing Constants ────────────────────────────────────────────────────────

export const TRANSPORT_TIERS = {
  standard: { id: 'standard', label: 'Standard Transport', baseFare: 35 },
  premium: { id: 'premium', label: 'Behavior-Aware Transport', baseFare: 50 },
};

export const TRIP_TYPES = {
  one_way: { id: 'one_way', label: 'One-way', multiplier: 1.0 },
  round_trip: { id: 'round_trip', label: 'Round-trip', multiplier: 1.75 },
};

export const SERVICE_TYPES = {
  vet: { id: 'vet', label: 'Vet Visit', surcharge: 10 },
  grooming: { id: 'grooming', label: 'Grooming', surcharge: 10 },
  daycare: { id: 'daycare', label: 'Daycare / Boarding', surcharge: 10 },
  airport: { id: 'airport', label: 'Airport Trip', surcharge: 25 },
  custom: { id: 'custom', label: 'Custom Ride', surcharge: 0 },
};

export const BEHAVIOR_LEVELS = {
  calm: { id: 'calm', label: 'Calm', surcharge: 0, recommendPremium: false },
  anxious: { id: 'anxious', label: 'Slightly anxious', surcharge: 15, recommendPremium: false },
  reactive: { id: 'reactive', label: 'Reactive', surcharge: 25, recommendPremium: true },
};

// Distance pricing
const FREE_MILES = 5;
const PER_MILE_RATE = 3;

/**
 * Calculate the price estimate based on all factors.
 * 
 * @param {Object} options
 * @param {string} options.transportTier - 'standard' or 'premium'
 * @param {string} options.tripType - 'one_way' or 'round_trip'
 * @param {string} options.serviceType - 'vet', 'grooming', 'daycare', 'airport', 'custom'
 * @param {string} options.behaviorLevel - 'calm', 'anxious', 'reactive'
 * @param {number|null} options.distanceMiles - Distance in miles (null if unavailable)
 * 
 * @returns {Object} Pricing breakdown
 */
export function calculatePrice({
  transportTier = 'standard',
  tripType = 'one_way',
  serviceType = 'custom',
  behaviorLevel = 'calm',
  distanceMiles = null,
}) {
  const tier = TRANSPORT_TIERS[transportTier] || TRANSPORT_TIERS.standard;
  const trip = TRIP_TYPES[tripType] || TRIP_TYPES.one_way;
  const service = SERVICE_TYPES[serviceType] || SERVICE_TYPES.custom;
  const behavior = BEHAVIOR_LEVELS[behaviorLevel] || BEHAVIOR_LEVELS.calm;

  // Base fare from transport tier
  let baseFare = tier.baseFare;

  // Service surcharge
  const serviceSurcharge = service.surcharge;

  // Behavior surcharge
  const behaviorSurcharge = behavior.surcharge;

  // Distance surcharge (only if distance is available)
  let distanceSurcharge = 0;
  let extraMiles = 0;
  const hasDistance = typeof distanceMiles === 'number' && distanceMiles >= 0;
  
  if (hasDistance) {
    extraMiles = Math.max(0, distanceMiles - FREE_MILES);
    distanceSurcharge = extraMiles * PER_MILE_RATE;
  }

  // Subtotal before trip multiplier
  const subtotal = baseFare + serviceSurcharge + behaviorSurcharge + distanceSurcharge;

  // Apply trip type multiplier
  const total = subtotal * trip.multiplier;

  // Calculate range (for estimates)
  const priceLow = Math.floor(total);
  const priceHigh = Math.ceil(total * 1.15); // 15% buffer for traffic/conditions

  return {
    // Core pricing
    total: Math.round(total * 100) / 100,
    priceLow,
    priceHigh,
    
    // Breakdown
    baseFare,
    serviceSurcharge,
    behaviorSurcharge,
    distanceSurcharge,
    tripMultiplier: trip.multiplier,
    
    // Distance info
    hasDistance,
    distanceMiles: hasDistance ? distanceMiles : null,
    extraMiles,
    
    // Metadata
    tier,
    trip,
    service,
    behavior,
    
    // Recommendations
    recommendPremium: behavior.recommendPremium,
  };
}

/**
 * Generate a user-friendly price display string.
 * 
 * @param {Object} pricing - Result from calculatePrice()
 * @returns {Object} Display strings
 */
export function formatPriceDisplay(pricing) {
  if (!pricing) return null;

  const { priceLow, priceHigh, hasDistance, distanceMiles } = pricing;

  return {
    // Main price display
    priceRange: `$${priceLow}–$${priceHigh}`,
    
    // Subtitle
    subtitle: hasDistance
      ? `Based on ${Math.round(distanceMiles)} miles`
      : 'Depending on distance and traffic',
    
    // Whether distance was calculated
    hasDistance,
  };
}

/**
 * Map a pet's temperament/behavior notes to a behavior level.
 * 
 * @param {string} temperament - Pet temperament string
 * @param {boolean} needsExpertHandling - Whether the pet is flagged for expert handling
 * @returns {string} Behavior level ID
 */
export function mapTemperamentToBehavior(temperament, needsExpertHandling = false) {
  if (needsExpertHandling) return 'reactive';
  
  const t = (temperament || '').toLowerCase();
  
  if (t.includes('reactive') || t.includes('aggressive') || t.includes('difficult')) {
    return 'reactive';
  }
  if (t.includes('anxious') || t.includes('nervous') || t.includes('fearful') || t.includes('shy')) {
    return 'anxious';
  }
  
  return 'calm';
}

/**
 * Map a ride type string to a service type ID.
 * 
 * @param {string} rideType - Ride type string from form
 * @returns {string} Service type ID
 */
export function mapRideTypeToService(rideType) {
  const r = (rideType || '').toLowerCase();
  
  if (r.includes('vet')) return 'vet';
  if (r.includes('groom')) return 'grooming';
  if (r.includes('daycare') || r.includes('boarding')) return 'daycare';
  if (r.includes('airport')) return 'airport';
  
  return 'custom';
}
