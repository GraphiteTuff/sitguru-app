// components/parent/walk/ParentWalkMobileMap.tsx
"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import type { WalkGeoPoint, WalkMapMarker } from "@/lib/pawreport/walk-events";

type ParentWalkMobileMapProps = {
  path: WalkGeoPoint[];
  markers: WalkMapMarker[];
  isCompleted?: boolean;
  className?: string;
};

const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795];

function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("sg-parent-walk-map-styles")) return;
  const style = document.createElement("style");
  style.id = "sg-parent-walk-map-styles";
  style.textContent = `
    .sg-parent-guru {
      position: relative; width: 36px; height: 36px;
      display: grid; place-items: center;
    }
    .sg-parent-guru-pulse {
      position: absolute; inset: 0; border-radius: 999px;
      background: rgba(4,120,87,.4);
      animation: sgParentPulse 1.5s ease-out infinite;
    }
    .sg-parent-guru.is-done .sg-parent-guru-pulse { animation: none; opacity: .35; }
    .sg-parent-guru-core {
      position: relative; z-index: 1; width: 30px; height: 30px;
      border-radius: 999px; display: grid; place-items: center;
      background: #047857; color: #fff; font-size: 15px;
      border: 2px solid #fff; box-shadow: 0 10px 22px rgba(15,23,42,.28);
    }
    .sg-parent-guru.is-done .sg-parent-guru-core { background: #0284c7; }
    .sg-parent-event {
      width: 32px; height: 32px; border-radius: 999px;
      background: #fff; border: 2px solid #047857;
      display: grid; place-items: center; font-size: 15px;
      box-shadow: 0 8px 16px rgba(15,23,42,.18);
    }
    @keyframes sgParentPulse {
      0% { transform: scale(.7); opacity: .95; }
      100% { transform: scale(1.75); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

function eventGlyph(kind: WalkMapMarker["kind"]) {
  if (kind === "potty_pee" || kind === "potty_poop") return "💩";
  if (kind === "break" || kind === "break_end") return "⏸";
  if (kind === "start") return "▶️";
  if (kind === "end") return "🏡";
  return "📌";
}

export default function ParentWalkMobileMap({
  path,
  markers,
  isCompleted = false,
  className = "",
}: ParentWalkMobileMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const guruRef = useRef<L.Marker | null>(null);
  const eventsRef = useRef<L.LayerGroup | null>(null);

  const latLngs = useMemo(
    () => path.map((p) => [p.lat, p.lng] as [number, number]),
    [path],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    ensureStyles();

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(DEFAULT_CENTER, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    eventsRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    // Mobile browser chrome settle
    window.setTimeout(onResize, 250);

    return () => {
      window.removeEventListener("resize", onResize);
      map.remove();
      mapRef.current = null;
      polylineRef.current = null;
      guruRef.current = null;
      eventsRef.current = null;
    };
  }, []);

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
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
      map.fitBounds(polylineRef.current.getBounds(), {
        padding: [42, 42],
        maxZoom: 17,
        animate: true,
      });
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], 16, { animate: true });
    }

    if (eventsRef.current) {
      eventsRef.current.clearLayers();
      for (const marker of markers) {
        const icon = L.divIcon({
          className: "",
          html: `<div class="sg-parent-event" title="${marker.label}">${eventGlyph(marker.kind)}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        L.marker([marker.lat, marker.lng], { icon })
          .bindTooltip(marker.label, { direction: "top", offset: [0, -14] })
          .addTo(eventsRef.current);
      }
    }

    const tip = path.length ? path[path.length - 1] : null;
    if (tip) {
      const icon = L.divIcon({
        className: "",
        html: `<div class="sg-parent-guru ${isCompleted ? "is-done" : ""}"><span class="sg-parent-guru-pulse"></span><span class="sg-parent-guru-core">${isCompleted ? "✓" : "🐕"}</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      if (guruRef.current) {
        guruRef.current.setLatLng([tip.lat, tip.lng]);
        guruRef.current.setIcon(icon);
      } else {
        guruRef.current = L.marker([tip.lat, tip.lng], {
          icon,
          zIndexOffset: 900,
        }).addTo(map);
      }
      if (latLngs.length < 2) {
        map.panTo([tip.lat, tip.lng], { animate: true });
      }
    }
  }, [latLngs, markers, path, isCompleted]);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-emerald-100 bg-slate-100 shadow-sm ${className}`}
    >
      <div
        ref={containerRef}
        className="h-[min(52dvh,420px)] min-h-[280px] w-full"
      />
      {path.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/50 px-6 text-center">
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm">
            Waiting for Guru GPS… the route will draw here live.
          </p>
        </div>
      ) : null}
    </div>
  );
}
