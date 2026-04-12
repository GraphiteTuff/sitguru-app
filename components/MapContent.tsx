"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet marker icons (Next.js + Leaflet common issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function MapContent({
  markers,
  center = [39.9526, -75.1652], // Default to Philadelphia
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
      style={{ height: "100%", width: "100%", minHeight: "400px" }}
      className="rounded-3xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          // Use default icon or create a simple custom one
          icon={
            highlightedMarkerId === marker.id
              ? new L.Icon({
                  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                })
              : undefined // Let Leaflet use default
          }
        >
          <Popup>
            <strong>{marker.full_name || "Guru"}</strong>
            <br />
            {marker.title}
            <br />
            {marker.city}, {marker.state}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}