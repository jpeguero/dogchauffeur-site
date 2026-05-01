// /api/book-ride.js

export default async function handler(req, res) {
  console.log("[book-ride] Route hit");
  console.log("[book-ride] Method:", req.method);

  try {
    if (req.method === "GET") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    const body = req.body;

    console.log("[book-ride] Body received:", body);

    if (!body) {
      console.log("[book-ride] Missing request body");

      return res.status(400).json({
        success: false,
        error: "Missing request body",
      });
    }

    const bookingId = `DC-${Date.now()}`;

    console.log("[book-ride] Booking created:", bookingId);

    return res.status(200).json({
      success: true,
      bookingId,
      booking: {
        ...body,
        bookingId,
        status: "pending_review",
        createdAt: new Date().toISOString(),
      },
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
