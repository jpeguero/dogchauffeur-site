// /api/send-email.js

export default async function handler(req, res) {
  console.log("[send-email] Route hit");
  console.log("[send-email] Method:", req.method);

  try {
    if (req.method !== "POST") {
      console.log("[send-email] Invalid method");

      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("[send-email] Missing RESEND_API_KEY");

      return res.status(500).json({
        success: false,
        error: "Missing RESEND_API_KEY",
      });
    }

    const booking = req.body;

    console.log("[send-email] Booking payload:", booking);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DogChauffeur <onboarding@resend.dev>",
        to: ["tirisiwaymedia@gmail.com"],
        subject: `New DogChauffeur Booking: ${booking.bookingId || "Pending"}`,
        html: `
          <h2>New DogChauffeur Booking Request</h2>
          <p><strong>Booking ID:</strong> ${booking.bookingId || "N/A"}</p>
          <p><strong>Name:</strong> ${booking.full_name || booking.name || "N/A"}</p>
          <p><strong>Email:</strong> ${booking.email || "N/A"}</p>
          <p><strong>Phone:</strong> ${booking.phone || "N/A"}</p>
          <p><strong>Pet:</strong> ${booking.pet_name || booking.petName || "N/A"}</p>
          <p><strong>Pickup:</strong> ${booking.pickup_address || booking.pickupAddress || "N/A"}</p>
          <p><strong>Dropoff:</strong> ${booking.dropoff_address || booking.dropoffAddress || "N/A"}</p>
          <p><strong>Date:</strong> ${booking.pickup_date || booking.date || "N/A"}</p>
          <p><strong>Time:</strong> ${booking.pickup_time || booking.time || "N/A"}</p>
          <p><strong>Estimated Price:</strong> ${booking.estimated_price || booking.estimatedPrice || "N/A"}</p>
          <p><strong>Urgent:</strong> ${booking.is_urgent ? "YES" : "No"}</p>
        `,
      }),
    });

    const data = await response.json();

    console.log("[send-email] Resend response:", data);

    if (!response.ok) {
      console.error("[send-email] Resend failed:", data);

      return res.status(500).json({
        success: false,
        error: "Email failed",
        details: data,
      });
    }

    return res.status(200).json({
      success: true,
      emailId: data.id,
    });
  } catch (error) {
    console.error("[send-email] Fatal error:", error);

    return res.status(500).json({
      success: false,
      error: "Email route failed",
      details: error.message,
    });
  }
}
