const IS_LLC_ACTIVE = false; // Set to true once the LLC is officially filed/approved

export default async function handler(req, res) {
  console.log(`[admin-bookings] Request hit: ${req.method}`);
  
  // 1. Password Authorization Check
  const authHeader = req.headers.authorization;
  const adminPassword = process.env.ADMIN_PASSWORD || "Pawffeur2026!";
  
  if (!authHeader || authHeader !== adminPassword) {
    console.warn("[admin-bookings] Unauthorized access attempt");
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Invalid admin password"
    });
  }

  const sheetsUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL;
  if (!sheetsUrl) {
    console.error("[admin-bookings] GOOGLE_SHEETS_WEBAPP_URL is not set");
    return res.status(500).json({
      success: false,
      error: "Server configuration error: GOOGLE_SHEETS_WEBAPP_URL is missing"
    });
  }

  try {
    // ─── GET: Fetch Bookings from Google Sheets ──────────────────────────────────
    if (req.method === "GET") {
      console.log("[admin-bookings] Querying Google Sheets doGet...");
      const sheetsResponse = await fetch(sheetsUrl);
      
      if (!sheetsResponse.ok) {
        throw new Error(`Google Sheets doGet returned HTTP ${sheetsResponse.status}`);
      }
      
      const data = await sheetsResponse.json().catch(() => ({}));
      return res.status(200).json(data);
    }
    
    // ─── POST: Update Booking in Google Sheets ───────────────────────────────────
    if (req.method === "POST") {
      const { action, bookingId, status, driver } = req.body || {};
      
      if (action !== "update") {
        return res.status(400).json({
          success: false,
          error: "Invalid action. Supported actions: 'update'"
        });
      }
      
      if (!bookingId) {
        return res.status(400).json({
          success: false,
          error: "Missing bookingId"
        });
      }
      
      console.log(`[admin-bookings] Forwarding update for ${bookingId} (status: ${status}, driver: ${driver})`);
      const sheetsResponse = await fetch(sheetsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", bookingId, status, driver })
      });
      
      if (!sheetsResponse.ok) {
        throw new Error(`Google Sheets doPost update returned HTTP ${sheetsResponse.status}`);
      }
      
      const updateResult = await sheetsResponse.json().catch(() => ({}));
      console.log("[admin-bookings] Google Sheets update response:", updateResult);
      
      if (!updateResult.success) {
        return res.status(400).json(updateResult);
      }
      
      // ─── Post-Update Confirmation Dispatch ───────────────────────────────────────
      // If status has been updated to "Confirmed" (or similar confirmed status),
      // we trigger SMS & email alerts. We run them in the background so we don't
      // block the dashboard's quick response time.
      const booking = updateResult.booking || {};
      if (status === "Confirmed" && booking.bookingId) {
        // Dispatch notifications asynchronously in background
        dispatchConfirmations(booking).catch(err => {
          console.error("[admin-bookings] Background dispatch failed:", err);
        });
      }
      
      return res.status(200).json(updateResult);
    }
    
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
    
  } catch (error) {
    console.error("[admin-bookings] Fatal error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message
    });
  }
}

// Helper to E.164-format phone numbers
function formatToE164(phoneStr) {
  if (!phoneStr) return null;
  const digits = phoneStr.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.startsWith("+")) return digits;
  return `+${digits}`;
}

