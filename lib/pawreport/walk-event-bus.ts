// lib/pawreport/walk-event-bus.ts
/**
 * In-process pub/sub for SSE walk streams.
 * Publishes PawReportLiveEvent payloads only.
 */

import { EventEmitter } from "events";
import type { PawReportLiveEvent } from "@/lib/pawreport/walk-events";

type WalkBus = EventEmitter & {
  publish: (event: PawReportLiveEvent) => void;
  subscribe: (
    bookingId: string,
    listener: (event: PawReportLiveEvent) => void,
  ) => () => void;
};

const globalKey = "__sitguru_walk_event_bus__";

function createBus(): WalkBus {
  const emitter = new EventEmitter() as WalkBus;
  emitter.setMaxListeners(200);

  emitter.publish = (event: PawReportLiveEvent) => {
    emitter.emit(`walk:${event.bookingId}`, event);
    emitter.emit("walk:*", event);
  };

  emitter.subscribe = (bookingId, listener) => {
    const channel = `walk:${bookingId}`;
    emitter.on(channel, listener);
    return () => {
      emitter.off(channel, listener);
    };
  };

  return emitter;
}

export function getWalkEventBus(): WalkBus {
  const g = globalThis as typeof globalThis & {
    [globalKey]?: WalkBus;
  };

  if (!g[globalKey]) {
    g[globalKey] = createBus();
  }

  return g[globalKey];
}

export function publishWalkEvent(event: PawReportLiveEvent) {
  getWalkEventBus().publish(event);
}
