import { useEffect, useRef, useState } from "react";

/* ── CONFIGURE ───────────────────────────────────────────────
   Create a free form at https://formspree.io (route it to
   Alexander), paste the endpoint below.
   Until configured, falls back to a pre-filled email.          */
const FORM_ENDPOINT = "REPLACE_WITH_FORMSPREE_ENDPOINT";
const FALLBACK_EMAIL = "rides@pawffeur.com";
/* ───────────────────────────────────────────────────────────── */

const css = `
.pawfm-overlay{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:rgba(58,63,71,.55);backdrop-filter:blur(3px);padding:16px}
.pawfm-card{font-family:'Alte Haas Grotesk','Inter',system-ui,sans-serif;width:100%;max-width:430px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 30px 80px -20px rgba(58,63,71,.5)}
.pawfm-head{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0e9da;background:#fdfaf3}
.pawfm-head .t{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#a08c63;font-weight:700}
.pawfm-x{border:0;background:transparent;width:30px;height:30px;border-radius:8px;color:#a08c63;cursor:pointer;font-size:15px}
.pawfm-x:hover{background:#f7f1e3;color:#3a3f47}
.pawfm-summary{padding:12px 20px;background:rgba(224,138,43,.08);border-bottom:1px solid #f0e9da}
.pawfm-summary .cap{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#9a5d14;font-weight:700}
.pawfm-summary p{margin:4px 0 0;font-size:12.5px;color:#3a3f47;font-variant-numeric:tabular-nums}
.pawfm-form{padding:20px;display:flex;flex-direction:column;gap:14px}
.pawfm-field span{display:block;font-size:12px;font-weight:600;color:#3a3f47;margin-bottom:5px}
.pawfm-field input{width:100%;box-sizing:border-box;border:1px solid #e7dfcf;border-radius:10px;padding:11px 12px;font-size:14px;color:#3a3f47;background:#fdfaf3;outline:none;transition:border .15s,box-shadow .15s;font-family:inherit}
.pawfm-field input:focus{border-color:#e08a2b;box-shadow:0 0 0 3px rgba(224,138,43,.18)}
.pawfm-send{border:0;background:#e08a2b;color:#fff;font-size:15px;font-weight:700;padding:13px;border-radius:12px;cursor:pointer;font-family:inherit;transition:background .15s}
.pawfm-send:hover{background:#cf7a1d}
.pawfm-send:disabled{opacity:.6;cursor:default}
.pawfm-err{background:rgba(224,138,43,.1);border:1px solid rgba(224,138,43,.4);color:#9a5d14;border-radius:10px;padding:9px 12px;font-size:12.5px}
.pawfm-fine{text-align:center;font-size:10.5px;color:#a08c63;margin:0}
.pawfm-done{padding:28px 22px;text-align:center}
.pawfm-done h3{margin:0;font-size:20px;color:#3a3f47}
.pawfm-done p{margin:10px 0 0;font-size:14px;color:#6b7280;line-height:1.5}
.pawfm-done button{margin-top:18px;border:1px solid #e7dfcf;background:#fdfaf3;color:#3a3f47;font-weight:600;font-size:14px;padding:10px 22px;border-radius:10px;cursor:pointer;font-family:inherit}
.pawfm-done button:hover{border-color:#e08a2b}
`;

function money(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export default function PawLeadModal({ open, onClose, config }) {
  const [status, setStatus] = useState("idle");
  const firstField = useRef(null);

  useEffect(() => {
    if (!open) return;
    setStatus("idle");
    const t = setTimeout(() => firstField.current?.focus(), 50);
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const tripSummary = `${config.miles} mi ${config.roundTrip ? "round trip" : "one-way"} · ${
    config.tripsPerMonth
  }×/mo · est. ${money(config.fareLo)}–${money(config.fareHi)}/trip · ≈ ${money(
    config.monthly
  )}/mo`;

  async function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const payload = {
      name: String(data.get("name") || ""),
      pet: String(data.get("pet") || ""),
      email: String(data.get("email") || ""),
      phone: String(data.get("phone") || ""),
      trip_config: tripSummary,
      miles: config.miles,
      trips_per_month: config.tripsPerMonth,
      round_trip: config.roundTrip ? "yes" : "no",
      est_fare: `${money(config.fareLo)}–${money(config.fareHi)}`,
      source: "fare-estimator",
    };

    if (FORM_ENDPOINT.startsWith("REPLACE")) {
      const body = encodeURIComponent(
        `Name: ${payload.name}\nPet: ${payload.pet}\nEmail: ${payload.email}\nPhone: ${payload.phone}\n\nTrip:\n${tripSummary}`
      );
      window.location.href = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(
        "Ride request — " + payload.pet
      )}&body=${body}`;
      setStatus("sent");
      return;
    }

    try {
      setStatus("sending");
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("bad status");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="pawfm-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <style>{css}</style>
      <div className="pawfm-card">
        <div className="pawfm-head">
          <span className="t">Book a ride for your pet</span>
          <button className="pawfm-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="pawfm-summary">
          <span className="cap">Your trip</span>
          <p>{tripSummary}</p>
        </div>

        {status === "sent" ? (
          <div className="pawfm-done">
            <h3>Ride requested 🐾</h3>
            <p>
              We&apos;ll text you shortly to confirm your exact fare and pickup
              window. Every paw gets a chauffeur.
            </p>
            <button onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="pawfm-form" onSubmit={handleSubmit}>
            <label className="pawfm-field">
              <span>Your name</span>
              <input ref={firstField} name="name" autoComplete="name" required />
            </label>
            <label className="pawfm-field">
              <span>Pet&apos;s name &amp; type</span>
              <input name="pet" placeholder="e.g. Biscuit, golden retriever" required />
            </label>
            <label className="pawfm-field">
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label className="pawfm-field">
              <span>Phone (we text to confirm)</span>
              <input name="phone" type="tel" autoComplete="tel" required />
            </label>

            {status === "error" && (
              <p className="pawfm-err">
                That didn&apos;t go through — try again, or call us directly.
              </p>
            )}

            <button className="pawfm-send" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Request this ride →"}
            </button>
            <p className="pawfm-fine">No spam — one text to confirm, that&apos;s it.</p>
          </form>
        )}
      </div>
    </div>
  );
}
