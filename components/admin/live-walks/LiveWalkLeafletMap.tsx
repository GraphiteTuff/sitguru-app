// components/admin/live-walks/LiveWalkLeafletMap.tsx
"use client";

/**
 * Leaflet Focus Detail map — polyline, animated Guru marker, potty/break pins.
 */

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import type {
  AdminMapCoordinate,
  AdminMapEventPin,
} from "@/hooks/useAdminWalkMapData";

type LiveWalkLeafletMapProps = {
  path: AdminMapCoordinate[];
  events: AdminMapEventPin[];
  lastPoint: AdminMapCoordinate | null;
  isCompleted?: boolean;
  className?: string;
};

const DEFAULT_CENTER: [number, number] = [30.2672, -97.7431];

function guruIconHtml(isCompleted: boolean) {
  return `
    <div class="sg-guru-marker ${isCompleted ? "is-done" : ""}">
      <span class="sg-guru-pulse"></span>
      <span class="sg-guru-core">${isCompleted ? "✓" : "🐕"}</span>
    </div>
  `;
}

function eventIconHtml(kind: AdminMapEventPin["kind"], label: string) {
  const glyph =
    kind === "potty"
      ? "💩"
      : kind === "break"
        ? "🌲"
        : kind === "start"
          ? "▶️"
          : kind === "end"
            ? "✅"
            : "📌";
  return `
    <div class="sg-event-pin" title="${label.replace(/"/g, "&quot;")}">
      <span>${glyph}</span>
    </div>
  `;
}

export default function LiveWalkLeafletMap({
  path,
  events,
  lastPoint,
  isCompleted = false,
  className = "",
}: LiveWalkLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const guruMarkerRef = useRef<L.Marker | null>(null);
  const eventLayerRef = useRef<L.LayerGroup | null>(null);

  const latLngs = useMemo(
    () => path.map((point) => [point.lat, point.lng] as [number, number]),
    [path],
  );

  // Boot map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(DEFAULT_CENTER, 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    eventLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Inject marker styles once
    if (!document.getElementById("sg-live-walk-map-styles")) {
      const style = document.createElement("style");
      style.id = "sg-live-walk-map-styles";
      style.textContent = `
        .sg-guru-marker {
          position: relative;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
        }
        .sg-guru-pulse {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: rgba(4, 120, 87, 0.35);
          animation: sgGuruPulse 1.6s ease-out infinite;
        }
        .sg-guru-marker.is-done .sg-guru-pulse { animation: none; background: rgba(14, 165, 233, 0.25); }
        .sg-guru-core {
          position: relative;
          z-index: 1;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: #047857;
          color: white;
          font-size: 14px;
          border: 2px solid white;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.25);
        }
        .sg-guru-marker.is-done .sg-guru-core { background: #0284c7; }
        .sg-event-pin {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          background: white;
          border: 2px solid #047857;
          display: grid;
          place-items: center;
          font-size: 14px;
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.2);
        }
        @keyframes sgGuruPulse {
          0% { transform: scale(0.75); opacity: 0.9; }
          100% { transform: scale(1.7); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      map.remove();
      mapRef.current = null;
      polylineRef.current = null;
      guruMarkerRef.current = null;
      eventLayerRef.current = null;
    };
  }, []);

  // Sync polyline + markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (latLngs.length >= 2) {
      polylineRef.current = L.polyline(latLngs, {
        color: isCompleted ? "#0284c7" : "#047857",
        weight: 5,
        opacity: 0.92,
        lineJoin: "round",
        lineCap: "round",
      }).addTo(map);
      map.fitBounds(polylineRef.current.getBounds(), {
        padding: [36, 36],
        maxZoom: 17,
      });
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], 16);
    }

    if (eventLayerRef.current) {
      eventLayerRef.current.clearLayers();
      for (const event of events) {
        const icon = L.divIcon({
          className: "",
          html: eventIconHtml(event.kind, event.label),
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
        L.marker([event.lat, event.lng], { icon })
          .bindTooltip(event.label, { direction: "top", offset: [0, -12] })
          .addTo(eventLayerRef.current);
      }
    }

    const tip = lastPoint || (path.length ? path[path.length - 1] : null);
    if (tip) {
      const icon = L.divIcon({
        className: "",
        html: guruIconHtml(isCompleted),
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      if (guruMarkerRef.current) {
        guruMarkerRef.current.setLatLng([tip.lat, tip.lng]);
        guruMarkerRef.current.setIcon(icon);
      } else {
        guruMarkerRef.current = L.marker([tip.lat, tip.lng], {
          icon,
          zIndexOffset: 800,
        }).addTo(map);
      }
    }
  }, [latLngs, events, lastPoint, path, isCompleted]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-emerald-100 bg-slate-100 ${className}`}
    >
      <div ref={containerRef} className="h-[360px] w-full lg:h-full lg:min-h-[420px]" />
      {path.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/55">
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm">
            Waiting for GPS polyline points…
          </p>
        </div>
      ) : null}
    </div>
  );
}
