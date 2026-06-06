import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Phone, AlertTriangle, CheckCircle2, Truck, Thermometer, Shield, MessageSquare, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const VETS = [
  { name: "MedVet Chicago", address: "3305 N. California Ave", hours: "24/7 Emergency", phone: "+17732817110" },
  { name: "VEG Lincoln Park", address: "755 W. North Ave", hours: "24/7 Emergency", phone: "+13127575444" },
  { name: "VEG South Loop", address: "1114 S. Clinton St", hours: "24/7 Emergency", phone: "+18727105226" },
];

const BREAKDOWN_STEPS = [
  { icon: Truck,         color: "bg-red-500",    title: "Secure the Vehicle",       body: "Pull as far off the road as possible. Put the Jeep in Park, engage the Emergency Brake, and turn on your Hazard Lights." },
  { icon: Shield,        color: "bg-amber-500",  title: "Verify Pet Safety",        body: "Do NOT open crates or doors in traffic. Check that all pets are secure. Ensure climate control is still functioning — if the engine is off, use a battery-powered fan or open windows slightly for cross-ventilation (weather permitting)." },
  { icon: AlertTriangle, color: "bg-orange-500", title: "Deploy Safety Gear",       body: "Place emergency triangles or flares 100 feet behind the Jeep to alert Chicago traffic." },
  { icon: MessageSquare, color: "bg-[#2D6A4F]",  title: "Initiate One-Tap Alerts",  body: "Use the SMS Delay Alert button above to notify owners immediately. Call Roadside Assistance and request a priority tow for a vehicle carrying live animals." },
  { icon: Thermometer,   color: "bg-blue-600",   title: "Monitor Temperature",      body: "Keep the Govee Temp Monitor open. If cabin temp exceeds 80°F or drops below 60°F, call the nearest 24/7 Emergency Vet (listed above) and request a 'Safety Transfer' if the tow is delayed." },
];

function VetCard({ vet }) {
  return (
    <div className="bg-white rounded-2xl border border-red-100 p-4 flex items-start gap-4 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
        <Phone className="w-5 h-5 text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#1B4332] text-sm">{vet.name}</p>
        <p className="text-xs text-[#6B5B4F] mt-0.5">{vet.address}</p>
        <span className="inline-block mt-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium">{vet.hours}</span>
      </div>
      <a href={`tel:${vet.phone}`}>
        <Button className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-10 px-4 text-sm font-bold">
          Call
        </Button>
      </a>
    </div>
  );
}

