import { useSyncExternalStore } from "react";
import type { Analysis } from "./types";

let current: Analysis | null = null;
const listeners = new Set<() => void>();

export function setAnalysis(a: Analysis | null) {
  current = a;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAnalysis(): Analysis | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}
