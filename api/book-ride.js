export default async function handler(req, res) {
  console.log("[book-ride] Route hit");
  console.log("[book-ride] Method:", req.method);

  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    console.log("[book-ride] Body received:", req.body);

    const bookingId = `DC-${Date.now()}`;
    const booking = {
      ...req.body,
      bookingId,
      status: "pending_review",
      createdAt: new Date().toISOString(),
    };

    // 1. Google Sheets integration via Apps Script Webhook
    const sheetsUrl = process.env.GOOGLE_SHEETS_WEBAPP_URL;
    if (sheetsUrl) {
      console.log("[book-ride] Syncing booking to Google Sheets...");
      try {
        const sheetsResponse = await fetch(sheetsUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(booking),
        });
        const sheetsData = await sheetsResponse.json().catch(() => ({}));
        console.log("[book-ride] Google Sheets sync result:", sheetsResponse.status, sheetsData);
      } catch (sheetsErr) {
        console.error("[book-ride] Google Sheets sync failed:", sheetsErr);
      }
    } else {
      console.log("[book-ride] GOOGLE_SHEETS_WEBAPP_URL is not set. Skipping sheet sync.");
    }

    // 2. Direct Server-Side Email Alerts (Resend API)
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.BOOKING_ALERT_FROM;
    
    // E-Myth routing: Send alerts to both Owner (monitoring) and Alexander (Technician)
    const toEmail = process.env.BOOKING_ALERT_TO || "apeguero45@gmail.com, jpeguero@gmail.com";

    const name = req.body.full_name || "N/A";
    const phone = req.body.phone || "N/A";
    const email = req.body.email || "";
    const rideType = req.body.ride_type || "N/A";
    const pickup = req.body.pickup_address || "N/A";
    const dropoff = req.body.dropoff_address || "N/A";
    const date = req.body.preferred_date || "N/A";
    const timeWindow = req.body.preferred_time_window || "N/A";
    const numDogs = req.body.number_of_dogs || "1";
    const sizes = req.body.dog_sizes || "N/A";
    const notes = req.body.notes || "None";
    const isUrgent = req.body.is_urgent ? "YES" : "No";

    if (apiKey && fromEmail) {
      // A. Admin Plain-Text Email Body
      const adminEmailText = `New DogChauffeur Booking Request

Booking ID: ${bookingId}
Customer Name: ${name}
Phone: ${phone}
Email: ${email || "None provided"}

Trip Details:
-------------
Ride Type: ${rideType}
Pickup: ${pickup}
Drop-off: ${dropoff}
Preferred Date: ${date}
Time Window: ${timeWindow}
Urgent Request: ${isUrgent}

Pet Details:
------------
Number of Dogs: ${numDogs}
Dog Size(s): ${sizes}

Notes / Instructions:
---------------------
${notes}
`;

      // B. Customer Branded HTML Email Body
      const currentYear = new Date().getFullYear();
      const customerHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DogChauffeur Booking Received</title>
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
    .booking-card { background-color: #edf7f0; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 28px; }
    .booking-label { font-size: 12px; color: #40916c; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px; }
    .booking-id { font-size: 22px; color: #1b4332; font-weight: 800; }
    .section-title { font-size: 12px; color: #1b4332; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; border-bottom: 2px solid #edf7f0; padding-bottom: 8px; margin-bottom: 16px; }
    .detail-row { display: flex; margin-bottom: 12px; font-size: 14px; }
    .detail-label { color: #1b4332; font-weight: 600; width: 130px; flex-shrink: 0; }
    .detail-value { color: #6b5b4f; flex: 1; }
    .next-steps { background-color: #f9f7f3; border-left: 4px solid #52b788; border-radius: 8px; padding: 16px; margin-top: 28px; }
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
        <h1>DogChauffeur™</h1>
        <p>Safe, Reliable Pet Transportation</p>
      </div>
      <div class="content">
        <p class="greeting">Hi ${name},</p>
        <p class="intro">Thanks for booking with us! We have successfully received your pet's ride request. Our team will review the details and reach out shortly to confirm pricing, scheduling, and driver availability.</p>
        
        <div class="booking-card">
          <div class="booking-label">Your Booking ID</div>
          <div class="booking-id">${bookingId}</div>
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
          <div class="detail-value">${req.body.is_urgent ? "Yes (+$15 rush fee)" : "No"}</div>
        </div>

        <div class="section-title" style="margin-top: 24px;">Pet Details</div>
        <div class="detail-row">
          <div class="detail-label">Number of Dogs:</div>
          <div class="detail-value">${numDogs}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Dog Size(s):</div>
          <div class="detail-value">${sizes}</div>
        </div>

        <div class="next-steps">
          <h4>What happens next?</h4>
          <p>We are reviewing your trip details right now. You will receive a text message or phone call from us shortly to finalize scheduling and confirm the final rate. Questions before then? Reply to this email or call/text our office at (312) 620-9297.</p>
        </div>
      </div>
      <div class="footer">
        <p><strong>DogChauffeur™</strong> &middot; Safe Pet Transportation</p>
        <p>📞 <a href="tel:+13126209297">(312) 620-9297</a> &middot; ✉ <a href="mailto:support@dogchauffeur.com">support@dogchauffeur.com</a></p>
        <p style="margin-top: 16px; font-size: 10px; opacity: 0.6;">A service of TirisiWay, Inc. &copy; ${currentYear} TirisiWay, Inc. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

      // Dispatch Resend Emails in parallel
      const emailPromises = [];

      // Promise A: Admin Alert
      console.log("[book-ride] Direct Resend dispatch: Admin Alert to", toEmail);
      emailPromises.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: toEmail.split(",").map(item => item.trim()),
            subject: `New Ride Request: ${name} 🐕 [${bookingId}]`,
            text: adminEmailText,
          }),
        }).then(async r => {
          const rData = await r.json().catch(() => ({}));
          console.log("[book-ride] Admin Alert email response:", r.status, rData);
          return { type: "admin", ok: r.ok, status: r.status, data: rData };
        }).catch(err => {
          console.error("[book-ride] Admin Alert email request error:", err);
          return { type: "admin", ok: false, error: err.message };
        })
      );

      // Promise B: Customer Alert (if email provided)
      if (email && email.trim() !== "" && email.includes("@")) {
        console.log("[book-ride] Direct Resend dispatch: Customer Receipt to", email.trim());
        emailPromises.push(
          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [email.trim()],
              subject: `DogChauffeur Booking Received! 🐕 [${bookingId}]`,
              html: customerHtml,
            }),
          }).then(async r => {
            const rData = await r.json().catch(() => ({}));
            console.log("[book-ride] Customer Receipt email response:", r.status, rData);
            return { type: "customer", ok: r.ok, status: r.status, data: rData };
          }).catch(err => {
            console.error("[book-ride] Customer Receipt email request error:", err);
            return { type: "customer", ok: false, error: err.message };
          })
        );
      }

      // Execute emails in parallel
      try {
        const results = await Promise.all(emailPromises);
        console.log("[book-ride] Direct email execution results completed:", results);
      } catch (err) {
        console.error("[book-ride] Server-side email execution failed:", err);
      }
    } else {
      console.log("[book-ride] RESEND_API_KEY or BOOKING_ALERT_FROM is missing. Skipping email alerts.");
    }

    // 3. Direct Server-Side SMS Alerts (Twilio API via Native Fetch)
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
    const adminSmsPhone = process.env.ADMIN_PHONE_NUMBER || "7734504720"; // Defaults to Alexander (Technician)

    if (twilioSid && twilioToken && twilioFrom) {
      console.log("[book-ride] Initializing Twilio SMS dispatches...");
      const smsPromises = [];

      // Helper function to format phone number to E.164 (e.g. +17735624240)
      const formatToE164 = (phoneStr) => {
        if (!phoneStr) return null;
        const digits = phoneStr.replace(/\D/g, "");
        if (digits.length === 10) return `+1${digits}`;
        if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
        if (digits.startsWith("+")) return digits;
        return `+${digits}`;
      };

      const customerSmsTo = formatToE164(phone);
      const cleanTwilioFrom = formatToE164(twilioFrom);

      // A. Send SMS confirmation to Customer
      if (customerSmsTo) {
        const customerSmsBody = `Thanks for choosing DogChauffeur! We received your request (${bookingId}) for a ${rideType} on ${date}. We will review the details and contact you shortly to confirm the final rate.`;
        console.log(`[book-ride] Dispatching SMS confirmation to customer: ${customerSmsTo}`);
        
        const params = new URLSearchParams();
        params.append("From", cleanTwilioFrom);
        params.append("To", customerSmsTo);
        params.append("Body", customerSmsBody);

        smsPromises.push(
          fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: "POST",
            headers: {
              "Authorization": "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64"),
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params.toString()
          }).then(async r => {
            const rData = await r.json().catch(() => ({}));
            console.log("[book-ride] Customer SMS response:", r.status, rData);
            return { type: "customer_sms", ok: r.ok, status: r.status, data: rData };
          }).catch(err => {
            console.error("[book-ride] Customer SMS fetch error:", err);
            return { type: "customer_sms", ok: false, error: err.message };
          })
        );
      }

      // B. Send SMS alert to Admin (if ADMIN_PHONE_NUMBER is configured)
      const adminSmsTo = formatToE164(adminSmsPhone);
      if (adminSmsTo) {
        const adminSmsBody = `New Booking Request! ID: ${bookingId}\nCustomer: ${name}\nPhone: ${phone}\nType: ${rideType}\nDate: ${date}\nUrgent: ${isUrgent}\nCheck Google Sheet & Calendar!`;
        console.log(`[book-ride] Dispatching SMS alert to admin: ${adminSmsTo}`);
        
        const adminParams = new URLSearchParams();
        adminParams.append("From", cleanTwilioFrom);
        adminParams.append("To", adminSmsTo);
        adminParams.append("Body", adminSmsBody);

        smsPromises.push(
          fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: "POST",
            headers: {
              "Authorization": "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64"),
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: adminParams.toString()
          }).then(async r => {
            const rData = await r.json().catch(() => ({}));
            console.log("[book-ride] Admin SMS response:", r.status, rData);
            return { type: "admin_sms", ok: r.ok, status: r.status, data: rData };
          }).catch(err => {
            console.error("[book-ride] Admin SMS fetch error:", err);
            return { type: "admin_sms", ok: false, error: err.message };
          })
        );
      }

      // Execute all SMS dispatches
      try {
        const smsResults = await Promise.all(smsPromises);
        console.log("[book-ride] Direct SMS execution results completed:", smsResults);
      } catch (err) {
        console.error("[book-ride] Server-side SMS execution failed:", err);
      }
    } else {
      console.log("[book-ride] Twilio variables are incomplete. Skipping SMS alerts.");
    }

    return res.status(200).json({
      success: true,
      bookingId,
      booking,
    });
  } catch (error) {
    console.error("[book-ride] Fatal error:", error);

    return res.status(500).json({
      success: false,
      error: "Booking request failed",
      details: error.message,
    });
  }
}
