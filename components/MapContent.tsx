"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type RawMarker = Record<string, unknown>;

type NormalizedMarker = {
  id: string;
  name: string;
  title: string;
  city: string;
  state: string;
  services: string[];
  latitude: number;
  longitude: number;
  profileHref: string;
  source: "exact" | "city_fallback";
};

type MapContentProps = {
  markers?: RawMarker[];
  center?: [number, number];
  highlightedMarkerId?: string;
};

const DEFAULT_CENTER: [number, number] = [39.9526, -75.1652];

const CITY_COORDINATES: Record<string, [number, number]> = {
  "philadelphia,pa": [39.9526, -75.1652],
  "philadelphia,pennsylvania": [39.9526, -75.1652],
  "pittsburgh,pa": [40.4406, -79.9959],
  "pittsburgh,pennsylvania": [40.4406, -79.9959],
  "quakertown,pa": [40.4418, -75.3416],
  "quakertown,pennsylvania": [40.4418, -75.3416],
  "cromwell,mn": [46.6766, -92.8802],
  "cromwell,minnesota": [46.6766, -92.8802],
};

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function asString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter(Boolean)
      .slice(0, 5);
  }

  const text = asString(value);

  if (!text) return [];

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function cityKey(city: string, state: string) {
  return `${city},${state}`.toLowerCase().replace(/\s+/g, "");
}

function getFallbackCoordinates(city: string, state: string) {
  return CITY_COORDINATES[cityKey(city, state)] || null;
}

function getMarkerId(marker: RawMarker, index: number) {
  return (
    asString(marker.id) ||
    asString(marker.user_id) ||
    asString(marker.profile_id) ||
    asString(marker.slug) ||
    `guru-${index}`
  );
}

function normalizeMarker(
  marker: RawMarker,
  index: number
): NormalizedMarker | null {
  const id = getMarkerId(marker, index);

  const name =
    asString(marker.display_name) ||
    asString(marker.full_name) ||
    asString(marker.name) ||
    asString(marker.business_name) ||
    "SitGuru Provider";

  const title =
    asString(marker.title) ||
    asString(marker.headline) ||
    asString(marker.role) ||
    "Pet Care Guru";

  const city = asString(marker.city) || asString(marker.service_city);
  const state = asString(marker.state) || asString(marker.service_state);

  const latitude =
    asNumber(marker.latitude) ||
    asNumber(marker.lat) ||
    asNumber(marker.service_latitude) ||
    asNumber(marker.service_area_latitude);

  const longitude =
    asNumber(marker.longitude) ||
    asNumber(marker.lng) ||
    asNumber(marker.lon) ||
    asNumber(marker.service_longitude) ||
    asNumber(marker.service_area_longitude);

  const hasExactCoordinates =
    latitude !== 0 &&
    longitude !== 0 &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  const slug = asString(marker.slug);

  const profileHref = slug ? `/guru/${slug}` : `/guru/${id}`;

  if (hasExactCoordinates) {
    return {
      id,
      name,
      title,
      city,
      state,
      services: asStringArray(marker.services),
      latitude,
      longitude,
      profileHref,
      source: "exact",
    };
  }

  const fallback = getFallbackCoordinates(city, state);

  if (!fallback) return null;

  return {
    id,
    name,
    title,
    city,
    state,
    services: asStringArray(marker.services),
    latitude: fallback[0],
    longitude: fallback[1],
    profileHref,
    source: "city_fallback",
  };
}

function offsetDuplicateMarkers(markers: NormalizedMarker[]) {
  const seen = new Map<string, number>();

  return markers.map((marker) => {
    const key = `${marker.latitude.toFixed(4)},${marker.longitude.toFixed(4)}`;
    const count = seen.get(key) || 0;

    seen.set(key, count + 1);

    if (count === 0) return marker;

    const offset = count * 0.0025;

    return {
      ...marker,
      latitude: marker.latitude + offset,
      longitude: marker.longitude + offset,
    };
  });
}

