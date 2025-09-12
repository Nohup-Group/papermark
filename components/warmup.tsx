"use client";

import { useEffect } from "react";

async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retries = 5,
  intervalMs = 1000
) {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(url, { cache: "no-store", ...init });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      attempt += 1;
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
}

export default function Warmup() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchWithRetry("/api/health", undefined, 5, 1000);
        if (!cancelled) console.info("Backend wake-up successful");
      } catch (e) {
        if (!cancelled)
          console.error("Backend wake-up failed after retries", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

