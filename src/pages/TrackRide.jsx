import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  PawPrint, MapPin, CheckCircle2, Clock, Truck, ShieldAlert,
  Shield, Thermometer, User, Headphones, Compass, RefreshCw, Send, CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STATUS_STEPS = [
  { key: "requested",   label: "Ride Requested",   icon: Clock },
  { key: "confirmed",   label: "Driver Assigned",  icon: Shield },
  { key: "in_progress", label: "Pet Picked Up",    icon: Truck },
  { key: "completed",   label: "Pet Delivered",    icon: CheckCircle2 },
];

function getStepIndex(status) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

// Coordinate path for simulated premium vector map
const MAP_ROUTE_NODES = [
  { x: 50, y: 150, label: "Pickup Point" },
  { x: 130, y: 70, label: "Segment 1" },
  { x: 230, y: 150, label: "Segment 2" },
  { x: 330, y: 90, label: "Drop-off Hub" }
];

export default function TrackRide() {
  const params = new URLSearchParams(window.location.search);
  const tripId = params.get("id");

  const [trip, setTrip] = useState(null);
  const [dbUpdates, setDbUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // --- Simulated Demo State ---
  const [isDemo, setIsDemo] = useState(false);
  const [progress, setProgress] = useState(15);
  const [etaMinutes, setEtaMinutes] = useState(25);
  const [cabinTemp, setCabinTemp] = useState(68.5);
  const [simulatedLogs, setSimulatedLogs] = useState([]);

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
        const upds = await base44.entities.TripUpdate.filter({ trip_id: tripId });
        setDbUpdates(upds.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
        setLoading(false);
      } catch (err) {
        console.error("Failed to load trip data", err);
        setNotFound(true);
        setLoading(false);
      }
    };
    load();

    // Subscribe to real-time sync
    const unsub1 = base44.entities.Trip.subscribe((event) => {
      if (event.data?.id === tripId || event.id === tripId) {
        setTrip(event.data);
      }
    });
    const unsub2 = base44.entities.TripUpdate.subscribe((event) => {
      if (event.data?.trip_id === tripId) {
        setDbUpdates((prev) => {
          const exists = prev.find((u) => u.id === event.data.id);
          if (exists) return prev;
          return [...prev, event.data];
        });
      }
    });

    return () => { unsub1(); unsub2(); };
  }, [tripId]);

  // Activate Demo Voyage Simulator
  const launchDemo = () => {
    setIsDemo(true);
    setNotFound(false);
    setTrip({
      id: "PW-98274A",
      pet_name: "Barkley",
      pickup_location: "Wicker Park Veterinary Clinic",
      dropoff_location: "Lincoln Park Daycare Center",
      driver_name: "Driver Sophia",
      ride_type: "Standard Transport",
      status: "in_progress",
      scheduled_date: new Date().toISOString().split("T")[0],
      scheduled_time: "14:30",
    });
    
    // Initial credible operational logs
    const initialTime = new Date();
    setSimulatedLogs([
      {
        id: "l1",
        time: new Date(initialTime.getTime() - 12 * 60000),
        message: "Passenger checked in and safely secured."
      },
      {
        id: "l2",
        time: new Date(initialTime.getTime() - 10 * 60000),
        message: "Cabin temperature verified."
      },
      {
        id: "l3",
        time: new Date(initialTime.getTime() - 8 * 60000),
        message: "Driver completed comfort check."
      },
      {
        id: "l4",
        time: new Date(initialTime.getTime() - 5 * 60000),
        message: "Pawffeur Concierge monitoring active voyage."
      },
      {
        id: "l5",
        time: new Date(initialTime.getTime() - 2 * 60000),
        message: "Route progress updated."
      }
    ]);
    setProgress(25);
    setEtaMinutes(22);
  };

  // Run Real-Time Simulation progression loops
  useEffect(() => {
    if (!isDemo && (!trip || trip.status !== "in_progress")) return;

    // Segment coordinate progress & telemetry simulator
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 25; // Loop back for demo continuity
        return prev + 1;
      });

      setEtaMinutes(prev => {
        if (prev <= 3) return 25;
        // Decrease ETA roughly as progress advances
        return Math.random() > 0.7 ? prev - 1 : prev;
      });

      setCabinTemp(prev => {
        const delta = (Math.random() - 0.5) * 0.2;
        const next = Math.max(67.5, Math.min(69.5, prev + delta));
        return Math.round(next * 10) / 10;
      });
    }, 4000);

    // Periodic auto-advancing premium operational log entries
    const operationalMessages = [
      "Cabin temperature verified.",
      "Route progress updated.",
      "Driver completed comfort check.",
      "ETA refreshed.",
      "Drop-off instructions confirmed.",
      "Pawffeur Concierge monitoring active voyage."
    ];

    const logsInterval = setInterval(() => {
      const randomMsg = operationalMessages[Math.floor(Math.random() * operationalMessages.length)];
      pushSimulatedLog(randomMsg);
    }, 25000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(logsInterval);
    };
  }, [isDemo, trip]);

  const pushSimulatedLog = (message) => {
    setSimulatedLogs(prev => [
      {
        id: "sim-" + Math.random(),
        time: new Date(),
        message
      },
      ...prev
    ]);
  };

  // --- Owner Action Panel Commands ---
  const handleRequestDriverUpdate = () => {
    toast.success("Driver update requested.");
    pushSimulatedLog("Driver update requested. Pawffeur Concierge will refresh the ride status.");
  };

  const handleNotifyArrivalContact = () => {
    toast.success("Arrival contact notification prepared.");
    pushSimulatedLog("Arrival contact notification queued.");
  };

  const handleViewComfortCheck = () => {
    toast.success("Latest comfort check displayed.");
    pushSimulatedLog("Latest comfort check displayed.");
  };

  const handleContactConcierge = () => {
    toast.success("Concierge contact request logged.");
    pushSimulatedLog("Pawffeur Concierge monitoring active voyage. Support request dispatched.");
  };

  const handleConfirmDestination = () => {
    toast.success("Destination details confirmed.");
    pushSimulatedLog("Drop-off instructions confirmed.");
  };

  // Interpolate vehicle markers along the custom SVG map
  const getCarCoordinates = () => {
    const totalSegments = MAP_ROUTE_NODES.length - 1;
    const decimal = progress / 100;
    const segment = Math.min(Math.floor(decimal * totalSegments), totalSegments - 1);
    
    const segmentProgress = (decimal * totalSegments) - segment;
    const startNode = MAP_ROUTE_NODES[segment];
    const endNode = MAP_ROUTE_NODES[segment + 1];
    
    return {
      x: startNode.x + (endNode.x - startNode.x) * segmentProgress,
      y: startNode.y + (endNode.y - startNode.y) * segmentProgress
    };
  };

  const carCoords = getCarCoordinates();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1015] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1B4332] border border-[#2D6A4F] flex items-center justify-center mx-auto mb-3 animate-pulse">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
          <p className="text-white/60 font-medium text-sm">Synchronizing with Pawffeur network...</p>
        </div>
      </div>
    );
  }

  // Not Found View (Launches simulated demo)
  if (notFound && !isDemo) {
    return (
      <div className="min-h-screen bg-[#0E1015] flex items-center justify-center px-4">
        <div className="bg-[#12151E] rounded-3xl border border-white/5 p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-[#1B4332]/25 border border-[#2D6A4F]/40 flex items-center justify-center mx-auto mb-5">
            <PawPrint className="w-8 h-8 text-[#52B788]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 font-serif">Voyage Not Found</h2>
          <p className="text-white/60 text-sm mb-6 leading-relaxed">
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
  const currentStepIdx = getStepIndex(activeTrip.status);

  // Database updates lookup mapping
  const dbUpdateLabels = {
    pickup_completed: "🐾 Pet picked up",
    en_route: "🚗 En route to destination",
    potty_break: "🌿 Potty break stop",
    rest_stop: "☕ Rest stop",
    feeding: "🍖 Feeding time",
    near_destination: "📍 Almost there",
    final_delivery: "🏠 Arrived at destination",
  };

  return (
    <div className="min-h-screen bg-[#0E1015] text-[#FAF6F0] font-sans pb-12">
      {/* 1. Header / Trip Summary */}
      <header className="sticky top-0 z-40 bg-[#0E1015]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1B4332]/20 border border-[#2D6A4F]/30 flex items-center justify-center">
            <PawPrint className="w-4 h-4 text-[#52B788]" />
          </div>
          <div>
            <h1 className="font-bold text-[#FAF6F0] text-base tracking-tight">Pawffeur™ Live Voyage</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Real-Time Client Dashboard</span>
            </div>
          </div>
        </div>

        {isDemo && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
            Simulated Demo Active
          </div>
        )}
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 grid md:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Map & Passenger Comfort HUD */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Trip Summary Card */}
          <div className="bg-[#12151E] border border-white/5 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] text-white/55 font-mono uppercase tracking-wider">Booking ID</p>
                <h2 className="text-xl font-bold text-white font-serif">{activeTrip.id}</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/55 font-mono uppercase tracking-wider">Status</p>
                <span className="inline-block text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2.5 py-0.5 capitalize">
                  {activeTrip.status?.replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-white/45">Passenger</p>
                <p className="font-medium text-white">{activeTrip.pet_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-white/45">Service Tier</p>
                <p className="font-medium text-white">{activeTrip.ride_type || "Behavior-Aware Transport"}</p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-2.5 text-xs text-white/70">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <p><span className="text-white/45 font-medium">Pickup:</span> {activeTrip.pickup_location}</p>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p><span className="text-white/45 font-medium">Drop-off:</span> {activeTrip.dropoff_location}</p>
              </div>
            </div>
          </div>

          {/* 2. Simulated Premium Route Map */}
          <div className="bg-[#12151E] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold tracking-wider text-white/70 uppercase">Route Progress</span>
              <span className="text-[9px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-widest">
                Simulated demo route
              </span>
            </div>

            {/* SVG Interactive Live Map */}
            <div className="w-full h-44 bg-[#080A0F] rounded-2xl relative border border-white/5 flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 380 200">
                <defs>
                  <pattern id="map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#map-grid)" />

                {/* Path Segment Line (Shadow Layer) */}
                <polyline 
                  points="50,150 130,70 230,150 330,90" 
                  fill="none" 
                  stroke="rgba(255, 255, 255, 0.05)" 
                  strokeWidth="6" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />

                {/* Traveled route (Active Green line) */}
                <polyline 
                  points="50,150 130,70 230,150 330,90" 
                  fill="none" 
                  stroke="#10B981" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  strokeDasharray="400"
                  strokeDashoffset={400 - (progress * 4)}
                />

                {/* Segments Nodes */}
                {MAP_ROUTE_NODES.map((node, i) => (
                  <g key={i} transform={`translate(${node.x},${node.y})`}>
                    <circle r="8" fill={i === 0 ? "rgba(16, 185, 129, 0.15)" : i === MAP_ROUTE_NODES.length - 1 ? "rgba(245, 158, 11, 0.15)" : "rgba(255,255,255,0.02)"} className="animate-ping" />
                    <circle r="4" fill={i === 0 ? "#10B981" : i === MAP_ROUTE_NODES.length - 1 ? "#F59E0B" : "rgba(255,255,255,0.3)"} />
                  </g>
                ))}

                {/* Vehicle marker */}
                <g transform={`translate(${carCoords.x},${carCoords.y})`}>
                  <circle r="12" fill="rgba(245, 158, 11, 0.2)" className="animate-pulse" />
                  <circle r="6" fill="#F59E0B" />
                  <circle r="2" fill="#FAF6F0" />
                </g>
              </svg>

              {/* Map overlay elements */}
              <div className="absolute bottom-3 left-4 text-[9px] font-mono text-white/55">
                Departed: <span className="text-[#10B981] font-bold">{MAP_ROUTE_NODES[0].label}</span>
              </div>
              <div className="absolute bottom-3 right-4 text-[9px] font-mono text-white/55">
                Destination: <span className="text-amber-500 font-bold">{MAP_ROUTE_NODES[MAP_ROUTE_NODES.length - 1].label}</span>
              </div>
            </div>

            {/* Progress Telemetry Dock */}
            <div className="grid grid-cols-2 divide-x divide-white/5 border border-white/5 bg-[#0A0D14] p-4 text-center font-mono rounded-2xl">
              <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] text-white/45 uppercase mb-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" /> Route Progress
                </span>
                <span className="text-base font-bold tracking-tight text-[#FAF6F0]">{progress}%</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] text-white/45 uppercase mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Est. Time Remaining
                </span>
                <span className="text-base font-bold tracking-tight text-[#FAF6F0]">
                  {progress >= 100 ? "Arrived" : `${etaMinutes} mins`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Passenger Comfort Status & Action Panel */}
        <div className="md:col-span-5 space-y-6">
          
          {/* 3. Passenger Comfort Status Grid */}
          <div className="bg-[#12151E] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-white/70 uppercase flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" /> Passenger Comfort Status
            </h3>

            <div className="grid grid-cols-1 gap-3 text-xs font-mono">
              <div className="flex justify-between items-center bg-[#0A0D14] p-3 rounded-xl border border-white/5">
                <span className="text-white/55 flex items-center gap-2">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Secured
                </span>
                <span className="text-emerald-400 font-bold">YES / HARNESSED</span>
              </div>

              <div className="flex justify-between items-center bg-[#0A0D14] p-3 rounded-xl border border-white/5">
                <span className="text-white/55 flex items-center gap-2">
                  <Thermometer className="w-3.5 h-3.5 text-blue-400" /> Cabin Temperature
                </span>
                <span className="text-white font-bold">{progress >= 100 ? "—" : `${cabinTemp}°F / VERIFIED`}</span>
              </div>

              <div className="flex justify-between items-center bg-[#0A0D14] p-3 rounded-xl border border-white/5">
                <span className="text-white/55 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-amber-400" /> Comfort Check
                </span>
                <span className="text-emerald-400 font-bold">COMPLETE</span>
              </div>

              <div className="flex justify-between items-center bg-[#0A0D14] p-3 rounded-xl border border-white/5">
                <span className="text-white/55 flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-purple-400" /> Driver Status
                </span>
                <span className="text-white font-bold uppercase">{progress >= 100 ? "Arrived" : "En Route"}</span>
              </div>

              <div className="flex justify-between items-center bg-[#0A0D14] p-3 rounded-xl border border-white/5">
                <span className="text-white/55 flex items-center gap-2">
                  <Headphones className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> Concierge Monitoring
                </span>
                <span className="text-emerald-400 font-bold uppercase tracking-wider">Active</span>
              </div>
            </div>
          </div>

          {/* 5. Owner Action Panel */}
          <div className="bg-[#12151E] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-white/70 uppercase flex items-center gap-2">
              <Headphones className="w-4 h-4 text-amber-500" /> Owner Action Panel
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              <Button 
                onClick={handleRequestDriverUpdate} 
                className="w-full bg-[#1C202F] hover:bg-[#252A3F] text-white border border-white/5 rounded-xl h-11 text-xs justify-start px-4 gap-3 transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Request Driver Update
              </Button>

              <Button 
                onClick={handleNotifyArrivalContact} 
                className="w-full bg-[#1C202F] hover:bg-[#252A3F] text-white border border-white/5 rounded-xl h-11 text-xs justify-start px-4 gap-3 transition"
              >
                <Send className="w-3.5 h-3.5 text-blue-400" /> Notify Arrival Contact
              </Button>

              <Button 
                onClick={handleViewComfortCheck} 
                className="w-full bg-[#1C202F] hover:bg-[#252A3F] text-white border border-white/5 rounded-xl h-11 text-xs justify-start px-4 gap-3 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> View Comfort Check
              </Button>

              <Button 
                onClick={handleContactConcierge} 
                className="w-full bg-[#1C202F] hover:bg-[#252A3F] text-white border border-white/5 rounded-xl h-11 text-xs justify-start px-4 gap-3 transition"
              >
                <Headphones className="w-3.5 h-3.5 text-purple-400" /> Contact Pawffeur™ Concierge
              </Button>

              <Button 
                onClick={handleConfirmDestination} 
                className="w-full bg-[#1C202F] hover:bg-[#252A3F] text-white border border-white/5 rounded-xl h-11 text-xs justify-start px-4 gap-3 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Confirm Destination Details
              </Button>
            </div>
          </div>

          {/* 4. Voyage Status Log */}
          <div className="bg-[#12151E] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-white/70 uppercase">Voyage Status Log</h3>
            
            <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
              {/* Combine simulated logs and database updates */}
              {[...simulatedLogs, ...dbUpdates.map(u => ({
                id: u.id,
                time: new Date(u.created_date),
                message: dbUpdateLabels[u.update_type] || `${u.update_type}: ${u.message || ""}`
              }))].map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs leading-normal">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-white/95 font-medium">{log.message}</p>
                    <p className="text-[10px] text-white/45 mt-0.5">
                      {new Date(log.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}

              {simulatedLogs.length === 0 && dbUpdates.length === 0 && (
                <p className="text-xs text-white/40 text-center py-4 font-mono">Logs stream initialized. Awaiting updates...</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 6. Safety / Simulation Notice */}
      <footer className="max-w-4xl mx-auto px-4 mt-8 pt-8 border-t border-white/5 text-center text-xs text-white/40 space-y-3">
        <div className="bg-[#12151E] border border-white/5 rounded-2xl p-4 flex items-center justify-center gap-3 text-left max-w-2xl mx-auto">
          <ShieldAlert className="w-5 h-5 text-amber-500/80 shrink-0" />
          <p className="leading-relaxed">
            Simulated demo experience. Live GPS, driver updates, and concierge monitoring will connect to production services when enabled.
          </p>
        </div>
        <p className="pt-2 font-medium tracking-wide">Pawffeur™ — Premium pet transportation.</p>
      </footer>
    </div>
  );
}