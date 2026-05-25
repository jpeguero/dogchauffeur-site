export const VALID_EVENTS = ["ride_received", "ride_confirmed", "en_route", "pet_picked_up", "pet_delivered"];

export const PENDING_REGISTRATION_CODES = [30034, 30007, 21610, 30003, 30005];

export function buildMessage(event_type, { pet_name, driver_name, dropoff_address, trip_id } = {}) {
  const trackingLink = trip_id
    ? `\nTrack: https://app.base44.com/apps/67c8952edaa6ee3ba12ddc8f/TrackRide?id=${trip_id}`
    : "";

  switch (event_type) {
    case "ride_received":
      return `DogChauffeur: We received your ride request for ${pet_name}. We'll confirm shortly.${trackingLink}`;
    case "ride_confirmed":
      return `DogChauffeur: Your ride for ${pet_name} is confirmed! Driver: ${driver_name}.${trackingLink}`;
    case "en_route":
      return `DogChauffeur: Your driver is on the way to pick up ${pet_name}!${trackingLink}`;
    case "pet_picked_up":
      return `DogChauffeur: ${pet_name} has been picked up and is on the way!${trackingLink}`;
    case "pet_delivered":
      return `DogChauffeur: ${pet_name} has arrived safely at ${dropoff_address}. Thank you for using DogChauffeur!`;
    default:
      return null;
  }
}

export function formatPhone(phone) {
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length === 10) return `+1${cleanPhone}`;
  if (cleanPhone.startsWith("1")) return `+${cleanPhone}`;
  return `+1${cleanPhone}`;
}
