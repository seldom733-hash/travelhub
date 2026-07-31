import { useEffect, useRef } from "react";

/**
 * Track page view on mount and record time-on-page on unmount.
 * Pass serviceId/serviceType for service detail pages.
 */
export function useTrackView(opts?: { serviceId?: string; serviceType?: string; path?: string }) {
  const startTime = useRef(Date.now());

  useEffect(() => {
    const path = opts?.path || window.location.pathname;

    // Fire-and-forget page view POST
    fetch("/api/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        serviceId: opts?.serviceId || null,
        serviceType: opts?.serviceType || null,
        referrer: document.referrer || null,
      }),
      credentials: "include",
    }).catch(() => {});

    // Record duration on unmount
    // sendBeacon when page is actually closing (no cookies, but reliable)
    // fetch with credentials for SPA route changes (user identity preserved)
    return () => {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      if (duration > 2) {
        const body = JSON.stringify({ path, serviceId: opts?.serviceId, serviceType: opts?.serviceType, duration });
        if (document.visibilityState === "hidden") {
          navigator.sendBeacon("/api/track-view", new Blob([body], { type: "application/json" }));
        } else {
          fetch("/api/track-view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            credentials: "include",
          }).catch(() => {});
        }
      }
    };
  }, [opts?.serviceId, opts?.serviceType, opts?.path]);
}
