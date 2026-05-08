"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";

type RawMarker = Record<string, unknown>;

type MapContentProps = {
  markers?: RawMarker[];
  center?: [number, number];
  highlightedMarkerId?: string;
};

type NormalizedMarker = {
  id: string;
  name: string;
  title: string;
  city: string;
  state: string;
  zipCode: string;
  services: string[];
  latitude: number;
  longitude: number;
  profileHref: string;
  avatarUrl: string;
  initials: string;
  serviceRadiusMiles: number;
  source: "zip" | "city" | "service_coordinates" | "coordinates";
};

const MAP_HEIGHT = 420;
const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;
const SEARCH_ZOOM = 10;
const HOVER_ZOOM = 10;
const DEFAULT_SERVICE_RADIUS_MILES = 25;
const MAX_SERVICE_RADIUS_MILES = 100;
const METERS_PER_MILE = 1609.344;

const KNOWN_ZIP_COORDINATES: Record<string, [number, number]> = {
  "18901": [40.3101, -75.1299],
  "18902": [40.3368, -75.1113],
  "18938": [40.3637, -75.0607],
  "18944": [40.3101, -75.1305],
  "18951": [40.4418, -75.3416],
  "15201": [40.4734, -79.9558],
  "15213": [40.4442, -79.9559],
  "15222": [40.4475, -79.9934],
  "32099": [30.3322, -81.6557],
  "32202": [30.3285, -81.6562],
  "32207": [30.2927, -81.6415],
  "32221": [30.3041, -81.8504],
  "55726": [46.6766, -92.8802],
  "92656": [33.5677, -117.7256],
};

const CITY_COORDINATES: Record<string, [number, number]> = {
  "alisoviejo,ca": [33.5677, -117.7256],
  "alisoviejo,california": [33.5677, -117.7256],
  "bethlehem,pa": [40.6259, -75.3705],
  "bethlehem,pennsylvania": [40.6259, -75.3705],
  "cromwell,mn": [46.6766, -92.8802],
  "cromwell,minnesota": [46.6766, -92.8802],
  "doylestown,pa": [40.3101, -75.1299],
  "doylestown,pennsylvania": [40.3101, -75.1299],
  "jacksonville,fl": [30.3322, -81.6557],
  "jacksonville,florida": [30.3322, -81.6557],
  "newhope,pa": [40.3643, -74.9513],
  "newhope,pennsylvania": [40.3643, -74.9513],
  "philadelphia,pa": [39.9526, -75.1652],
  "philadelphia,pennsylvania": [39.9526, -75.1652],
  "pittsburgh,pa": [40.4406, -79.9959],
  "pittsburgh,pennsylvania": [40.4406, -79.9959],
  "quakertown,pa": [40.4418, -75.3416],
  "quakertown,pennsylvania": [40.4418, -75.3416],
};

function asString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter(Boolean)
      .slice(0, 6);
  }

  const text = asString(value);
  if (!text) return [];

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanZipCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

function normalizeLocationText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cityKey(city: string, state: string) {
  return `${normalizeLocationText(city)},${normalizeLocationText(state)}`;
}

function getId(marker: RawMarker) {
  const id =
    marker.id ??
    marker.user_id ??
    marker.userId ??
    marker.profile_id ??
    marker.profileId ??
    marker.guru_id ??
    marker.guruId ??
    marker.slug;

  return id === null || id === undefined ? "" : String(id);
}

function getName(marker: RawMarker) {
  return (
    asString(marker.display_name) ||
    asString(marker.displayName) ||
    asString(marker.full_name) ||
    asString(marker.fullName) ||
    asString(marker.name) ||
    asString(marker.title) ||
    "SitGuru Guru"
  );
}

function getTitle(marker: RawMarker) {
  return (
    asString(marker.headline) ||
    asString(marker.tagline) ||
    asString(marker.title) ||
    asString(marker.role) ||
    "Pet Care Guru"
  );
}

