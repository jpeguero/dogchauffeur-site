import { createClient } from "@supabase/supabase-js";
import { getPolicyNumber, evaluatePreClearanceStatus } from "../lib/policies.js";

export default async function handler(req, res) {
  console.log(`[api/admin-document-clearance] Route hit: ${req.method}`);

  try {
    if (req.method !== "GET" && req.method !== "POST") {
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
      console.error("[api/admin-document-clearance] Supabase configuration variables are missing.");
      return res.status(500).json({
        success: false,
        error: "Database configuration error",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // ==========================================
    // GET METHOD: Retrieve clearance records
    // ==========================================
    if (req.method === "GET") {
      const { passenger_profile_id, all } = req.query || {};

      let queryBuilder = supabase.from("passenger_document_clearances").select("*");

      if (all === "true") {
        const roleParam = req.query.role || "";
        const isSuperOrAdmin = roleParam === "super_admin" || roleParam === "admin";
        
        if (!isSuperOrAdmin) {
          return res.status(403).json({
            success: false,
            error: "Forbidden: Admin context required to retrieve all document clearances",
          });
        }
      } else {
        if (!passenger_profile_id) {
          return res.status(400).json({
            success: false,
            error: "passenger_profile_id is required unless all=true is specified",
          });
        }
        queryBuilder = queryBuilder.eq("passenger_profile_id", passenger_profile_id);
      }

      const { data: records, error: getError } = await queryBuilder;

      if (getError) {
        console.error("[api/admin-document-clearance] Fetch clearances error:", getError);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch document clearances",
        });
      }

      // Evaluate case-by-case vaccine override intent
      let pre_clearance_status = "cleared";
      if (passenger_profile_id) {
        const { trip_id } = req.query || {};
        let tripQuery = supabase.from("trips").select("*").eq("passenger_profile_id", passenger_profile_id);
        if (trip_id) {
          tripQuery = tripQuery.eq("id", trip_id);
        }
        const { data: trips } = await tripQuery;
        const activeTrip = (trips || []).find(t => t.status !== "completed" && t.status !== "cancelled");

        pre_clearance_status = await evaluatePreClearanceStatus(supabase, passenger_profile_id, activeTrip);
      }

      return res.status(200).json({
        success: true,
        data: records || [],
        pre_clearance_status
      });
    }


    // ==========================================
    // POST METHOD: Save/Update clearance records
    // ==========================================
    if (req.method === "POST") {
      const body = req.body || {};
      const {
        passenger_profile_id,
        document_type,
        document_url,
        status = "pending_review",
        vet_signing_name,
        vet_license_number,
        clinic_name,
        clinic_phone,
        vaccine_manufacturer,
        vaccine_lot_number,
        vaccine_expiration_date,
        pdf_integrity_checked = false,
        pdf_checksum,
        reviewed_by,
        rejection_reason,
        issue_date
      } = body;

      // 1. Mandatory validation
      if (!passenger_profile_id) {
        return res.status(400).json({
          success: false,
          error: "passenger_profile_id is required",
        });
      }

      if (!document_type || !["rabies_certificate", "usda_health_certificate"].includes(document_type)) {
        return res.status(400).json({
          success: false,
          error: "document_type must be rabies_certificate or usda_health_certificate",
        });
      }

      if (!document_url) {
        return res.status(400).json({
          success: false,
          error: "document_url is required",
        });
      }

      const validStatuses = ["pending_review", "approved_active", "expired", "rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `status must be one of: ${validStatuses.join(", ")}`,
        });
      }

      // 2. Anti-tampering check (pdf_checksum uniqueness)
      if (pdf_checksum) {
        const { data: duplicateDoc, error: dupError } = await supabase
          .from("passenger_document_clearances")
          .select("id, passenger_profile_id")
          .eq("pdf_checksum", pdf_checksum)
          .single();

        if (dupError && dupError.message !== "Not found") {
          console.error("[api/admin-document-clearance] Duplicate check error:", dupError);
        }

        if (duplicateDoc && duplicateDoc.passenger_profile_id !== passenger_profile_id) {
          return res.status(409).json({
            success: false,
            error: "Conflict: This document has already been uploaded for another profile (duplicate checksum detected).",
          });
        }
      }

      // 3. Validation transitions
      const payload = {
        passenger_profile_id,
        document_type,
        document_url,
        status,
        pdf_checksum: pdf_checksum || null,
        updated_at: new Date().toISOString(),
        issue_date: issue_date || null,
        calculated_expiry_at: null,
        expiry_notice_sent: false
      };

      if (status === "approved_active") {
        if (!vet_signing_name || !vet_license_number || !clinic_name || !vaccine_lot_number || !vaccine_expiration_date || !issue_date) {
          return res.status(400).json({
            success: false,
            error: "Approved/Active status requires: vet_signing_name, vet_license_number, clinic_name, vaccine_lot_number, vaccine_expiration_date, issue_date",
          });
        }

        if (!pdf_integrity_checked) {
          return res.status(400).json({
            success: false,
            error: "Cannot approve document: PDF integrity and anti-tampering check must be marked as complete",
          });
        }

        const expDate = new Date(vaccine_expiration_date);
        if (isNaN(expDate.getTime())) {
          return res.status(400).json({
            success: false,
            error: "vaccine_expiration_date is invalid",
          });
        }

        const issDate = new Date(issue_date);
        if (isNaN(issDate.getTime())) {
          return res.status(400).json({
            success: false,
            error: "issue_date is invalid",
          });
        }

        // Fetch dynamic policies
        const rabiesMaxAge = await getPolicyNumber("rabies_max_age_days", 1095);
        const usdaMaxAge = await getPolicyNumber("usda_max_age_days", 30);

        let calculatedExpiry;
        if (document_type === "rabies_certificate") {
          const maxAgeMs = rabiesMaxAge * 24 * 60 * 60 * 1000;
          const policyLimitDate = new Date(issDate.getTime() + maxAgeMs);
          const vetExpDate = new Date(vaccine_expiration_date);
          
          calculatedExpiry = policyLimitDate < vetExpDate ? policyLimitDate : vetExpDate;
        } else {
          const maxAgeMs = usdaMaxAge * 24 * 60 * 60 * 1000;
          calculatedExpiry = new Date(issDate.getTime() + maxAgeMs);
        }

        payload.calculated_expiry_at = calculatedExpiry.toISOString();

        // Save QA details
        payload.vet_signing_name = vet_signing_name;
        payload.vet_license_number = vet_license_number;
        payload.clinic_name = clinic_name;
        payload.clinic_phone = clinic_phone || null;
        payload.vaccine_manufacturer = vaccine_manufacturer || null;
        payload.vaccine_lot_number = vaccine_lot_number;
        payload.vaccine_expiration_date = vaccine_expiration_date;
        payload.pdf_integrity_checked = true;

        // Set review meta
        payload.reviewed_by = reviewed_by || "system-admin@pawffeur.com";
        payload.reviewed_at = new Date().toISOString();
        payload.rejection_reason = null;

      } else if (status === "rejected") {
        if (!rejection_reason || !rejection_reason.trim()) {
          return res.status(400).json({
            success: false,
            error: "rejection_reason is required when status is rejected",
          });
        }

        payload.rejection_reason = rejection_reason;
        payload.reviewed_by = reviewed_by || "system-admin@pawffeur.com";
        payload.reviewed_at = new Date().toISOString();

      } else {
        // pending_review or expired
        payload.rejection_reason = null;
        payload.reviewed_by = null;
        payload.reviewed_at = null;
      }

      // Check if clearance record already exists for this profile and type
      const { data: existingRecord, error: exError } = await supabase
        .from("passenger_document_clearances")
        .select("id")
        .eq("passenger_profile_id", passenger_profile_id)
        .eq("document_type", document_type)
        .single();

      if (exError && exError.message !== "Not found") {
        console.error("[api/admin-document-clearance] Fetch existing record error:", exError);
      }

      let savedRecord;
      let dbError;

      if (existingRecord) {
        const { data, error } = await supabase
          .from("passenger_document_clearances")
          .update(payload)
          .eq("id", existingRecord.id)
          .select("*");
        savedRecord = data ? data[0] : null;
        dbError = error;
      } else {
        payload.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from("passenger_document_clearances")
          .insert([payload])
          .select("*");
        savedRecord = data ? data[0] : null;
        dbError = error;
      }

      if (dbError || !savedRecord) {
        console.error("[api/admin-document-clearance] DB write error:", dbError);
        return res.status(500).json({
          success: false,
          error: "Failed to store document clearance",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Document clearance saved successfully",
        data: savedRecord,
      });
    }

  } catch (error) {
    console.error("[api/admin-document-clearance] General exception:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
