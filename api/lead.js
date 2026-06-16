import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  console.log("[api/lead] Route hit");

  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    const body = req.body || {};
    console.log("[api/lead] Body received:", body);

    // 1. Honeypot Validation
    // Standard spam protection fields (website, fax)
    if (body.website || body.fax) {
      console.warn("[api/lead] Spam detected via honeypot field");
      return res.status(400).json({
        success: false,
        error: "Spam detected",
      });
    }

    // 2. Data Validation
    const {
      full_name,
      phone,
      email,
      pet_name,
      pet_type,
      pet_size,
      ride_type,
      pickup_address,
      dropoff_address,
      preferred_date,
      preferred_time_window,
      is_urgent,
      how_heard,
      notes,
      consent,
      consent_text,
      // Source tracking parameters
      partner_id,
      qr_id,
      campaign_id,
      utm_source,
      utm_medium,
      utm_campaign,
      source
    } = body;

    if (!full_name || !phone || !email || !ride_type || !pickup_address || !dropoff_address || !preferred_date) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    if (!consent || !consent_text) {
      return res.status(400).json({
        success: false,
        error: "Consent is required",
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
      console.error("[api/lead] Supabase configuration variables are missing.");
      return res.status(500).json({
        success: false,
        error: "Database configuration error",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 3. Generate Public Lead Reference
    // Reference format: PAW-XXXXX (random 5-digit number)
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const leadRef = `PAW-${randomDigits}`;

    // 4. Duplicate Check within 72 Hours (safe parameterized queries)
    let possibleDuplicate = false;
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    
    try {
      const { data: emailMatch, error: emailErr } = await supabase
        .from("leads")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .gte("created_at", seventyTwoHoursAgo);

      const { data: phoneMatch, error: phoneErr } = await supabase
        .from("leads")
        .select("id")
        .eq("phone", phone.trim())
        .gte("created_at", seventyTwoHoursAgo);

      if (emailErr || phoneErr) {
        console.error("[api/lead] Duplicate check query failure:", emailErr || phoneErr);
      } else if ((emailMatch && emailMatch.length > 0) || (phoneMatch && phoneMatch.length > 0)) {
        possibleDuplicate = true;
        console.log(`[api/lead] Duplicate match found within 72 hours (Email match: ${emailMatch?.length > 0}, Phone match: ${phoneMatch?.length > 0}). Setting possible_duplicate = true`);
      }
    } catch (dupErr) {
      console.error("[api/lead] Error during duplicate detection:", dupErr);
    }

    // 5. Smart OS Fields (Routing, Priority, Estimated Value)
    let assignedTo = "Emily";
    let notifyEmails = [];
    let priority = 3;
    let baseValue = 50; // default for other / unknown

    const emilyEmail = process.env.LEAD_NOTIFY_EMILY || "emilymarie.peguero@gmail.com";
    const alexanderEmail = process.env.LEAD_NOTIFY_ALEXANDER || "alexander-email-needed";
    const ownerEmail = process.env.LEAD_NOTIFY_OWNER || "jpeguero@gmail.com";

    // Clean normalized strings for comparison
    const normalizedRideType = String(ride_type).toLowerCase();

    // Map base value based on ride type
    if (normalizedRideType.includes("vet")) {
      baseValue = 45;
    } else if (normalizedRideType.includes("grooming")) {
      baseValue = 40;
    } else if (normalizedRideType.includes("daycare") || normalizedRideType.includes("boarding")) {
      baseValue = 35;
    } else if (normalizedRideType.includes("airport")) {
      baseValue = 75;
    } else if (normalizedRideType.includes("emergency") || normalizedRideType.includes("urgent")) {
      baseValue = 90;
    }

    const estimatedValue = baseValue + (is_urgent ? 35 : 0);

    // Routing and Priority Logic
    const isEmergencyOrUrgent = normalizedRideType.includes("emergency") || normalizedRideType.includes("urgent") || is_urgent;
    const isAirport = normalizedRideType.includes("airport");

    assignedTo = "Alexander"; // Alexander is the primary operating lead for all leads

    if (isEmergencyOrUrgent || isAirport) {
      notifyEmails = [alexanderEmail, emilyEmail, ownerEmail];
      priority = isEmergencyOrUrgent ? 1 : 2;
    } else if (
      normalizedRideType.includes("vet") || 
      normalizedRideType.includes("grooming") || 
      normalizedRideType.includes("daycare") || 
      normalizedRideType.includes("boarding")
    ) {
      notifyEmails = [alexanderEmail, emilyEmail];
      priority = 3;
    } else {
      notifyEmails = [alexanderEmail, emilyEmail, ownerEmail];
      priority = 3;
    }

    const followUpDue = new Date().toISOString();
    const consentAt = new Date().toISOString();

    // 6. Insert Lead into Supabase
    const leadData = {
      lead_ref: leadRef,
      status: "new",
      full_name,
      phone,
      email,
      pet_name: pet_name || null,
      pet_type: pet_type || null,
      pet_size: pet_size || null,
      ride_type,
      pickup_address,
      dropoff_address,
      preferred_date,
      preferred_time_window: preferred_time_window || null,
      is_urgent: !!is_urgent,
      how_heard: how_heard || null,
      notes: notes || null,
      partner_id: partner_id || null,
      qr_id: qr_id || null,
      campaign_id: campaign_id || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      source: source || null,
      assigned_to: assignedTo,
      priority,
      estimated_value: estimatedValue,
      follow_up_due: followUpDue,
      consent: !!consent,
      consent_at: consentAt,
      consent_text,
      possible_duplicate: possibleDuplicate,
      notification_status: "pending"
    };

    const { data: insertedLead, error: insertError } = await supabase
      .from("leads")
      .insert([leadData])
      .select()
      .single();

    if (insertError) {
      console.error("[api/lead] Supabase insert failed:", insertError);
      return res.status(500).json({
        success: false,
        error: "Failed to store lead data in database",
      });
    }

    console.log("[api/lead] Lead inserted successfully:", insertedLead.id);

    // 7. Send Notifications via Resend
    let notificationStatus = "sent";
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.LEAD_NOTIFY_FROM || process.env.BOOKING_ALERT_FROM || "leads@pawffeur.com";

    // Warning logs for placeholders
    if (alexanderEmail === "alexander-email-needed") {
      console.warn("[api/lead] Warning: LEAD_NOTIFY_ALEXANDER is unset/placeholder. Routing alert to backup email list.");
    }

    if (!resendApiKey) {
      console.error("[api/lead] Missing RESEND_API_KEY env variable. Skipping email notification.");
      notificationStatus = "failed";
    } else {
      // Filter out invalid placeholder/empty emails
      const validToEmails = notifyEmails.filter(
        email => email && email.includes("@") && email !== "alexander-email-needed"
      );

      // If Alexander email was a placeholder, ensure owner is notified as fallback
      if (notifyEmails.includes(alexanderEmail) && validToEmails.indexOf(ownerEmail) === -1) {
        validToEmails.push(ownerEmail);
      }

      if (validToEmails.length === 0) {
        console.error("[api/lead] No valid notification recipients. Skipping email.");
        notificationStatus = "failed";
      } else {
        const subjectPrefix = possibleDuplicate ? "[possible dup] " : "";
        const emailSubject = `${subjectPrefix}New Lead Assigned to ${assignedTo} (${leadRef})`;

        const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #2D2D2D; background-color: #F9F7F3;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #EDF7F0; overflow: hidden; box-shadow: 0 4px 12px rgba(27,67,50,0.05);">
            <div style="background-color: #1B4332; padding: 24px; text-align: center; color: #ffffff;">
              <h2 style="margin: 0; font-size: 20px;">Pawffeur Smart OS</h2>
              <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.8;">New Lead Routing Notification</p>
            </div>
            <div style="padding: 24px; space-y: 16px;">
              <div style="background-color: #EDF7F0; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="font-weight: bold; color: #1B4332; width: 120px;">Lead Ref:</td>
                    <td>${leadRef}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; color: #1B4332;">Assignee:</td>
                    <td><strong>${assignedTo}</strong></td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; color: #1B4332;">Priority:</td>
                    <td>Priority ${priority}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; color: #1B4332;">Est. Value:</td>
                    <td>$${estimatedValue.toFixed(2)}</td>
                  </tr>
                  ${possibleDuplicate ? `
                  <tr>
                    <td style="font-weight: bold; color: #D9383A;">Duplicate Alert:</td>
                    <td style="color: #D9383A; font-weight: bold;">POSSIBLE DUPLICATE (Match in last 72 hours)</td>
                  </tr>` : ""}
                </table>
              </div>

              <h3 style="color: #1B4332; border-bottom: 1px solid #EDF7F0; padding-bottom: 6px; margin-top: 0;">Customer Details</h3>
              <p><strong>Name:</strong> ${full_name}</p>
              <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>

              <h3 style="color: #1B4332; border-bottom: 1px solid #EDF7F0; padding-bottom: 6px;">Pet Details</h3>
              <p><strong>Pet Name:</strong> ${pet_name || "N/A"}</p>
              <p><strong>Type:</strong> ${pet_type || "N/A"} (${pet_size || "N/A"})</p>

              <h3 style="color: #1B4332; border-bottom: 1px solid #EDF7F0; padding-bottom: 6px;">Ride Details</h3>
              <p><strong>Ride Type:</strong> ${ride_type}</p>
              <p><strong>Pickup:</strong> ${pickup_address}</p>
              <p><strong>Dropoff:</strong> ${dropoff_address}</p>
              <p><strong>Preferred:</strong> ${preferred_date} (${preferred_time_window || "Anytime"})</p>
              <p><strong>Urgent/Same-day:</strong> ${is_urgent ? "YES" : "No"}</p>
              ${how_heard ? `<p><strong>Source (How Heard):</strong> ${how_heard}</p>` : ""}
              ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}

              <div style="background-color: #F9F7F3; padding: 12px; border-radius: 8px; font-size: 11px; color: #6B5B4F; margin-top: 24px;">
                <strong>Consent Obtained:</strong> ${consent ? "Yes" : "No"} at ${consentAt}<br/>
                <em>"${consent_text}"</em>
              </div>
            </div>
          </div>
        </div>
        `;

        try {
          console.log(`[api/lead] Dispatching email via Resend to ${validToEmails.join(", ")}`);
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: fromEmail,
              to: validToEmails,
              subject: emailSubject,
              html: emailHtml
            })
          });

          const emailData = await emailRes.json().catch(() => ({}));
          if (!emailRes.ok) {
            console.error("[api/lead] Resend API failed:", emailRes.status, emailData);
            notificationStatus = "failed";
          } else {
            console.log("[api/lead] Resend notification sent successfully:", emailData);
          }
        } catch (emailErr) {
          console.error("[api/lead] Error sending email notification:", emailErr);
          notificationStatus = "failed";
        }
      }
    }

    // 8. Update notification status in database (Email failure does not block the lead route success)
    try {
      await supabase
        .from("leads")
        .update({ notification_status: notificationStatus })
        .eq("id", insertedLead.id);
    } catch (updateErr) {
      console.error("[api/lead] Failed to update lead notification status:", updateErr);
    }

    // 9. Respond to client
    return res.status(200).json({
      success: true,
      leadRef,
      leadId: insertedLead.id,
      possibleDuplicate,
      notificationStatus
    });

  } catch (err) {
    console.error("[api/lead] Global route handler exception:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