function createSitGuruMarkerIcon(isHighlighted: boolean) {
  const color = isHighlighted ? "#f43f5e" : "#059669";
  const borderColor = isHighlighted ? "#fff1f2" : "#ecfdf5";
  const size = isHighlighted ? 42 : 34;
  const innerSize = isHighlighted ? 18 : 14;

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:9999px 9999px 9999px 0;
        background:${color};
        border:4px solid ${borderColor};
        box-shadow:0 12px 28px rgba(15, 23, 42, 0.28);
        transform:rotate(-45deg);
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <div style="
          width:${innerSize}px;
          height:${innerSize}px;
          border-radius:9999px;
          background:white;
          transform:rotate(45deg);
          box-shadow:inset 0 0 0 3px rgba(15, 23, 42, 0.08);
        "></div>
      </div>
    `,
  });
}

function FitMapToMarkers({
  markers,
  fallbackCenter,
  highlightedMarkerId,
}: {
  markers: NormalizedMarker[];
  fallbackCenter: [number, number];
  highlightedMarkerId?: string;
}) {
  const map = useMap();

  const markerSignature = useMemo(
    () =>
      markers
        .map((marker) => `${marker.id}:${marker.latitude}:${marker.longitude}`)
        .join("|"),
    [markers]
  );

  const fallbackLatitude = fallbackCenter[0];
  const fallbackLongitude = fallbackCenter[1];
  const activeHighlightedMarkerId = highlightedMarkerId || "";

  useEffect(() => {
    const highlightedMarker = activeHighlightedMarkerId
      ? markers.find((marker) => marker.id === activeHighlightedMarkerId)
      : null;

    if (highlightedMarker) {
      map.flyTo([highlightedMarker.latitude, highlightedMarker.longitude], 9, {
        duration: 0.45,
      });
      return;
    }

    if (!markers.length) {
      map.setView([fallbackLatitude, fallbackLongitude], 11);
      return;
    }

    if (markers.length === 1) {
      map.setView([markers[0].latitude, markers[0].longitude], 11);
      return;
    }

    const bounds = L.latLngBounds(
      markers.map((marker) => [marker.latitude, marker.longitude])
    );

    map.fitBounds(bounds, {
      padding: [36, 36],
      maxZoom: 11,
    });
  }, [
    activeHighlightedMarkerId,
    fallbackLatitude,
    fallbackLongitude,
    map,
    markerSignature,
    markers,
  ]);

  return null;
}

export default function MapContent({
  markers = [],
  center = DEFAULT_CENTER,
  highlightedMarkerId,
}: MapContentProps) {
  const normalizedMarkers = useMemo(() => {
    const cleanMarkers = markers
      .map((marker, index) => normalizeMarker(marker, index))
      .filter((marker): marker is NormalizedMarker => Boolean(marker));

    return offsetDuplicateMarkers(cleanMarkers);
  }, [markers]);

  const mapCenter =
    normalizedMarkers.length > 0
      ? ([normalizedMarkers[0].latitude, normalizedMarkers[0].longitude] as [
          number,
          number,
        ])
      : center;

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
      <MapContainer
        center={mapCenter}
        zoom={11}
        scrollWheelZoom={false}
        style={{
          height: "100%",
          width: "100%",
          minHeight: "420px",
          borderRadius: "24px",
        }}
        className="rounded-3xl"
      >
        <FitMapToMarkers
          markers={normalizedMarkers}
          fallbackCenter={center}
          highlightedMarkerId={highlightedMarkerId}
        />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {normalizedMarkers.map((marker) => {
          const isHighlighted = marker.id === (highlightedMarkerId || "");

          return (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              icon={createSitGuruMarkerIcon(isHighlighted)}
              zIndexOffset={isHighlighted ? 1000 : 0}
            >
              <Popup>
                <div style={{ minWidth: 190 }}>
                  <strong>{marker.name}</strong>
                  <br />
                  <span>{marker.title}</span>
                  <br />
                  <span>
                    {marker.city || "Location"}
                    {marker.state ? `, ${marker.state}` : ""}
                  </span>

                  {marker.services.length ? (
                    <>
                      <br />
                      <span>{marker.services.join(", ")}</span>
                    </>
                  ) : null}

                  {marker.source === "city_fallback" ? (
                    <>
                      <br />
                      <small>Approximate city location</small>
                    </>
                  ) : null}

                  <br />
                  <a href={marker.profileHref}>View Guru profile</a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-emerald-200 bg-white/95 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-700 shadow-lg">
        {normalizedMarkers.length} Guru map pin
        {normalizedMarkers.length === 1 ? "" : "s"}
      </div>

      {highlightedMarkerId ? (
        <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-rose-200 bg-white/95 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-rose-700 shadow-lg">
          Highlighting Guru
        </div>
      ) : null}

      {!normalizedMarkers.length ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl border border-amber-300/40 bg-white/95 p-4 text-sm font-semibold text-slate-700 shadow-lg">
          No map pins yet. Add latitude/longitude to Guru profiles, or use a
          city/state supported by the current fallback map list.
        </div>
      ) : null}
    </div>
  );
}