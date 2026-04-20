"use client";

import dynamic from "next/dynamic";

const MapWithNoSSR = dynamic(() => import("./MapContent"), { ssr: false });

type ProviderMapProps = {
  markers: any[];
  center?: [number, number];
  highlightedMarkerId?: string;
};

export default function ProviderMap({
  markers,
  center,
  highlightedMarkerId,
}: ProviderMapProps) {
  return (
    <MapWithNoSSR
      markers={markers}
      center={center}
      highlightedMarkerId={highlightedMarkerId ?? undefined}
    />
  );
}