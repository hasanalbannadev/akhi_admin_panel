"use client";
import { useSyncExternalStore } from "react";

/**
 * ছোট গ্লোবাল স্টোর (Bloc/Riverpod-এর মতো কাজ করে, আলাদা প্যাকেজ লাগে না)।
 * কোনো পরিবর্তন সফল হলে (অর্ডার, বাতিলের অনুরোধ, কার্ট, প্রোফাইল ইত্যাদি) `revision` বাড়ে;
 * useAsync ব্যবহার করা সব স্ক্রিন নিজে থেকে নতুন তথ্য এনে সঙ্গে সঙ্গে আপডেট হয়।
 */
let revision = 0;
const subs = new Set<() => void>();

export function bump() {
  revision += 1;
  subs.forEach((f) => f());
}
function subscribe(f: () => void) {
  subs.add(f);
  return () => { subs.delete(f); };
}
export function useRevision() {
  return useSyncExternalStore(subscribe, () => revision, () => 0);
}

// কোনো সেভ/বাটন চাপলে ওপরে ছোট লোডিং বার ঘোরে, নতুন তথ্য আসা পর্যন্ত
let pending = 0;
const bsubs = new Set<() => void>();
export function busy(delta: number) {
  pending = Math.max(0, pending + delta);
  bsubs.forEach((f) => f());
}
export function useBusy() {
  return useSyncExternalStore((f) => { bsubs.add(f); return () => { bsubs.delete(f); }; }, () => pending > 0, () => false);
}
