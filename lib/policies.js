import { createClient } from "@supabase/supabase-js";

/**
 * Sanitizes environment variable values by removing surrounding quotes.
 */
function getSanitizedEnv(val) {
  let clean = (val || "").trim();
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.slice(1, -1).trim();
  }
  if (clean.startsWith("'") && clean.endsWith("'")) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
}

/**
 * Fetches a numeric policy value from the public.system_policies table.
 * If query fails, falls back to safe default value.
 * Validates value is within code-enforced bounds.
 *
 * @param {string} key The policy key
 * @param {number} fallbackDefault Manual fallback value if key not configured
 * @returns {Promise<number>} Resolved policy value
 */
export async function getPolicyNumber(key, fallbackDefault) {
  const bounds = {
    override_max_hours: { min: 1, max: 24, default: 12 },
    override_min_audit_chars: { min: 20, max: 200, default: 50 },
    rabies_max_age_days: { min: 30, max: 1460, default: 1095 },
    usda_max_age_days: { min: 30, max: 1460, default: 30 },
    doc_expiry_warning_days: { min: 30, max: 1460, default: 30 },
  };

  const bound = bounds[key];
  const defVal = bound ? bound.default : fallbackDefault;

  try {
    const supabaseUrl = getSanitizedEnv(process.env.SUPABASE_URL);
    const supabaseServiceRoleKey = getSanitizedEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.warn(`[policies] Supabase environment variables missing. Falling back to default for ${key}: ${defVal}`);
      return defVal;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data, error } = await supabase
      .from("system_policies")
      .select("value_number")
      .eq("policy_key", key)
      .single();

    if (error || !data || data.value_number === null || data.value_number === undefined) {
      console.warn(`[policies] Fetching ${key} from database failed or returned empty. Error:`, error, `. Falling back to default: ${defVal}`);
      return defVal;
    }

    const val = Number(data.value_number);
    if (isNaN(val)) {
      return defVal;
    }

    // Enforce safety limits in code
    if (bound) {
      if (val < bound.min) {
        console.warn(`[policies] Fetched value ${val} for ${key} is below safety limit ${bound.min}. Clamping to ${bound.min}`);
        return bound.min;
      }
      if (val > bound.max) {
        console.warn(`[policies] Fetched value ${val} for ${key} is above safety limit ${bound.max}. Clamping to ${bound.max}`);
        return bound.max;
      }
    }

    return val;
  } catch (err) {
    console.error(`[policies] Exception encountered during lookup of ${key}:`, err);
    return defVal;
  }
}

/**
 * Evaluates the pre-clearance status for a passenger profile on a given trip.
 * 
 * @param {object} supabase The Supabase client instance
 * @param {string} passengerProfileId The passenger profile ID
 * @param {object} activeTrip The active trip object (containing id, trip_intent)
 * @returns {Promise<string>} The evaluated pre-clearance status ('cleared', 'blocked', or 'Admin Override Eligible')
 */
export async function evaluatePreClearanceStatus(supabase, passengerProfileId, activeTrip) {
  if (!passengerProfileId) return "cleared";

  // Fetch all approved active clearances for the passenger
  const { data: clearances, error: clError } = await supabase
    .from("passenger_document_clearances")
    .select("*")
    .eq("passenger_profile_id", passengerProfileId)
    .eq("status", "approved_active");

  if (clError) {
    console.error("[policies] Fetch clearances error:", clError);
  }

  // Fetch dynamic policies
  const rabiesMaxAge = await getPolicyNumber("rabies_max_age_days", 1095);
  const usdaMaxAge = await getPolicyNumber("usda_max_age_days", 30);

  const now = new Date();
  let hasRabiesCert = false;
  let hasExpiredDoc = false;

  for (const doc of (clearances || [])) {
    let maxAgeDays = doc.document_type === "rabies_certificate" ? rabiesMaxAge : usdaMaxAge;
    let calculatedExpiry;

    if (doc.issue_date) {
      const issDate = new Date(doc.issue_date);
      const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
      const policyExpiry = new Date(issDate.getTime() + maxAgeMs);
      
      if (doc.document_type === "rabies_certificate" && doc.vaccine_expiration_date) {
        const vetExpDate = new Date(doc.vaccine_expiration_date);
        calculatedExpiry = policyExpiry < vetExpDate ? policyExpiry : vetExpDate;
      } else {
        calculatedExpiry = policyExpiry;
      }
    } else {
      calculatedExpiry = doc.calculated_expiry_at ? new Date(doc.calculated_expiry_at) : new Date(doc.vaccine_expiration_date);
    }

    if (doc.document_type === "rabies_certificate") {
      hasRabiesCert = true;
    }

    if (calculatedExpiry < now) {
      hasExpiredDoc = true;
    }
  }

  if (!hasRabiesCert || hasExpiredDoc) {
    if (!activeTrip) {
      return "blocked";
    }

    // Check for overrides
    const { data: overrides, error: ovError } = await supabase
      .from("admin_override_logs")
      .select("*")
      .eq("trip_id", activeTrip.id)
      .eq("passenger_profile_id", passengerProfileId);

    if (ovError) {
      console.error("[policies] Fetch overrides error:", ovError);
    }

    const nowStr = new Date().toISOString();
    const hasActiveOverride = (overrides || []).some(o => o.bypass_expires_at > nowStr);

    if (!hasActiveOverride) {
      if (activeTrip.trip_intent === "vaccine_appointment") {
        return "Admin Override Eligible";
      } else {
        return "blocked";
      }
    }
  }

  return "cleared";
}

