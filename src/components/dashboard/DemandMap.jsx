import React, { useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, X, Phone, Mail, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Chicago center
const CHICAGO = [41.8781, -87.6298];

// Approximate geographic spread per zone
const ZONE_CONFIG = {
  "Local (within Chicago)":       { spread: 0.10, center: [41.8781, -87.6298] },
  "Suburban (10–25 miles)":        { spread: 0.22, center: [41.8781, -87.6298] },
  "Extended area (25–50 miles)":   { spread: 0.45, center: [41.8781, -87.6298] },
  "Long distance (50+ miles)":     { spread: 0.80, center: [41.8781, -87.6298] },
};

const URGENCY_CONFIG = {
  "Today":            { color: "#dc2626", ring: "#fee2e2", label: "Today",          order: 0 },
  "Within 3 days":    { color: "#ea580c", ring: "#ffedd5", label: "Within 3 days",  order: 1 },
  "Within a week":    { color: "#ca8a04", ring: "#fef9c3", label: "Within a week",  order: 2 },
  "Just researching": { color: "#2D6A4F", ring: "#d1fae5", label: "Just browsing",  order: 3 },
};

const DEFAULT_URGENCY = { color: "#6B5B4F", ring: "#f5f5f4", label: "Unknown" };

// Seeded pseudo-random from string → consistent jitter per lead
function seededRandom(str, salt = 0) {
  let h = salt;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return ((h >>> 0) / 4294967295);
}

function getCoords(lead) {
  const zoneKey = Object.keys(ZONE_CONFIG).find(k =>
    lead.estimate_zone && lead.estimate_zone.includes(k.split(" ")[0])
  ) || "Local (within Chicago)";

  const cfg = ZONE_CONFIG[zoneKey] || ZONE_CONFIG["Local (within Chicago)"];
  const id = lead.id || lead.email || Math.random().toString();

  const jitterLat = (seededRandom(id, 1) - 0.5) * 2 * cfg.spread;
  const jitterLng = (seededRandom(id, 2) - 0.5) * 2 * cfg.spread * 1.3;

  return [cfg.center[0] + jitterLat, cfg.center[1] + jitterLng];
}

// Cluster: group leads within ~0.04 deg of each other
function clusterLeads(leads) {
  const clusters = [];
  const assigned = new Set();

  leads.forEach((lead, i) => {
    if (assigned.has(i)) return;
    const pos = getCoords(lead);
    const cluster = { pos, leads: [lead] };
    assigned.add(i);

    leads.forEach((other, j) => {
      if (assigned.has(j)) return;
      const opos = getCoords(other);
      const dist = Math.sqrt((pos[0] - opos[0]) ** 2 + (pos[1] - opos[1]) ** 2);
      if (dist < 0.025) {
        cluster.leads.push(other);
        assigned.add(j);
        // Center of cluster
        cluster.pos = [
          cluster.leads.reduce((s, l) => s + getCoords(l)[0], 0) / cluster.leads.length,
          cluster.leads.reduce((s, l) => s + getCoords(l)[1], 0) / cluster.leads.length,
        ];
      }
    });

    clusters.push(cluster);
  });

  return clusters;
}

function LeadPopupCard({ lead }) {
  const urg = URGENCY_CONFIG[lead.urgency] || DEFAULT_URGENCY;
  return (
    <div className="w-56 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[#1B4332] text-sm">{lead.name || "Anonymous Lead"}</p>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: urg.ring, color: urg.color }}>
          {urg.label}
        </span>
      </div>
      {lead.estimate_service && (
        <div className="flex items-center gap-1.5 text-[#6B5B4F]">
          <Zap className="w-3 h-3" />{lead.estimate_service}
        </div>
      )}
      {lead.estimate_zone && (
        <div className="flex items-center gap-1.5 text-[#6B5B4F]">
          <MapPin className="w-3 h-3" />{lead.estimate_zone}
        </div>
      )}
      {(lead.estimate_low && lead.estimate_high) && (
        <p className="font-semibold text-[#1B4332]">
          Est: ${lead.estimate_low} – ${lead.estimate_high}
        </p>
      )}
      {lead.phone && (
        <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-[#2D6A4F] font-medium hover:underline">
          <Phone className="w-3 h-3" />{lead.phone}
        </a>
      )}
      {lead.email && (
        <div className="flex items-center gap-1.5 text-[#6B5B4F] break-all">
          <Mail className="w-3 h-3" />{lead.email}
        </div>
      )}
      <div className="text-[#6B5B4F]/60 pt-1 border-t border-gray-100">
        {new Date(lead.created_date).toLocaleDateString()}
      </div>
    </div>
  );
}

function ClusterMarker({ cluster }) {
  const count = cluster.leads.length;
  const [pos] = useState(cluster.pos);

  // Dominant urgency in cluster
  const urgencies = cluster.leads.map(l => URGENCY_CONFIG[l.urgency] || DEFAULT_URGENCY);
  const dominant = urgencies.sort((a, b) => a.order - b.order)[0];

  const radius = count === 1 ? 9 : Math.min(9 + count * 2.5, 24);

  return (
    <CircleMarker
      center={pos}
      radius={radius}
      pathOptions={{
        fillColor: dominant.color,
        fillOpacity: 0.85,
        color: "#fff",
        weight: 2,
      }}
    >
      <Popup maxWidth={240} className="leaflet-popup-custom">
        {count === 1 ? (
          <LeadPopupCard lead={cluster.leads[0]} />
        ) : (
          <div className="w-60 space-y-3">
            <p className="font-bold text-[#1B4332]">{count} leads in this area</p>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {cluster.leads.map(lead => (
                <div key={lead.id} className="border border-[#EDF7F0] rounded-lg p-2">
                  <LeadPopupCard lead={lead} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Popup>
    </CircleMarker>
  );
}

export default function DemandMap({ leads = [] }) {
  const clusters = useMemo(() => clusterLeads(leads), [leads]);

  const urgencyCounts = useMemo(() => {
    const counts = {};
    leads.forEach(l => {
      const k = l.urgency || "Unknown";
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }, [leads]);

  return (
    <div className="bg-white rounded-2xl border border-[#EDF7F0] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#EDF7F0] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#2D6A4F]" />
          <h2 className="font-bold text-[#1B4332] text-base">Service Demand Map</h2>
          <span className="bg-[#EDF7F0] text-[#1B4332] text-xs font-semibold px-2 py-0.5 rounded-full">{leads.length} signals</span>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(URGENCY_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: cfg.color }} />
              <span className="text-xs text-[#6B5B4F]">{cfg.label}</span>
              {urgencyCounts[key] > 0 && (
                <span className="text-xs font-bold" style={{ color: cfg.color }}>({urgencyCounts[key]})</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-[#6B5B4F]/50">
          No leads yet — estimator signals will appear here
        </div>
      ) : (
        <MapContainer
          center={CHICAGO}
          zoom={11}
          style={{ height: "420px", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {clusters.map((cluster, i) => (
            <ClusterMarker key={i} cluster={cluster} />
          ))}
        </MapContainer>
      )}

      <div className="px-5 py-3 border-t border-[#EDF7F0] bg-[#F9F7F3]">
        <p className="text-xs text-[#6B5B4F]/60">
          Marker size = cluster size · Color = highest urgency in cluster · Click any marker to see lead details · Positions are approximate based on service zone.
        </p>
      </div>
    </div>
  );
}