"use client";

import dynamic from "next/dynamic";

const MapWithNoSSR = dynamic(() => import("./MapContent"), { ssr: false });

export default function ProviderMap({
  markers,
  center,
  highlightedMarkerId,
}: {
  markers: any[];
  center?: [number, number];
  highlightedMarkerId?: string;
}) {
  return (
    <MapWithNoSSR 
      markers={markers} 
      center={center} 
      highlightedMarkerId={highlightedMarkerId} 
    />
  );
}