"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const Chatbot = dynamic(() => import("./Chatbot"), { ssr: false });
const WhatsAppButton = dynamic(() => import("./WhatsAppButton"), { ssr: false });
const CookiePolicyPopup = dynamic(() => import("./CookiePolicyPopup"), {
  ssr: false,
});
const SpecialOfferWrapper = dynamic(() => import("./SpecialOfferWrapper"), {
  ssr: false,
});
const CopyProtection = dynamic(() => import("./CopyProtection"), { ssr: false });

type IdleHandle = number;
type IdleDeadline = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

declare global {
  interface Window {
    requestIdleCallback?: (
      callback: (deadline: IdleDeadline) => void,
      options?: { timeout: number }
    ) => IdleHandle;
    cancelIdleCallback?: (id: IdleHandle) => void;
  }
}

export default function DeferredGlobalWidgets() {
  const pathname = usePathname();
  const [loadInteractiveWidgets, setLoadInteractiveWidgets] = useState(false);
  const [loadPassiveWidgets, setLoadPassiveWidgets] = useState(false);

  const isDashboardRoute =
    pathname?.includes("-dashboard") || pathname?.includes("/dashboard");
  const isCleanGSTSimulationRoute =
    pathname?.startsWith("/simulations/gst/e-invoicing-1") ||
    pathname?.startsWith("/simulations/gst/e-invoicing-3") ||
    false;

  useEffect(() => {
    if (isDashboardRoute || isCleanGSTSimulationRoute) return;

    let idleId: IdleHandle | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const trigger = () => setLoadInteractiveWidgets(true);

    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "touchstart",
      "keydown",
      "scroll",
    ];

    for (const eventName of events) {
      window.addEventListener(eventName, trigger, { once: true, passive: true });
    }

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => {
        setLoadInteractiveWidgets(true);
      }, { timeout: 3000 });
    } else {
      timeoutId = setTimeout(() => setLoadInteractiveWidgets(true), 3000);
    }

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, trigger);
      }
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isDashboardRoute, isCleanGSTSimulationRoute]);

  useEffect(() => {
    if (!loadInteractiveWidgets || isDashboardRoute || isCleanGSTSimulationRoute)
      return;

    const timerId = setTimeout(() => setLoadPassiveWidgets(true), 1200);
    return () => clearTimeout(timerId);
  }, [isDashboardRoute, isCleanGSTSimulationRoute, loadInteractiveWidgets]);

  if (isDashboardRoute || isCleanGSTSimulationRoute) return null;

  return (
    <>
      {loadInteractiveWidgets && <SpecialOfferWrapper location="all" maxCards={1} />}
      {loadInteractiveWidgets && <Chatbot />}
      {loadInteractiveWidgets && <WhatsAppButton />}
      {loadPassiveWidgets && <CookiePolicyPopup />}
      {loadPassiveWidgets && <CopyProtection />}
    </>
  );
}
