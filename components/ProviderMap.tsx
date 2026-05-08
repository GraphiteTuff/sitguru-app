"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

type MapMarker = Record<string, unknown>;

type ProviderMapProps = {
  markers?: MapMarker[];
  center?: [number, number];
  highlightedMarkerId?: string;
};

type NormalizedMapMarker = MapMarker & {
  __sitguruMapLatitude: number;
  __sitguruMapLongitude: number;
  __sitguruMapRadiusMiles: number;
};

const DEFAULT_SERVICE_RADIUS_MILES = 25;
const MAX_SERVICE_RADIUS_MILES = 100;

const MapWithNoSSR = dynamic(() => import("./MapContent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] min-h-[420px] w-full items-center justify-center rounded-[2rem] border border-emerald-100 bg-slate-100 text-sm font-black text-slate-500">
      Loading SitGuru map...
    </div>
  ),
});

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

function getString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function getNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
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

function isInsideMainlandUs(latitude: number, longitude: number) {
  return (
    latitude >= 24.3 &&
    latitude <= 49.7 &&
    longitude >= -125.25 &&
    longitude <= -66.4 &&
    latitude !== 0 &&
    longitude !== 0
  );
}

function isValidCenter(center?: [number, number]) {
  return (
    Array.isArray(center) &&
    center.length === 2 &&
    Number.isFinite(center[0]) &&
    Number.isFinite(center[1]) &&
    isInsideMainlandUs(center[0], center[1])
  );
}