function getCity(marker: RawMarker) {
  return (
    asString(marker.service_city) ||
    asString(marker.serviceCity) ||
    asString(marker.city) ||
    asString(marker.location_city) ||
    asString(marker.locationCity) ||
    asString(marker.address_city) ||
    asString(marker.addressCity)
  );
}

function getState(marker: RawMarker) {
  return (
    asString(marker.service_state) ||
    asString(marker.serviceState) ||
    asString(marker.state) ||
    asString(marker.location_state) ||
    asString(marker.locationState) ||
    asString(marker.address_state) ||
    asString(marker.addressState)
  );
}

function getZipCode(marker: RawMarker) {
  const zipCode =
    asString(marker.service_zip_code) ||
    asString(marker.serviceZipCode) ||
    asString(marker.service_zip) ||
    asString(marker.serviceZip) ||
    asString(marker.service_postal_code) ||
    asString(marker.servicePostalCode) ||
    asString(marker.service_area_zip_code) ||
    asString(marker.serviceAreaZipCode) ||
    asString(marker.service_area_zip) ||
    asString(marker.serviceAreaZip) ||
    asString(marker.care_zip_code) ||
    asString(marker.careZipCode) ||
    asString(marker.care_zip) ||
    asString(marker.careZip) ||
    asString(marker.zip_code) ||
    asString(marker.zipCode) ||
    asString(marker.zip) ||
    asString(marker.zipcode) ||
    asString(marker.postal_code) ||
    asString(marker.postalCode) ||
    asString(marker.location_zip_code) ||
    asString(marker.locationZipCode) ||
    asString(marker.location_zip) ||
    asString(marker.locationZip) ||
    asString(marker.address_zip_code) ||
    asString(marker.addressZipCode) ||
    asString(marker.address_zip);

  return cleanZipCode(zipCode);
}

function getAvatarUrl(marker: RawMarker) {
  return (
    asString(marker.avatar_url) ||
    asString(marker.avatarUrl) ||
    asString(marker.profile_photo_url) ||
    asString(marker.profilePhotoUrl) ||
    asString(marker.photo_url) ||
    asString(marker.photoUrl) ||
    asString(marker.image_url) ||
    asString(marker.imageUrl)
  );
}

function getServices(marker: RawMarker) {
  const services = asStringArray(marker.services);
  if (services.length) return services;

  const serviceNames = asStringArray(marker.service_names);
  if (serviceNames.length) return serviceNames;

  return asStringArray(marker.serviceNames);
}

function getProfileHref(marker: RawMarker) {
  const directHref = asString(marker.profileHref) || asString(marker.href);
  if (directHref) return directHref;

  const slug = asString(marker.slug);
  if (slug) return `/gurus/${slug}`;

  const id = getId(marker);
  return id ? `/gurus/${id}` : "/find-care";
}

function getServiceRadiusMiles(marker: RawMarker) {
  const radius =
    asNumber(marker.service_radius_miles) ??
    asNumber(marker.serviceRadiusMiles) ??
    asNumber(marker.service_radius) ??
    asNumber(marker.serviceRadius) ??
    asNumber(marker.service_area_radius_miles) ??
    asNumber(marker.serviceAreaRadiusMiles) ??
    asNumber(marker.travel_radius_miles) ??
    asNumber(marker.travelRadiusMiles) ??
    asNumber(marker.travel_radius) ??
    asNumber(marker.travelRadius) ??
    asNumber(marker.willing_to_travel_miles) ??
    asNumber(marker.willingToTravelMiles) ??
    asNumber(marker.max_travel_distance_miles) ??
    asNumber(marker.maxTravelDistanceMiles) ??
    asNumber(marker.radius_miles) ??
    asNumber(marker.radiusMiles) ??
    asNumber(marker.radius) ??
    DEFAULT_SERVICE_RADIUS_MILES;

  return Math.min(Math.max(Math.round(radius), 1), MAX_SERVICE_RADIUS_MILES);
}

function getInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "SG";
}

function isValidMainlandCoordinate(latitude: number | null, longitude: number | null) {
  return (
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= 24.3 &&
    latitude <= 49.7 &&
    longitude >= -125.25 &&
    longitude <= -66.4 &&
    latitude !== 0 &&
    longitude !== 0
  );
}

function getServiceCoordinates(marker: RawMarker) {
  const latitude =
    asNumber(marker.service_latitude) ??
    asNumber(marker.serviceLatitude) ??
    asNumber(marker.service_area_latitude) ??
    asNumber(marker.serviceAreaLatitude) ??
    asNumber(marker.care_latitude) ??
    asNumber(marker.careLatitude) ??
    asNumber(marker.map_latitude) ??
    asNumber(marker.mapLatitude);

  const longitude =
    asNumber(marker.service_longitude) ??
    asNumber(marker.serviceLongitude) ??
    asNumber(marker.service_area_longitude) ??
    asNumber(marker.serviceAreaLongitude) ??
    asNumber(marker.care_longitude) ??
    asNumber(marker.careLongitude) ??
    asNumber(marker.map_longitude) ??
    asNumber(marker.mapLongitude);

  return { latitude, longitude };
}

function getGenericCoordinates(marker: RawMarker) {
  const latitude =
    asNumber(marker.latitude) ??
    asNumber(marker.lat) ??
    asNumber(marker.location_latitude) ??
    asNumber(marker.locationLatitude);

  const longitude =
    asNumber(marker.longitude) ??
    asNumber(marker.lng) ??
    asNumber(marker.lon) ??
    asNumber(marker.long) ??
    asNumber(marker.location_longitude) ??
    asNumber(marker.locationLongitude);

  return { latitude, longitude };
}

function normalizeMarker(marker: RawMarker): NormalizedMarker | null {
  const id = getId(marker);
  const name = getName(marker);
  const city = getCity(marker);
  const state = getState(marker);
  const zipCode = getZipCode(marker);
  const avatarUrl = getAvatarUrl(marker);
  const radius = getServiceRadiusMiles(marker);

  const zipCoordinates = zipCode ? KNOWN_ZIP_COORDINATES[zipCode] : undefined;
  const cityCoordinates =
    city && state ? CITY_COORDINATES[cityKey(city, state)] : undefined;
  const serviceCoordinates = getServiceCoordinates(marker);
  const genericCoordinates = getGenericCoordinates(marker);

  let latitude: number | null = null;
  let longitude: number | null = null;
  let source: NormalizedMarker["source"] = "coordinates";

  if (zipCoordinates) {
    [latitude, longitude] = zipCoordinates;
    source = "zip";
  } else if (cityCoordinates) {
    [latitude, longitude] = cityCoordinates;
    source = "city";
  } else if (
    isValidMainlandCoordinate(serviceCoordinates.latitude, serviceCoordinates.longitude)
  ) {
    latitude = serviceCoordinates.latitude;
    longitude = serviceCoordinates.longitude;
    source = "service_coordinates";
  } else if (
    isValidMainlandCoordinate(genericCoordinates.latitude, genericCoordinates.longitude)
  ) {
    latitude = genericCoordinates.latitude;
    longitude = genericCoordinates.longitude;
    source = "coordinates";
  }

  if (
    !id ||
    latitude === null ||
    longitude === null ||
    !isValidMainlandCoordinate(latitude, longitude)
  ) {
    return null;
  }

  return {
    id,
    name,
    title: getTitle(marker),
    city,
    state,
    zipCode,
    services: getServices(marker),
    latitude,
    longitude,
    profileHref: getProfileHref(marker),
    avatarUrl,
    initials: getInitials(name),
    serviceRadiusMiles: radius,
    source,
  };
}

