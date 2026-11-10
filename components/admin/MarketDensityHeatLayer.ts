import L from "leaflet";
import type { MarketDensityMarket } from "@/lib/admin/market-density";

export type DensityMeasure = "bookableCount" | "petParentCount" | "bookingCount";

/** Geographic intensity uses aggregated counts, redrawn for pan/zoom/resize. */
export class MarketDensityHeatLayer extends L.Layer {
  private canvas?: HTMLCanvasElement;
  private map?: L.Map;

  constructor(private markets: MarketDensityMarket[], private measure: DensityMeasure) { super(); }

  onAdd(map: L.Map): this {
    this.map = map;
    this.canvas = L.DomUtil.create("canvas", "leaflet-layer");
    this.canvas.style.pointerEvents = "none";
    this.canvas.setAttribute("aria-hidden", "true");
    map.getPanes().overlayPane.appendChild(this.canvas);
    map.on("moveend zoomend resize", this.draw, this);
    this.draw();
    return this;
  }

  onRemove(map: L.Map): this {
    map.off("moveend zoomend resize", this.draw, this);
    this.canvas?.remove();
    this.canvas = undefined;
    this.map = undefined;
    return this;
  }

  private draw() {
    const map = this.map;
    const canvas = this.canvas;
    if (!map || !canvas) return;
    const size = map.getSize();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size.x * scale;
    canvas.height = size.y * scale;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
    L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(scale, scale);
    const maximum = Math.max(1, ...this.markets.map((market) => market[this.measure]));
    for (const market of this.markets) {
      if (market.latitude == null || market.longitude == null || market[this.measure] <= 0) continue;
      const point = map.latLngToContainerPoint([market.latitude, market.longitude]);
      const weight = Math.sqrt(market[this.measure] / maximum);
      const radius = 20 + weight * 46;
      const gradient = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
      gradient.addColorStop(0, `rgba(234,88,12,${0.3 + weight * 0.5})`);
      gradient.addColorStop(0.35, `rgba(245,158,11,${0.2 + weight * 0.35})`);
      gradient.addColorStop(0.7, "rgba(16,185,129,0.2)");
      gradient.addColorStop(1, "rgba(16,185,129,0)");
      context.fillStyle = gradient;
      context.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
    }
  }
}
