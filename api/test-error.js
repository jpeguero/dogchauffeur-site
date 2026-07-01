import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    let supabaseUrl = (process.env.SUPABASE_URL || "").trim();
    if (supabaseUrl.startsWith('"') && supabaseUrl.endsWith('"')) supabaseUrl = supabaseUrl.slice(1, -1).trim();
    if (supabaseUrl.startsWith("'") && supabaseUrl.endsWith("'")) supabaseUrl = supabaseUrl.slice(1, -1).trim();

    let supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    if (supabaseServiceRoleKey.startsWith('"') && supabaseServiceRoleKey.endsWith('"')) supabaseServiceRoleKey = supabaseServiceRoleKey.slice(1, -1).trim();
    if (supabaseServiceRoleKey.startsWith("'") && supabaseServiceRoleKey.endsWith("'")) supabaseServiceRoleKey = supabaseServiceRoleKey.slice(1, -1).trim();

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const leadData = {
      lead_ref: `ERRTEST-${Math.floor(10000 + Math.random() * 90000)}`,
      status: "new",
      full_name: "Test Error Agent",
      phone: "1234567890",
      email: "test@example.com",
      ride_type: "Vet Visit",
      pickup_address: "Test Pick",
      dropoff_address: "Test Drop",
      preferred_date: "2026-07-15",
      consent: true,
      consent_text: "Test Consent",
      pet_weight_lbs: 140,
      pet_weight_range: "Large (50+ lbs)",
      pet_shoulder_height_in: 34,
      pet_body_length_in: 35,
      ramp_required: true,
      crate_trained: false,
      temperament_with_pets: "Reactive",
      vehicle_space_preference: "xl_bay",
      fit_review_required: true,
      fit_review_reason_codes: ["TEST_REASON"],
      fit_review_warnings: ["TEST_WARN"]
    };

    const { data, error } = await supabase
      .from("leads")
      .insert([leadData])
      .select();

    return res.status(200).json({
      success: false,
      errorInfo: error ? {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      } : null,
      data
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
