export const BASE_FEE = 25;
export const BASE_MILES = 5;
export const PER_MILE_AFTER = 2.50;
export const MINIMUM_FARE = 25;
export const HEAVY_SURCHARGE = 15;
export const HEAVY_THRESHOLD = 75;
export const SERVICE_RADIUS_MILES = 25;

export function calculatePrice(distanceMeters, petWeight) {
  const miles = distanceMeters / 1609.344;
  const extraMiles = Math.max(0, miles - BASE_MILES);
  const baseFare = BASE_FEE + extraMiles * PER_MILE_AFTER;
  const heavySurcharge = (petWeight && Number(petWeight) > HEAVY_THRESHOLD) ? HEAVY_SURCHARGE : 0;
  const price = Math.max(MINIMUM_FARE, Math.round((baseFare + heavySurcharge) * 100) / 100);
  return {
    miles: Math.round(miles * 10) / 10,
    price,
    heavySurcharge,
    extraMiles: Math.round(extraMiles * 10) / 10,
    perMileCharge: Math.round(extraMiles * PER_MILE_AFTER * 100) / 100,
  };
}

export function serviceAreaCheck(homeToPickupMeters) {
  const miles = Math.round(homeToPickupMeters / 1609.344 * 10) / 10;
  return {
    home_to_pickup_miles: miles,
    out_of_service_area: miles > SERVICE_RADIUS_MILES,
  };
}
