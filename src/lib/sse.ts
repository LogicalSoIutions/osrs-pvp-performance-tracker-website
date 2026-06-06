import type { FightSummary } from "@/src/types/fights";

type SsePayload = FightSummary;
type Listener = (event: "fight_added", data: SsePayload) => void;

declare global {
  var __pvpTrackerListeners: Set<Listener> | undefined;
}

const listeners = global.__pvpTrackerListeners ?? new Set<Listener>();

if (process.env.NODE_ENV !== "production") {
  global.__pvpTrackerListeners = listeners;
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function broadcast(event: "fight_added", data: SsePayload) {
  for (const listener of listeners) {
    listener(event, data);
  }
}
