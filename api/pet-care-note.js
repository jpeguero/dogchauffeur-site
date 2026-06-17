import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  console.log("[api/pet-care-note] Route hit");

  try {
    if (req.method !== "POST" && req.method !== "GET") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    // Initialize Supabase client with sanitization
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
      console.error("[api/pet-care-note] Supabase configuration variables are missing.");
      return res.status(500).json({
        success: false,
        error: "Database configuration error",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // GET METHOD
    if (req.method === "GET") {
      const { phone, email, pet_name, lead_id } = req.query || {};

      if (!lead_id && !phone && !email) {
        return res.status(400).json({
          success: false,
          error: "At least one contact identifier (phone/email) or lead_id is required",
        });
      }

      let query = supabase
        .from("pet_care_notes")
        .select("*")
        .eq("status", "active");

      if (lead_id) {
        query = query.eq("lead_id", lead_id);
      } else {
        if (phone) {
          const normalizedPhone = String(phone).replace(/\D/g, "");
          query = query.eq("normalized_phone", normalizedPhone);
        }
        if (email) {
          const normalizedEmail = String(email).trim().toLowerCase();
          query = query.eq("normalized_email", normalizedEmail);
        }
        if (pet_name) {
          query = query.eq("pet_name", pet_name);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("[api/pet-care-note] Database query error:", error);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch care notes",
        });
      }

      return res.status(200).json({
        success: true,
        data,
      });
    }

    // POST METHOD
    if (req.method === "POST") {
      const body = req.body || {};
      const {
        lead_id,
        phone,
        email,
        pet_name,
        care_note_raw,
        driver_instruction,
        created_by
      } = body;

      if (!pet_name || !pet_name.trim()) {
        return res.status(400).json({
          success: false,
          error: "pet_name is required",
        });
      }

      const normalizedPhone = phone ? String(phone).replace(/\D/g, "") : null;
      const normalizedEmail = email ? String(email).trim().toLowerCase() : null;

      if (!normalizedPhone && !normalizedEmail) {
        return res.status(400).json({
          success: false,
          error: "At least one contact identifier (phone or email) is required",
        });
      }

      // 1. Fetch current active notes matching this pet and contact info
      // Check both phone and email individually to ensure we catch any active match
      let activeNotes = [];

      if (normalizedPhone) {
        const { data: phoneMatch, error: phoneErr } = await supabase
          .from("pet_care_notes")
          .select("*")
          .eq("status", "active")
          .eq("normalized_phone", normalizedPhone)
          .ilike("pet_name", pet_name.trim());
        
        if (phoneErr) {
          console.error("[api/pet-care-note] Error querying by phone:", phoneErr);
          return res.status(500).json({ success: false, error: "Database query failure" });
        }
        activeNotes = activeNotes.concat(phoneMatch || []);
      }

      if (normalizedEmail) {
        const { data: emailMatch, error: emailErr } = await supabase
          .from("pet_care_notes")
          .select("*")
          .eq("status", "active")
          .eq("normalized_email", normalizedEmail)
          .ilike("pet_name", pet_name.trim());
        
        if (emailErr) {
          console.error("[api/pet-care-note] Error querying by email:", emailErr);
          return res.status(500).json({ success: false, error: "Database query failure" });
        }
        
        // Ensure no duplicate references from matching both phone and email
        (emailMatch || []).forEach(note => {
          if (!activeNotes.some(n => n.id === note.id)) {
            activeNotes.push(note);
          }
        });
      }

      // Safeguard 1: Multiple active match protection
      if (activeNotes.length > 1) {
        console.warn(`[api/pet-care-note] Conflict detected: ${activeNotes.length} active notes found for pet "${pet_name}"`);
        return res.status(409).json({
          success: false,
          error: "Manual review required: multiple active care notes found for this customer profile and pet name",
          conflictCount: activeNotes.length
        });
      }

      const oldNote = activeNotes.length === 1 ? activeNotes[0] : null;

      // Prepare new note data
      const newNoteData = {
        lead_id: lead_id || null,
        normalized_phone: normalizedPhone,
        normalized_email: normalizedEmail,
        pet_name: pet_name.trim(),
        care_note_raw: care_note_raw || null,
        driver_instruction: driver_instruction || null,
        status: "active",
        supersedes: oldNote ? oldNote.id : null,
        created_by: created_by || "system"
      };

      // Safeguard 2: Replacement failure protection
      if (oldNote) {
        let oldNoteUpdated = false;
        try {
          // A. Mark old note replaced
          const { error: updateErr } = await supabase
            .from("pet_care_notes")
            .update({ status: "replaced" })
            .eq("id", oldNote.id);

          if (updateErr) throw updateErr;
          oldNoteUpdated = true;

          // B. Insert new note
          const { data: inserted, error: insertErr } = await supabase
            .from("pet_care_notes")
            .insert([newNoteData])
            .select()
            .single();

          if (insertErr) throw insertErr;

          return res.status(200).json({
            success: true,
            noteId: inserted.id,
            supersedes: oldNote.id,
            replaced: true
          });

        } catch (txnError) {
          console.error("[api/pet-care-note] Transaction replacement failure:", txnError);
          // Rollback the old note back to active if we marked it replaced
          if (oldNoteUpdated) {
            console.log(`[api/pet-care-note] Rolling back old note status (${oldNote.id}) to active`);
            await supabase
              .from("pet_care_notes")
              .update({ status: "active" })
              .eq("id", oldNote.id);
          }
          return res.status(500).json({
            success: false,
            error: "Failed to update care note. Old care note state has been safely restored."
          });
        }
      } else {
        // Insert new note directly (no replacement needed)
        const { data: inserted, error: insertErr } = await supabase
          .from("pet_care_notes")
          .insert([newNoteData])
          .select()
          .single();

        if (insertErr) {
          console.error("[api/pet-care-note] Direct insert failed:", insertErr);
          return res.status(500).json({
            success: false,
            error: "Failed to store care note in database"
          });
        }

        return res.status(200).json({
          success: true,
          noteId: inserted.id,
          replaced: false
        });
      }
    }

  } catch (err) {
    console.error("[api/pet-care-note] Global route exception:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}