function isValidCenter(center?: [number, number]) {
  return (
    Array.isArray(center) &&
    center.length === 2 &&
    isValidMainlandCoordinate(center[0], center[1])
  );
}

function createAvatarIcon(marker: NormalizedMarker, highlighted: boolean) {
  const imageMarkup = marker.avatarUrl
    ? `<img src="${escapeHtml(marker.avatarUrl)}" alt="" />`
    : `<span>${escapeHtml(marker.initials)}</span>`;

  return L.divIcon({
    className: "sitguru-leaflet-avatar-icon",
    html: `<div class="sitguru-leaflet-avatar-shell${
      highlighted ? " is-highlighted" : ""
    }">${imageMarkup}</div>`,
    iconSize: [58, 58],
    iconAnchor: [29, 29],
    popupAnchor: [0, -30],
  });
}

function createPopupHtml(marker: NormalizedMarker) {
  const location = [marker.city, marker.state].filter(Boolean).join(", ");
  const zipText = marker.zipCode ? ` ${marker.zipCode}` : "";
  const servicesHtml = marker.services
    .slice(0, 4)
    .map(
      (service) =>
        `<span class="rounded-full border border-emerald-100 bg-white px-2.5 py-1 text-[11px] font-black text-emerald-800">${escapeHtml(
          service,
        )}</span>`,
    )
    .join("");

  const avatarHtml = marker.avatarUrl
    ? `<img src="${escapeHtml(marker.avatarUrl)}" alt="${escapeHtml(
        marker.name,
      )} avatar" class="h-full w-full object-cover" />`
    : escapeHtml(marker.initials);

  return `
    <div class="p-4">
      <div class="flex items-start gap-3">
        <div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 text-sm font-black text-emerald-800">
          ${avatarHtml}
        </div>

        <div class="min-w-0">
          <p class="truncate text-base font-black tracking-tight text-slate-950">
            ${escapeHtml(marker.name)}
          </p>
          <p class="mt-0.5 text-xs font-bold text-slate-600">
            ${escapeHtml(marker.title)}
          </p>
          ${
            location || marker.zipCode
              ? `<p class="mt-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                  ${escapeHtml(location)}${escapeHtml(zipText)}
                </p>`
              : ""
          }
        </div>
      </div>

      <div class="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
        Accepts care within ${marker.serviceRadiusMiles} mi
      </div>

      ${
        servicesHtml
          ? `<div class="mt-3 flex flex-wrap gap-1.5">${servicesHtml}</div>`
          : ""
      }

      <a
        href="${escapeHtml(marker.profileHref)}"
        class="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
      >
        View Guru Profile
      </a>
    </div>
  `;
}

function getViewportSignature(markers: NormalizedMarker[], center?: [number, number]) {
  const centerSignature = isValidCenter(center)
    ? `${center?.[0].toFixed(5)},${center?.[1].toFixed(5)}`
    : "no-center";

  const markerSignature = markers
    .map(
      (marker) =>
        `${marker.id}:${marker.latitude.toFixed(5)},${marker.longitude.toFixed(
          5,
        )}:${marker.serviceRadiusMiles}`,
    )
    .sort()
    .join("|");

  return `${centerSignature}::${markerSignature}`;
}

function fitMapToMarkers({
  map,
  markers,
  center,
  animate,
}: {
  map: L.Map;
  markers: NormalizedMarker[];
  center?: [number, number];
  animate: boolean;
}) {
  const boundsPoints: [number, number][] = [];

  if (isValidCenter(center)) {
    boundsPoints.push(center as [number, number]);
  }

  markers.forEach((marker) => {
    boundsPoints.push([marker.latitude, marker.longitude]);
  });

  if (boundsPoints.length === 0) {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate });
    return;
  }

  if (boundsPoints.length === 1) {
    map.setView(boundsPoints[0], isValidCenter(center) ? SEARCH_ZOOM : DEFAULT_ZOOM, {
      animate,
    });
    return;
  }

  const bounds = L.latLngBounds(boundsPoints);

  if (bounds.isValid()) {
    map.fitBounds(bounds.pad(0.24), {
      animate,
      duration: animate ? 0.65 : undefined,
      maxZoom: isValidCenter(center) ? 11 : 8,
      padding: [44, 44],
    });
  }
}

