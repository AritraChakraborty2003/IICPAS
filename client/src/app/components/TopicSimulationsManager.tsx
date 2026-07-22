"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getApiBase } from "@/lib/apiBase";
import SimulationCredFieldsEditor from "./SimulationCredFieldsEditor";

const STATIC_CDN_BASE =
  process.env.NEXT_PUBLIC_STATIC_CDN_BASE || "https://cdn.iicpa.in";

// Editor for portal simulation links (/simulations/...) attached to a case
// study or assignment, each with optional per-insert credentials that take
// precedence over the Simulation Manager config (same ?simCfg=<id> mechanism
// as topic Quick Inserts).

export interface TopicSimEntry {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  credFields: { label: string; value: string }[];
  bannerText: string;
  validate: boolean;
  overrideId: string;
  credsLoaded: boolean;
}

export interface SavedTopicSimulation {
  url: string;
  title?: string;
  imageUrl?: string;
}

const adminAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  },
});

const overrideIdFromUrl = (url: string) =>
  url.match(/[?&]simCfg=([^&]+)/)?.[1] || "";

const stripSimCfg = (url: string) => url.replace(/[?&]simCfg=[^&]+/, "");

// /simulations/gst/e-invoicing-1 -> gst-e-invoicing-1
export const simulationSlugFromUrl = (url: string): string => {
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    const match = pathname.match(/\/simulations\/(.+)/);
    if (!match) return "";
    return match[1].replace(/\/+$/, "").split("/").join("-").toLowerCase();
  } catch {
    return "";
  }
};

export const topicSimEntriesFromSaved = (
  saved: SavedTopicSimulation[] | undefined
): TopicSimEntry[] =>
  (saved || []).map((item, index) => ({
    id: `tsim-${Date.now()}-${index}`,
    title: item.title || "",
    url: item.url || "",
    imageUrl: item.imageUrl || "",
    credFields: [],
    bannerText: "",
    validate: true,
    overrideId: overrideIdFromUrl(item.url || ""),
    credsLoaded: !overrideIdFromUrl(item.url || ""),
  }));

