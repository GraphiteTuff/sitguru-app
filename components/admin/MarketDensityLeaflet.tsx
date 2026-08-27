"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import type { MarketDensityMarket } from "@/lib/admin/market-density";

const SCORE_COLORS: Record<MarketDensityMarket["score"], string> = {
  launch_ready: "#059669",
  needs_pet_parents: "#d97706",
  needs_gurus: "#ea580c",
  no_density: "#e11d48",
};

const DEFAULT_CENTER: [number, number] = [40.4418, -75.3416];

export default function MarketDensityLeaflet({
  markets,
}: {
  markets: MarketDensityMarket[];
}) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [mapError, setMapError] = useState("");

  const mapped = useMemo(
    () =>
      markets.filter(
        (market) => market.latitude != null && market.longitude != null,
      ),
    [markets],
  );

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;

    try {
      const map = L.map(mapElementRef.current, {
        center: DEFAULT_CENTER,
        zoom: 8,
        minZoom: 4,
        maxZoom: 14,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      const invalidate = () => map.invalidateSize({ animate: false });
      const timers = [
        window.setTimeout(invalidate, 0),
        window.setTimeout(invalidate, 250),
      ];

      return () => {
        timers.forEach((timer) => window.clearTimeout(timer));
        map.remove();
        mapRef.current = null;
      };
    } catch (error) {
      console.error("Market density map failed:", error);
      setMapError("Map could not load.");
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layer = L.layerGroup().addTo(map);

    for (const market of mapped) {
      const color = SCORE_COLORS[market.score];
      const radius = Math.min(
        22,
        8 + market.bookableCount * 2 + market.petParentCount * 0.4,
      );

      const marker = L.circleMarker(
        [market.latitude as number, market.longitude as number],
        {
          radius,
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.72,
        },
      );

      marker.bindPopup(
        `<strong>${market.label}</strong><br/>${market.scoreLabel}<br/>${market.bookableCount} bookable · ${market.petParentCount} Pet Parents · ${market.bookingCount} bookings`,
      );
      marker.addTo(layer);
    }

    if (mapped.length > 0) {
      const bounds = L.latLngBounds(
        mapped.map((market) => [
          market.latitude as number,
          market.longitude as number,
        ]),
      );
      map.fitBounds(bounds.pad(0.28), { maxZoom: 10 });
    }

    return () => {
      map.removeLayer(layer);
    };
  }, [mapped]);

  if (mapError) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-[1.75rem] border border-rose-100 bg-rose-50 text-sm font-black text-rose-700">
        {mapError}
      </div>
    );
  }

  return (
    <div
      ref={mapElementRef}
      className="h-[360px] w-full overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-slate-100"
    />
  );
}