export default function EmergencyProtocols() {
  const [user, setUser] = useState(null);
  const [sendingTrip, setSendingTrip] = useState(null);
  const [sentTrips, setSentTrips] = useState(new Set());

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: activeTrips = [] } = useQuery({
    queryKey: ["emergency-active-trips", user?.email],
    queryFn: () => base44.entities.Trip.filter({
      driver_email: user.email,
      status: "in_progress",
    }),
    enabled: !!user,
  });

  async function sendDelayAlert(trip) {
    if (!trip.owner_phone) {
      toast.error("No phone number on file for this owner.");
      return;
    }
    setSendingTrip(trip.id);
    try {
      await base44.functions.invoke("sendSMS", {
        phone: trip.owner_phone,
        pet_name: trip.pet_name || "your pet",
        event_type: "custom",
        custom_message: `Urgent: There has been a minor delay in transport. Your pet is safe and secure. I will provide a full update in 5 minutes. — Pawffeur`,
      });
      setSentTrips(prev => new Set([...prev, trip.id]));
      toast.success("Delay alert sent to owner!");
    } catch (e) {
      toast.error("SMS failed: " + e.message);
    }
    setSendingTrip(null);
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-16">

      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-extrabold">Emergency Protocols</h1>
        </div>
        <p className="text-red-100 text-sm leading-relaxed">
          Stay calm. Follow the steps below. Your pet's safety is the priority.
        </p>
      </div>

      {/* Client Notification */}
      <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-5 h-5 text-amber-500" />
          <h2 className="font-bold text-[#1B4332] text-base">Client Delay Alert</h2>
        </div>
        <p className="text-xs text-[#6B5B4F] mb-4">
          Sends this SMS to the owner: <em>"Urgent: There has been a minor delay in transport. Your pet is safe and secure. I will provide a full update in 5 minutes."</em>
        </p>

        {activeTrips.length === 0 ? (
          <div className="bg-[#F9F7F3] rounded-xl p-4 text-center text-sm text-[#6B5B4F]/60">
            No active trips right now. SMS buttons appear when a trip is in progress.
          </div>
        ) : (
          <div className="space-y-2">
            {activeTrips.map(trip => (
              <div key={trip.id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <div>
                  <p className="font-semibold text-sm text-[#1B4332]">{trip.pet_name || "Pet"}</p>
                  <p className="text-xs text-[#6B5B4F]">{trip.owner_phone || "No phone on file"}</p>
                </div>
                <Button
                  onClick={() => sendDelayAlert(trip)}
                  disabled={!!sendingTrip || sentTrips.has(trip.id)}
                  className={`rounded-xl h-9 px-4 text-sm font-bold ${sentTrips.has(trip.id) ? "bg-green-500 hover:bg-green-500" : "bg-amber-500 hover:bg-amber-600"} text-white`}
                >
                  {sendingTrip === trip.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : sentTrips.has(trip.id) ? (
                    <><Check className="w-4 h-4 mr-1" /> Sent</>
                  ) : (
                    "📱 Alert Owner"
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Roadside Assistance */}
      <div className="bg-white rounded-2xl border border-[#EDF7F0] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-[#2D6A4F]" />
          <h2 className="font-bold text-[#1B4332] text-base">Roadside Assistance</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: "AAA Roadside (24/7)", number: "+18002228252", note: "Standard AAA dispatch" },
            { label: "Allstate Motor Club (24/7)", number: "+18004002212", note: "If insured with Allstate" },
            { label: "State Farm Roadside (24/7)", number: "+18776274327", note: "If insured with State Farm" },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between bg-[#F9F7F3] rounded-xl px-4 py-3">
              <div>
                <p className="font-semibold text-sm text-[#1B4332]">{r.label}</p>
                <p className="text-xs text-[#6B5B4F]">{r.note}</p>
              </div>
              <a href={`tel:${r.number}`}>
                <Button className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl h-9 px-4 text-sm font-bold">
                  Call
                </Button>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Vets */}
      <div className="bg-white rounded-2xl border border-[#EDF7F0] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-5 h-5 text-red-500" />
          <h2 className="font-bold text-[#1B4332] text-base">24/7 Emergency Vets — Chicago Area</h2>
        </div>
        <div className="space-y-3">
          {VETS.map(vet => <VetCard key={vet.name} vet={vet} />)}
        </div>
      </div>

      {/* Breakdown Checklist */}
      <div className="bg-white rounded-2xl border border-[#EDF7F0] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-[#1B4332]" />
          <h2 className="font-bold text-[#1B4332] text-base">Jeep Breakdown Checklist</h2>
        </div>
        <div className="space-y-4">
          {BREAKDOWN_STEPS.map((step, i) => (
            <div key={step.title} className="flex items-start gap-4">
              <div className={`w-9 h-9 rounded-xl ${step.color} flex items-center justify-center flex-shrink-0 text-white font-bold text-sm`}>
                {i + 1}
              </div>
              <div>
                <p className="font-bold text-[#1B4332] text-sm">{step.title}</p>
                <p className="text-xs text-[#6B5B4F] mt-0.5 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 bg-[#EDF7F0] rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#40916C] flex-shrink-0" />
          <p className="text-xs text-[#2D6A4F] font-medium">Complete all 5 steps before resuming transport.</p>
        </div>
      </div>

    </div>
  );
}