'use client';
import { useSyncExternalStore } from 'react';

/**
 * Tiny global store (works like a Bloc / Riverpod provider, no extra package needed).
 * `revision` goes up after every successful change (save, delete, approve, refund, cancel, send to courier ...).
 * Every list/detail that uses useAsync listens to it and reloads at once, so all screens show the new state together.
 * The Refresh button in the top bar calls bump() too.
 */
let revision = 0;
const subs = new Set();

export function bump() {
  revision += 1;
  subs.forEach((f) => f());
}
export function subscribe(f) {
  subs.add(f);
  return () => subs.delete(f);
}
export function useRevision() {
  return useSyncExternalStore(subscribe, () => revision, () => 0);
}

// Slim loading bar at the top while a save/button action is running.
let pending = 0;
const bsubs = new Set();
export function busy(delta) { pending = Math.max(0, pending + delta); bsubs.forEach((f) => f()); }
export function useBusy() {
  return useSyncExternalStore((f) => { bsubs.add(f); return () => bsubs.delete(f); }, () => pending > 0, () => false);
}
