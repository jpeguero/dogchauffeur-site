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

    return res.status(200).json({
      success: true,
      bookingId,
      booking: {
        ...req.body,
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
