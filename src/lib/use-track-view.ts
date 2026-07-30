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
    return () => {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      if (duration > 2) {
        fetch("/api/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, serviceId: opts?.serviceId, serviceType: opts?.serviceType, duration }),
          credentials: "include",
        }).catch(() => {});
      }
    };
  }, [opts?.serviceId, opts?.serviceType, opts?.path]);
}
