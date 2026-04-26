import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, Clock, MapPin, Wifi, WifiOff } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Fix leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const driverIcon = new L.DivIcon({
  html: `<div style="background:#1B4332;border:3px solid white;border-radius:50%;width:20px;height:20px;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
    <div style="width:8px;height:8px;background:white;border-radius:50%;"></div>
  </div>`,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const destIcon = new L.DivIcon({
  html: `<div style="background:#DC2626;border:3px solid white;border-radius:50% 50% 50% 0;width:22px;height:22px;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [50, 50] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 14);
    }
  }, [positions.map(p => p.join(",")).join("|")]);
  return null;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodeAddress(address) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
    { headers: { "Accept-Language": "en" } }
  );
  const data = await res.json();
  if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  return null;
}

export default function LiveTrackingMap({ trip, isDriver }) {
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(trip.driver_location_updated_at || null);
  const [driverPos, setDriverPos] = useState(
    trip.driver_lat && trip.driver_lng ? [trip.driver_lat, trip.driver_lng] : null
  );
  const watchRef = useRef(null);

  // Subscribe to trip changes for real-time driver location updates (owner view)
  useEffect(() => {
    if (isDriver) return;
    const unsub = base44.entities.Trip.subscribe((event) => {
      if (event.id === trip.id && event.data?.driver_lat) {
        setDriverPos([event.data.driver_lat, event.data.driver_lng]);
        setLastUpdated(event.data.driver_location_updated_at);
      }
    });
    return unsub;
  }, [trip.id, isDriver]);

  // Geocode pickup and destination
  useEffect(() => {
    if (trip.pickup_location) {
      geocodeAddress(trip.pickup_location).then(setPickupCoords);
    }
    if (trip.dropoff_location) {
      geocodeAddress(trip.dropoff_location).then(setDestCoords);
    }
  }, [trip.pickup_location, trip.dropoff_location]);

  const startSharing = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by this browser.");
      return;
    }
    setSharing(true);
    setLocationError(null);
    const push = (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setDriverPos([lat, lng]);
      setLastUpdated(new Date().toISOString());
      base44.entities.Trip.update(trip.id, {
        driver_lat: lat,
        driver_lng: lng,
        driver_location_updated_at: new Date().toISOString(),
      });
    };
    watchRef.current = navigator.geolocation.watchPosition(push, (err) => {
      setLocationError(err.message);
      setSharing(false);
    }, { enableHighAccuracy: true, maximumAge: 5000 });
  };

  const stopSharing = () => {
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setSharing(false);
  };

  useEffect(() => () => stopSharing(), []);

  const isLive = ["confirmed", "in_progress"].includes(trip.status);
  const mapCenter = driverPos || (pickupCoords ? [pickupCoords.lat, pickupCoords.lng] : destCoords ? [destCoords.lat, destCoords.lng] : [41.8781, -87.6298]);
  const fitPositions = [
    driverPos,
    pickupCoords ? [pickupCoords.lat, pickupCoords.lng] : null,
    destCoords ? [destCoords.lat, destCoords.lng] : null,
  ].filter(Boolean);

  // ETA calculation
  let etaText = null;
  if (driverPos && destCoords) {
    const km = haversineKm(driverPos[0], driverPos[1], destCoords.lat, destCoords.lng);
    const avgSpeedKmh = 50;
    const mins = Math.round((km / avgSpeedKmh) * 60);
    etaText = mins < 2 ? "Arriving now" : `~${mins} min away`;
  }

  const staleMs = lastUpdated ? Date.now() - new Date(lastUpdated).getTime() : null;
  const isStale = staleMs && staleMs > 60000;

  return (
    <div className="bg-white rounded-3xl border border-[#EDF7F0] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF7F0]">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-[#2D6A4F]" />
          <h3 className="font-bold text-[#1B4332]">{isLive ? "Live Tracking" : "Planned Route"}</h3>
          {lastUpdated && (
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${isStale ? "bg-amber-50 text-amber-700" : "bg-[#D8F3DC] text-[#1B4332]"}`}>
              {isStale ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
              {isStale ? "Location may be outdated" : "Live"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {etaText && (
            <div className="flex items-center gap-1.5 bg-[#EDF7F0] rounded-xl px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span className="text-sm font-semibold text-[#1B4332]">{etaText}</span>
            </div>
          )}
          {isDriver && isLive && (
            sharing ? (
              <button
                onClick={stopSharing}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl px-4 py-1.5 text-sm font-medium transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Stop Sharing
              </button>
            ) : (
              <button
                onClick={startSharing}
                className="flex items-center gap-2 forest-gradient text-white rounded-xl px-4 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Navigation className="w-3.5 h-3.5" />
                Share Location
              </button>
            )
          )}
        </div>
      </div>

      {locationError && (
        <div className="px-6 py-2 bg-red-50 text-red-700 text-xs">{locationError}</div>
      )}

      {/* Map */}
      <div style={{ height: 340 }}>
        <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          />
          <FitBounds positions={fitPositions} />
          {driverPos && (
            <Marker position={driverPos} icon={driverIcon}>
              <Popup>
                <strong>{trip.driver_name || "Driver"}</strong><br />
                {lastUpdated && <span className="text-xs text-gray-500">Updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
              </Popup>
            </Marker>
          )}
          {destCoords && (
            <Marker position={[destCoords.lat, destCoords.lng]} icon={destIcon}>
              <Popup>
                <strong>Destination</strong><br />{trip.dropoff_location}
              </Popup>
            </Marker>
          )}
          {/* Planned route: pickup → dropoff */}
          {pickupCoords && destCoords && !driverPos && (
            <Polyline
              positions={[[pickupCoords.lat, pickupCoords.lng], [destCoords.lat, destCoords.lng]]}
              color="#2D6A4F"
              weight={3}
              dashArray="8 6"
              opacity={0.7}
            />
          )}
          {/* Live route: driver → dropoff */}
          {driverPos && destCoords && (
            <Polyline
              positions={[driverPos, [destCoords.lat, destCoords.lng]]}
              color="#1B4332"
              weight={2}
              dashArray="6 8"
              opacity={0.6}
            />
          )}
          {/* Pickup marker (when no live driver) */}
          {pickupCoords && !driverPos && (
            <Marker position={[pickupCoords.lat, pickupCoords.lng]}>
              <Popup><strong>Pickup</strong><br />{trip.pickup_location}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 flex items-center gap-4 text-xs text-[#6B5B4F]/60 border-t border-[#EDF7F0] bg-[#F9F7F3]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#1B4332]" />
          Driver
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          Destination
        </div>
        {isLive && !driverPos && !isDriver && (
          <span className="ml-auto text-amber-600">Waiting for driver to share location…</span>
        )}
        {isLive && !driverPos && isDriver && !sharing && (
          <span className="ml-auto text-[#6B5B4F]/50">Tap "Share Location" to let the owner track you</span>
        )}
        {!isLive && (
          <span className="ml-auto text-[#6B5B4F]/50 italic">Planned route — live tracking starts when the ride begins</span>
        )}
      </div>
    </div>
  );
}