import { calculateDistanceMiles } from "@/lib/distance/calculateDistanceMiles";

type LocationPoint = {
  latitude: number | null;
  longitude: number | null;
};

type GuruServiceArea = {
  service_latitude: number | null;
  service_longitude: number | null;
  service_radius_miles: number | null;
  service_area_enabled?: boolean | null;
};

export type GuruServiceRadiusResult = {
  eligible: boolean;
  distance_miles: number | null;
  service_radius_miles: number | null;
  reason: string;
};

export function checkGuruServiceRadius(
  customerSitLocation: LocationPoint,
  guru: GuruServiceArea
): GuruServiceRadiusResult {
  if (guru.service_area_enabled === false) {
    return {
      eligible: true,
      distance_miles: null,
      service_radius_miles: guru.service_radius_miles,
      reason: "Service area filtering is disabled for this Guru.",
    };
  }

  if (
    customerSitLocation.latitude == null ||
    customerSitLocation.longitude == null ||
    guru.service_latitude == null ||
    guru.service_longitude == null ||
    guru.service_radius_miles == null
  ) {
    return {
      eligible: false,
      distance_miles: null,
      service_radius_miles: guru.service_radius_miles,
      reason: "Missing customer location, Guru location, or Guru radius.",
    };
  }

  const distanceMiles = calculateDistanceMiles(
    customerSitLocation.latitude,
    customerSitLocation.longitude,
    guru.service_latitude,
    guru.service_longitude
  );

  const eligible = distanceMiles <= guru.service_radius_miles;

  return {
    eligible,
    distance_miles: distanceMiles,
    service_radius_miles: guru.service_radius_miles,
    reason: eligible
      ? "Customer sit location is within the Guru service radius."
      : "Customer sit location is outside the Guru service radius.",
  };
}