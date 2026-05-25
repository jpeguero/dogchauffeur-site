import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { buildMessage, formatPhone, VALID_EVENTS, PENDING_REGISTRATION_CODES } from './messages.js';

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { phone, pet_name, event_type, driver_name, dropoff_address, trip_id } = body;

    if (!phone) {
      return Response.json({ error: "Phone number required" }, { status: 400 });
    }

    if (!event_type || !VALID_EVENTS.includes(event_type)) {
      return Response.json({ error: "Invalid event type" }, { status: 400 });
    }

    const message = buildMessage(event_type, { pet_name, driver_name, dropoff_address, trip_id });
    const formattedPhone = formatPhone(phone);

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