// Create/update the credential overrides for each entry and return the list
// to persist on the case study / assignment. Call from the builder's save.
export const syncTopicSimulations = async (
  entries: TopicSimEntry[]
): Promise<SavedTopicSimulation[]> => {
  const API_BASE = getApiBase();
  const result: SavedTopicSimulation[] = [];

  for (const entry of entries) {
    const baseUrl = stripSimCfg(entry.url.trim());
    if (!baseUrl) continue;
    const credFields = entry.credFields.filter(
      (field) => field.label.trim() && field.value.trim()
    );
    const bannerText = entry.bannerText.trim();
    const slug = simulationSlugFromUrl(baseUrl);
    let overrideId = entry.overrideId;

    if ((credFields.length || bannerText) && slug) {
      const payload = {
        slug,
        name: slug,
        credentialFields: credFields,
        bannerText,
        requireCredentialValidation: entry.validate,
      };
      if (overrideId) {
        await axios.put(
          `${API_BASE}/simulation-configs/overrides/${overrideId}`,
          payload,
          adminAuthHeaders()
        );
      } else {
        const response = await axios.post(
          `${API_BASE}/simulation-configs/overrides`,
          payload,
          adminAuthHeaders()
        );
        overrideId = response.data?._id || "";
      }
    } else if (overrideId) {
      // Credentials were cleared — drop the override
      await axios
        .delete(
          `${API_BASE}/simulation-configs/overrides/${overrideId}`,
          adminAuthHeaders()
        )
        .catch(() => {});
      overrideId = "";
    }

    result.push({
      url: overrideId
        ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}simCfg=${overrideId}`
        : baseUrl,
      title: entry.title.trim(),
      imageUrl: entry.imageUrl.trim(),
    });
  }

  return result;
};

export default function TopicSimulationsManager({
  entries,
  onChange,
}: {
  entries: TopicSimEntry[];
  onChange: (entries: TopicSimEntry[]) => void;
}) {
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(
    null
  );

  const handleImageUpload = async (entryId: string, file?: File | null) => {
    if (!file || uploadingImageFor) return;
    try {
      setUploadingImageFor(entryId);
      const formData = new FormData();
      formData.append("image", file);
      const res = await axios.post(
        `${STATIC_CDN_BASE}/upload/image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const url: string =
        res.data?.data?.cdnUrl || res.data?.cdnUrl || res.data?.imageUrl || "";
      if (url) {
        onChange(
          entries.map((item) =>
            item.id === entryId ? { ...item, imageUrl: url } : item
          )
        );
      } else {
        alert("Image upload did not return a URL");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      alert(
        "Image upload failed: " + (error?.response?.data?.error || error?.message)
      );
    } finally {
      setUploadingImageFor(null);
    }
  };

  // Prefill credential fields for saved entries that carry an override id
  useEffect(() => {
    entries.forEach((entry) => {
      if (!entry.overrideId || entry.credsLoaded) return;
      fetch(
        `${getApiBase()}/simulation-configs/public/override/${entry.overrideId}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          onChange(
            entries.map((item) =>
              item.id === entry.id
                ? {
                    ...item,
                    credsLoaded: true,
                    credFields: (data?.credentialFields || []).map(
                      (field: { label?: string; value?: string }) => ({
                        label: field.label || "",
                        value: field.value || "",
                      })
                    ),
                    bannerText: data?.bannerText || "",
                    validate: data?.requireCredentialValidation !== false,
                  }
                : item
            )
          );
        })
        .catch(() => {
          onChange(
            entries.map((item) =>
              item.id === entry.id ? { ...item, credsLoaded: true } : item
            )
          );
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.map((e) => `${e.id}:${e.credsLoaded}`).join(",")]);

  const update = (id: string, patch: Partial<TopicSimEntry>) =>
    onChange(
      entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    );

  const addEntry = () =>
    onChange([
      ...entries,
      {
        id: `tsim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: "",
        url: "",
        imageUrl: "",
        credFields: [
          { label: "Username", value: "" },
          { label: "Password", value: "" },
        ],
        bannerText: "",
        validate: true,
        overrideId: "",
        credsLoaded: true,
      },
    ]);

  const removeEntry = (entry: TopicSimEntry) => {
    if (entry.overrideId) {
      axios
        .delete(
          `${getApiBase()}/simulation-configs/overrides/${entry.overrideId}`,
          adminAuthHeaders()
        )
        .catch(() => {});
    }
    onChange(entries.filter((item) => item.id !== entry.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Topic Simulations (Optional)
          </h3>
          <p className="text-sm text-gray-500">
            Link portal simulations (e.g. /simulations/epf-reg-1) with their own
            credentials and banner text. These take precedence over the
            Simulation Manager for the same simulation.
          </p>
        </div>
        <button
          type="button"
          onClick={addEntry}
          className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
        >
          + Add Simulation
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="py-10 text-center text-gray-500">
          No simulations added yet. Click &quot;Add Simulation&quot; to get
          started.
        </p>
      ) : (
        entries.map((entry, index) => {
          const slug = simulationSlugFromUrl(entry.url.trim());
          return (
            <div
              key={entry.id}
              className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">
                  Simulation {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeEntry(entry)}
                  className="text-sm font-medium text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">
                    Title (shown to students)
                  </label>
                  <input
                    value={entry.title}
                    onChange={(e) => update(entry.id, { title: e.target.value })}
                    placeholder="e.g. EPF Return Filing Practice"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">
                    Simulation URL
                  </label>
                  <input
                    value={stripSimCfg(entry.url)}
                    onChange={(e) => update(entry.id, { url: e.target.value })}
                    placeholder="/simulations/epf-reg-1"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  {entry.url.trim() && (
                    <p className="mt-1 font-mono text-xs text-gray-400">
                      Slug: {slug || "— not a /simulations/... URL —"}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Simulation image (optional — card background, like topic
                  simulations)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={entry.imageUrl}
                    onChange={(e) =>
                      update(entry.id, { imageUrl: e.target.value })
                    }
                    placeholder="https://cdn.iicpa.in/... or upload a file"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <label className="cursor-pointer whitespace-nowrap rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50">
                    {uploadingImageFor === entry.id
                      ? "Uploading..."
                      : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImageFor !== null}
                      onChange={(e) => {
                        handleImageUpload(entry.id, e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {entry.imageUrl.trim() && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={entry.imageUrl}
                    alt="Simulation card background preview"
                    className="mt-2 h-24 w-full max-w-sm rounded-lg border border-gray-200 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>

              <SimulationCredFieldsEditor
                credFields={entry.credFields}
                bannerText={entry.bannerText}
                validate={entry.validate}
                overrideId={entry.overrideId}
                credsLoaded={entry.credsLoaded}
                onPatch={(patch) => update(entry.id, patch)}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
