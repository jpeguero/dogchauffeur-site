import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { calculatePrice, serviceAreaCheck, BASE_FEE } from './pricing.js';

const HOME_BASE = "60628, Chicago, IL";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { pickup, dropoff, pet_weight } = await req.json();
    if (!pickup || !dropoff) {
      return Response.json({ error: 'pickup and dropoff are required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    // Two origins: pickup (for trip distance) and home base (for service area check)
    // Two destinations: dropoff and pickup
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${encodeURIComponent(pickup)}|${encodeURIComponent(HOME_BASE)}` +
      `&destinations=${encodeURIComponent(dropoff)}|${encodeURIComponent(pickup)}` +
      `&units=imperial&key=${apiKey}`;

    const res  = await fetch(url);
    const data = await res.json();

    const tripElement = data?.rows?.[0]?.elements?.[0]; // pickup → dropoff
    const homeElement = data?.rows?.[1]?.elements?.[1]; // HOME_BASE → pickup

    if (!tripElement || tripElement.status !== 'OK') {
      return Response.json({ error: 'Could not calculate distance. Please check addresses.' }, { status: 422 });
    }

    const { miles, price, heavySurcharge, extraMiles, perMileCharge } = calculatePrice(
      tripElement.distance.value,
      pet_weight
    );

    let out_of_service_area  = false;
    let home_to_pickup_miles = null;
    if (homeElement?.status === 'OK') {
      ({ home_to_pickup_miles, out_of_service_area } = serviceAreaCheck(homeElement.distance.value));
    }

    return Response.json({
      miles,
      price,
      base_fee:          BASE_FEE,
      extra_miles:       extraMiles,
      per_mile_charge:   perMileCharge,
      heavy_surcharge:   heavySurcharge,
      distance_text:     tripElement.distance.text,
      duration_text:     tripElement.duration.text,
      out_of_service_area,
      home_to_pickup_miles,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
