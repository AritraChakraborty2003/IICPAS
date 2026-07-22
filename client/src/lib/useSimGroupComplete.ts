"use client";
import { useCallback } from "react";
import { usePathname } from "next/navigation";

export const SIM_GROUP_COMPLETE_MESSAGE = "iicpa:sim-complete";

// Reports "this simulation's task is done" to a parent window, if and only if
// the page is embedded inside a Group Simulations player iframe. Outside of
// that context (window.parent === window, i.e. a normal standalone visit to
// /simulations/...) this is a complete no-op — nothing changes for the
// thousands of existing standalone simulation links.
export const useSimGroupComplete = () => {
  const pathname = usePathname();

  return useCallback(() => {
    if (typeof window === "undefined" || window.parent === window) return;
    const slug = (pathname || "").replace(/^\/simulations\//, "").replace(/\/+$/, "");
    window.parent.postMessage(
      { type: SIM_GROUP_COMPLETE_MESSAGE, slug },
      window.location.origin
    );
  }, [pathname]);
};
