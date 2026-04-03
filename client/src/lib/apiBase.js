"use client";

const FALLBACK_API_BASE = "http://localhost:8080/api";

const getRawApiBase = () =>
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  FALLBACK_API_BASE;

export const getApiBase = () => {
  const rawBase = getRawApiBase().trim();

  return rawBase.endsWith("/api")
    ? rawBase
    : `${rawBase.replace(/\/+$/, "")}/api`;
};

export const getApiOrigin = () =>
  getRawApiBase().trim().replace(/\/api\/?$/i, "");
