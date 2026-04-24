"use client";

import dynamic from "next/dynamic";

type MapMarker = Record<string, unknown>;

type ProviderMapProps = {
  markers?: MapMarker[];
  center?: [number, number];
  highlightedMarkerId?: string;
};

const MapWithNoSSR = dynamic(() => import("./MapContent"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-500">
      Loading SitGuru map...
    </div>
  ),
});

function hasUsableLocation(marker: MapMarker) {
  const latitude =
    marker.latitude ??
    marker.lat ??
    marker.service_latitude ??
    marker.service_area_latitude;

  const longitude =
    marker.longitude ??
    marker.lng ??
    marker.lon ??
    marker.service_longitude ??
    marker.service_area_longitude;

  const city = typeof marker.city === "string" ? marker.city.trim() : "";
  const state = typeof marker.state === "string" ? marker.state.trim() : "";
  const serviceCity =
    typeof marker.service_city === "string" ? marker.service_city.trim() : "";
  const serviceState =
    typeof marker.service_state === "string" ? marker.service_state.trim() : "";

  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);

  const hasCoordinates =
    Number.isFinite(numericLatitude) &&
    Number.isFinite(numericLongitude) &&
    numericLatitude >= -90 &&
    numericLatitude <= 90 &&
    numericLongitude >= -180 &&
    numericLongitude <= 180 &&
    numericLatitude !== 0 &&
    numericLongitude !== 0;

  const hasCityState = Boolean((city && state) || (serviceCity && serviceState));

  return hasCoordinates || hasCityState;
}

export default function ProviderMap({
  markers = [],
  center,
  highlightedMarkerId,
}: ProviderMapProps) {
  const safeMarkers = Array.isArray(markers) ? markers : [];
  const usableMarkers = safeMarkers.filter(hasUsableLocation);
  const missingLocationCount = safeMarkers.length - usableMarkers.length;

  return (
    <div className="space-y-3">
      <MapWithNoSSR
        markers={safeMarkers}
        center={center}
        highlightedMarkerId={highlightedMarkerId ?? undefined}
      />

      <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black text-slate-900">
            {usableMarkers.length.toLocaleString()} Guru map pin
            {usableMarkers.length === 1 ? "" : "s"} available
          </p>
          <p className="mt-1 leading-6">
            Map pins use Guru profile coordinates when available, with city/state
            fallback locations when exact coordinates are missing.
          </p>
        </div>

        {missingLocationCount > 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800">
            {missingLocationCount.toLocaleString()} missing location
            {missingLocationCount === 1 ? "" : "s"}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800">
            Locations ready
          </div>
        )}
      </div>
    </div>
  );
}