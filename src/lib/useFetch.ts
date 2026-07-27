"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseFetchOptions<T> {
  /** If false, the request is not sent. Default: true */
  enabled?: boolean;
  /** Number of retry attempts on failure. Default: 0 */
  retries?: number;
  /** Milliseconds between retries. Default: 1000 */
  retryDelay?: number;
  /** Map a non-ok response body to a custom error message */
  getErrorMessage?: (body: unknown) => string;
  /** Optional transform applied to the parsed JSON before setting data */
  transform?: (json: unknown) => T;
  /** Debounce delay in ms. When set, fetch is delayed until this many ms after the last URL change. Default: undefined (no debounce) */
  debounceMs?: number;
}

interface UseFetchResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  /** Manually trigger a refetch */
  refetch: () => void;
}

/**
 * Hook that wraps `fetch` with:
 *  - AbortController (auto-cleanup on unmount / URL change)
 *  - Automatic retries with back-off
 *  - Typed loading / error / data states
 *  - Optional debounce (debounceMs option)
 *
 * @example
 * const { data, loading, error } = useFetch<HotTourData[]>(
 *   "/api/services?type=TOUR&limit=4&sort=popular",
 *   { transform: (json: any) => json.services ?? [] }
 * );
 *
 * // Debounced search
 * const { data: suggestions } = useFetch<SuggestionsResponse>(
 *   `/api/search?q=${query}`,
 *   { debounceMs: 300, enabled: query.length >= 2 }
 * );
 */
export function useFetch<T = unknown>(
  url: string | null,
  options: UseFetchOptions<T> = {},
): UseFetchResult<T> {
  const {
    enabled = true,
    retries = 0,
    retryDelay = 1000,
    getErrorMessage,
    transform,
    debounceMs,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url && enabled);

  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger((n) => n + 1), []);

  // Debounce state: track the "effective" URL that triggers the actual fetch
  const [effectiveUrl, setEffectiveUrl] = useState<string | null>(url);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce logic: when url or enabled changes, delay before updating effectiveUrl
  useEffect(() => {
    if (debounceMs && debounceMs > 0) {
      let cancelled = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (!cancelled) setEffectiveUrl(url);
      }, enabled ? debounceMs : 0);
      return () => {
        cancelled = true;
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      };
    } else {
      setEffectiveUrl(url);
    }
  }, [url, enabled, debounceMs]);

  useEffect(() => {
    if (!effectiveUrl || !enabled) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function doFetch(attempt: number) {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(effectiveUrl!, {
          signal: controller.signal,
          credentials: "include",
        });

        const body = await res.json().catch(() => null);

        if (cancelled) return;

        if (!res.ok) {
          const msg = getErrorMessage
            ? getErrorMessage(body)
            : (body as Record<string, string> | null)?.error || `HTTP ${res.status}`;
          throw new Error(msg);
        }

        const result = transform ? transform(body) : (body as T);
        setData(result);
        setError(null);
      } catch (err: unknown) {
        if (cancelled) return;

        // Abort is not an error — it just means we cleaned up
        if (err instanceof DOMException && err.name === "AbortError") return;

        const message = err instanceof Error ? err.message : "Unknown error";

        // Retry logic
        if (attempt < retries) {
          setTimeout(() => {
            if (!cancelled) doFetch(attempt + 1);
          }, retryDelay * (attempt + 1));
          return;
        }

        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    doFetch(0);

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUrl, enabled, trigger]);

  return { data, error, loading, refetch };
}
