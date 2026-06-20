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