export default function MapContent({
  markers = [],
  center,
  highlightedMarkerId,
}: MapContentProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const lastViewportSignatureRef = useRef("");
  const lastHighlightedMarkerIdRef = useRef<string | undefined>(undefined);
  const [mapError, setMapError] = useState("");

  const normalizedMarkers = useMemo(
    () => markers.map(normalizeMarker).filter(Boolean) as NormalizedMarker[],
    [markers],
  );

  const initialMapCenter: [number, number] = isValidCenter(center)
    ? (center as [number, number])
    : DEFAULT_CENTER;

  const initialMapZoom = isValidCenter(center) ? SEARCH_ZOOM : DEFAULT_ZOOM;

  const viewportSignature = useMemo(
    () => getViewportSignature(normalizedMarkers, center),
    [normalizedMarkers, center],
  );

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;

    try {
      const map = L.map(mapElementRef.current, {
        center: initialMapCenter,
        zoom: initialMapZoom,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: false,
        scrollWheelZoom: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        preferCanvas: true,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 80,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const tileLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          tileSize: 256,
          updateWhenIdle: false,
          updateWhenZooming: true,
          crossOrigin: true,
        },
      ).addTo(map);

      tileLayer.on("tileerror", () => {
        setMapError(
          "Map tiles could not load. Check browser console, ad blockers, or network access to OpenStreetMap tiles.",
        );
      });

      const layerGroup = L.layerGroup().addTo(map);

      mapRef.current = map;
      layerGroupRef.current = layerGroup;

      const invalidate = () => {
        map.invalidateSize({ animate: false });
      };

      const timers = [
        window.setTimeout(invalidate, 0),
        window.setTimeout(invalidate, 150),
        window.setTimeout(invalidate, 400),
        window.setTimeout(invalidate, 900),
      ];

      window.addEventListener("resize", invalidate);

      const observer =
        typeof ResizeObserver !== "undefined"
          ? new ResizeObserver(() => invalidate())
          : null;

      observer?.observe(mapElementRef.current);

      if (mapElementRef.current.parentElement) {
        observer?.observe(mapElementRef.current.parentElement);
      }

      return () => {
        timers.forEach((timer) => window.clearTimeout(timer));
        window.removeEventListener("resize", invalidate);
        observer?.disconnect();

        map.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
      };
    } catch (error) {
      console.error("SitGuru Leaflet map failed to initialize:", error);
      setMapError(
        error instanceof Error
          ? error.message
          : "The SitGuru map failed to initialize.",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;

    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    normalizedMarkers.forEach((marker) => {
      const highlighted = marker.id === highlightedMarkerId;
      const latLng: [number, number] = [marker.latitude, marker.longitude];

      L.circle(latLng, {
        radius: marker.serviceRadiusMiles * METERS_PER_MILE,
        color: "#059669",
        fillColor: "#10b981",
        fillOpacity: highlighted ? 0.18 : 0.08,
        opacity: highlighted ? 0.58 : 0.25,
        weight: highlighted ? 3 : 1,
      }).addTo(layerGroup);

      L.marker(latLng, {
        icon: createAvatarIcon(marker, highlighted),
        zIndexOffset: highlighted ? 1000 : 500,
      })
        .bindTooltip(`${marker.serviceRadiusMiles}-mile radius`, {
          direction: "top",
          offset: [0, -24],
          opacity: 0.96,
        })
        .bindPopup(createPopupHtml(marker), {
          minWidth: 230,
          maxWidth: 290,
        })
        .addTo(layerGroup);
    });

    if (process.env.NODE_ENV !== "production") {
      console.table(
        normalizedMarkers.map((marker) => ({
          id: marker.id,
          name: marker.name,
          city: marker.city,
          state: marker.state,
          zip: marker.zipCode,
          lat: marker.latitude,
          lng: marker.longitude,
          source: marker.source,
          radius: marker.serviceRadiusMiles,
        })),
      );
    }
  }, [highlightedMarkerId, normalizedMarkers]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;
    if (lastViewportSignatureRef.current === viewportSignature) return;

    lastViewportSignatureRef.current = viewportSignature;

    const timer = window.setTimeout(() => {
      map.invalidateSize({ animate: false });
      fitMapToMarkers({
        map,
        markers: normalizedMarkers,
        center,
        animate: true,
      });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [center, normalizedMarkers, viewportSignature]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;
    if (lastHighlightedMarkerIdRef.current === highlightedMarkerId) return;

    lastHighlightedMarkerIdRef.current = highlightedMarkerId;

    if (highlightedMarkerId) {
      const highlightedMarker = normalizedMarkers.find(
        (marker) => marker.id === highlightedMarkerId,
      );

      if (highlightedMarker) {
        map.flyTo(
          [highlightedMarker.latitude, highlightedMarker.longitude],
          Math.max(map.getZoom(), HOVER_ZOOM),
          {
            animate: true,
            duration: 0.55,
          },
        );
      }

      return;
    }

    const timer = window.setTimeout(() => {
      fitMapToMarkers({
        map,
        markers: normalizedMarkers,
        center,
        animate: true,
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [center, highlightedMarkerId, normalizedMarkers]);

  return (
    <div className="relative h-[420px] min-h-[420px] w-full overflow-hidden rounded-[2rem] border border-emerald-100 bg-sky-50 shadow-inner">
      <style jsx global>{`
        .sitguru-map-shell,
        .sitguru-map-shell .leaflet-container,
        .sitguru-map-shell .sitguru-leaflet-map {
          height: ${MAP_HEIGHT}px !important;
          min-height: ${MAP_HEIGHT}px !important;
          width: 100% !important;
          background: #dff7fb !important;
          font-family: inherit;
          overflow: hidden !important;
          position: relative !important;
          z-index: 0;
        }

        .sitguru-map-shell .leaflet-pane {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
        }

        .sitguru-map-shell .leaflet-map-pane {
          z-index: 400 !important;
        }

        .sitguru-map-shell .leaflet-tile-pane {
          z-index: 200 !important;
        }

        .sitguru-map-shell .leaflet-overlay-pane {
          z-index: 400 !important;
        }

        .sitguru-map-shell .leaflet-shadow-pane {
          z-index: 500 !important;
        }

        .sitguru-map-shell .leaflet-marker-pane {
          z-index: 650 !important;
        }

        .sitguru-map-shell .leaflet-tooltip-pane {
          z-index: 700 !important;
        }

        .sitguru-map-shell .leaflet-popup-pane {
          z-index: 750 !important;
        }

        .sitguru-map-shell .leaflet-tile-container {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
        }

        .sitguru-map-shell .leaflet-tile {
          border: 0 !important;
          height: 256px !important;
          max-height: none !important;
          max-width: none !important;
          min-height: 0 !important;
          min-width: 0 !important;
          object-fit: initial !important;
          position: absolute !important;
          width: 256px !important;
        }

        .sitguru-map-shell img.leaflet-tile {
          display: block !important;
          height: 256px !important;
          max-height: none !important;
          max-width: none !important;
          min-height: 0 !important;
          min-width: 0 !important;
          object-fit: initial !important;
          width: 256px !important;
        }

        .sitguru-map-shell .leaflet-control-container {
          position: relative !important;
          z-index: 900 !important;
        }

        .sitguru-map-shell .leaflet-top,
        .sitguru-map-shell .leaflet-bottom {
          position: absolute !important;
          z-index: 900 !important;
          pointer-events: none;
        }

        .sitguru-map-shell .leaflet-top {
          top: 0 !important;
        }

        .sitguru-map-shell .leaflet-right {
          right: 0 !important;
        }

        .sitguru-map-shell .leaflet-bottom {
          bottom: 0 !important;
        }

        .sitguru-map-shell .leaflet-left {
          left: 0 !important;
        }

        .sitguru-map-shell .leaflet-control {
          clear: both;
          pointer-events: auto;
        }

        .sitguru-map-shell .leaflet-bottom.leaflet-right .leaflet-control {
          margin-bottom: 14px;
          margin-right: 14px;
        }

        .sitguru-map-shell .leaflet-bottom.leaflet-left .leaflet-control {
          margin-bottom: 14px;
          margin-left: 14px;
        }

        .sitguru-map-shell .leaflet-top.leaflet-left .leaflet-control {
          margin-left: 14px;
          margin-top: 14px;
        }

        .sitguru-map-shell .leaflet-control-attribution {
          border-radius: 999px 0 0 0;
          font-size: 10px;
          font-weight: 800;
        }

        .sitguru-leaflet-avatar-icon {
          background: transparent;
          border: 0;
        }

        .sitguru-leaflet-avatar-shell {
          align-items: center;
          background: #ffffff;
          border: 4px solid rgba(16, 185, 129, 0.36);
          border-radius: 9999px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.24);
          display: flex;
          height: 58px;
          justify-content: center;
          overflow: hidden;
          position: relative;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
          width: 58px;
        }

        .sitguru-leaflet-avatar-shell::after {
          border: 2px solid rgba(255, 255, 255, 0.94);
          border-radius: 9999px;
          content: "";
          inset: 3px;
          pointer-events: none;
          position: absolute;
        }

        .sitguru-leaflet-avatar-shell img {
          height: 100%;
          max-height: none !important;
          max-width: none !important;
          object-fit: cover;
          width: 100%;
        }

        .sitguru-leaflet-avatar-shell span {
          color: #047857;
          font-size: 0.9rem;
          font-weight: 1000;
          letter-spacing: -0.04em;
        }

        .sitguru-leaflet-avatar-shell.is-highlighted {
          border-color: rgba(5, 150, 105, 0.95);
          box-shadow: 0 18px 42px rgba(5, 150, 105, 0.38);
          transform: scale(1.16);
        }

        .sitguru-map-shell .leaflet-popup-content-wrapper {
          border-radius: 24px;
          box-shadow: 0 22px 52px rgba(15, 23, 42, 0.24);
        }

        .sitguru-map-shell .leaflet-popup-content {
          margin: 0;
          min-width: 230px;
        }

        .sitguru-map-shell .leaflet-tooltip {
          border: 1px solid rgba(16, 185, 129, 0.28);
          border-radius: 999px;
          color: #064e3b;
          font-size: 11px;
          font-weight: 1000;
          letter-spacing: 0.1em;
          padding: 6px 10px;
          text-transform: uppercase;
        }
      `}</style>

      <div className="pointer-events-none absolute left-4 top-4 z-[950] rounded-full border border-emerald-100 bg-white/95 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700 shadow-lg shadow-slate-950/10 backdrop-blur">
        {normalizedMarkers.length} Guru map pin{normalizedMarkers.length === 1 ? "" : "s"}
      </div>

      {mapError ? (
        <div className="absolute inset-x-4 bottom-4 z-[950] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 shadow-lg">
          {mapError}
        </div>
      ) : null}

      <div className="sitguru-map-shell h-full min-h-[420px] w-full">
        <div
          ref={mapElementRef}
          className="sitguru-leaflet-map h-full min-h-[420px] w-full"
        />
      </div>
    </div>
  );
}