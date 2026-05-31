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
