import React, { useState } from "react";

const inputStyle = {
  width: "100%",
  border: "1px solid #D8F3DC",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 15,
  background: "#fff",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  color: "#1B4332",
  fontWeight: 700,
  fontSize: 14,
  marginBottom: 6,
};

const fieldStyle = { marginBottom: 18 };

const initialForm = {
  full_name: "",
  phone: "",
  email: "",
  ride_type: "Vet Visit",
  pickup_address: "",
  dropoff_address: "",
  preferred_date: "",
  preferred_time_window: "",
  number_of_dogs: "1",
  dog_sizes: "Small",
  notes: "",
  is_urgent: false,
};

export default function BookingRequest() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [smsConsent, setSmsConsent] = useState(false);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      console.log("[BookingRequest] Submitting booking", form);

      const response = await fetch("/api/book-ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          number_of_dogs: Number(form.number_of_dogs) || 1,
        }),
        signal: controller.signal,
      });

      console.log("[BookingRequest] /api/book-ride status", response.status);
      const data = await response.json().catch(() => ({}));
      console.log("[BookingRequest] /api/book-ride response", data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Booking request failed");
      }

      setConfirmation(data);
    } catch (err) {
      console.error("[BookingRequest] Submit failed", err);
      setError(
        err.name === "AbortError"
          ? "The request timed out. Please try again."
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      clearTimeout(timeoutId);
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <main style={{ minHeight: "100vh", background: "#F9F7F3", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <section style={{ width: "100%", maxWidth: 520, background: "#fff", border: "1px solid #EDF7F0", borderRadius: 28, padding: 36, textAlign: "center", boxShadow: "0 20px 60px rgba(27,67,50,0.08)" }}>
          <div style={{ width: 64, height: 64, borderRadius: 22, background: "#D8F3DC", color: "#1B4332", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 34 }}>✓</div>
          <h1 style={{ color: "#1B4332", fontSize: 28, margin: "0 0 10px" }}>Request Received</h1>
          <p style={{ color: "#6B5B4F", lineHeight: 1.6, marginBottom: 18 }}>
            Thanks, {form.full_name || "there"}. We'll review your request and reach out to confirm pricing and timing.
          </p>
          <div style={{ background: "#EDF7F0", borderRadius: 16, padding: 16, marginBottom: 22 }}>
            <div style={{ color: "#6B5B4F", fontSize: 13 }}>Booking ID</div>
            <div style={{ color: "#1B4332", fontWeight: 800, fontSize: 20 }}>{confirmation.bookingId || confirmation.booking?.bookingId || "DC-PENDING"}</div>
          </div>
          <a href="/" style={{ display: "inline-block", background: "#1B4332", color: "#fff", borderRadius: 12, padding: "12px 20px", textDecoration: "none", fontWeight: 700 }}>
            Back to Home
          </a>
        </section>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#F9F7F3" }}>
      <nav style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #D8F3DC" }}>
        <a href="/" style={{ color: "#1B4332", fontWeight: 800, textDecoration: "none", fontSize: 20 }}>Pawffeur™</a>
      </nav>

      <section style={{ maxWidth: 720, margin: "0 auto", padding: "42px 18px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ color: "#1B4332", fontSize: 34, margin: "0 0 8px" }}>Book a Ride or Request a Quote</h1>
          <p style={{ color: "#6B5B4F", margin: 0 }}>Fill in the details below and we'll get back to you promptly.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #EDF7F0", borderRadius: 28, padding: 28, boxShadow: "0 20px 60px rgba(27,67,50,0.06)" }}>
          {error && (
            <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239", borderRadius: 12, padding: 12, marginBottom: 18 }}>
              {error}
            </div>
          )}

          <div style={fieldStyle}>
            <label style={labelStyle}>Your Name *</label>
            <input required style={inputStyle} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="e.g., Sarah Johnson" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Mobile Phone *</label>
              <input required style={inputStyle} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(312) 555-1234" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email</label>
              <input type="email" style={inputStyle} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@email.com" />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Ride Type *</label>
            <select required style={inputStyle} value={form.ride_type} onChange={(e) => set("ride_type", e.target.value)}>
              {["Vet Visit", "Grooming", "Daycare / Boarding", "Airport Trip", "Custom Ride"].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Pickup Address *</label>
            <input required style={inputStyle} value={form.pickup_address} onChange={(e) => set("pickup_address", e.target.value)} placeholder="123 Main St, Chicago, IL" />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Drop-off Address *</label>
            <input required style={inputStyle} value={form.dropoff_address} onChange={(e) => set("dropoff_address", e.target.value)} placeholder="456 Elm Ave, Chicago, IL" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Preferred Date *</label>
              <input required type="date" style={inputStyle} value={form.preferred_date} onChange={(e) => set("preferred_date", e.target.value)} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Preferred Time Window</label>
              <input style={inputStyle} value={form.preferred_time_window} onChange={(e) => set("preferred_time_window", e.target.value)} placeholder="e.g. 8–10 AM" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Number of Dogs</label>
              <input type="number" min="1" style={inputStyle} value={form.number_of_dogs} onChange={(e) => set("number_of_dogs", e.target.value)} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Dog Size(s)</label>
              <select style={inputStyle} value={form.dog_sizes} onChange={(e) => set("dog_sizes", e.target.value)}>
                {["Small", "Medium", "Large", "Mixed sizes"].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Notes / Special Needs</label>
            <textarea style={{ ...inputStyle, minHeight: 105, resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Medication, anxiety, crate preference, anything we should know..." />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, background: "#FFFBEB", borderRadius: 12, padding: 14, color: "#92400E", fontWeight: 700, marginBottom: 20 }}>
            <input type="checkbox" checked={form.is_urgent} onChange={(e) => set("is_urgent", e.target.checked)} />
            This is urgent / same-day (+$15 rush fee)
          </label>

          <div style={{ background: "#F9F7F3", borderRadius: 14, padding: 16, marginBottom: 20, color: "#6B5B4F" }}>
            <strong style={{ color: "#1B4332" }}>What to expect</strong>
            <ul style={{ marginBottom: 0, paddingLeft: 20, lineHeight: 1.7 }}>
              <li>Pickup and drop-off confirmation</li>
              <li>Safe transportation for your pet</li>
              <li>Clear communication after your request is submitted</li>
            </ul>
            <p style={{ marginBottom: 0, fontSize: 13 }}>Questions before booking? <a href="tel:3126209297" style={{ color: "#1B4332", fontWeight: 700 }}>Call or text (312) 620-9297</a></p>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20 }}>
            <input 
              type="checkbox" 
              id="sms-opt-in"
              required 
              checked={smsConsent} 
              onChange={(e) => setSmsConsent(e.target.checked)} 
              style={{ marginTop: 4, cursor: "pointer" }}
            />
            <label htmlFor="sms-opt-in" style={{ color: "#6B5B4F", fontSize: 11, lineHeight: 1.5, cursor: "pointer" }}>
              I agree to receive booking updates and SMS alerts from Pawffeur™ at the number provided. Message & data rates may apply. Msg frequency varies. Reply STOP to opt out. View our <a href="/privacy-policy" style={{ color: "#1B4332", textDecoration: "underline" }}>Privacy Policy</a> and <a href="/terms-and-conditions" style={{ color: "#1B4332", textDecoration: "underline" }}>Terms & Conditions</a>.
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ width: "100%", background: submitting ? "#9AA9A0" : "#1B4332", color: "#fff", border: 0, borderRadius: 14, padding: "14px 18px", fontWeight: 800, fontSize: 16, cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting ? "Sending..." : "Request Ride"}
          </button>

          <p style={{ textAlign: "center", color: "#6B5B4F", fontSize: 12, marginTop: 16, marginBottom: 0 }}>
            We'll review your request and reach out to confirm pricing and timing.
          </p>
        </form>
      </section>
    </main>
  );
}
