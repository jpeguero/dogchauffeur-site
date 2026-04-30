import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { phone, pet_name, event_type, driver_name, dropoff_address, trip_id, date_time, service_type } = body;

    if (!phone) {
      return Response.json({ error: "Phone number required" }, { status: 400 });
    }

    // Supported transactional events
    const validEvents = ["ride_received", "ride_confirmed", "en_route", "pet_picked_up", "pet_delivered"];
    if (!event_type || !validEvents.includes(event_type)) {
      return Response.json({ error: "Invalid event type" }, { status: 400 });
    }

    let message = "";

    const trackingLink = trip_id ? `\nTrack: https://app.base44.com/apps/67c8952edaa6ee3ba12ddc8f/TrackRide?id=${trip_id}` : "";
    const serviceNote = service_type === "Behavior-Aware Transport" ? " (Behavior-Aware)" : "";

    if (event_type === "ride_received") {
      const dateStr = date_time ? ` for ${date_time}` : "";
      message = `DogChauffeur: Your ride${serviceNote} is confirmed${dateStr}. We'll notify you when your driver is on the way. Reply STOP to opt out.`;
    } else if (event_type === "ride_confirmed") {
      message = `DogChauffeur: Your ride for ${pet_name} is confirmed! Driver: ${driver_name}.${trackingLink}`;
    } else if (event_type === "en_route") {
      message = `DogChauffeur: Your driver is on the way to pick up ${pet_name || "your dog"}!${trackingLink}`;
    } else if (event_type === "pet_picked_up") {
      message = `DogChauffeur: ${pet_name || "Your dog"} has been picked up and is on the way!${trackingLink}`;
    } else if (event_type === "pet_delivered") {
      message = `DogChauffeur: ${pet_name || "Your dog"} has safely arrived at ${dropoff_address || "the destination"}. Thank you for using DogChauffeur!`;
    }

    // Format phone: remove non-digits and ensure +1 prefix
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `+1${cleanPhone}` : cleanPhone.startsWith("1") ? `+${cleanPhone}` : `+1${cleanPhone}`;

    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: formattedPhone,
        Body: message,
      }).toString(),
    });

    const result = await response.json();

    // Twilio 10DLC / A2P carrier filtering error codes:
    // 30034 = Message blocked, pending Brand/Campaign registration
    // 30007 = Carrier violation
    // 30034, 21610, 30003, 30005 = various carrier/filtering errors
    const PENDING_REGISTRATION_CODES = [30034, 30007, 21610, 30003, 30005];

    if (!response.ok) {
      const twilioCode = result.code ? parseInt(result.code) : null;
      if (twilioCode && PENDING_REGISTRATION_CODES.includes(twilioCode)) {
        // Carrier is filtering — expected until 10DLC Brand + Campaign registration completes
        console.warn(`[SMS] Delivery pending A2P 10DLC registration. Twilio code: ${twilioCode}. Event: ${event_type}, Phone: ${formattedPhone}`);
        return Response.json({
          success: false,
          pending_registration: true,
          twilio_code: twilioCode,
          message: "SMS queued — pending Twilio A2P 10DLC Brand & Campaign registration approval.",
        });
      }
      return Response.json({ error: result.message || "SMS send failed", twilio_code: twilioCode }, { status: response.status });
    }

    return Response.json({ success: true, message_sid: result.sid });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
