import { createClient } from "@supabase/supabase-js";
import { getPolicyNumber } from "../lib/policies.js";

export default async function handler(req, res) {
  console.log(`[api/admin-expiry-notifications] Cron run started at: ${new Date().toISOString()}`);

  try {
    // 1. Initialize Supabase client
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
      console.error("[api/admin-expiry-notifications] Supabase configuration variables are missing.");
      return res.status(500).json({ success: false, error: "Database configuration error" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 2. Fetch config policy warning threshold
    const warningDays = await getPolicyNumber("doc_expiry_warning_days", 30);
    const rabiesMaxAge = await getPolicyNumber("rabies_max_age_days", 1095);
    const usdaMaxAge = await getPolicyNumber("usda_max_age_days", 30);

    // Fetch active clearances where notices have not been sent yet
    const { data: clearances, error: dbError } = await supabase
      .from("passenger_document_clearances")
      .select("*")
      .eq("status", "approved_active")
      .eq("expiry_notice_sent", false);

    if (dbError) {
      console.error("[api/admin-expiry-notifications] Fetch clearances failed:", dbError);
      return res.status(500).json({ success: false, error: "Failed to fetch document clearances" });
    }

    const now = new Date();
    const nowTime = now.getTime();
    const notifiedIds = [];
    const logMessages = [];

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

      // Check if within warning window and not already expired
      if (calculatedExpiry >= now) {
        const diffTime = calculatedExpiry.getTime() - nowTime;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= warningDays) {
          const logMsg = `Logged warning dispatch event for Passenger [${doc.passenger_profile_id}] - ${doc.document_type} expires in ${diffDays} days (${calculatedExpiry.toISOString().split("T")[0]})`;
          console.log(logMsg);
          logMessages.push(logMsg);
          notifiedIds.push(doc.id);
        }
      }
    }

    // Update notice flag for matching documents
    if (notifiedIds.length > 0) {
      const { error: updateError } = await supabase
        .from("passenger_document_clearances")
        .update({ expiry_notice_sent: true })
        .in("id", notifiedIds);

      if (updateError) {
        console.error("[api/admin-expiry-notifications] Failed to update notice flags:", updateError);
        return res.status(500).json({ success: false, error: "Failed to update notice flags in database" });
      }
    }

    return res.status(200).json({
      success: true,
      notified_count: notifiedIds.length,
      logs: logMessages
    });

  } catch (error) {
    console.error("[api/admin-expiry-notifications] General exception:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
