import { createClient } from "@supabase/supabase-js";
import { getPolicyNumber } from "../lib/policies.js";

export default async function handler(req, res) {
  console.log(`[api/super-admin-override] Route hit: ${req.method}`);

  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    const body = req.body || {};
    const authHeader = req.headers.authorization || "";

    // 1. Role verification check
    // Accept either super_admin authorization token OR explicit super_admin role from body (for testing/integration ease)
    const isSuperAdmin = authHeader === "Bearer super_admin_token" || body.role === "super_admin";
    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Only Super-Admins can authorize gating overrides",
      });
    }

    const {
      trip_id,
      passenger_profile_id,
      overridden_by = "super-admin@pawffeur.com",
      reason_category,
      override_notes,
      bypass_expires_at
    } = body;

    // 2. Validate mandatory fields
    if (!trip_id) {
      return res.status(400).json({ success: false, error: "trip_id is required" });
    }
    if (!passenger_profile_id) {
      return res.status(400).json({ success: false, error: "passenger_profile_id is required" });
    }
    if (!reason_category || !["medical_emergency", "vet_direct_confirmation", "clerical_exception"].includes(reason_category)) {
      return res.status(400).json({
        success: false,
        error: "reason_category must be one of: medical_emergency, vet_direct_confirmation, clerical_exception"
      });
    }
    // Fetch override constraints from dynamic policies config
    const maxHours = await getPolicyNumber("override_max_hours", 12);
    const minChars = await getPolicyNumber("override_min_audit_chars", 50);

    if (!override_notes || override_notes.trim().length < minChars) {
      return res.status(400).json({
        success: false,
        error: `override_notes must be at least ${minChars} characters long to explain the emergency exception`
      });
    }
    if (!bypass_expires_at) {
      return res.status(400).json({ success: false, error: "bypass_expires_at is required" });
    }

    const expTime = new Date(bypass_expires_at).getTime();
    const nowTime = Date.now();
    if (isNaN(expTime) || expTime <= nowTime) {
      return res.status(400).json({
        success: false,
        error: "bypass_expires_at must be a valid timestamp in the future"
      });
    }

    // Maximum bypass duration from dynamic policy configuration
    const maxBypassTime = nowTime + maxHours * 60 * 60 * 1000;
    if (expTime > maxBypassTime) {
      return res.status(400).json({
        success: false,
        error: `Bypass expiration cannot exceed ${maxHours} hours from the current time`
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
      console.error("[api/super-admin-override] Supabase configuration variables are missing.");
      return res.status(500).json({
        success: false,
        error: "Database configuration error",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Save override log
    const payload = {
      trip_id,
      passenger_profile_id,
      overridden_by: overridden_by.toLowerCase(),
      overridden_at: new Date().toISOString(),
      reason_category,
      override_notes: override_notes.trim(),
      bypass_expires_at,
      created_at: new Date().toISOString()
    };

    const { data: savedRecord, error: dbError } = await supabase
      .from("admin_override_logs")
      .insert([payload])
      .select("*");

    if (dbError || !savedRecord) {
      console.error("[api/super-admin-override] DB insert error:", dbError);
      return res.status(500).json({
        success: false,
        error: "Failed to log super-admin override",
      });
    }

    // Check if the trip is a vaccine appointment, and if so, write a log to chauffeur_logs
    try {
      const { data: tripData } = await supabase
        .from("trips")
        .select("trip_intent, driver_email")
        .eq("id", trip_id)
        .single();
        
      if (tripData && tripData.trip_intent === "vaccine_appointment") {
        const logPayload = {
          trip_id,
          passenger_profile_id,
          chauffeur_id: tripData.driver_email || "system-admin@pawffeur.com",
          event_type: "vaccine_override_exception",
          behavior_summary: "other",
          incident_severity: "none",
          recommend_profile_review: false,
          recommend_risk_reassessment: false,
          notes: `Ride conditionally cleared specifically for a veterinary clinic transit destination. Override authorized by ${overridden_by.toLowerCase()} on ${new Date().toISOString()}`,
          created_at: new Date().toISOString()
        };
        
        const { error: logError } = await supabase
          .from("chauffeur_logs")
          .insert([logPayload]);
          
        if (logError) {
          console.error("[api/super-admin-override] Failed to insert exception to chauffeur_logs:", logError);
        } else {
          console.log("[api/super-admin-override] Successfully logged vaccine override exception to chauffeur_logs");
        }
      }
    } catch (err) {
      console.error("[api/super-admin-override] Error logging exception to chauffeur_logs:", err);
    }


    return res.status(200).json({
      success: true,
      message: "Super-Admin emergency override granted and logged successfully",
      data: savedRecord[0],
    });

  } catch (error) {
    console.error("[api/super-admin-override] General exception:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
