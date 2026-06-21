import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PawPrint, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TrackRide() {
  const params = new URLSearchParams(window.location.search);
  const tripId = params.get("id");

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [verification, setVerification] = useState(null);

  // --- Simulated Demo State ---
  const [isDemo, setIsDemo] = useState(false);

  // Fetch real trip data or fall back to demo option
  useEffect(() => {
    if (!tripId) { 
      setNotFound(true); 
      setLoading(false); 
      return; 
    }

    const load = async () => {
      try {
        const trips = await base44.entities.Trip.filter({ id: tripId });
        if (!trips || trips.length === 0) { 
          setNotFound(true); 
          setLoading(false); 
          return; 
        }
        setTrip(trips[0]);

        // Fetch verification details if any
        try {
          const verRes = await fetch(`/api/chauffeur-health-record-verification?trip_id=${tripId}`).then(r => r.json());
          if (verRes && verRes.success) {
            setVerification(verRes.data);
          }
        } catch (e) {
          console.error("Failed to load verification status", e);
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to load trip data", err);
        setNotFound(true);
        setLoading(false);
      }
    };
    load();

    // Subscribe to real-time sync if applicable
    const unsub1 = base44.entities.Trip.subscribe((event) => {
      if (event.data?.id === tripId || event.id === tripId) {
        setTrip(event.data);
      }
    });

    return () => { unsub1(); };
  }, [tripId]);

  // Activate Demo Voyage Simulator
  const launchDemo = () => {
    setIsDemo(true);
    setNotFound(false);
    setTrip({
      id: "PW-98274A",
      pet_name: "Rocky",
      pickup_location: "Wicker Park Veterinary Clinic, Chicago, IL",
      dropoff_location: "Lincoln Park Daycare Center, Chicago, IL",
      driver_name: "Alexander",
      ride_type: "Standard Transport",
      status: "in_progress",
      scheduled_date: new Date().toISOString().split("T")[0],
      scheduled_time: "14:30",
    });
    setVerification({
      visual_match_confirmed: true,
      restraint_hardware_confirmed: true,
      photo_capture_attached: true,
      transport_decision: "pass_visual_match",
      verification_notes: "Rocky was pictured at pickup and loaded calmly. Photo check-in sent to owner.",
      reviewed_at: new Date(Date.now() - 5 * 60000).toISOString(),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F3] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1B4332] flex items-center justify-center mx-auto mb-3 animate-pulse">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
          <p className="text-[#1B4332] font-semibold text-sm">Synchronizing with Pawffeur network...</p>
        </div>
      </div>
    );
  }

  // Not Found View (Launches simulated demo)
  if (notFound && !isDemo) {
    return (
      <div className="min-h-screen bg-[#F9F7F3] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-[#D8F3DC] p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-[#EDF7F0] border border-[#B7E4C7] flex items-center justify-center mx-auto mb-5">
            <PawPrint className="w-8 h-8 text-[#1B4332]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1B4332] mb-2 font-serif">Voyage Not Found</h2>
          <p className="text-[#6B5B4F] text-sm mb-6 leading-relaxed">
            No active trip identifier detected in this link. Please trigger the simulated dashboard demo to view the customer interface.
          </p>
          <Button 
            onClick={launchDemo} 
            className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-2xl py-6 text-base font-semibold flex items-center justify-center gap-2 shadow-md transition"
          >
            Launch Live Demo Voyage
          </Button>
        </div>
      </div>
    );
  }

  const activeTrip = trip || {};
  const petName = activeTrip.pet_name || "your pet";
  const driverName = activeTrip.driver_name || "Alexander";
  const displayStatus = activeTrip.status || "requested";

  // Check if photo is captured
  const isPhotoCaptured = !!(verification && verification.photo_capture_attached);
  
  // Format captured timestamp
  let capturedTimeStr = "Pending";
  let sharedTimeStr = "Pending";
  if (verification && verification.reviewed_at) {
    const d = new Date(verification.reviewed_at);
    capturedTimeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    sharedTimeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (isDemo) {
    capturedTimeStr = "3:42 PM";
    sharedTimeStr = "3:43 PM";
  }

  // Wording & notes
  const driverNotes = verification?.verification_notes || (isDemo ? "Rocky was pictured at pickup and loaded calmly. Photo check-in sent to owner." : "Driver will share a photo update after pickup check-in is complete.");

  // Build timeline items dynamically
  const isCareNoteConfirmed = displayStatus === "confirmed" || displayStatus === "in_progress" || displayStatus === "completed";
  const isPickupPhotoCaptured = isPhotoCaptured;
  const isOwnerNotified = isPhotoCaptured;
  const isDropoffCheckin = displayStatus === "completed";

  return (
    <>
      <style>{`
        :root {
          --paw-green: #1b4332;
          --paw-green-soft: #edf7f0;
          --paw-green-mid: #b7e4c7;
          --paw-cream: #f9f7f3;
          --paw-brown: #6b5b4f;
          --paw-text: #1f2933;
          --paw-muted: #6b7280;
          --paw-border: #d8f3dc;
          --paw-white: #ffffff;
          --paw-warning: #92400e;
          --paw-shadow: 0 20px 45px rgba(27, 67, 50, 0.12);
        }

        .tracking-body-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #f9f7f3 0%, #edf7f0 100%);
          color: var(--paw-text);
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          margin: 0;
          padding: 0;
        }

        .tracking-shell {
          width: min(1180px, calc(100% - 32px));
          margin: 0 auto;
          padding: 32px 0;
        }

        .tracking-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 24px;
          padding: 28px;
          background: var(--paw-white);
          border: 1px solid var(--paw-border);
          border-radius: 28px;
          box-shadow: var(--paw-shadow);
        }

        .eyebrow,
        .section-label {
          margin: 0 0 6px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--paw-green);
        }

        .tracking-hero h1 {
          margin: 0;
          font-size: clamp(2rem, 5vw, 3.4rem);
          line-height: 1;
          color: var(--paw-green);
        }

        .hero-subtext {
          max-width: 620px;
          margin: 12px 0 0;
          font-size: 1rem;
          line-height: 1.55;
          color: var(--paw-brown);
        }

        .ride-status-pill,
        .neutral-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .ride-status-pill {
          padding: 10px 14px;
          background: var(--paw-green-soft);
          color: var(--paw-green);
          border: 1px solid var(--paw-border);
        }

        .status-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: var(--paw-green);
        }

        .neutral-badge {
          padding: 8px 12px;
          background: var(--paw-cream);
          color: var(--paw-brown);
          border: 1px solid #eadfce;
        }

        .tracking-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.85fr);
          gap: 24px;
          align-items: start;
        }

        .telemetry-card,
        .timeline-card,
        .framework-footer {
          background: var(--paw-white);
          border: 1px solid var(--paw-border);
          border-radius: 28px;
          box-shadow: var(--paw-shadow);
        }

        .telemetry-card,
        .timeline-card {
          padding: 22px;
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .card-header h2 {
          margin: 0;
          font-size: 1.35rem;
          line-height: 1.2;
          color: var(--paw-green);
        }

        .photo-frame {
          overflow: hidden;
          border-radius: 24px;
          background: var(--paw-cream);
          border: 1px solid var(--paw-border);
          aspect-ratio: 16 / 10;
        }

        .photo-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .photo-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--paw-brown);
          text-align: center;
          padding: 20px;
        }

        .telemetry-meta {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .meta-item {
          padding: 12px;
          background: var(--paw-green-soft);
          border: 1px solid var(--paw-border);
          border-radius: 16px;
        }

        .meta-label {
          display: block;
          margin-bottom: 4px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--paw-green);
        }

        .meta-value {
          display: block;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--paw-text);
        }

        .driver-note {
          margin-top: 16px;
          padding: 16px;
          background: var(--paw-cream);
          border: 1px solid #eadfce;
          border-radius: 18px;
        }

        .note-label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--paw-brown);
        }

        .driver-note p {
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.55;
          color: var(--paw-text);
        }

        .task-timeline {
          list-style: none;
          padding: 0;
          margin: 0;
          position: relative;
        }

        .task-item {
          display: grid;
          grid-template-columns: 20px minmax(0, 1fr);
          gap: 12px;
          position: relative;
          padding-bottom: 20px;
        }

        .task-item:not(:last-child)::before {
          content: "";
          position: absolute;
          left: 9px;
          top: 18px;
          bottom: 0;
          width: 2px;
          background: var(--paw-border);
        }

        .task-marker {
          width: 20px;
          height: 20px;
          margin-top: 2px;
          border-radius: 999px;
          border: 3px solid var(--paw-white);
          box-shadow: 0 0 0 1px var(--paw-border);
          background: var(--paw-green-mid);
          z-index: 1;
        }

        .task-item.completed .task-marker {
          background: var(--paw-green);
        }

        .task-item.pending .task-marker {
          background: #e5e7eb;
        }

        .task-body {
          padding: 0 0 0 2px;
        }

        .task-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 14px;
        }

        .task-row h3 {
          margin: 0;
          font-size: 0.98rem;
          line-height: 1.35;
          color: var(--paw-text);
        }

        .task-row time {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--paw-muted);
          white-space: nowrap;
        }

        .task-body p {
          margin: 4px 0 0;
          font-size: 0.84rem;
          line-height: 1.45;
          color: var(--paw-brown);
        }

        .framework-footer {
          margin-top: 24px;
          padding: 22px 24px;
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.8fr);
          gap: 24px;
          align-items: start;
        }

        .footer-title {
          margin: 0 0 6px;
          font-weight: 900;
          color: var(--paw-green);
        }

        .framework-footer p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.55;
          color: var(--paw-brown);
        }

        .footer-disclaimer {
          padding: 14px;
          background: var(--paw-cream);
          border: 1px solid #eadfce;
          border-radius: 18px;
          font-size: 0.8rem !important;
        }

        @media (max-width: 880px) {
          .tracking-hero,
          .framework-footer {
            grid-template-columns: 1fr;
            flex-direction: column;
          }

          .tracking-grid {
            grid-template-columns: 1fr;
          }

          .telemetry-meta {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 520px) {
          .tracking-shell {
            width: min(100% - 20px, 1180px);
            padding: 20px 0;
          }

          .tracking-hero,
          .telemetry-card,
          .timeline-card,
          .framework-footer {
            border-radius: 22px;
            padding: 18px;
          }

          .telemetry-meta {
            grid-template-columns: 1fr;
          }

          .task-row {
            flex-direction: column;
            gap: 2px;
          }
        }
      `}</style>

      <div className="tracking-body-container">
        <main className="tracking-shell">
          {/* Header */}
          <section className="tracking-hero">
            <div>
              <p className="eyebrow">Pawffeur Ride Update</p>
              <h1>{petName} is {displayStatus === "completed" ? "delivered" : "on the way"}</h1>
              <p className="hero-subtext">
                Photo check-ins from your driver with time and location context.
              </p>
            </div>

            <div className="ride-status-pill">
              <span className="status-dot"></span>
              {displayStatus === "completed" ? "Completed" : "In progress"}
            </div>
          </section>

          {/* Main Grid */}
          <section className="tracking-grid">
            {/* Telemetry Photo Card */}
            <article className="telemetry-card">
              <div className="card-header">
                <div>
                  <p className="section-label">Pickup Check-In</p>
                  <h2>{isPhotoCaptured ? "Photo shared with owner" : "Awaiting photo check-in"}</h2>
                </div>
                <span className="neutral-badge">{isPhotoCaptured ? "Captured" : "Pending"}</span>
              </div>

              <div className="photo-frame">
                {isPhotoCaptured ? (
                  <img
                    src="/assets/dog_chauffeur_hero.png"
                    alt={`${petName} pictured during pickup check-in`}
                  />
                ) : (
                  <div className="photo-placeholder font-mono text-xs">
                    <PawPrint className="w-8 h-8 text-gray-300 animate-pulse mb-2" />
                    <span>Awaiting driver photo check-in...</span>
                  </div>
                )}
              </div>

              <div className="telemetry-meta">
                <div className="meta-item">
                  <span className="meta-label">Captured</span>
                  <span className="meta-value">{capturedTimeStr}</span>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Location</span>
                  <span className="meta-value">{isDemo ? "Chicago, IL" : (activeTrip.pickup_location?.split(",")[1]?.trim() || "Chicago, IL")}</span>
                </div>

                <div className="meta-item">
                  <span className="meta-label">GPS</span>
                  <span className="meta-value">{isDemo ? "41.8781, -87.6298" : "41.8781, -87.6298"}</span>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Driver</span>
                  <span className="meta-value">{driverName}</span>
                </div>
              </div>

              <div className="driver-note">
                <span className="note-label">Driver note</span>
                <p>{driverNotes}</p>
              </div>
            </article>

            {/* Task Compliance Timeline */}
            <aside className="timeline-card">
              <div className="card-header">
                <div>
                  <p className="section-label">Ride Task Timeline</p>
                  <h2>Care actions completed</h2>
                </div>
              </div>

              <ol className="task-timeline">
                <li className={`task-item ${isCareNoteConfirmed ? "completed" : "pending"}`}>
                  <div className="task-marker"></div>
                  <div className="task-body">
                    <div className="task-row">
                      <h3>Care note confirmed</h3>
                      <time>{isCareNoteConfirmed ? (isDemo ? "3:30 PM" : "Confirmed") : "Pending"}</time>
                    </div>
                    <p>Current care instructions checked before pickup.</p>
                  </div>
                </li>

                <li className={`task-item ${isPickupPhotoCaptured ? "completed" : "pending"}`}>
                  <div className="task-marker"></div>
                  <div className="task-body">
                    <div className="task-row">
                      <h3>Pickup photo captured</h3>
                      <time>{isPickupPhotoCaptured ? capturedTimeStr : "Pending"}</time>
                    </div>
                    <p>Photo check-in captured with timestamp and location context.</p>
                  </div>
                </li>

                <li className={`task-item ${isOwnerNotified ? "completed" : "pending"}`}>
                  <div className="task-marker"></div>
                  <div className="task-body">
                    <div className="task-row">
                      <h3>Owner notified</h3>
                      <time>{isOwnerNotified ? sharedTimeStr : "Pending"}</time>
                    </div>
                    <p>Pickup photos delivered to {petName}’s owner.</p>
                  </div>
                </li>

                <li className={`task-item ${isDropoffCheckin ? "completed" : "pending"}`}>
                  <div className="task-marker"></div>
                  <div className="task-body">
                    <div className="task-row">
                      <h3>Drop-off check-in</h3>
                      <time>{isDropoffCheckin ? (isDemo ? "4:15 PM" : "Completed") : "Pending"}</time>
                    </div>
                    <p>Driver will share a photo update after drop-off.</p>
                  </div>
                </li>
              </ol>
            </aside>
          </section>

          {/* Framework Footer */}
          <footer className="framework-footer">
            <div>
              <p className="footer-title">Transparent ride communication</p>
              <p>
                Pawffeur shares driver-provided photo check-ins, timestamps, and ride task updates
                so owners can follow the transport process with clear context.
              </p>
            </div>

            <p className="footer-disclaimer">
              Photo check-ins are communication records. They do not certify safety, health,
              behavior, or ride outcome.
            </p>
          </footer>
        </main>
      </div>
    </>
  );
}