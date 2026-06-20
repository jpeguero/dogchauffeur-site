import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  console.log(`[api/admin-policy-config] Route hit: ${req.method}`);

  try {
    if (req.method !== "GET" && req.method !== "PATCH") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    const authHeader = req.headers.authorization || "";
    const roleParam = req.query.role || (req.body && req.body.role) || "";

    // Role verification check (super_admin required)
    const isSuperAdmin = authHeader === "Bearer super_admin_token" || roleParam === "super_admin";
    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Only Super-Admins can view or modify policy configurations",
      });
    }

    // Initialize Supabase client
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
      console.error("[api/admin-policy-config] Supabase configuration variables are missing.");
      return res.status(500).json({
        success: false,
        error: "Database configuration error",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // ==========================================
    // GET METHOD: Retrieve system policies
    // ==========================================
    if (req.method === "GET") {
      const { data: policies, error: dbError } = await supabase
        .from("system_policies")
        .select("*")
        .order("policy_key", { ascending: true });

      if (dbError) {
        console.error("[api/admin-policy-config] DB fetch error:", dbError);
        return res.status(500).json({
          success: false,
          error: "Failed to retrieve system policies",
        });
      }

      return res.status(200).json({
        success: true,
        data: policies || [],
      });
    }

    // ==========================================
    // PATCH METHOD: Update system policy
    // ==========================================
    if (req.method === "PATCH") {
      const body = req.body || {};
      const { policy_key, value_number, updated_by = "super-admin@pawffeur.com" } = body;

      if (!policy_key) {
        return res.status(400).json({
          success: false,
          error: "policy_key is required",
        });
      }

      if (value_number === undefined || value_number === null) {
        return res.status(400).json({
          success: false,
          error: "value_number is required",
        });
      }

      const valNum = Number(value_number);
      if (isNaN(valNum)) {
        return res.status(400).json({
          success: false,
          error: "value_number must be a valid number",
        });
      }

      // Enforce strict safety bounds in backend
      if (policy_key === "override_max_hours") {
        if (valNum < 1 || valNum > 24) {
          return res.status(400).json({
            success: false,
            error: "override_max_hours must be between 1 and 24 hours",
          });
        }
      } else if (policy_key === "override_min_audit_chars") {
        if (valNum < 20 || valNum > 200) {
          return res.status(400).json({
            success: false,
            error: "override_min_audit_chars must be between 20 and 200 characters",
          });
        }
      } else if (["rabies_max_age_days", "usda_max_age_days", "doc_expiry_warning_days"].includes(policy_key)) {
        if (valNum < 30 || valNum > 1460) {
          return res.status(400).json({
            success: false,
            error: `${policy_key} must be between 30 and 1460 days`,
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: `Unknown or unmodifiable policy key: ${policy_key}`,
        });
      }

      // Perform update
      const { data: updatedRecord, error: dbError } = await supabase
        .from("system_policies")
        .update({
          value_number: valNum,
          updated_by: updated_by.toLowerCase(),
          updated_at: new Date().toISOString(),
        })
        .eq("policy_key", policy_key)
        .select("*");

      if (dbError || !updatedRecord || updatedRecord.length === 0) {
        console.error("[api/admin-policy-config] DB update error:", dbError);
        return res.status(500).json({
          success: false,
          error: `Failed to update system policy: ${policy_key}`,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Policy ${policy_key} updated successfully`,
        data: updatedRecord[0],
      });
    }

  } catch (error) {
    console.error("[api/admin-policy-config] General exception:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
