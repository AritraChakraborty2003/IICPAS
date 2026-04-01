"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const AUTH_ROUTES = new Set([
  "/login",
  "/register",
  "/student-login",
  "/teacher-login",
  "/teacher-register",
  "/center-login",
  "/center-register",
]);

export default function AuthRouteMarker() {
  const pathname = usePathname();

  useEffect(() => {
    const isAuthPage = Boolean(pathname && AUTH_ROUTES.has(pathname));
    document.body.classList.toggle("auth-page", isAuthPage);

    return () => {
      document.body.classList.remove("auth-page");
    };
  }, [pathname]);

  return null;
}
