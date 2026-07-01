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

    // Query columns of the leads table
    const { data: columns, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'leads' })
      .catch(() => ({ data: null, error: 'RPC not available' }));

    // Try a test insert
    const leadData = {
      lead_ref: `TEST-${Math.floor(10000 + Math.random() * 90000)}`,
      status: "new",
      full_name: "Test DB Agent",
      phone: "1234567890",
      email: "test@example.com",
      ride_type: "Vet Visit",
      pickup_address: "Test Pick",
      dropoff_address: "Test Drop",
      preferred_date: "2026-07-15",
      consent: true,
      consent_text: "Test Consent",
      weight_lbs: 140,
      height_inches: 34,
      length_inches: 35,
      ramp_required: true,
      crate_trained: false,
      temperament: "Reactive",
      vehicle_space_preference: "xl_bay"
    };

    const { data: inserted, error: insertError } = await supabase
      .from("leads")
      .insert([leadData])
      .select();

    return res.status(200).json({
      success: false,
      columns,
      colError,
      insertError: insertError ? {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      } : null,
      inserted
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
