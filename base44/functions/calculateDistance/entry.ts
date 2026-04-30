import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ── Pricing config ────────────────────────────────────────────────────────────
const BASE_FEE         = 25;    // flat fee covers first 5 miles
const BASE_MILES       = 5;     // miles included in base fee
const PER_MILE_AFTER   = 2.50;  // per mile beyond first 5
const MINIMUM_FARE     = 25;
const HEAVY_SURCHARGE  = 15;    // extra for dogs > 75 lbs (large crate)
const HEAVY_THRESHOLD  = 75;    // lbs

// ── Service area ─────────────────────────────────────────────────────────────
// Update HOME_BASE to your actual home ZIP / address
const HOME_BASE           = "60628, Chicago, IL";
const SERVICE_RADIUS_MILES = 25;

// ── US state abbreviation map ────────────────────────────────────────────────
const STATE_ABBREVS: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
  oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
  'district of columbia': 'DC',
};

// ── Address normalizer ───────────────────────────────────────────────────────
// Converts "Chicago,Il" → "Chicago, IL", trims extra spaces, uppercase state codes
function normalizeAddress(address: string): string {
  if (!address) return address;

  // 1. Trim overall and collapse multiple spaces into one
  let normalized = address.trim().replace(/\s+/g, ' ');

  // 2. Ensure space after commas: "Chicago,IL" → "Chicago, IL"
  normalized = normalized.replace(/,(\S)/g, ', $1');

  // 3. Normalize state abbreviations to uppercase
  //    Match ", XX" or ", XX 12345" pattern at end (state + optional ZIP)
  normalized = normalized.replace(
    /,\s*([a-zA-Z]{2})(\s+\d{5}(-\d{4})?)?$/,
    (_, state, zip) => `, ${state.toUpperCase()}${zip || ''}`
  );

  // 4. Convert full state names to abbreviations (case insensitive)
  for (const [fullName, abbrev] of Object.entries(STATE_ABBREVS)) {
    const regex = new RegExp(`,\\s*${fullName}(\\s+\\d{5}(-\\d{4})?)?$`, 'i');
    if (regex.test(normalized)) {
      normalized = normalized.replace(regex, (_, zip) => `, ${abbrev}${zip || ''}`);
      break;
    }
  }

  return normalized;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { pickup, dropoff, pet_weight } = await req.json();
    if (!pickup || !dropoff) {
      return Response.json({ error: 'pickup and dropoff are required' }, { status: 400 });
    }

    // Normalize addresses before sending to Google Maps API
    const normalizedPickup = normalizeAddress(pickup);
    const normalizedDropoff = normalizeAddress(dropoff);

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    // Two origins: pickup (for trip distance) and home base (for service area check)
    // Two destinations: dropoff and pickup
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${encodeURIComponent(normalizedPickup)}|${encodeURIComponent(HOME_BASE)}` +
      `&destinations=${encodeURIComponent(normalizedDropoff)}|${encodeURIComponent(normalizedPickup)}` +
      `&units=imperial&key=${apiKey}`;

    const res  = await fetch(url);
    const data = await res.json();

    const tripElement = data?.rows?.[0]?.elements?.[0]; // pickup → dropoff
    const homeElement = data?.rows?.[1]?.elements?.[1]; // HOME_BASE → pickup

    if (!tripElement || tripElement.status !== 'OK') {
      return Response.json({ error: 'Could not calculate distance. Please check addresses.' }, { status: 422 });
    }

    // ── Trip pricing ──────────────────────────────────────────────────────────
    const miles      = tripElement.distance.value / 1609.344;
    const extraMiles = Math.max(0, miles - BASE_MILES);
    const baseFare   = BASE_FEE + extraMiles * PER_MILE_AFTER;
    const heavySurcharge = (pet_weight && Number(pet_weight) > HEAVY_THRESHOLD) ? HEAVY_SURCHARGE : 0;
    const price      = Math.max(MINIMUM_FARE, Math.round((baseFare + heavySurcharge) * 100) / 100);

    // ── Service area check ────────────────────────────────────────────────────
    let out_of_service_area  = false;
    let home_to_pickup_miles = null;
    if (homeElement?.status === 'OK') {
      home_to_pickup_miles = Math.round(homeElement.distance.value / 1609.344 * 10) / 10;
      out_of_service_area  = home_to_pickup_miles > SERVICE_RADIUS_MILES;
    }

    return Response.json({
      miles:             Math.round(miles * 10) / 10,
      price,
      base_fee:          BASE_FEE,
      extra_miles:       Math.round(extraMiles * 10) / 10,
      per_mile_charge:   Math.round(extraMiles * PER_MILE_AFTER * 100) / 100,
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
