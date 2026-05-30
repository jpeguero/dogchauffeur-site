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
    const toEmail = process.env.BOOKING_ALERT_TO || "jpeguero@gmail.com";

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
    const email = form?.email || "N/A";
    const rideType = form?.ride_type || "N/A";
    const pickup = form?.pickup_address || "N/A";
    const dropoff = form?.dropoff_address || "N/A";
    const date = form?.preferred_date || "N/A";
    const timeWindow = form?.preferred_time_window || "N/A";
    const numDogs = form?.number_of_dogs || "1";
    const sizes = form?.dog_sizes || "N/A";
    const notes = form?.notes || "None";
    const isUrgent = form?.is_urgent ? "YES (+$15 rush fee)" : "No";

    const emailText = `New DogChauffeur Booking Request

Booking ID: ${bookingId}
Customer Name: ${name}
Phone: ${phone}
Email: ${email}

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

    console.log("[send-email] Preparing native fetch to Resend API");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `New Ride Request: ${name} 🐕 [${bookingId}]`,
        text: emailText,
      }),
    });

    const responseData = await response.json().catch(() => ({}));
    console.log("[send-email] Resend API status:", response.status, responseData);

    if (!response.ok) {
      throw new Error(
        responseData.message || `Resend API returned status ${response.status}`
      );
    }

    return res.status(200).json({
      success: true,
      message: "Booking email alert sent successfully",
      id: responseData.id,
    });
  } catch (error) {
    console.error("[send-email] Fatal error sending email alert:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to send booking email alert",
      details: error.message,
    });
  }
}
