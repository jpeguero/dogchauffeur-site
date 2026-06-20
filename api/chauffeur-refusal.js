import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  console.log(`[api/chauffeur-refusal] Route hit: ${req.method}`);

  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    const body = req.body || {};
    const ride_id = body.ride_id || body.trip_id;
    const driver_email = body.driver_email;

    if (!ride_id) {
      return res.status(400).json({
        success: false,
        error: "ride_id or trip_id is required",
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
      console.error("[api/chauffeur-refusal] Supabase configuration variables are missing.");
      return res.status(500).json({
        success: false,
        error: "Database configuration error",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 1. Fetch trip to verify existence and driver assignment
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .eq("id", ride_id)
      .single();

    if (tripError || !trip) {
      console.error("[api/chauffeur-refusal] Fetch trip error or not found:", tripError);
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

    // Check if trip is already cancelled or completed
    if (trip.status === "cancelled" || trip.status === "completed") {
      return res.status(400).json({
        success: false,
        error: `Cannot refuse trip that is already ${trip.status}`,
      });
    }

    // 2. Set trip status and driver_action_status to 'cancelled'
    const { data: updatedTrip, error: updateError } = await supabase
      .from("trips")
      .update({
        status: "cancelled",
        driver_action_status: "cancelled"
      })
      .eq("id", ride_id)
      .select("*")
      .single();

    if (updateError || !updatedTrip) {
      console.error("[api/chauffeur-refusal] Update trip error:", updateError);
      return res.status(500).json({
        success: false,
        error: "Failed to update trip status",
      });
    }

    // 3. Log safety exception to chauffeur_logs
    const logPayload = {
      trip_id: ride_id,
      passenger_profile_id: trip.passenger_profile_id || null,
      chauffeur_id: driver_email.toLowerCase(),
      event_type: "medical_refusal_exception",
      behavior_summary: "other",
      handling_outcomes: [],
      incident_severity: "urgent",
      recommend_profile_review: false,
      recommend_risk_reassessment: false,
      notes: "[Chauffeur Log]: Trip cancelled at curbside. Animal exhibited acute emergency symptoms. Refused for transit safety.",
      created_at: new Date().toISOString()
    };

    const { data: newLog, error: dbError } = await supabase
      .from("chauffeur_logs")
      .insert([logPayload])
      .select("*");

    if (dbError || !newLog || newLog.length === 0) {
      console.error("[api/chauffeur-refusal] DB insert error into chauffeur_logs:", dbError);
      // We still return 200/success for the cancellation but warn about the log failure, 
      // or should we fail the request? Usually it is better to return 500 if the log is required.
      return res.status(500).json({
        success: false,
        error: "Trip was updated but failed to store chauffeur safety exception log",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Curbside refusal processed successfully and logged.",
      data: {
        trip: updatedTrip,
        log: newLog[0]
      }
    });

  } catch (error) {
    console.error("[api/chauffeur-refusal] General exception:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
