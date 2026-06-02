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

    // Google Sheets integration via Apps Script Webhook
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

    // Server-side email alerts dispatch
    try {
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers.host;
      const emailEndpoint = `${protocol}://${host}/api/send-email`;
      console.log("[book-ride] Dispatching email alerts server-side:", emailEndpoint);
      
      // Await the fetch on the high-speed serverless network so it is guaranteed to execute
      const emailResponse = await fetch(emailEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking, form: req.body }),
      });
      const emailData = await emailResponse.json().catch(() => ({}));
      console.log("[book-ride] Server-side email dispatch result:", emailResponse.status, emailData);
    } catch (emailErr) {
      console.error("[book-ride] Server-side email dispatch failed:", emailErr);
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
