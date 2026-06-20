import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  console.log(`[api/chauffeur-acknowledgment] Route hit: ${req.method}`);

  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    // Accept ride_id and driver_email from either query parameters or request body
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
      console.error("[api/chauffeur-acknowledgment] Supabase configuration variables are missing.");
      return res.status(500).json({
        success: false,
        error: "Database configuration error",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 1. Fetch trip to verify assignment
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .eq("id", ride_id)
      .single();

    if (tripError || !trip) {
      console.error("[api/chauffeur-acknowledgment] Fetch trip error or not found:", tripError);
      return res.status(404).json({
        success: false,
        error: "Trip not found",
      });
    }

    // 2. Access Control check: does requested driver_email match the trip's driver_email?
    if ((trip.driver_email || "").toLowerCase() !== driver_email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: "Access Forbidden: You are not assigned to this ride",
      });
    }

    // 3. Check for passenger profile ID on the trip
    const passengerProfileId = trip.passenger_profile_id;
    if (!passengerProfileId) {
      return res.status(400).json({
        success: false,
        error: "Trip is not linked to a Passenger Profile",
      });
    }

    // 4. Fetch the passenger profile
    const { data: profile, error: profileError } = await supabase
      .from("passenger_profiles")
      .select("*")
      .eq("id", passengerProfileId)
      .single();

    if (profileError || !profile) {
      console.error("[api/chauffeur-acknowledgment] Fetch passenger profile error or not found:", profileError);
      return res.status(404).json({
        success: false,
        error: "Passenger profile not found",
      });
    }

    // 5. Checklist validations if profile is high-risk
    const { checklist_details, safety_requirements_updated_at, profile_snapshot_timestamp } = { ...(req.query || {}), ...(req.body || {}) };

    const clientTimestamp = safety_requirements_updated_at || profile_snapshot_timestamp;
    if (clientTimestamp && profile.safety_requirements_updated_at) {
      const serverTime = new Date(profile.safety_requirements_updated_at).getTime();
      const clientTime = new Date(clientTimestamp).getTime();
      if (clientTime < serverTime) {
        return res.status(409).json({
          success: false,
          error: "Stale review checklist: passenger safety requirements have been updated. Please refresh and try again.",
        });
      }
    }

    if (profile.escape_risk || profile.bite_scratch_risk || profile.medical_risk) {
      if (!checklist_details || typeof checklist_details !== "object") {
        return res.status(400).json({
          success: false,
          error: "Bypass blocked: All mandatory safety checkboxes must be checked",
        });
      }

      if (profile.escape_risk) {
        if (checklist_details.confirm_harness !== true || checklist_details.confirm_doors_closed !== true) {
          return res.status(400).json({
            success: false,
            error: "Bypass blocked: All mandatory safety checkboxes must be checked",
          });
        }
      }

      if (profile.bite_scratch_risk) {
        if (checklist_details.confirm_gloves !== true) {
          return res.status(400).json({
            success: false,
            error: "Bypass blocked: All mandatory safety checkboxes must be checked",
          });
        }
      }

      if (profile.medical_risk) {
        if (checklist_details.confirm_medical !== true) {
          return res.status(400).json({
            success: false,
            error: "Bypass blocked: All mandatory safety checkboxes must be checked",
          });
        }
      }
    }

    // 6. Update the trip record to mark safety reviewed
    const acknowledged_at = new Date().toISOString();
    const { data: updatedTrip, error: updateError } = await supabase
      .from("trips")
      .update({
        acknowledged_at,
        acknowledged_by: driver_email,
        checklist_details: checklist_details || null
      })
      .eq("id", ride_id)
      .select("*");

    if (updateError) {
      console.error("[api/chauffeur-acknowledgment] Update trip acknowledgment error:", updateError);
      return res.status(500).json({
        success: false,
        error: "Failed to save acknowledgment status",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ride_id,
        acknowledged_at,
        acknowledged_by: driver_email,
        checklist_details: checklist_details || null
      }
    });

  } catch (error) {
    console.error("[api/chauffeur-acknowledgment] General exception:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
