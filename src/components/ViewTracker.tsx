"use client";

import { useTrackView } from "@/lib/use-track-view";

/**
 * Client-side view tracker.
 * Placed in layout.tsx to track every page view and time-on-page.
 */
export default function ViewTracker() {
  useTrackView();
  return null;
}
