import { useMemo, useState } from "react";
import PawLeadModal from "./PawLeadModal";

/* ── FARE MODEL CONFIGURATION ─────────────────────────────────
   Every pricing parameter Alexander must review is listed here.  */
const ROUND_TRIP_MULT = 1.8;      // 1.8x multiplier for round trip

// Zone Flat Base Rates
const ZONE_LOCAL_BASE = 35;       // Local (within Chicago) flat rate: $35 (0-10 mi)
const ZONE_SUBURBAN_BASE = 55;    // Suburban flat rate: $55 (10-25 mi)
const ZONE_EXTENDED_BASE = 85;    // Extended area flat rate: $85 (25-50 mi)
const ZONE_LONGDIST_BASE = 120;   // Long distance flat rate: $120 (50+ mi)

// Pet Size Surcharges
const PET_SMALL_SURCHARGE = 0;    // Small Dog (<20 lbs) / Cat / Other surcharge: +$0
const PET_MEDIUM_SURCHARGE = 5;   // Medium Dog (20-50 lbs) surcharge: +$5
const PET_LARGE_SURCHARGE = 12;   // Large Dog (50+ lbs) surcharge: +$12

// Volume / Recurring Settings (PENDING ALEXANDER'S FINAL APPROVAL)
const RECURRING_MIN_TRIPS = 4;    // Kick off discount at 4+ trips per month
const RECURRING_DISCOUNT = 0.15;  // 15% discount on volume regular schedules

const RANGE_PCT = 0.08;           // Show ±8% range to set customer expectations
/* ───────────────────────────────────────────────────────────── */

const css = `
.pawf-card{font-family:'Alte Haas Grotesk','Inter',system-ui,sans-serif;background:#fff;border:1px solid #ece4d4;border-radius:20px;box-shadow:0 24px 60px -28px rgba(58,63,71,.25);overflow:hidden;max-width:920px;margin:0 auto}
.pawf-head{display:flex;align-items:center;justify-content:space-between;padding:14px 22px;border-bottom:1px solid #f0e9da;background:#fdfaf3}
.pawf-head .t{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#a08c63;font-weight:700}
.pawf-live{display:inline-flex;align-items:center;gap:7px;font-size:11px;color:#a08c63}
.pawf-dot{width:7px;height:7px;border-radius:50%;background:#e08a2b;animation:pawfpulse 1.8s ease-in-out infinite}
@keyframes pawfpulse{0%,100%{opacity:1}50%{opacity:.3}}
.pawf-grid{display:grid;grid-template-columns:1.05fr .95fr}
@media(max-width:760px){.pawf-grid{grid-template-columns:1fr}}
.pawf-controls{padding:26px 24px;display:flex;flex-direction:column;gap:30px}
.pawf-label-row{display:flex;align-items:flex-end;justify-content:space-between}
.pawf-label{font-size:14px;color:#3a3f47;font-weight:600}
.pawf-value{font-size:24px;font-weight:700;color:#3a3f47;font-variant-numeric:tabular-nums}
.pawf-value small{font-size:13px;font-weight:500;color:#a08c63}
.pawf-slider{-webkit-appearance:none;appearance:none;width:100%;height:5px;border-radius:99px;outline:none;cursor:pointer;margin-top:14px;background:linear-gradient(90deg,#e08a2b var(--fill,50%),#f0e9da var(--fill,50%))}
.pawf-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:24px;height:24px;border-radius:50%;background:#fff;border:3px solid #e08a2b;box-shadow:0 2px 10px rgba(224,138,43,.45);transition:transform .12s}
.pawf-slider::-webkit-slider-thumb:hover{transform:scale(1.1)}
.pawf-slider::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:#fff;border:3px solid #e08a2b;box-shadow:0 2px 10px rgba(224,138,43,.45)}
.pawf-ticks{display:flex;justify-content:space-between;font-size:10px;color:#a08c63;margin-top:7px}
.pawf-toggle{display:inline-flex;background:#f7f1e3;border-radius:12px;padding:4px;gap:4px;width:fit-content}
.pawf-toggle button{border:0;background:transparent;padding:9px 18px;border-radius:9px;font-size:13px;font-weight:600;color:#a08c63;cursor:pointer;transition:all .15s}
.pawf-toggle button.on{background:#fff;color:#3a3f47;box-shadow:0 2px 8px rgba(58,63,71,.12)}
.pawf-readout{background:#f7f1e3;padding:26px 24px;border-top:1px solid #f0e9da}
@media(min-width:761px){.pawf-readout{border-top:0;border-left:1px solid #f0e9da}}
.pawf-readout .cap{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#a08c63;font-weight:700}
.pawf-price{font-size:42px;font-weight:800;color:#3a3f47;line-height:1.1;margin-top:6px;font-variant-numeric:tabular-nums}
.pawf-price small{font-size:15px;font-weight:500;color:#a08c63}
.pawf-rows{margin-top:18px;display:flex;flex-direction:column;gap:9px;font-size:13.5px}
.pawf-row{display:flex;justify-content:space-between;color:#6b7280}
.pawf-row b{color:#3a3f47;font-variant-numeric:tabular-nums}
.pawf-badge{margin-top:18px;background:rgba(224,138,43,.12);border:1px solid rgba(224,138,43,.35);border-radius:12px;padding:11px 14px;font-size:13px;color:#9a5d14}
.pawf-cta{display:block;width:100%;margin-top:18px;border:0;background:#e08a2b;color:#fff;font-size:15px;font-weight:700;padding:14px;border-radius:12px;cursor:pointer;transition:background .15s;font-family:inherit}
.pawf-cta:hover{background:#cf7a1d}
.pawf-fine{margin-top:10px;text-align:center;font-size:10.5px;color:#a08c63}
`;