// Background dispatcher for SMS & email confirmations
async function dispatchConfirmations(booking) {
  console.log(`[dispatchConfirmations] Running notifications for booking: ${booking.bookingId}`);
  
  const name = booking.full_name || "Pet Owner";
  const email = booking.email || "";
  const phone = booking.phone || "";
  const rideType = booking.ride_type || "Ride";
  const date = booking.preferred_date || "requested date";
  const timeWindow = booking.preferred_time_window || "scheduled window";
  const pickup = booking.pickup_address || "";
  const dropoff = booking.dropoff_address || "";
  const isUrgent = booking.is_urgent || "NO";
  const driver = booking.driver || "";
  const bookingId = booking.bookingId;
  
  const promises = [];
  
  // 1. Direct Twilio SMS Alert
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  const customerPhone = formatToE164(phone);
  
  if (twilioSid && twilioToken && twilioFrom && customerPhone) {
    const smsBody = `Your Pawffeur ride (${bookingId}) on ${date} has been CONFIRMED! 🟢\nDriver: ${driver !== "Unassigned" ? driver : "Assigned"}\nPickup: ${pickup}\nWe'll text when we're on the way!`;
    console.log(`[dispatchConfirmations] Sending Twilio confirmation to ${customerPhone}`);
    
    const cleanTwilioFrom = formatToE164(twilioFrom);
    const params = new URLSearchParams();
    params.append("From", cleanTwilioFrom);
    params.append("To", customerPhone);
    params.append("Body", smsBody);
    
    promises.push(
      fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      }).then(async r => {
        const rData = await r.json().catch(() => ({}));
        console.log("[dispatchConfirmations] SMS confirmation status:", r.status, rData);
      }).catch(err => {
        console.error("[dispatchConfirmations] SMS confirmation failed:", err);
      })
    );
  } else {
    console.log("[dispatchConfirmations] Twilio credentials or customer phone is missing. Skipping SMS.");
  }
  
  // 2. Direct Resend Email Alert
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.BOOKING_ALERT_FROM;
  
  if (resendKey && fromEmail && email && email.includes("@")) {
    console.log(`[dispatchConfirmations] Sending Resend confirmation to ${email}`);
    const currentYear = new Date().getFullYear();
    const customerConfirmedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pawffeur Booking Confirmed! 🐕</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9F7F3; color: #2D2D2D; margin: 0; padding: 0; }
    .wrapper { width: 100%; background-color: #F9F7F3; padding: 24px 0; -webkit-text-size-adjust: 100%; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #EDF7F0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(27,67,50,0.05); }
    .header { background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; font-size: 14px; color: #d8f3dc; font-weight: 500; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 16px; font-weight: 600; color: #1b4332; margin-top: 0; }
    .intro { font-size: 14px; color: #6b5b4f; line-height: 1.6; margin-bottom: 24px; }
    .booking-card { background-color: #edf7f0; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 28px; border: 1px solid #b7e4c7; }
    .booking-label { font-size: 12px; color: #40916c; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px; }
    .booking-id { font-size: 22px; color: #1b4332; font-weight: 800; }
    .section-title { font-size: 12px; color: #1b4332; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; border-bottom: 2px solid #edf7f0; padding-bottom: 8px; margin-bottom: 16px; }
    .detail-row { display: flex; margin-bottom: 12px; font-size: 14px; }
    .detail-label { color: #1b4332; font-weight: 600; width: 130px; flex-shrink: 0; }
    .detail-value { color: #6b5b4f; flex: 1; }
    .next-steps { background-color: #f9f7f3; border-left: 4px solid #1b4332; border-radius: 8px; padding: 16px; margin-top: 28px; }
    .next-steps h4 { margin: 0 0 6px; font-size: 14px; color: #1b4332; font-weight: 700; }
    .next-steps p { margin: 0; font-size: 13px; color: #6b5b4f; line-height: 1.5; }
    .footer { text-align: center; padding: 28px 24px; background-color: #1b4332; color: #ffffff; font-size: 12px; }
    .footer a { color: #d8f3dc; text-decoration: none; font-weight: 600; }
    .footer p { margin: 6px 0; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Pawffeur™</h1>
        <p>Your Ride is Confirmed!</p>
      </div>
      <div class="content">
        <p class="greeting">Hi ${name},</p>
        <p class="intro">Great news! We have reviewed your request and officially confirmed your pet's ride scheduling. A driver has been assigned and we are ready to roll!</p>
        
        <div class="booking-card">
          <div class="booking-label">Confirmed Booking ID</div>
          <div class="booking-id">${bookingId}</div>
          <div style="font-size: 14px; color: #1b4332; font-weight: 700; margin-top: 8px;">Status: Confirmed 🟢</div>
          ${driver && driver !== "Unassigned" ? `<div style="font-size: 13px; color: #2d6a4f; margin-top: 4px;">Assigned Driver: ${driver}</div>` : ""}
        </div>
        
        <div class="section-title">Trip Details</div>
        <div class="detail-row">
          <div class="detail-label">Ride Type:</div>
          <div class="detail-value">${rideType}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Pickup:</div>
          <div class="detail-value">${pickup}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Drop-off:</div>
          <div class="detail-value">${dropoff}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Date:</div>
          <div class="detail-value">${date}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Time Window:</div>
          <div class="detail-value">${timeWindow}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Urgent Request:</div>
          <div class="detail-value">${isUrgent === "YES" ? "Yes" : "No"}</div>
        </div>
        
        <div class="next-steps">
          <h4>What to expect next?</h4>
          <p>Our driver will contact you via text/call when they are on their way. We secure all pets safely during transit. If you need to make changes or have questions, reply directly to this email or call/text us at (312) 620-9297.</p>
        </div>
      </div>
      <div class="footer">
        <p><strong>Pawffeur™</strong> &middot; Safe Pet Transportation</p>
        <p>📞 <a href="tel:+13126209297">(312) 620-9297</a> &middot; ✉ <a href="mailto:support@pawffeur.com">support@pawffeur.com</a></p>
        <p style="margin-top: 16px; font-size: 10px; opacity: 0.6;">
          ${IS_LLC_ACTIVE ? "Pawffeur™ is operated by Pawffeur, LLC. &copy; " + currentYear + " Pawffeur, LLC. All rights reserved." : "A service of TirisiWay, Inc. &copy; " + currentYear + " TirisiWay, Inc. All rights reserved."}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

    promises.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email.trim()],
          subject: `Pawffeur Booking Confirmed! 🐕 [${bookingId}]`,
          html: customerConfirmedHtml
        })
      }).then(async r => {
        const rData = await r.json().catch(() => ({}));
        console.log("[dispatchConfirmations] Email confirmation status:", r.status, rData);
      }).catch(err => {
        console.error("[dispatchConfirmations] Email confirmation failed:", err);
      })
    );
  } else {
    console.log("[dispatchConfirmations] Resend credentials or customer email is missing. Skipping email.");
  }
  
  await Promise.all(promises);
  console.log("[dispatchConfirmations] All background dispatches finished");
}
