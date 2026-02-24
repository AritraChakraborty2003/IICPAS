"use client";

import { useEffect } from "react";
import axios from "axios";

export const useAuthHeartbeat = ({
  enabled,
  heartbeatUrl,
  intervalMs = 30000,
  withCredentials = true,
  getHeaders,
}) => {
  useEffect(() => {
    if (!enabled || !heartbeatUrl) return undefined;

    let timer;
    let cancelled = false;

    const sendHeartbeat = async () => {
      if (cancelled) return;
      try {
        const headers = typeof getHeaders === "function" ? getHeaders() : undefined;
        await axios.post(
          heartbeatUrl,
          {},
          {
            withCredentials,
            headers,
          }
        );
      } catch {
        // Keep silent to avoid noisy UX.
      }
    };

    sendHeartbeat();
    timer = setInterval(sendHeartbeat, intervalMs);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [enabled, heartbeatUrl, intervalMs, withCredentials, getHeaders]);
};
