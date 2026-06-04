export default async function handler(req, res) {
  console.log("[send-email] Route hit");

  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    const { booking, form } = req.body || {};
    console.log("[send-email] Received request body:", req.body);

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.BOOKING_ALERT_FROM;
    
    // E-Myth routing: Always send alerts to both Owner (monitoring) and Alexander (Technician)
    let adminEmails = ["apeguero45@gmail.com", "jpeguero@gmail.com"];
    if (process.env.BOOKING_ALERT_TO) {
      const extraEmails = process.env.BOOKING_ALERT_TO.split(",").map(e => e.trim());
      extraEmails.forEach(e => {
        if (e && !adminEmails.includes(e)) {
          adminEmails.push(e);
        }
      });
    }

    // Requirements validation
    if (!apiKey) {
      console.error("[send-email] Configuration error: RESEND_API_KEY is missing.");
      return res.status(500).json({
        success: false,
        error: "Missing server environment variable: RESEND_API_KEY",
      });
    }

    if (!fromEmail) {
      console.error("[send-email] Configuration error: BOOKING_ALERT_FROM is missing.");
      return res.status(500).json({
        success: false,
        error: "Missing server environment variable: BOOKING_ALERT_FROM",
      });
    }

    const bookingId = booking?.bookingId || "DC-N/A";
    const name = form?.full_name || "N/A";
    const phone = form?.phone || "N/A";
    const email = form?.email || "";
    const rideType = form?.ride_type || "N/A";
    const pickup = form?.pickup_address || "N/A";
    const dropoff = form?.dropoff_address || "N/A";
    const date = form?.preferred_date || "N/A";
    const timeWindow = form?.preferred_time_window || "N/A";
    const numDogs = form?.number_of_dogs || "1";
    const sizes = form?.dog_sizes || "N/A";
    const notes = form?.notes || "None";
    const isUrgent = form?.is_urgent ? "YES" : "No";

    // 1. Admin Plain-Text Email Body
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

    // 2. Customer Branded HTML Email Body
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
          <div class="detail-value">${isUrgent === "YES" ? "Yes (+$15 rush fee)" : "No"}</div>
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

    const emailPromises = [];

    // Promise 1: Send Admin Notification (Plain-text)
    console.log(`[send-email] Sending admin alert to: ${adminEmails}`);
    emailPromises.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: adminEmails,
          subject: `New Ride Request: ${name} 🐕 [${bookingId}]`,
          text: adminEmailText,
        }),
      })
    );

    // Promise 2: Send Customer Confirmation (HTML) - only if optional email address is provided
    if (email && email.trim() !== "" && email.includes("@")) {
      console.log(`[send-email] Sending customer receipt to: ${email.trim()}`);
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
        })
      );
    } else {
      console.log("[send-email] Customer email address not provided. Skipping customer confirmation email.");
    }

    // Dispatch parallel requests
    const responses = await Promise.all(emailPromises);
    const results = [];

    for (let i = 0; i < responses.length; i++) {
      const resp = responses[i];
      const respData = await resp.json().catch(() => ({}));
      console.log(`[send-email] Resend API Response ${i} status:`, resp.status, respData);
      
      if (!resp.ok) {
        throw new Error(
          respData.message || `Resend API returned status ${resp.status} for dispatch ${i}`
        );
      }
      results.push(respData);
    }

    return res.status(200).json({
      success: true,
      message: `Booking email alert successfully sent. Customer receipt: ${results.length > 1 ? "Sent" : "Skipped"}`,
      ids: results.map((r) => r.id),
    });
  } catch (error) {
    console.error("[send-email] Fatal error sending email alerts:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to send booking email alerts",
      details: error.message,
    });
  }
}
