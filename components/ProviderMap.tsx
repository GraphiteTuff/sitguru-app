"use client";

import dynamic from "next/dynamic";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Dynamic import to avoid SSR issues with Leaflet (window/document)
const MapWithNoSSR = dynamic(
  () => import("./MapContent"), // We'll create this below
  { ssr: false }
);

export default function ProviderMap({
  markers,
  center,
  highlightedMarkerId,
}: {
  markers: any[];
  center?: [number, number];
  highlightedMarkerId?: string;
}) {
  return <MapWithNoSSR markers={markers} center={center} highlightedMarkerId={highlightedMarkerId} />;
}