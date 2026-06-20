import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  console.log(`[api/chauffeur-safety-card] Route hit: ${req.method}`);

  try {
    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    const { ride_id, driver_email } = req.query || {};

    if (!ride_id) {
      return res.status(400).json({
        success: false,
        error: "ride_id query parameter is required",
      });
    }

    if (!driver_email) {
      return res.status(400).json({
        success: false,
        error: "driver_email query parameter is required",
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
      console.error("[api/chauffeur-safety-card] Supabase configuration variables are missing.");
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
      console.error("[api/chauffeur-safety-card] Fetch trip error or not found:", tripError);
      return res.status(404).json({
        success: false,
        error: "Trip not found",
      });
    }

    // 2. Access Control check: does requested driver_email match the trip's driver_email?
    // Case-insensitive comparison for safety
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
      console.error("[api/chauffeur-safety-card] Fetch passenger profile error or not found:", profileError);
      return res.status(404).json({
        success: false,
        error: "Passenger profile not found",
      });
    }

    // 5. Fetch past observations history (timeline)
    const { data: observations, error: obsError } = await supabase
      .from("chauffeur_logs")
      .select("id, trip_id, chauffeur_id, behavior_summary, handling_outcomes, incident_severity, recommend_profile_review, recommend_risk_reassessment, notes, created_at")
      .eq("passenger_profile_id", passengerProfileId)
      .order("created_at", { ascending: false });

    if (obsError) {
      console.error("[api/chauffeur-safety-card] Fetch observations error:", obsError);
    }

    // Fetch past health record verifications (timeline)
    const { data: verifications, error: verError } = await supabase
      .from("chauffeur_health_record_verifications")
      .select("id, trip_id, reviewed_by, transport_decision, hold_reason, verification_notes, created_at")
      .eq("passenger_profile_id", passengerProfileId);

    if (verError) {
      console.error("[api/chauffeur-safety-card] Fetch health verifications error:", verError);
    }

    const mappedVerifications = (verifications || []).map(v => {
      let notes = "";
      if (v.transport_decision === "pass_visual_match") {
        notes = "Visual check passed; safety restraint hardware anchored.";
      } else {
        notes = `Visual mismatch or non-compliant transport hardware. Reason: ${v.hold_reason || ""}`;
      }
      if (v.verification_notes) {
        notes += ` Notes: ${v.verification_notes}`;
      }

      return {
        id: v.id,
        trip_id: v.trip_id,
        chauffeur_id: v.reviewed_by,
        event_type: "health_record_verification",
        behavior_summary: v.transport_decision,
        incident_severity: v.transport_decision === "pass_visual_match" ? "none" : "minor",
        notes: notes,
        created_at: v.created_at
      };
    });

    const allHistory = [...(observations || []), ...mappedVerifications];
    allHistory.sort((a, b) => {
      const timeDiff = new Date(b.created_at) - new Date(a.created_at);
      if (timeDiff !== 0) return timeDiff;
      return String(b.id).localeCompare(String(a.id));
    });
    const safetyReqUpdatedAt = profile.safety_requirements_updated_at
      ? new Date(profile.safety_requirements_updated_at).getTime()
      : 0;

    const acknowledgedAtTime = trip.acknowledged_at
      ? new Date(trip.acknowledged_at).getTime()
      : 0;

    const isAssigneeMatch = trip.acknowledged_by && trip.driver_email &&
      trip.acknowledged_by.toLowerCase() === trip.driver_email.toLowerCase();

    // The review is valid/fresh only if assignee matches AND acknowledgment is at or after safety updates
    const isAckFresh = isAssigneeMatch && acknowledgedAtTime >= safetyReqUpdatedAt;

    const whitelistPayload = {
      pet_name: profile.pet_name,
      species: profile.species,
      breed: profile.breed,
      weight: profile.weight,
      age_group: profile.age_group,
      temperament: profile.temperament,
      emergency_contact_name: profile.emergency_contact_name,
      emergency_contact_phone: profile.emergency_contact_phone,
      vet_info_on_file: !!(profile.emergency_vet_name && profile.emergency_vet_name.trim()),
      comfort_notes: profile.write_in_feedback?.notes || null,
      acknowledged_at: isAckFresh ? (trip.acknowledged_at || null) : null,
      acknowledged_by: isAckFresh ? (trip.acknowledged_by || null) : null,
      escape_risk: !!profile.escape_risk,
      bite_scratch_risk: !!profile.bite_scratch_risk,
      medical_risk: !!profile.medical_risk,
      carrier_required: !!profile.carrier_required,
      checklist_details: isAckFresh ? (trip.checklist_details || null) : null,
      safety_requirements_updated_at: profile.safety_requirements_updated_at || null,
      requires_re_review: !isAckFresh && trip.acknowledged_at !== null && isAssigneeMatch,
      review_state: (!isAckFresh && trip.acknowledged_at !== null && isAssigneeMatch) ? "stale_profile_change" : null,
      observations: allHistory
    };

    return res.status(200).json({
      success: true,
      data: whitelistPayload,
    });

  } catch (error) {
    console.error("[api/chauffeur-safety-card] General exception:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