function getMarkerId(marker: MapMarker) {
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

function getMarkerCity(marker: MapMarker) {
  return (
    getString(marker.service_city) ||
    getString(marker.serviceCity) ||
    getString(marker.city) ||
    getString(marker.location_city) ||
    getString(marker.locationCity) ||
    getString(marker.address_city) ||
    getString(marker.addressCity)
  );
}

function getMarkerState(marker: MapMarker) {
  return (
    getString(marker.service_state) ||
    getString(marker.serviceState) ||
    getString(marker.state) ||
    getString(marker.location_state) ||
    getString(marker.locationState) ||
    getString(marker.address_state) ||
    getString(marker.addressState)
  );
}

function getMarkerZipCode(marker: MapMarker) {
  const zipCode =
    getString(marker.service_zip_code) ||
    getString(marker.serviceZipCode) ||
    getString(marker.service_zip) ||
    getString(marker.serviceZip) ||
    getString(marker.service_postal_code) ||
    getString(marker.servicePostalCode) ||
    getString(marker.service_area_zip_code) ||
    getString(marker.serviceAreaZipCode) ||
    getString(marker.service_area_zip) ||
    getString(marker.serviceAreaZip) ||
    getString(marker.care_zip_code) ||
    getString(marker.careZipCode) ||
    getString(marker.care_zip) ||
    getString(marker.careZip) ||
    getString(marker.zip_code) ||
    getString(marker.zipCode) ||
    getString(marker.zip) ||
    getString(marker.zipcode) ||
    getString(marker.postal_code) ||
    getString(marker.postalCode) ||
    getString(marker.location_zip_code) ||
    getString(marker.locationZipCode) ||
    getString(marker.location_zip) ||
    getString(marker.locationZip) ||
    getString(marker.address_zip_code) ||
    getString(marker.addressZipCode) ||
    getString(marker.address_zip);

  return cleanZipCode(zipCode);
}

function getMarkerLatitude(marker: MapMarker) {
  return getNumber(
    marker.service_latitude ??
      marker.serviceLatitude ??
      marker.service_area_latitude ??
      marker.serviceAreaLatitude ??
      marker.care_latitude ??
      marker.careLatitude ??
      marker.map_latitude ??
      marker.mapLatitude ??
      marker.latitude ??
      marker.lat ??
      marker.location_latitude ??
      marker.locationLatitude,
  );
}

function getMarkerLongitude(marker: MapMarker) {
  return getNumber(
    marker.service_longitude ??
      marker.serviceLongitude ??
      marker.service_area_longitude ??
      marker.serviceAreaLongitude ??
      marker.care_longitude ??
      marker.careLongitude ??
      marker.map_longitude ??
      marker.mapLongitude ??
      marker.longitude ??
      marker.lng ??
      marker.lon ??
      marker.long ??
      marker.location_longitude ??
      marker.locationLongitude,
  );
}

function getMarkerRadiusMiles(marker: MapMarker) {
  const radius =
    getNumber(marker.service_radius_miles) ??
    getNumber(marker.serviceRadiusMiles) ??
    getNumber(marker.service_radius) ??
    getNumber(marker.serviceRadius) ??
    getNumber(marker.radius_miles) ??
    getNumber(marker.radiusMiles) ??
    getNumber(marker.service_area_radius_miles) ??
    getNumber(marker.serviceAreaRadiusMiles) ??
    getNumber(marker.travel_radius_miles) ??
    getNumber(marker.travelRadiusMiles) ??
    getNumber(marker.radius) ??
    DEFAULT_SERVICE_RADIUS_MILES;

  return Math.min(Math.max(Math.round(radius), 1), MAX_SERVICE_RADIUS_MILES);
}

function getPreferredMarkerCoordinates(marker: MapMarker): [number, number] | null {
  const zipCode = getMarkerZipCode(marker);
  const zipCoordinates = zipCode ? KNOWN_ZIP_COORDINATES[zipCode] : undefined;

  if (zipCoordinates) return zipCoordinates;

  const city = getMarkerCity(marker);
  const state = getMarkerState(marker);
  const cityCoordinates =
    city && state ? CITY_COORDINATES[cityKey(city, state)] : undefined;

  if (cityCoordinates) return cityCoordinates;

  const latitude = getMarkerLatitude(marker);
  const longitude = getMarkerLongitude(marker);

  if (
    latitude !== null &&
    longitude !== null &&
    isInsideMainlandUs(latitude, longitude)
  ) {
    return [latitude, longitude];
  }

  return null;
}

function getSearchParamValue(searchParams: URLSearchParams, key: string) {
  return (searchParams.get(key) || "").trim();
}

function hasActiveSearchLocation(searchParams: URLSearchParams) {
  const zipCode =
    getSearchParamValue(searchParams, "zipCode") ||
    getSearchParamValue(searchParams, "zip") ||
    getSearchParamValue(searchParams, "zipcode") ||
    getSearchParamValue(searchParams, "postalCode") ||
    getSearchParamValue(searchParams, "postal_code");

  const city = getSearchParamValue(searchParams, "city");
  const state = getSearchParamValue(searchParams, "state");

  return Boolean(zipCode || city || state);
}

function hasActiveSearchFilters(searchParams: URLSearchParams) {
  const service = getSearchParamValue(searchParams, "service");
  const query =
    getSearchParamValue(searchParams, "q") ||
    getSearchParamValue(searchParams, "query") ||
    getSearchParamValue(searchParams, "search");

  return Boolean(service || query || hasActiveSearchLocation(searchParams));
}

function normalizeMarkerForMap(marker: MapMarker): NormalizedMapMarker | null {
  const coordinates = getPreferredMarkerCoordinates(marker);
  if (!coordinates) return null;

  const radiusMiles = getMarkerRadiusMiles(marker);

  return {
    ...marker,
    __sitguruMapLatitude: coordinates[0],
    __sitguruMapLongitude: coordinates[1],
    __sitguruMapRadiusMiles: radiusMiles,
    latitude: coordinates[0],
    longitude: coordinates[1],
    service_latitude: coordinates[0],
    service_longitude: coordinates[1],
    service_radius_miles: radiusMiles,
  };
}

export default function ProviderMap({
  markers = [],
  center,
  highlightedMarkerId,
}: ProviderMapProps) {
  const searchParams = useSearchParams();

  const usableMarkers = useMemo(() => {
    const seen = new Set<string>();

    return markers
      .map((marker) => normalizeMarkerForMap(marker))
      .filter(Boolean)
      .filter((marker) => {
        const id = getMarkerId(marker as NormalizedMapMarker);
        if (!id || seen.has(id)) return false;

        seen.add(id);
        return true;
      }) as NormalizedMapMarker[];
  }, [markers]);

  const safeHighlightedMarkerId = useMemo(() => {
    if (!highlightedMarkerId) return undefined;

    return usableMarkers.some((marker) => getMarkerId(marker) === highlightedMarkerId)
      ? highlightedMarkerId
      : undefined;
  }, [highlightedMarkerId, usableMarkers]);

  const hasSearchFilters = hasActiveSearchFilters(searchParams);
  const hasSearchLocation = hasActiveSearchLocation(searchParams);
  const centerReady = isValidCenter(center);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <MapWithNoSSR
        markers={usableMarkers}
        center={centerReady ? center : undefined}
        highlightedMarkerId={safeHighlightedMarkerId}
      />

      <div className="border-t border-slate-100 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">
              {usableMarkers.length} Guru map pin
              {usableMarkers.length === 1 ? "" : "s"} available
            </p>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Map pins mirror the Guru cards shown on the page and use ZIP/city
              service locations before verified coordinates.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-800">
            {hasSearchLocation
              ? centerReady
                ? "Search area ready"
                : "Search filters active"
              : hasSearchFilters
                ? "Filters active"
                : "Locations ready"}
          </div>
        </div>
      </div>
    </div>
  );
}