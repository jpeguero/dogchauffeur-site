import { createClient } from "@supabase/supabase-js";
import { getPolicyNumber } from "../lib/policies.js";

export default async function handler(req, res) {
  console.log(`[api/chauffeur-health-record-verification] Route hit: ${req.method}`);

  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    const { trip_id } = { ...(req.query || {}), ...(req.body || {}) };

    if (!trip_id) {
      return res.status(400).json({
        success: false,
        error: "trip_id is required",
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
      console.error("[api/chauffeur-health-record-verification] Supabase configuration variables are missing.");
      return res.status(500).json({
        success: false,
        error: "Database configuration error",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // ==========================================
    // GET METHOD: Retrieve verification record
    // ==========================================
    if (req.method === "GET") {
      // Fetch trip to determine passenger_profile_id and route configuration
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("id", trip_id)
        .single();

      if (tripError || !trip) {
        console.error("[api/chauffeur-health-record-verification] Fetch trip error or not found:", tripError);
        return res.status(404).json({
          success: false,
          error: "Trip not found",
        });
      }

      let pre_clearance_status = "cleared";
      const docWarnings = [];

      if (trip.passenger_profile_id) {
        // Fetch all approved active clearances for the passenger
        const { data: clearances, error: clError } = await supabase
          .from("passenger_document_clearances")
          .select("*")
          .eq("passenger_profile_id", trip.passenger_profile_id)
          .eq("status", "approved_active");

        if (clError) {
          console.error("[api/chauffeur-health-record-verification] Fetch clearances error:", clError);
        }

        // Fetch dynamic policies
        const rabiesMaxAge = await getPolicyNumber("rabies_max_age_days", 1095);
        const usdaMaxAge = await getPolicyNumber("usda_max_age_days", 30);
        const warningDays = await getPolicyNumber("doc_expiry_warning_days", 30);

        const now = new Date();
        const nowTime = now.getTime();
        
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

          // Check if expired
          if (calculatedExpiry < now) {
            hasExpiredDoc = true;
          } else {
            // Check if expiring soon
            const diffTime = calculatedExpiry.getTime() - nowTime;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= warningDays) {
              docWarnings.push({
                document_type: doc.document_type,
                days_remaining: diffDays,
                expiry_date: calculatedExpiry.toISOString().split("T")[0]
              });
            }
          }
        }

        if (!hasRabiesCert || hasExpiredDoc) {
          // If no active rabies cert or any approved document is expired, check for active overrides
          const { data: overrides, error: ovError } = await supabase
            .from("admin_override_logs")
            .select("*")
            .eq("trip_id", trip_id)
            .eq("passenger_profile_id", trip.passenger_profile_id);

          if (ovError) {
            console.error("[api/chauffeur-health-record-verification] Fetch overrides error:", ovError);
          }

          const nowStr = new Date().toISOString();
          const hasActiveOverride = (overrides || []).some(o => o.bypass_expires_at > nowStr);

          if (!hasActiveOverride) {
            pre_clearance_status = "blocked";
          }
        }
      }

      // Fetch visual safety verification record
      const { data: record, error: getError } = await supabase
        .from("chauffeur_health_record_verifications")
        .select("*")
        .eq("trip_id", trip_id)
        .single();

      if (getError && getError.message !== "Not found") {
        console.error("[api/chauffeur-health-record-verification] Fetch verification error:", getError);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch verification status",
        });
      }

      const responsePayload = {
        success: true,
        pre_clearance_status,
        data: record || null,
      };

      const isAdmin = req.query.role === "super_admin" || req.query.role === "admin";
      if (isAdmin && docWarnings.length > 0) {
        responsePayload.warnings = docWarnings;
      }

      return res.status(200).json(responsePayload);
    }

    // ==========================================
    // ==========================================
    // POST METHOD: Save/Update verification record
    // ==========================================
    if (req.method === "POST") {
      const body = req.body || {};
      const {
        reviewed_by,
        reviewed_at,
        visual_match_confirmed,
        restraint_hardware_confirmed,
        photo_capture_attached,
        transport_decision,
        hold_reason,
        verification_notes
      } = body;

      // 1. Mandatory fields checks
      if (!reviewed_by) {
        return res.status(400).json({
          success: false,
          error: "reviewed_by is required",
        });
      }

      if (!reviewed_at) {
        return res.status(400).json({
          success: false,
          error: "reviewed_at is required",
        });
      }

      const validDecisions = ["pass_visual_match", "fail_visual_mismatch"];
      if (!transport_decision || !validDecisions.includes(transport_decision)) {
        return res.status(400).json({
          success: false,
          error: `transport_decision must be one of: ${validDecisions.join(", ")}`,
        });
      }

      // 2. Fetch trip to verify assignment and policies
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("id", trip_id)
        .single();

      if (tripError || !trip) {
        console.error("[api/chauffeur-health-record-verification] Fetch trip error or not found:", tripError);
        return res.status(404).json({
          success: false,
          error: "Trip not found",
        });
      }

      // Access Control: Verify requesting driver is the assigned chauffeur
      if ((trip.driver_email || "").toLowerCase() !== reviewed_by.toLowerCase()) {
        return res.status(403).json({
          success: false,
          error: "Access Forbidden: You are not assigned to this ride",
        });
      }

      // 3. Validation Logic based on transport decision
      if (transport_decision === "pass_visual_match") {
        if (!visual_match_confirmed || !restraint_hardware_confirmed || !photo_capture_attached) {
          return res.status(400).json({
            success: false,
            error: "Cannot clear transport: Visual match, restraint hardware, and photo capture must all be confirmed",
          });
        }
      } else {
        // transport_decision is 'fail_visual_mismatch'
        if (!hold_reason || !hold_reason.trim()) {
          return res.status(400).json({
            success: false,
            error: "hold_reason is required when transport decision is failed",
          });
        }
      }

      // 4. Save/Upsert verification record
      const payload = {
        trip_id,
        passenger_profile_id: trip.passenger_profile_id || null,
        reviewed_by: reviewed_by.toLowerCase(),
        reviewed_at,
        visual_match_confirmed: !!visual_match_confirmed,
        restraint_hardware_confirmed: !!restraint_hardware_confirmed,
        photo_capture_attached: !!photo_capture_attached,
        transport_decision,
        hold_reason: transport_decision === "pass_visual_match" ? null : hold_reason,
        verification_notes: verification_notes || null,
        updated_at: new Date().toISOString()
      };

      // Check if verification already exists for this trip
      const { data: existingRecord } = await supabase
        .from("chauffeur_health_record_verifications")
        .select("id")
        .eq("trip_id", trip_id)
        .single();

      let savedRecord;
      let dbError;

      if (existingRecord) {
        const { data, error } = await supabase
          .from("chauffeur_health_record_verifications")
          .update(payload)
          .eq("trip_id", trip_id)
          .select("*");
        savedRecord = data ? data[0] : null;
        dbError = error;
      } else {
        payload.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from("chauffeur_health_record_verifications")
          .insert([payload])
          .select("*");
        savedRecord = data ? data[0] : null;
        dbError = error;
      }

      if (dbError || !savedRecord) {
        console.error("[api/chauffeur-health-record-verification] DB write error:", dbError);
        return res.status(500).json({
          success: false,
          error: "Failed to store visual safety verification",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Visual safety verification saved successfully",
        data: savedRecord,
      });
    }

  } catch (error) {
    console.error("[api/chauffeur-health-record-verification] General exception:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
