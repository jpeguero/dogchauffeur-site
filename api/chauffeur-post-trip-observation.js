import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  console.log(`[api/chauffeur-post-trip-observation] Route hit: ${req.method}`);

  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    const { ride_id, driver_email } = { ...(req.query || {}), ...(req.body || {}) };

    if (!ride_id) {
      return res.status(400).json({
        success: false,
        error: "ride_id is required",
      });
    }

    if (!driver_email) {
      return res.status(400).json({
        success: false,
        error: "driver_email is required",
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
      console.error("[api/chauffeur-post-trip-observation] Supabase configuration variables are missing.");
      return res.status(500).json({
        success: false,
        error: "Database configuration error",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 1. Fetch trip to verify existence, completion, and driver assignment
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .eq("id", ride_id)
      .single();

    if (tripError || !trip) {
      console.error("[api/chauffeur-post-trip-observation] Fetch trip error or not found:", tripError);
      return res.status(404).json({
        success: false,
        error: "Trip not found",
      });
    }

    // Access Control check
    if ((trip.driver_email || "").toLowerCase() !== driver_email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: "Access Forbidden: You are not assigned to this ride",
      });
    }

    // ==========================================
    // GET METHOD: Check for existing observation
    // ==========================================
    if (req.method === "GET") {
      const { data: log, error: logError } = await supabase
        .from("chauffeur_logs")
        .select("*")
        .eq("trip_id", ride_id)
        .single();

      if (logError && logError.message !== "Not found") {
        console.error("[api/chauffeur-post-trip-observation] Fetch logs error:", logError);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch observation status",
        });
      }

      return res.status(200).json({
        success: true,
        data: log || null,
      });
    }

    // Completion check (only for POST)
    if (trip.status !== "completed") {
      return res.status(400).json({
        success: false,
        error: "Trip must be completed to submit post-trip observations",
      });
    }

    // Linked profile check (only for POST)
    if (!trip.passenger_profile_id) {
      return res.status(400).json({
        success: false,
        error: "Trip is not linked to a Passenger Profile",
      });
    }

    // ==========================================
    // POST METHOD: Submit observation
    // ==========================================
    if (req.method === "POST") {
      const body = req.body || {};
      const {
        behavior_summary,
        handling_outcomes,
        incident_severity,
        recommend_profile_review,
        recommend_risk_reassessment,
        notes
      } = body;

      // 1. Payload field validation
      const validBehaviors = ["calm", "anxious", "vocal", "resistant", "aggressive", "other"];
      if (!behavior_summary || !validBehaviors.includes(behavior_summary)) {
        return res.status(400).json({
          success: false,
          error: `behavior_summary must be one of: ${validBehaviors.join(", ")}`,
        });
      }

      const validSeverities = ["none", "minor", "moderate", "urgent"];
      if (!incident_severity || !validSeverities.includes(incident_severity)) {
        return res.status(400).json({
          success: false,
          error: `incident_severity must be one of: ${validSeverities.join(", ")}`,
        });
      }

      const validOutcomes = [
        "easy_loading",
        "needed_extra_restraint",
        "carrier_issue",
        "owner_instruction_mismatch",
        "medical_concern_observed"
      ];
      if (handling_outcomes !== undefined) {
        if (!Array.isArray(handling_outcomes)) {
          return res.status(400).json({
            success: false,
            error: "handling_outcomes must be an array of strings",
          });
        }
        for (const item of handling_outcomes) {
          if (!validOutcomes.includes(item)) {
            return res.status(400).json({
              success: false,
              error: `Invalid handling_outcomes item: ${item}. Must be one of: ${validOutcomes.join(", ")}`,
            });
          }
        }
      }

      if (notes !== undefined && typeof notes !== "string") {
        return res.status(400).json({
          success: false,
          error: "notes must be a string",
        });
      }

      if (notes && notes.length > 1000) {
        return res.status(400).json({
          success: false,
          error: "notes cannot exceed 1000 characters",
        });
      }

      // 2. Duplicate submission prevention check
      const { data: existingLog } = await supabase
        .from("chauffeur_logs")
        .select("id")
        .eq("trip_id", ride_id)
        .single();

      if (existingLog) {
        return res.status(409).json({
          success: false,
          error: "Observation already submitted for this trip",
        });
      }

      // 3. Insert record
      const insertPayload = {
        trip_id: ride_id,
        passenger_profile_id: trip.passenger_profile_id,
        chauffeur_id: driver_email.toLowerCase(),
        event_type: "post_trip_observation",
        behavior_summary,
        handling_outcomes: handling_outcomes || [],
        incident_severity,
        recommend_profile_review: !!recommend_profile_review,
        recommend_risk_reassessment: !!recommend_risk_reassessment,
        notes: notes || null
      };

      const { data: newLog, error: dbError } = await supabase
        .from("chauffeur_logs")
        .insert([insertPayload])
        .select("*");

      if (dbError || !newLog || newLog.length === 0) {
        console.error("[api/chauffeur-post-trip-observation] DB insert error:", dbError);
        return res.status(500).json({
          success: false,
          error: "Failed to store chauffeur observation",
        });
      }

      return res.status(201).json({
        success: true,
        message: "Observations submitted successfully",
        data: newLog[0],
      });
    }

  } catch (error) {
    console.error("[api/chauffeur-post-trip-observation] General exception:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
