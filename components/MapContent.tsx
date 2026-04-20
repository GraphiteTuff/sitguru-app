"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icons (very common issue in Next.js)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function MapContent({
  markers = [],
  center = [39.9526, -75.1652], // Default: Philadelphia
  highlightedMarkerId,
}: {
  markers: any[];
  center?: [number, number];
  highlightedMarkerId?: string;
}) {
  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: "100%", width: "100%", minHeight: "420px", borderRadius: "24px" }}
      className="rounded-3xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {markers.map((marker: any) => (
        <Marker
          key={marker.id}
          position={[marker.latitude || 0, marker.longitude || 0]}
        >
          <Popup>
            <strong>{marker.full_name || marker.title || "Guru"}</strong>
            <br />
            {marker.city}, {marker.state}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}