/**
 * POST /api/book-ride
 * 
 * Booking intake endpoint for DogChauffeur.
 * 
 * Database persistence and Twilio SMS will be added after approval.
 */

// In-memory store for development (will be replaced with database)
const bookings = [];

function generateBookingId() {
  return `DC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function validateBooking(body) {
  const errors = [];
  
  // Required fields
  if (!body.customerName || body.customerName.trim() === "") {
    errors.push("customerName is required");
  }
  if (!body.phone || body.phone.trim() === "") {
    errors.push("phone is required");
  }
  if (!body.pickupAddress || body.pickupAddress.trim() === "") {
    errors.push("pickupAddress is required");
  }
  if (!body.dropoffAddress || body.dropoffAddress.trim() === "") {
    errors.push("dropoffAddress is required");
  }
  if (!body.date || body.date.trim() === "") {
    errors.push("date is required");
  }
  if (!body.time || body.time.trim() === "") {
    errors.push("time is required");
  }
  
  // Enum validation
  const validServiceTypes = ["standard", "premium"];
  if (body.serviceType && !validServiceTypes.includes(body.serviceType)) {
    errors.push("serviceType must be 'standard' or 'premium'");
  }
  
  const validBehaviors = ["calm", "slightly_anxious", "reactive"];
  if (body.dogBehavior && !validBehaviors.includes(body.dogBehavior)) {
    errors.push("dogBehavior must be 'calm', 'slightly_anxious', or 'reactive'");
  }
  
  return errors;
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false, 
      error: "Method not allowed" 
    });
  }
  
  try {
    const body = req.body;
    
    // Validate request
    const validationErrors = validateBooking(body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors
      });
    }
    
    // Generate booking ID
    const bookingId = generateBookingId();
    
    // Create booking record
    const booking = {
      id: bookingId,
      serviceType: body.serviceType || "standard",
      dogBehavior: body.dogBehavior || "calm",
      customerName: body.customerName.trim(),
      phone: body.phone.trim(),
      pickupAddress: body.pickupAddress.trim(),
      dropoffAddress: body.dropoffAddress.trim(),
      date: body.date.trim(),
      time: body.time.trim(),
      notes: body.notes || "",
      createdAt: new Date().toISOString(),
      status: "pending"
    };
    
    // Store in memory (temporary - will be replaced with database)
    bookings.push(booking);
    
    // Log booking for debugging
    console.log("[DogChauffeur] New booking received:", bookingId, booking);
    
    // TODO: Database persistence and Twilio SMS will be added after approval.
    // When Twilio A2P campaign is approved, send confirmation SMS here.
    
    return res.status(200).json({
      success: true,
      bookingId: bookingId,
      message: "Booking request received."
    });
    
  } catch (error) {
    console.error("[DogChauffeur] Booking error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error. Please try again."
    });
  }
}