function money(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export default function PawffeurEstimator() {
  const [miles, setMiles] = useState(5);
  const [tripsPerMonth, setTripsPerMonth] = useState(2);
  const [roundTrip, setRoundTrip] = useState(true);
  const [petSize, setPetSize] = useState("small"); // "small" | "medium" | "large"
  const [leadOpen, setLeadOpen] = useState(false);

  // Map distance slider value to pricing zones
  const zoneInfo = useMemo(() => {
    if (miles <= 10) {
      return { id: "local", name: "Local", base: ZONE_LOCAL_BASE, range: "0-10 mi" };
    } else if (miles <= 25) {
      return { id: "suburban", name: "Suburban", base: ZONE_SUBURBAN_BASE, range: "10-25 mi" };
    } else if (miles <= 50) {
      return { id: "extended", name: "Extended Area", base: ZONE_EXTENDED_BASE, range: "25-50 mi" };
    } else {
      return { id: "longdist", name: "Long Distance", base: ZONE_LONGDIST_BASE, range: "50+ mi" };
    }
  }, [miles]);

  // Pet size surcharge mapping
  const petSurcharge = useMemo(() => {
    if (petSize === "medium") return PET_MEDIUM_SURCHARGE;
    if (petSize === "large") return PET_LARGE_SURCHARGE;
    return PET_SMALL_SURCHARGE;
  }, [petSize]);

  // Calculation logic
  const fare = useMemo(() => {
    let perTrip = zoneInfo.base + petSurcharge;
    if (roundTrip) perTrip *= ROUND_TRIP_MULT;
    
    const recurring = tripsPerMonth >= RECURRING_MIN_TRIPS;
    if (recurring) perTrip *= 1 - RECURRING_DISCOUNT;
    
    const lo = perTrip * (1 - RANGE_PCT);
    const hi = perTrip * (1 + RANGE_PCT);
    const monthly = perTrip * tripsPerMonth;
    
    return { perTrip, lo, hi, monthly, recurring };
  }, [zoneInfo, petSurcharge, roundTrip, tripsPerMonth]);

  const milesFill = ((miles - 1) / (60 - 1)) * 100;
  const tripsFill = ((tripsPerMonth - 1) / (20 - 1)) * 100;

  return (
    <div className="pawf-card">
      <style>{css}</style>

      <div className="pawf-head">
        <span className="t">Instant Fare Estimator</span>
        <span className="pawf-live">
          <span className="pawf-dot" /> live estimate
        </span>
      </div>

      <div className="pawf-grid">
        <div className="pawf-controls">
          {/* Distance Slider */}
          <div>
            <div className="pawf-label-row">
              <label className="pawf-label" htmlFor="pawf-miles">
                Trip distance
              </label>
              <span className="pawf-value">
                {miles} <small>miles ({zoneInfo.name})</small>
              </span>
            </div>
            <input
              id="pawf-miles"
              className="pawf-slider"
              type="range"
              min={1}
              max={60}
              value={miles}
              style={{ "--fill": `${milesFill}%` }}
              onChange={(e) => setMiles(Number(e.target.value))}
            />
            <div className="pawf-ticks">
              <span>1 mi</span>
              <span>60 mi</span>
            </div>
          </div>

          {/* Trips Per Month Slider */}
          <div>
            <div className="pawf-label-row">
              <label className="pawf-label" htmlFor="pawf-trips">
                Trips per month
              </label>
              <span className="pawf-value">
                {tripsPerMonth} <small>{tripsPerMonth === 1 ? "trip" : "trips"}</small>
              </span>
            </div>
            <input
              id="pawf-trips"
              className="pawf-slider"
              type="range"
              min={1}
              max={20}
              value={tripsPerMonth}
              style={{ "--fill": `${tripsFill}%` }}
              onChange={(e) => setTripsPerMonth(Number(e.target.value))}
            />
            <div className="pawf-ticks">
              <span>One-off</span>
              <span>Daily regular</span>
            </div>
          </div>

          {/* Pet Size Selector */}
          <div>
            <span className="pawf-label" style={{ display: "block", marginBottom: 10 }}>
              Pet Size
            </span>
            <div className="pawf-toggle" role="group" aria-label="Pet size">
              <button
                type="button"
                className={petSize === "small" ? "on" : ""}
                onClick={() => setPetSize("small")}
              >
                Small (&lt;20 lbs)
              </button>
              <button
                type="button"
                className={petSize === "medium" ? "on" : ""}
                onClick={() => setPetSize("medium")}
              >
                Medium (20-50 lbs)
              </button>
              <button
                type="button"
                className={petSize === "large" ? "on" : ""}
                onClick={() => setPetSize("large")}
              >
                Large (50+ lbs)
              </button>
            </div>
          </div>

          {/* Trip Type Selector */}
          <div>
            <span className="pawf-label" style={{ display: "block", marginBottom: 10 }}>
              Trip type
            </span>
            <div className="pawf-toggle" role="group" aria-label="Trip type">
              <button
                type="button"
                className={!roundTrip ? "on" : ""}
                onClick={() => setRoundTrip(false)}
              >
                One-way
              </button>
              <button
                type="button"
                className={roundTrip ? "on" : ""}
                onClick={() => setRoundTrip(true)}
              >
                Round trip
              </button>
            </div>
          </div>
        </div>

        {/* Readout Grid Panel */}
        <div className="pawf-readout">
          <p className="cap">Estimated fare</p>
          <p className="pawf-price">
            {money(fare.lo)}–{money(fare.hi)} <small>/ trip</small>
          </p>

          <div className="pawf-rows">
            <div className="pawf-row">
              <span>Base zone fare ({zoneInfo.name})</span>
              <b>{money(zoneInfo.base)}</b>
            </div>
            {petSurcharge > 0 && (
              <div className="pawf-row">
                <span>Pet size surcharge</span>
                <b>+ {money(petSurcharge)}</b>
              </div>
            )}
            {roundTrip && (
              <div className="pawf-row">
                <span>Round trip</span>
                <b>× {ROUND_TRIP_MULT}</b>
              </div>
            )}
            <div className="pawf-row">
              <span>Monthly ({tripsPerMonth} {tripsPerMonth === 1 ? "trip" : "trips"})</span>
              <b>≈ {money(fare.monthly)}</b>
            </div>
          </div>

          {fare.recurring && (
            <div className="pawf-badge">
              🐾 Volume Discount: {RECURRING_DISCOUNT * 100}% off applied for{" "}
              {RECURRING_MIN_TRIPS}+ trips a month <span className="opacity-80 text-[10px] block mt-0.5 font-sans">(Discount % pending approval)</span>
            </div>
          )}

          <button type="button" className="pawf-cta" onClick={() => setLeadOpen(true)}>
            Book a ride for your pet →
          </button>
          <p className="pawf-fine">
            Estimate only · we confirm your exact fare before any trip
          </p>
        </div>
      </div>

      <PawLeadModal
        open={leadOpen}
        onClose={() => setLeadOpen(false)}
        config={{
          miles,
          tripsPerMonth,
          roundTrip,
          fareLo: fare.lo,
          fareHi: fare.hi,
          monthly: fare.monthly,
        }}
      />
    </div>
  );
}
