import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { 
  PawPrint, MapPin, CheckCircle2, Clock, Truck, Star, 
  Music, Wind, Thermometer, Volume2, Camera, Sparkles, Plus, AlertCircle, PlayCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STATUS_STEPS = [
  { key: "requested",   label: "Ride Requested",   icon: Clock },
  { key: "confirmed",   label: "Driver Assigned",  icon: Star },
  { key: "in_progress", label: "Pet Picked Up",    icon: Truck },
  { key: "completed",   label: "Pet Delivered",    icon: CheckCircle2 },
];

function getStepIndex(status) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

// Linear interpolation for map path
const ROUTE_NODES = [
  { x: 40, y: 150, label: "Wicker Park" },
  { x: 120, y: 80, label: "Bucktown" },
  { x: 220, y: 160, label: "Lincoln Park" },
  { x: 340, y: 110, label: "Daycare Hub" }
];

export default function TrackRide() {
  const params = new URLSearchParams(window.location.search);
  const tripId = params.get("id");

  const [trip, setTrip] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // --- Live Interactive State ---
  const [isDemo, setIsDemo] = useState(false);
  const [speed, setSpeed] = useState(35);
  const [temperature, setTemperature] = useState(68.5);
  const [soundscape, setSoundscape] = useState("Calming Lofi");
  const [windowLevel, setWindowLevel] = useState("Snout Crack");
  const [lavenderActive, setLavenderActive] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [treatAnimation, setTreatAnimation] = useState(false);
  const [customUpdates, setCustomUpdates] = useState([]);

  // Fetch real trip data or fall back to demo
  useEffect(() => {
    if (!tripId) { 
      // If no ID is passed, we default to demo availability after loading
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
        setUpdates(upds.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
        setLoading(false);
      } catch (err) {
        console.error("Failed to load trip", err);
        setNotFound(true);
        setLoading(false);
      }
    };
    load();

    // Real-time updates subscription
    const unsub1 = base44.entities.Trip.subscribe((event) => {
      if (event.data?.id === tripId || event.id === tripId) {
        setTrip(event.data);
      }
    });
    const unsub2 = base44.entities.TripUpdate.subscribe((event) => {
      if (event.data?.trip_id === tripId) {
        setUpdates((prev) => {
          const exists = prev.find((u) => u.id === event.data.id);
          if (exists) return prev;
          return [...prev, event.data];
        });
      }
    });

    return () => { unsub1(); unsub2(); };
  }, [tripId]);

  // Activate Demo Voyage Simulator
  const startDemo = () => {
    setIsDemo(true);
    setNotFound(false);
    setTrip({
      id: "demo-voyage",
      pet_name: "Barkley",
      pickup_location: "Wicker Park Veterinary Clinic",
      dropoff_location: "Lincoln Park Daycare Center",
      driver_name: "Chauffeur Sophia",
      status: "in_progress",
      scheduled_date: new Date().toISOString().split("T")[0],
      scheduled_time: "Now",
      notes: "Barkley is a very curious Golden Retriever. Highly responsive to window breeze and lofi soundscapes."
    });
    setUpdates([]);
    setCustomUpdates([
      {
        id: "init",
        type: "system",
        message: "Voyage Initialized. Sophia greeted Barkley with a tail-wag and secure harness check.",
        time: new Date()
      }
    ]);
    setProgress(15);
  };

  // Run Real-Time Simulator Loops (both for Demo and active Real voyages)
  useEffect(() => {
    if (!isDemo && (!trip || trip.status !== "in_progress")) return;

    // 1. Vehicle progress and telemetry simulator
    const telemetryInterval = setInterval(() => {
      // Dynamic Speed fluctuation
      setSpeed(prev => {
        const delta = (Math.random() - 0.5) * 6;
        const next = Math.max(15, Math.min(48, prev + delta));
        return Math.round(next);
      });

      // Dynamic Temperature fluctuation
      setTemperature(prev => {
        const delta = (Math.random() - 0.5) * 0.4;
        const next = Math.max(66.5, Math.min(70.5, prev + delta));
        return Math.round(next * 10) / 10;
      });

      // Map progression loop
      setProgress(prev => {
        if (prev >= 100) return 15; // Loop back for demo continuous effect
        return prev + 1;
      });
    }, 1500);

    // 2. Funny Dog Contextual Actions Streamer
    const dogActions = [
      "Barkley is sniffing the air-conditioning vents with maximum focus.",
      "Tail wagging detected: Barkley spotted a golden retriever walking on the sidewalk.",
      "Yawns comfortably. Barkley adjusted his position on the orthopedic foam bed.",
      "Nose pressed to the glass. Fascinated by a passing motorcycle.",
      "Rear ears vibrating happily to the ambient music cabin stream."
    ];

    const actionInterval = setInterval(() => {
      const randomAction = dogActions[Math.floor(Math.random() * dogActions.length)];
      appendCustomUpdate(randomAction);
    }, 18000);

    return () => {
      clearInterval(telemetryInterval);
      clearInterval(actionInterval);
    };
  }, [isDemo, trip]);

  const appendCustomUpdate = (message, type = "status") => {
    const newLog = {
      id: "custom-" + Math.random(),
      type,
      message,
      time: new Date()
    };
    setCustomUpdates(prev => [newLog, ...prev]);
  };

  // --- Interactive Control Deck Actions ---
  const handleSendTreat = () => {
    if (treatAnimation) return;
    setTreatAnimation(true);
    toast.success("🍖 Virtual Treat Sent to Chauffeur Sophia!");
    appendCustomUpdate("Owner sent a virtual premium bone biscuit! Sophia handed it to Barkley. Tail-wag velocity: Maximum.", "treat");
    
    setTimeout(() => {
      setTreatAnimation(false);
    }, 3000);
  };

  const handleWindowChange = (level) => {
    setWindowLevel(level);
    toast.success(`💨 Cabin window height set to: ${level}`);
    const descriptions = {
      "Closed": "Window rolled fully up. Pure filtered AC cabin breeze active.",
      "Snout Crack": "Window set to Snout Crack. Sniff-rate increased by 45%.",
      "Half Down": "Window rolled Half Down. Hair-blowing mode engaged!"
    };
    appendCustomUpdate(descriptions[level] || `Window adjusted to ${level}.`, "window");
  };

  const handleSoundscapeChange = (track) => {
    setSoundscape(track);
    toast.success(`🎵 Audio Soundscape updated to: ${track}`);
    appendCustomUpdate(`Ambient music set to ${track}. Barkley is visibly relaxing.`, "music");
  };

  const handleSpritzLavender = () => {
    if (lavenderActive) return;
    setLavenderActive(true);
    toast.success("🍃 Calming Lavender Spritz diffused in vehicle cabin.");
    appendCustomUpdate("Lavender aromatherapy spray active. Barkley took a deep calming breath.", "lavender");
    
    setTimeout(() => {
      setLavenderActive(false);
    }, 4000);
  };

  // Calculate current car position along vector nodes
  const getCarCoords = () => {
    const totalSegments = ROUTE_NODES.length - 1;
    const decimal = progress / 100;
    const segment = Math.min(Math.floor(decimal * totalSegments), totalSegments - 1);
    
    const segmentProgress = (decimal * totalSegments) - segment;
    const startNode = ROUTE_NODES[segment];
    const endNode = ROUTE_NODES[segment + 1];
    
    return {
      x: startNode.x + (endNode.x - startNode.x) * segmentProgress,
      y: startNode.y + (endNode.y - startNode.y) * segmentProgress
    };
  };

  const carCoords = getCarCoords();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F3] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl forest-gradient flex items-center justify-center mx-auto mb-3 animate-pulse">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
          <p className="text-[#6B5B4F] font-semibold">Contacting Pawffeur Satellite...</p>
        </div>
      </div>
    );
  }

  // Not Found View (Allows launching interactive demo)
  if (notFound && !isDemo) {
    return (
      <div className="min-h-screen bg-[#F9F7F3] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-[#EDF7F0] p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 rounded-3xl bg-[#EDF7F0] flex items-center justify-center mx-auto mb-5">
            <PawPrint className="w-8 h-8 text-[#2D6A4F]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1B4332] mb-3">Voyage Not Found</h2>
          <p className="text-[#6B5B4F] text-sm mb-6 leading-relaxed">
            No active voyage URL parameter detected. Please check the ride tracking link sent via SMS, or trigger the live simulator below to preview the premium system!
          </p>
          <Button 
            onClick={startDemo} 
            className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-2xl py-6 text-base font-semibold flex items-center justify-center gap-2 shadow-md transition"
          >
            <PlayCircle className="w-5 h-5" /> Launch Live Demo Voyage
          </Button>
        </div>
      </div>
    );
  }

  const activeTrip = trip || {};
  const currentStepIdx = getStepIndex(activeTrip.status);

  const updateLabels = {
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
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-[#0E1015]/80 backdrop-blur-xl border-b border-[#FAF6F0]/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <PawPrint className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <span className="font-bold text-[#FAF6F0] tracking-tight">Pawffeur</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Live Voyage Tracking</span>
            </div>
          </div>
        </div>

        {isDemo && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-semibold">
            Demo Simulator Active
          </div>
        )}
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 grid md:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Map & Cabin Cam HUD */}
        <div className="md:col-span-7 space-y-6">
          
          {/* 1. Live Cabin Cam Video Stream Container */}
          <div className="relative overflow-hidden bg-black border border-white/10 rounded-3xl shadow-2xl">
            {/* Blinking camera UI bar */}
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center text-xs font-mono bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white/95 uppercase tracking-wider">Live Cabin Cam [HD 1080p]</span>
              </div>
              <span className="text-white/60">AUTO STREAM ON</span>
            </div>

            {/* Bouncing Audio Spectrum bars */}
            <div className="absolute bottom-4 left-4 z-20 flex items-end gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1.5 rounded-xl border border-white/5">
              <span className="text-[10px] font-mono text-white/70 mr-1.5 uppercase">Soundscape</span>
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 rounded-full bg-amber-500"
                  style={{
                    height: '16px',
                    animation: `bounce 0.8s ease-in-out infinite`,
                    animationDelay: `${i * 0.12}s`
                  }}
                />
              ))}
            </div>

            {/* Lavender aroma spray graphic overlay */}
            {lavenderActive && (
              <div className="absolute inset-0 bg-[#A78BFA]/25 backdrop-blur-[2px] z-10 flex items-center justify-center animate-fade-in transition-all duration-500">
                <div className="text-center">
                  <Sparkles className="w-8 h-8 text-[#A78BFA] animate-bounce mx-auto mb-2" />
                  <span className="text-[#DDD6FE] text-xs font-mono font-bold tracking-widest uppercase">Aroma Diffuser Spritzing...</span>
                </div>
              </div>
            )}

            {/* Premium Dog Chauffeur Image with scale effect */}
            <div className="w-full aspect-[4/3] bg-zinc-900 flex items-center justify-center overflow-hidden relative">
              <img 
                src="/assets/dog_chauffeur_hero.png" 
                alt="Cabin Cam Feed" 
                className={`w-full h-full object-cover transition-all duration-700 ${treatAnimation ? 'scale-105 saturate-150' : 'scale-100'}`}
              />

              {/* Feed overlay static effect */}
              <div className="absolute inset-0 bg-radial-vignette opacity-35 pointer-events-none" />

              {/* Treat Animation Overlay */}
              {treatAnimation && (
                <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="text-center animate-scale-up">
                    <span className="text-5xl block animate-bounce">🍖</span>
                    <span className="text-amber-400 font-mono text-xs font-extrabold uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-full border border-amber-500/20">
                      Treat Sent! Yum!
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Telemetry Data Dock */}
            <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-white/10 bg-[#12151E] p-4 text-center font-mono">
              <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] text-white/55 uppercase mb-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-amber-500" /> Velocity
                </span>
                <span className="text-lg font-bold tracking-tight text-[#FAF6F0]">{speed} <span className="text-xs text-white/45 font-normal">MPH</span></span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] text-white/55 uppercase mb-1 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-emerald-500" /> Climate
                </span>
                <span className="text-lg font-bold tracking-tight text-[#FAF6F0]">{temperature}°F</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] text-white/55 uppercase mb-1 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-blue-500" /> Windows
                </span>
                <span className="text-xs font-bold text-blue-400 truncate max-w-full uppercase">{windowLevel}</span>
              </div>
            </div>
          </div>

          {/* 2. Vector GPS Tracking Map Panel */}
          <div className="bg-[#12151E] border border-white/5 rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
              <span className="text-xs font-mono font-bold tracking-wider text-white/70 uppercase">GPS Navigation Map</span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 font-bold uppercase">Active Path</span>
            </div>

            {/* SVG Interactive Live Map */}
            <div className="w-full h-44 bg-[#080A0F] rounded-2xl relative border border-white/5 mt-6 flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 380 200">
                {/* Dark grid background pattern */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Route connector lines (Shadow layer) */}
                <polyline 
                  points="40,150 120,80 220,160 340,110" 
                  fill="none" 
                  stroke="rgba(216, 243, 220, 0.05)" 
                  strokeWidth="6" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />

                {/* Traveled route (Active Green line) */}
                <polyline 
                  points="40,150 120,80 220,160 340,110" 
                  fill="none" 
                  stroke="#10B981" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  strokeDasharray="400"
                  strokeDashoffset={400 - (progress * 4)}
                />

                {/* Route segment nodes */}
                {ROUTE_NODES.map((node, i) => (
                  <g key={i} transform={`translate(${node.x},${node.y})`}>
                    {/* Ring glow */}
                    <circle r="8" fill={i === 0 ? "rgba(16, 185, 129, 0.2)" : i === ROUTE_NODES.length - 1 ? "rgba(245, 158, 11, 0.2)" : "rgba(255,255,255,0.05)"} className="animate-ping" />
                    {/* Inner core */}
                    <circle r="4" fill={i === 0 ? "#10B981" : i === ROUTE_NODES.length - 1 ? "#F59E0B" : "rgba(255,255,255,0.4)"} />
                  </g>
                ))}

                {/* Vehicle cursor marker */}
                <g transform={`translate(${carCoords.x},${carCoords.y})`}>
                  {/* Glowing ring */}
                  <circle r="14" fill="rgba(245, 158, 11, 0.25)" className="animate-pulse" />
                  {/* Small gold paw car icon marker */}
                  <circle r="7" fill="#F59E0B" />
                  <circle r="3" fill="#FAF6F0" />
                </g>
              </svg>

              {/* Map floating route overlay labels */}
              <div className="absolute bottom-2 left-4 text-[9px] font-mono text-white/55">
                Start: <span className="text-[#10B981] font-bold">{ROUTE_NODES[0].label}</span>
              </div>
              <div className="absolute bottom-2 right-4 text-[9px] font-mono text-white/55">
                End: <span className="text-amber-500 font-bold">{ROUTE_NODES[ROUTE_NODES.length - 1].label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Owner Control Deck & Status Logs */}
        <div className="md:col-span-5 space-y-6">
          
          {/* A. Dynamic Canine Owner Control Deck */}
          <div className="bg-[#12151E] border border-white/5 rounded-3xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-white/70 uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Concierge Cabin Control
            </h3>
            
            {/* Control Grids */}
            <div className="space-y-4">
              {/* Treat trigger */}
              <button 
                onClick={handleSendTreat}
                disabled={treatAnimation}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black rounded-2xl py-3 px-4 font-bold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
              >
                <span>🍖</span> Send Premium Biscuit
              </button>

              {/* Soundscape Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">Select Audio Soundscape</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["Calming Lofi", "Canine Classical", "Woods Symphony"].map(track => (
                    <button
                      key={track}
                      onClick={() => handleSoundscapeChange(track)}
                      className={`text-[10px] font-semibold py-2 px-1 rounded-xl transition ${
                        soundscape === track 
                          ? 'bg-amber-500 text-black shadow-md' 
                          : 'bg-[#1C202F] text-white hover:bg-white/5'
                      }`}
                    >
                      {track.replace("Canine ", "").replace(" Symphony", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Window Level Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 block">Adjust Passenger Window</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["Closed", "Snout Crack", "Half Down"].map(level => (
                    <button
                      key={level}
                      onClick={() => handleWindowChange(level)}
                      className={`text-[10px] font-semibold py-2 px-1 rounded-xl transition ${
                        windowLevel === level 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'bg-[#1C202F] text-white hover:bg-white/5'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lavender diffuser trigger */}
              <button
                onClick={handleSpritzLavender}
                disabled={lavenderActive}
                className="w-full bg-[#1C202F] hover:bg-[#252A3F] border border-white/5 text-[#A78BFA] font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition text-xs"
              >
                <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                {lavenderActive ? "Spritzing..." : "Spritz Lavender Mist"}
              </button>
            </div>
          </div>

          {/* B. Ride Status Indicator Panel */}
          <div className="bg-[#12151E] border border-white/5 rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold tracking-wider text-white/70 uppercase">Voyage Progress</h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold uppercase">
                {activeTrip.status?.replace("_", " ") || "In Progress"}
              </span>
            </div>

            <div className="space-y-4">
              {STATUS_STEPS.map((step, idx) => {
                const done = idx < currentStepIdx;
                const active = idx === currentStepIdx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                      done 
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" 
                        : active 
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-500" 
                          : "bg-white/5 border-white/5 text-white/20"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${
                        active ? "text-amber-500" : done ? "text-white/80" : "text-white/25"
                      }`}>{step.label}</p>
                    </div>
                    {active && (
                      <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                    )}
                    {done && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Passenger details */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-white/55">Passenger</span>
              <span className="font-semibold text-white">{activeTrip.pet_name || "Pet"}</span>
            </div>
            {activeTrip.driver_name && (
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-white/55">Chauffeur</span>
                <span className="font-semibold text-white">{activeTrip.driver_name}</span>
              </div>
            )}
          </div>

          {/* C. Real-Time Voyage Status Logs */}
          <div className="bg-[#12151E] border border-white/5 rounded-3xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-white/70 uppercase">Voyage Logs</h3>
            
            <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
              {/* Combine local simulated updates and standard db updates */}
              {[...customUpdates, ...updates.map(u => ({
                id: u.id,
                type: "db",
                message: updateLabels[u.update_type] || u.update_type + (u.message ? `: ${u.message}` : ""),
                time: new Date(u.created_date)
              }))].map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs leading-normal">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    log.type === "treat" 
                      ? "bg-amber-500" 
                      : log.type === "music" 
                        ? "bg-purple-500" 
                        : log.type === "window" 
                          ? "bg-blue-500" 
                          : "bg-emerald-500"
                  }`} />
                  <div className="flex-1">
                    <p className="text-white/90 font-medium">{log.message}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {new Date(log.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}

              {customUpdates.length === 0 && updates.length === 0 && (
                <p className="text-xs text-white/40 text-center py-4 font-mono">Logs stream initialized. Awaiting updates...</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Styled inline keyframe for Equalizer bouncing */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce {
          0%, 100% { height: 4px; }
          50% { height: 20px; }
        }
        .bg-radial-vignette {
          background: radial-gradient(circle, transparent 40%, rgba(0,0,0,0.85) 100%);
        }
      `}} />
    </div>
  );
}