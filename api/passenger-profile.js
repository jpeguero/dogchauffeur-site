import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  console.log(`[api/passenger-profile] Route hit: ${req.method}, Action: ${req.query?.action}`);

  try {
    if (req.method !== "POST" && req.method !== "GET" && req.method !== "PATCH") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
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
      console.error("[api/passenger-profile] Supabase configuration variables are missing.");
      return res.status(500).json({
        success: false,
        error: "Database configuration error",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // ==========================================
    // GET METHOD
    // ==========================================
    if (req.method === "GET") {
      const { id, owner_email, action, passenger_profile_id } = req.query || {};

      // Action: list-co-owners
      if (action === "list-co-owners") {
        if (!passenger_profile_id) {
          return res.status(400).json({
            success: false,
            error: "passenger_profile_id is required to list co-owners",
          });
        }
        const { data: coOwners, error: listErr } = await supabase
          .from("passenger_co_owners")
          .select("*")
          .eq("passenger_profile_id", passenger_profile_id);

        if (listErr) {
          console.error("[api/passenger-profile] List co-owners error:", listErr);
          return res.status(500).json({ success: false, error: listErr.message });
        }
        return res.status(200).json({ success: true, data: coOwners });
      }

      if (!id && !owner_email) {
        return res.status(400).json({
          success: false,
          error: "Either profile id or owner_email query parameter is required",
        });
      }

      if (id) {
        // Fetch single profile
        const { data: profile, error } = await supabase
          .from("passenger_profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !profile) {
          console.error("[api/passenger-profile] Fetch single error:", error);
          return res.status(404).json({
            success: false,
            error: "Passenger profile not found",
          });
        }

        // Ownership and Co-ownership access check
        if (owner_email && profile.owner_email !== owner_email) {
          const { data: coOwnerLink, error: linkErr } = await supabase
            .from("passenger_co_owners")
            .select("id")
            .eq("passenger_profile_id", id)
            .eq("co_owner_email", owner_email)
            .single();

          if (linkErr || !coOwnerLink) {
            return res.status(403).json({
              success: false,
              error: "Unauthorized: You do not have access to this profile",
            });
          }
        }

        const { data: observations, error: obsError } = await supabase
          .from("chauffeur_logs")
          .select("id, trip_id, chauffeur_id, behavior_summary, handling_outcomes, incident_severity, recommend_profile_review, recommend_risk_reassessment, notes, created_at")
          .eq("passenger_profile_id", id)
          .order("created_at", { ascending: false });

        if (obsError) {
          console.error("[api/passenger-profile] Fetch observations error:", obsError);
        }

        // Fetch past health record verifications (timeline)
        const { data: verifications, error: verError } = await supabase
          .from("chauffeur_health_record_verifications")
          .select("id, trip_id, reviewed_by, transport_decision, hold_reason, verification_notes, created_at")
          .eq("passenger_profile_id", id);

        if (verError) {
          console.error("[api/passenger-profile] Fetch health verifications error:", verError);
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

        profile.observations = allHistory;

        return res.status(200).json({
          success: true,
          data: profile,
        });
      } else {
        // Fetch lists of profiles: owned AND co-owned
        const { data: coOwnedLinks, error: coOwnedErr } = await supabase
          .from("passenger_co_owners")
          .select("passenger_profile_id")
          .eq("co_owner_email", owner_email);

        if (coOwnedErr) {
          console.error("[api/passenger-profile] Co-owned query error:", coOwnedErr);
          return res.status(500).json({ success: false, error: "Failed to fetch co-owned relationships" });
        }

        const coOwnedIds = (coOwnedLinks || []).map(link => link.passenger_profile_id);

        let query = supabase.from("passenger_profiles").select("*");
        if (coOwnedIds.length > 0) {
          // Format UUID array filter for supabase-js or postgrest
          query = query.or(`owner_email.eq.${owner_email},id.in.(${coOwnedIds.map(uid => `"${uid}"`).join(",")})`);
        } else {
          query = query.eq("owner_email", owner_email);
        }

        const { data: profiles, error } = await query.order("created_at", { ascending: false });

        if (error) {
          console.error("[api/passenger-profile] Fetch list error:", error);
          return res.status(500).json({
            success: false,
            error: "Failed to fetch passenger profiles",
          });
        }

        return res.status(200).json({
          success: true,
          data: profiles,
        });
      }
    }

    // ==========================================
    // POST METHOD
    // ==========================================
    if (req.method === "POST") {
      const { action } = req.query || {};
      const body = req.body || {};

      // POST Action: invite-co-owner
      if (action === "invite-co-owner") {
        const { passenger_profile_id, co_owner_email, owner_email } = body;

        if (!passenger_profile_id || !co_owner_email || !owner_email) {
          return res.status(400).json({ success: false, error: "Missing required invitation fields" });
        }

        // 1. Fetch profile to check primary owner email
        const { data: profile, error: fErr } = await supabase
          .from("passenger_profiles")
          .select("*")
          .eq("id", passenger_profile_id)
          .single();

        if (fErr || !profile) {
          return res.status(404).json({ success: false, error: "Passenger profile not found" });
        }
        if (profile.owner_email !== owner_email) {
          return res.status(403).json({ success: false, error: "Unauthorized: Only the primary owner can invite co-owners" });
        }
        if (profile.owner_email === co_owner_email.trim()) {
          return res.status(400).json({ success: false, error: "Cannot invite primary owner as co-owner" });
        }

        // 2. Check if co-owner link already exists
        const { data: existingLink } = await supabase
          .from("passenger_co_owners")
          .select("id")
          .eq("passenger_profile_id", passenger_profile_id)
          .eq("co_owner_email", co_owner_email.trim())
          .single();

        if (existingLink) {
          return res.status(400).json({ success: false, error: "This user is already a co-owner of this pet" });
        }

        // 3. Create co-owner entry
        const { data: newLink, error: insErr } = await supabase
          .from("passenger_co_owners")
          .insert([{ passenger_profile_id, co_owner_email: co_owner_email.trim() }])
          .select("*");

        if (insErr) {
          console.error("[api/passenger-profile] Invitation insertion error:", insErr);
          return res.status(500).json({ success: false, error: insErr.message });
        }

        return res.status(200).json({
          success: true,
          message: "Co-owner invited successfully",
          data: newLink[0]
        });
      }

      // POST Action: suggest-change
      if (action === "suggest-change") {
        const { id, co_owner_email, suggested_data } = body;

        if (!id || !co_owner_email || !suggested_data) {
          return res.status(400).json({ success: false, error: "Missing required suggestion fields" });
        }

        // 1. Verify caller is a co-owner
        const { data: coOwnerLink, error: linkErr } = await supabase
          .from("passenger_co_owners")
          .select("id")
          .eq("passenger_profile_id", id)
          .eq("co_owner_email", co_owner_email)
          .single();

        if (linkErr || !coOwnerLink) {
          return res.status(403).json({ success: false, error: "Unauthorized: You are not a co-owner of this pet" });
        }

        // 2. Retrieve existing profile to determine target species for validations
        const { data: existingProfile, error: exErr } = await supabase
          .from("passenger_profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (exErr || !existingProfile) {
          return res.status(404).json({ success: false, error: "Passenger profile not found" });
        }

        // 3. Restricted field validations
        const restrictedFields = [
          "owner_email", "lifecycle_state", "escape_risk", "bite_scratch_risk", "medical_risk",
          "emergency_vet_consent", "emergency_vet_consent_timestamp", "emergency_vet_consent_method",
          "emergency_vet_name", "emergency_vet_phone", "emergency_vet_address",
          "emergency_contact_name", "emergency_contact_phone"
        ];

        for (const field of restrictedFields) {
          if (suggested_data[field] !== undefined) {
            return res.status(400).json({
              success: false,
              error: `Restricted field change request: co-owners cannot suggest changes to safety or emergency contacts: ${field}`
            });
          }
        }

        // 4. Validate allowed fields if suggested
        if (suggested_data.weight !== undefined) {
          if (suggested_data.weight === null || isNaN(Number(suggested_data.weight)) || Number(suggested_data.weight) <= 0) {
            return res.status(400).json({ success: false, error: "Weight must be greater than 0" });
          }
        }

        if (suggested_data.age_group !== undefined) {
          if (!["Puppy/Kitten", "Adult", "Senior"].includes(suggested_data.age_group)) {
            return res.status(400).json({ success: false, error: "Invalid age_group" });
          }
        }

        if (suggested_data.temperament !== undefined) {
          if (!["Calm", "Excited", "Anxious", "Fearful", "Reactive"].includes(suggested_data.temperament)) {
            return res.status(400).json({ success: false, error: "Invalid temperament" });
          }
        }

        if (suggested_data.write_in_feedback !== undefined) {
          if (suggested_data.write_in_feedback) {
            if (typeof suggested_data.write_in_feedback !== "object") {
              return res.status(400).json({ success: false, error: "write_in_feedback must be an object" });
            }
            if (suggested_data.write_in_feedback.notes && String(suggested_data.write_in_feedback.notes).length > 1000) {
              return res.status(400).json({ success: false, error: "write_in_feedback notes must not exceed 1000 characters" });
            }
          }
        }

        if (suggested_data.species_specific_data !== undefined) {
          const specData = suggested_data.species_specific_data || {};
          const targetSpecies = suggested_data.species || existingProfile.species;

          if (targetSpecies === "Dog") {
            const { harness_preference, loading_method, reactivity_class } = specData;
            if (harness_preference && !["Back-Clip", "Front-Clip"].includes(harness_preference)) {
              return res.status(400).json({ success: false, error: "Invalid harness_preference for Dog (Collar-Only is blocked)" });
            }
            if (loading_method && !["Self-Walk (Leashed)", "Lifted by Staff"].includes(loading_method)) {
              return res.status(400).json({ success: false, error: "Invalid loading_method for Dog" });
            }
            if (reactivity_class && reactivity_class !== "None") {
              return res.status(400).json({ success: false, error: "Dog reactivity is not allowed in this slice" });
            }
          } else if (targetSpecies === "Cat") {
            const { carrier_style, handling_tolerance, hide_light_preference, calming_permission } = specData;
            if (carrier_style && !["Soft-Sided", "Hard-Plastic"].includes(carrier_style)) {
              return res.status(400).json({ success: false, error: "Invalid carrier_style for Cat (Cardboard is blocked)" });
            }
            if (handling_tolerance && !["High (allows hands-on)", "Moderate (cautious)"].includes(handling_tolerance)) {
              return res.status(400).json({ success: false, error: "Invalid handling_tolerance for Cat" });
            }
            if (hide_light_preference && !["Covered (prefers dark/towel)", "Open (prefers to look out)"].includes(hide_light_preference)) {
              return res.status(400).json({ success: false, error: "Invalid hide_light_preference for Cat" });
            }
            if (calming_permission !== undefined && typeof calming_permission !== "boolean") {
              return res.status(400).json({ success: false, error: "calming_permission must be a boolean" });
            }
          }
        }

        // 5. Update suggested_changes JSONB column of profile
        const { data: updatedProfile, error: updErr } = await supabase
          .from("passenger_profiles")
          .update({ suggested_changes: suggested_data })
          .eq("id", id)
          .select("*");

        if (updErr) {
          console.error("[api/passenger-profile] Suggestion update error:", updErr);
          return res.status(500).json({ success: false, error: updErr.message });
        }

        return res.status(200).json({
          success: true,
          message: "Changes suggested successfully",
          data: updatedProfile[0]
        });
      }

      // POST Action: review-suggestion
      if (action === "review-suggestion") {
        const { id, owner_email, review_action } = body; // action is 'approve' or 'reject'

        if (!id || !owner_email || !review_action) {
          return res.status(400).json({ success: false, error: "Missing required review parameters" });
        }

        // 1. Fetch profile to check owner email (No Self-Approval)
        const { data: profile, error: fErr } = await supabase
          .from("passenger_profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (fErr || !profile) {
          return res.status(404).json({ success: false, error: "Passenger profile not found" });
        }

        if (profile.owner_email !== owner_email) {
          return res.status(403).json({ success: false, error: "Unauthorized: Only the primary owner can resolve suggestions" });
        }

        // 2. Perform review resolution
        if (review_action === "reject") {
          const { data: updated, error: rErr } = await supabase
            .from("passenger_profiles")
            .update({ suggested_changes: null })
            .eq("id", id)
            .select("*");

          if (rErr) return res.status(500).json({ success: false, error: rErr.message });
          return res.status(200).json({ success: true, message: "Suggestion rejected", data: updated[0] });
        }

        if (review_action === "approve") {
          const suggestions = profile.suggested_changes;
          if (!suggestions || Object.keys(suggestions).length === 0) {
            return res.status(400).json({ success: false, error: "No pending suggestions found for this profile" });
          }

          // Build updates: Merge all suggested fields atomically
          const updates = {
            suggested_changes: null,
            updated_at: new Date().toISOString(),
            freshness_timestamp: new Date().toISOString()
          };

          const allowedKeys = ["pet_name", "breed", "weight", "age_group", "temperament", "write_in_feedback", "species_specific_data", "species"];
          allowedKeys.forEach(k => {
            if (suggestions[k] !== undefined) {
              if (k === "weight") {
                updates[k] = Number(suggestions[k]);
              } else {
                updates[k] = suggestions[k];
              }
            }
          });

          // Check if any approved suggestion has material safety changes
          let isMaterialChange = false;
          if (suggestions.write_in_feedback !== undefined) {
            const oldNotes = profile.write_in_feedback?.notes || "";
            const newNotes = suggestions.write_in_feedback?.notes || "";
            if (oldNotes !== newNotes) isMaterialChange = true;
          }
          if (suggestions.species_specific_data !== undefined) {
            const oldSpec = profile.species_specific_data || {};
            const newSpec = suggestions.species_specific_data || {};
            const safetyKeys = ["harness_preference", "loading_method", "carrier_style", "handling_tolerance", "hide_light_preference", "calming_permission"];
            for (const key of safetyKeys) {
              if (newSpec[key] !== undefined && newSpec[key] !== oldSpec[key]) {
                isMaterialChange = true;
              }
            }
          }

          if (isMaterialChange) {
            updates.safety_requirements_updated_at = new Date().toISOString();
          }

          const { data: updated, error: aErr } = await supabase
            .from("passenger_profiles")
            .update(updates)
            .eq("id", id)
            .select("*");

          if (aErr) return res.status(500).json({ success: false, error: aErr.message });
          return res.status(200).json({ success: true, message: "Suggestion approved and merged", data: updated[0] });
        }

        return res.status(400).json({ success: false, error: "Invalid review_action" });
      }

      // Default profile creation logic (unchanged from Slice 1)
      const {
        pet_name,
        species,
        breed,
        weight,
        age_group,
        temperament,
        emergency_vet_name,
        emergency_vet_phone,
        emergency_vet_address,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_vet_consent,
        emergency_vet_consent_timestamp,
        emergency_vet_consent_method,
        species_specific_data,
        write_in_feedback,
        owner_email,
        lifecycle_state,
        escape_risk,
        bite_scratch_risk,
        medical_risk,
        carrier_required
      } = body;

      // 1. Mandatory base validations
      if (!pet_name || !pet_name.trim()) {
        return res.status(400).json({ success: false, error: "pet_name is required" });
      }
      if (!species || !["Dog", "Cat", "Other"].includes(species)) {
        return res.status(400).json({ success: false, error: "Invalid or missing species" });
      }
      if (weight === undefined || weight === null || isNaN(Number(weight)) || Number(weight) <= 0) {
        return res.status(400).json({ success: false, error: "Weight must be greater than 0" });
      }
      if (!age_group || !["Puppy/Kitten", "Adult", "Senior"].includes(age_group)) {
        return res.status(400).json({ success: false, error: "Invalid or missing age_group" });
      }
      if (!temperament || !["Calm", "Excited", "Anxious", "Fearful", "Reactive"].includes(temperament)) {
        return res.status(400).json({ success: false, error: "Invalid or missing temperament" });
      }
      if (!emergency_contact_name || !emergency_contact_name.trim()) {
        return res.status(400).json({ success: false, error: "emergency_contact_name is required" });
      }
      if (!emergency_contact_phone || !emergency_contact_phone.trim()) {
        return res.status(400).json({ success: false, error: "emergency_contact_phone is required" });
      }
      if (!owner_email || !owner_email.trim()) {
        return res.status(400).json({ success: false, error: "owner_email is required" });
      }

      // 2. State & Safety Gating
      if (lifecycle_state && !["Draft", "Active"].includes(lifecycle_state)) {
        return res.status(400).json({ success: false, error: "Invalid lifecycle_state in this slice" });
      }
      // Enforce vet details validation if medical_risk is true and state is Active
      const targetState = lifecycle_state || "Active";
      if (medical_risk === true && targetState === "Active") {
        if (!emergency_vet_consent) {
          return res.status(400).json({ success: false, error: "Emergency veterinary consent is required when Medical Risk is enabled" });
        }
        if (!emergency_vet_name || !emergency_vet_name.trim()) {
          return res.status(400).json({ success: false, error: "Preferred clinic name is required when Medical Risk is enabled" });
        }
        if (!emergency_vet_phone || !emergency_vet_phone.trim()) {
          return res.status(400).json({ success: false, error: "Preferred clinic phone is required when Medical Risk is enabled" });
        }
        if (!emergency_vet_address || !emergency_vet_address.trim()) {
          return res.status(400).json({ success: false, error: "Preferred clinic address is required when Medical Risk is enabled" });
        }
      }

      // 3. Write-in feedback character limit check
      if (write_in_feedback) {
        if (typeof write_in_feedback !== "object") {
          return res.status(400).json({ success: false, error: "write_in_feedback must be an object" });
        }
        if (write_in_feedback.notes && String(write_in_feedback.notes).length > 1000) {
          return res.status(400).json({ success: false, error: "write_in_feedback notes must not exceed 1000 characters" });
        }
      }

      // 4. Species-Specific Data Validations
      const specData = species_specific_data || {};
      if (species === "Dog") {
        const { harness_preference, loading_method, reactivity_class } = specData;
        if (!harness_preference || !["Back-Clip", "Front-Clip"].includes(harness_preference)) {
          return res.status(400).json({ success: false, error: "Invalid harness_preference for Dog (Collar-Only is blocked)" });
        }
        if (!loading_method || !["Self-Walk (Leashed)", "Lifted by Staff"].includes(loading_method)) {
          return res.status(400).json({ success: false, error: "Invalid loading_method for Dog" });
        }
        if (reactivity_class && reactivity_class !== "None") {
          return res.status(400).json({ success: false, error: "Dog reactivity is not allowed in this slice" });
        }
      } else if (species === "Cat") {
        const { carrier_style, handling_tolerance, hide_light_preference, calming_permission } = specData;
        if (!carrier_style || !["Soft-Sided", "Hard-Plastic"].includes(carrier_style)) {
          return res.status(400).json({ success: false, error: "Invalid carrier_style for Cat (Cardboard is blocked)" });
        }
        if (!handling_tolerance || !["High (allows hands-on)", "Moderate (cautious)"].includes(handling_tolerance)) {
          return res.status(400).json({ success: false, error: "Invalid handling_tolerance for Cat" });
        }
        if (!hide_light_preference || !["Covered (prefers dark/towel)", "Open (prefers to look out)"].includes(hide_light_preference)) {
          return res.status(400).json({ success: false, error: "Invalid hide_light_preference for Cat" });
        }
        if (calming_permission === undefined || typeof calming_permission !== "boolean") {
          return res.status(400).json({ success: false, error: "calming_permission must be a boolean" });
        }
      } else if (species === "Other") {
        if (Object.keys(specData).length > 0) {
          return res.status(400).json({ success: false, error: "Other species must have empty species_specific_data" });
        }
      }

      // 5. Consent and Timestamp Validations
      if (emergency_vet_consent) {
        if (!emergency_vet_consent_timestamp) {
          return res.status(400).json({ success: false, error: "emergency_vet_consent_timestamp is required when consent is given" });
        }
        if (emergency_vet_consent_method !== "In-App Checkbox") {
          return res.status(400).json({ success: false, error: "Invalid emergency_vet_consent_method in this slice" });
        }
      }

      // 6. Insert into Supabase
      const insertPayload = {
        pet_name,
        species,
        breed: breed || null,
        weight: Number(weight),
        age_group,
        temperament,
        emergency_vet_name: emergency_vet_name || null,
        emergency_vet_phone: emergency_vet_phone || null,
        emergency_vet_address: emergency_vet_address || null,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_vet_consent: !!emergency_vet_consent,
        emergency_vet_consent_timestamp: emergency_vet_consent ? emergency_vet_consent_timestamp : null,
        emergency_vet_consent_method: emergency_vet_consent ? emergency_vet_consent_method : null,
        species_specific_data: specData,
        write_in_feedback: write_in_feedback || {},
        owner_email,
        lifecycle_state: lifecycle_state || "Active",
        escape_risk: !!escape_risk,
        bite_scratch_risk: !!bite_scratch_risk,
        medical_risk: !!medical_risk,
        carrier_required: !!carrier_required,
        freshness_timestamp: new Date().toISOString(),
        safety_requirements_updated_at: new Date().toISOString()
      };

      const { data: newProfile, error: dbError } = await supabase
        .from("passenger_profiles")
        .insert([insertPayload])
        .select("*");

      if (dbError) {
        console.error("[api/passenger-profile] Database insertion error:", dbError);
        return res.status(500).json({ success: false, error: dbError.message });
      }

      return res.status(201).json({
        success: true,
        message: "Passenger profile created successfully",
        data: newProfile[0]
      });
    }

    // ==========================================
    // PATCH METHOD
    // ==========================================
    if (req.method === "PATCH") {
      const { id } = req.query || {};
      if (!id) {
        return res.status(400).json({ success: false, error: "Profile id parameter is required for update" });
      }

      const body = req.body || {};
      const { owner_email } = body;
      if (!owner_email || !owner_email.trim()) {
        return res.status(400).json({ success: false, error: "owner_email is required for verification" });
      }

      // 1. Fetch current profile to verify existence and ownership
      const { data: existingProfile, error: fetchErr } = await supabase
        .from("passenger_profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchErr || !existingProfile) {
        return res.status(404).json({ success: false, error: "Passenger profile not found" });
      }

      if (existingProfile.owner_email !== owner_email) {
        return res.status(403).json({ success: false, error: "Unauthorized: Owner email mismatch" });
      }

      // 2. Validate update parameters if present
      const updates = {};

      if (body.pet_name !== undefined) {
        if (!body.pet_name || !body.pet_name.trim()) {
          return res.status(400).json({ success: false, error: "pet_name cannot be empty" });
        }
        updates.pet_name = body.pet_name;
      }

      if (body.species !== undefined) {
        if (!["Dog", "Cat", "Other"].includes(body.species)) {
          return res.status(400).json({ success: false, error: "Invalid species value" });
        }
        updates.species = body.species;
      }

      const targetSpecies = updates.species || existingProfile.species;

      if (body.weight !== undefined) {
        if (body.weight === null || isNaN(Number(body.weight)) || Number(body.weight) <= 0) {
          return res.status(400).json({ success: false, error: "Weight must be greater than 0" });
        }
        updates.weight = Number(body.weight);
      }

      if (body.age_group !== undefined) {
        if (!["Puppy/Kitten", "Adult", "Senior"].includes(body.age_group)) {
          return res.status(400).json({ success: false, error: "Invalid age_group" });
        }
        updates.age_group = body.age_group;
      }

      if (body.temperament !== undefined) {
        if (!["Calm", "Excited", "Anxious", "Fearful", "Reactive"].includes(body.temperament)) {
          return res.status(400).json({ success: false, error: "Invalid temperament" });
        }
        updates.temperament = body.temperament;
      }

      if (body.emergency_contact_name !== undefined) {
        if (!body.emergency_contact_name || !body.emergency_contact_name.trim()) {
          return res.status(400).json({ success: false, error: "emergency_contact_name cannot be empty" });
        }
        updates.emergency_contact_name = body.emergency_contact_name;
      }

      if (body.emergency_contact_phone !== undefined) {
        if (!body.emergency_contact_phone || !body.emergency_contact_phone.trim()) {
          return res.status(400).json({ success: false, error: "emergency_contact_phone cannot be empty" });
        }
        updates.emergency_contact_phone = body.emergency_contact_phone;
      }

      // Check blocked high-risk flags
      // Validate and set high-risk flags updates
      if (body.escape_risk !== undefined) updates.escape_risk = !!body.escape_risk;
      if (body.bite_scratch_risk !== undefined) updates.bite_scratch_risk = !!body.bite_scratch_risk;
      if (body.medical_risk !== undefined) updates.medical_risk = !!body.medical_risk;

      // Validate vet details if medical_risk is active or being enabled
      const finalMedicalRisk = updates.medical_risk !== undefined ? updates.medical_risk : existingProfile.medical_risk;
      const finalLifecycleState = updates.lifecycle_state !== undefined ? updates.lifecycle_state : existingProfile.lifecycle_state;

      if (finalMedicalRisk === true && finalLifecycleState === "Active") {
        const finalConsent = updates.emergency_vet_consent !== undefined ? updates.emergency_vet_consent : existingProfile.emergency_vet_consent;
        const finalVetName = updates.emergency_vet_name !== undefined ? updates.emergency_vet_name : existingProfile.emergency_vet_name;
        const finalVetPhone = updates.emergency_vet_phone !== undefined ? updates.emergency_vet_phone : existingProfile.emergency_vet_phone;
        const finalVetAddress = updates.emergency_vet_address !== undefined ? updates.emergency_vet_address : existingProfile.emergency_vet_address;

        if (!finalConsent) {
          return res.status(400).json({ success: false, error: "Emergency veterinary consent is required when Medical Risk is enabled" });
        }
        if (!finalVetName || !finalVetName.trim()) {
          return res.status(400).json({ success: false, error: "Preferred clinic name is required when Medical Risk is enabled" });
        }
        if (!finalVetPhone || !finalVetPhone.trim()) {
          return res.status(400).json({ success: false, error: "Preferred clinic phone is required when Medical Risk is enabled" });
        }
        if (!finalVetAddress || !finalVetAddress.trim()) {
          return res.status(400).json({ success: false, error: "Preferred clinic address is required when Medical Risk is enabled" });
        }
      }

      // Write-in feedback character limit check
      if (body.write_in_feedback !== undefined) {
        if (body.write_in_feedback) {
          if (typeof body.write_in_feedback !== "object") {
            return res.status(400).json({ success: false, error: "write_in_feedback must be an object" });
          }
          if (body.write_in_feedback.notes && String(body.write_in_feedback.notes).length > 1000) {
            return res.status(400).json({ success: false, error: "write_in_feedback notes must not exceed 1000 characters" });
          }
        }
        updates.write_in_feedback = body.write_in_feedback || {};
      }

      // Species specific data check
      if (body.species_specific_data !== undefined) {
        const specData = body.species_specific_data || {};
        if (targetSpecies === "Dog") {
          const { harness_preference, loading_method, reactivity_class } = specData;
          if (!harness_preference || !["Back-Clip", "Front-Clip"].includes(harness_preference)) {
            return res.status(400).json({ success: false, error: "Invalid harness_preference for Dog (Collar-Only is blocked)" });
          }
          if (!loading_method || !["Self-Walk (Leashed)", "Lifted by Staff"].includes(loading_method)) {
            return res.status(400).json({ success: false, error: "Invalid loading_method for Dog" });
          }
          if (reactivity_class && reactivity_class !== "None") {
            return res.status(400).json({ success: false, error: "Dog reactivity is not allowed in this slice" });
          }
        } else if (targetSpecies === "Cat") {
          const { carrier_style, handling_tolerance, hide_light_preference, calming_permission } = specData;
          if (!carrier_style || !["Soft-Sided", "Hard-Plastic"].includes(carrier_style)) {
            return res.status(400).json({ success: false, error: "Invalid carrier_style for Cat (Cardboard is blocked)" });
          }
          if (!handling_tolerance || !["High (allows hands-on)", "Moderate (cautious)"].includes(handling_tolerance)) {
            return res.status(400).json({ success: false, error: "Invalid handling_tolerance for Cat" });
          }
          if (!hide_light_preference || !["Covered (prefers dark/towel)", "Open (prefers to look out)"].includes(hide_light_preference)) {
            return res.status(400).json({ success: false, error: "Invalid hide_light_preference for Cat" });
          }
          if (calming_permission === undefined || typeof calming_permission !== "boolean") {
            return res.status(400).json({ success: false, error: "calming_permission must be a boolean" });
          }
        } else if (targetSpecies === "Other") {
          if (Object.keys(specData).length > 0) {
            return res.status(400).json({ success: false, error: "Other species must have empty species_specific_data" });
          }
        }
        updates.species_specific_data = specData;
      }

      // Consent and Timestamp Checks
      if (body.emergency_vet_consent !== undefined) {
        updates.emergency_vet_consent = !!body.emergency_vet_consent;
        if (updates.emergency_vet_consent) {
          if (!body.emergency_vet_consent_timestamp && !existingProfile.emergency_vet_consent_timestamp) {
            return res.status(400).json({ success: false, error: "emergency_vet_consent_timestamp is required when consent is given" });
          }
          updates.emergency_vet_consent_timestamp = body.emergency_vet_consent_timestamp || existingProfile.emergency_vet_consent_timestamp;
          
          const consentMethod = body.emergency_vet_consent_method || existingProfile.emergency_vet_consent_method;
          if (consentMethod !== "In-App Checkbox") {
            return res.status(400).json({ success: false, error: "Invalid emergency_vet_consent_method in this slice" });
          }
          updates.emergency_vet_consent_method = consentMethod;
        } else {
          updates.emergency_vet_consent_timestamp = null;
          updates.emergency_vet_consent_method = null;
        }
      }

      if (body.emergency_vet_name !== undefined) updates.emergency_vet_name = body.emergency_vet_name || null;
      if (body.emergency_vet_phone !== undefined) updates.emergency_vet_phone = body.emergency_vet_phone || null;
      if (body.emergency_vet_address !== undefined) updates.emergency_vet_address = body.emergency_vet_address || null;
      if (body.breed !== undefined) updates.breed = body.breed || null;
      if (body.carrier_required !== undefined) updates.carrier_required = !!body.carrier_required;

      if (body.lifecycle_state !== undefined) {
        if (!["Draft", "Active"].includes(body.lifecycle_state)) {
          return res.status(400).json({ success: false, error: "Invalid lifecycle_state value" });
        }
        updates.lifecycle_state = body.lifecycle_state;
      }

      // Check for material safety changes
      let isMaterialChange = false;

      // 1. Check risk flags
      if (body.escape_risk !== undefined && !!body.escape_risk !== !!existingProfile.escape_risk) isMaterialChange = true;
      if (body.bite_scratch_risk !== undefined && !!body.bite_scratch_risk !== !!existingProfile.bite_scratch_risk) isMaterialChange = true;
      if (body.medical_risk !== undefined && !!body.medical_risk !== !!existingProfile.medical_risk) isMaterialChange = true;
      if (body.carrier_required !== undefined && !!body.carrier_required !== !!existingProfile.carrier_required) isMaterialChange = true;

      // 2. Check emergency vet info
      if (body.emergency_vet_name !== undefined && (body.emergency_vet_name || "") !== (existingProfile.emergency_vet_name || "")) isMaterialChange = true;
      if (body.emergency_vet_phone !== undefined && (body.emergency_vet_phone || "") !== (existingProfile.emergency_vet_phone || "")) isMaterialChange = true;
      if (body.emergency_vet_address !== undefined && (body.emergency_vet_address || "") !== (existingProfile.emergency_vet_address || "")) isMaterialChange = true;

      // 3. Check emergency treatment consent
      if (body.emergency_vet_consent !== undefined && !!body.emergency_vet_consent !== !!existingProfile.emergency_vet_consent) isMaterialChange = true;
      if (body.emergency_vet_consent_timestamp !== undefined && (body.emergency_vet_consent_timestamp || "") !== (existingProfile.emergency_vet_consent_timestamp || "")) isMaterialChange = true;
      if (body.emergency_vet_consent_method !== undefined && (body.emergency_vet_consent_method || "") !== (existingProfile.emergency_vet_consent_method || "")) isMaterialChange = true;

      // 4. Check write-in comfort/safety notes (write_in_feedback.notes)
      if (body.write_in_feedback !== undefined) {
        const oldNotes = existingProfile.write_in_feedback?.notes || "";
        const newNotes = body.write_in_feedback?.notes || "";
        if (oldNotes !== newNotes) isMaterialChange = true;
      }

      // 5. Check species-specific safety handling instructions
      if (body.species_specific_data !== undefined) {
        const oldSpec = existingProfile.species_specific_data || {};
        const newSpec = body.species_specific_data || {};
        const safetyKeys = ["harness_preference", "loading_method", "carrier_style", "handling_tolerance", "hide_light_preference", "calming_permission"];
        for (const key of safetyKeys) {
          if (newSpec[key] !== undefined && newSpec[key] !== oldSpec[key]) {
            isMaterialChange = true;
          }
        }
      }

      if (isMaterialChange) {
        updates.safety_requirements_updated_at = new Date().toISOString();
      }

      updates.updated_at = new Date().toISOString();
      updates.freshness_timestamp = new Date().toISOString();

      const { data: updatedProfile, error: updateErr } = await supabase
        .from("passenger_profiles")
        .update(updates)
        .eq("id", id)
        .select("*");

      if (updateErr) {
        console.error("[api/passenger-profile] Database update error:", updateErr);
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      return res.status(200).json({
        success: true,
        message: "Passenger profile updated successfully",
        data: updatedProfile[0]
      });
    }

  } catch (err) {
    console.error("[api/passenger-profile] Server error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
}
