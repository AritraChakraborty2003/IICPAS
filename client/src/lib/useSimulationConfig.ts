"use client";
import { useEffect, useState } from "react";
import { getApiBase } from "@/lib/apiBase";

export type CredentialField = { label: string; value: string };

export type SimulationCredConfig = {
  credentialFields: CredentialField[];
  bannerText: string;
  requireCredentialValidation: boolean;
};

const parseConfig = (data: unknown): SimulationCredConfig | null => {
  const config = data as {
    credentialFields?: { label?: string; value?: string }[];
    bannerText?: string;
    requireCredentialValidation?: boolean;
    isActive?: boolean;
  } | null;
  if (!config || config.isActive === false) return null;
  const fields = (config.credentialFields || []).filter(
    (field): field is CredentialField => Boolean(field?.label && field?.value)
  );
  if (!fields.length) return null;
  return {
    credentialFields: fields,
    bannerText: String(config.bannerText || "").trim(),
    requireCredentialValidation: config.requireCredentialValidation !== false,
  };
};

// Read the per-insert override id carried on the simulation URL
// (?simCfg=<id>, appended by the course editor's Quick Inserts).
export const getSimCfgIdFromLocation = (): string => {
  if (typeof window === "undefined") return "";
  try {
    return (
      new URLSearchParams(window.location.search).get("simCfg")?.trim() || ""
    );
  } catch {
    return "";
  }
};

// Load the credential config for a simulation page. A per-insert override
// referenced by ?simCfg=<id> takes precedence over the slug-level config
// managed in the admin Simulation Manager.
export const useSimulationConfig = (
  slug: string
): SimulationCredConfig | null => {
  const [config, setConfig] = useState<SimulationCredConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    const apply = (next: SimulationCredConfig | null) => {
      if (!cancelled && next) setConfig(next);
    };

    const fetchBySlug = () =>
      fetch(`${getApiBase()}/simulation-configs/public/${slug}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => apply(parseConfig(data)))
        .catch(() => {
          // No config available — hardcoded defaults stay in effect
        });

    const overrideId = getSimCfgIdFromLocation();
    if (overrideId) {
      fetch(`${getApiBase()}/simulation-configs/public/override/${overrideId}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          const parsed = parseConfig(data);
          if (parsed) apply(parsed);
          else return fetchBySlug();
        })
        .catch(() => fetchBySlug());
    } else {
      fetchBySlug();
    }

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return config;
};

// Pick a configured credential value by matching its label, e.g.
// findFieldValue(config, /pass/i) for the password field.
export const findFieldValue = (
  config: SimulationCredConfig | null,
  labelPattern: RegExp
): string =>
  config?.credentialFields.find((field) => labelPattern.test(field.label))
    ?.value || "";

// The first field that is neither a password nor a captcha — used as the
// username/id credential for two-input login forms.
export const findUsernameValue = (
  config: SimulationCredConfig | null
): string =>
  config?.credentialFields.find(
    (field) => !/pass|captcha/i.test(field.label)
  )?.value || "";
