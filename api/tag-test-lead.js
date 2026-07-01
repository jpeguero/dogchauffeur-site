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

    const testLeadIds = [
      "dbca97a7-b77c-4885-844a-f2838ac40f2b",
      "582a68c8-d4fc-477a-a824-117c06b5ea24"
    ];

    const { data, error } = await supabase
      .from("leads")
      .update({ status: "verification_test", notes: "VERIFICATION-ONLY TEST LEAD. Ignored for operational routing." })
      .in("id", testLeadIds)
      .select();

    return res.status(200).json({
      success: !error,
      error,
      updated: data
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
