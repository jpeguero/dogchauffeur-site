import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    let supabaseUrl = (process.env.SUPABASE_URL || "").trim();
    if (supabaseUrl.startsWith('"') && supabaseUrl.endsWith('"')) {
      supabaseUrl = supabaseUrl.slice(1, -1).trim();
    }
    if (supabaseUrl.startsWith("'") && supabaseUrl.endsWith("'")) {
      supabaseUrl = supabaseUrl.slice(1, -1).trim();
    }

    let supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    if (supabaseServiceRoleKey.startsWith('"') && supabaseServiceRoleKey.endsWith('"')) {
      supabaseServiceRoleKey = supabaseServiceRoleKey.slice(1, -1).trim();
    }
    if (supabaseServiceRoleKey.startsWith("'") && supabaseServiceRoleKey.endsWith("'")) {
      supabaseServiceRoleKey = supabaseServiceRoleKey.slice(1, -1).trim();
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return res.status(500).json({ error: "Missing config" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const targetId = "890cfcf0-a370-4bb8-bab1-bdf53823e6f6";
    const { data, error } = await supabase
      .from("leads")
      .update({ notes: "verification-only" })
      .eq("id", targetId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, updatedLead: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
