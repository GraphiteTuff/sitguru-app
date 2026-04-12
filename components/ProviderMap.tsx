"use client";

import { useEffect, useMemo, useRef } from "react";
import { GoogleMap, InfoWindow, LoadScript, Marker } from "@react-google-maps/api";

type MapMarker = {
  id: string | number;
  lat: number;
  lng: number;
  title?: string;
  subtitle?: string;
};

const containerStyle = {
  width: "100%",
  height: "560px",
  borderRadius: "24px",
};

const defaultCenter = {
  lat: 40.6084,
  lng: -75.4902,
};

function makeDogPinSvg(highlighted: boolean) {
  const bg = highlighted ? "#10b981" : "#ffffff";
  const border = highlighted ? "#10b981" : "#cbd5e1";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="78" viewBox="0 0 64 78">
      <defs>
        <filter id="shadow" x="0" y="0" width="64" height="78" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.22"/>
        </filter>
      </defs>

      <g filter="url(#shadow)">
        <path
          d="M32 76C32 76 54 48.5 54 30C54 17.85 44.15 8 32 8C19.85 8 10 17.85 10 30C10 48.5 32 76 32 76Z"
          fill="${bg}"
          stroke="${border}"
          stroke-width="3"
        />
        <circle cx="32" cy="30" r="16" fill="${bg}" />
        <text x="32" y="37" text-anchor="middle" font-size="18">🐶</text>
      </g>
    </svg>
  `;
}

function markerIcon(highlighted: boolean) {
  const svg = makeDogPinSvg(highlighted);
  const encoded = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

  return {
    url: encoded,
    scaledSize: {
      width: highlighted ? 58 : 46,
      height: highlighted ? 70 : 56,
    },
    anchor: {
      x: highlighted ? 29 : 23,
      y: highlighted ? 70 : 56,
    },
  };
}

export default function GuruMap({
  markers,
  center = defaultCenter,
  zoom = 9,
  highlightedMarkerId,
}: {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  highlightedMarkerId?: string | number | null;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<google.maps.Map | null>(null);

  const highlightedMarker = useMemo(
    () => markers.find((marker) => marker.id === highlightedMarkerId) || null,
    [markers, highlightedMarkerId],
  );

  useEffect(() => {
    if (!mapRef.current || !highlightedMarker) return;

    mapRef.current.panTo({
      lat: highlightedMarker.lat,
      lng: highlightedMarker.lng,
    });
  }, [highlightedMarker]);

  if (!apiKey) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={["places"]}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        {markers.map((marker) => {
          const isHighlighted = highlightedMarkerId === marker.id;

          return (
            <Marker
              key={`${marker.id}-${isHighlighted ? "active" : "idle"}`}
              position={{ lat: marker.lat, lng: marker.lng }}
              title={marker.title}
              optimized={false}
              icon={markerIcon(isHighlighted)}
              zIndex={isHighlighted ? 999 : 1}
            />
          );
        })}

        {highlightedMarker ? (
          <InfoWindow
            position={{ lat: highlightedMarker.lat, lng: highlightedMarker.lng }}
            options={{
              pixelOffset:
                typeof window !== "undefined" && window.google
                  ? new window.google.maps.Size(0, -48)
                  : undefined,
            }}
          >
            <div className="min-w-[160px]">
              <p className="text-sm font-bold text-slate-900">
                {highlightedMarker.title || "Guru"}
              </p>
              {highlightedMarker.subtitle ? (
                <p className="mt-1 text-xs text-slate-600">{highlightedMarker.subtitle}</p>
              ) : null}
            </div>
          </InfoWindow>
        ) : null}
      </GoogleMap>
    </LoadScript>
  );
}