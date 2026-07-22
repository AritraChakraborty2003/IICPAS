"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getApiBase } from "@/lib/apiBase";
import SimulationCredFieldsEditor from "./SimulationCredFieldsEditor";
import { simulationSlugFromUrl } from "./TopicSimulationsManager";
import type { TopicSimEntry } from "./TopicSimulationsManager";

const STATIC_CDN_BASE =
  process.env.NEXT_PUBLIC_STATIC_CDN_BASE || "https://cdn.iicpa.in";

// Editor for "Group Simulations" — an ordered sequence of existing
// /simulations/... pages (each with its own credential override, same
// mechanism as TopicSimulationsManager) that auto-advance one after another
// for the student once launched from a single "Start Group" button.

export interface SimGroupEntry {
  id: string;
  name: string;
  bgImageUrl: string;
  slots: TopicSimEntry[];
}

export interface SavedSimulationGroupSlot {
  url: string;
  title?: string;
  imageUrl?: string;
}

export interface SavedSimulationGroup {
  name: string;
  bgImageUrl?: string;
  slots: SavedSimulationGroupSlot[];
}

const adminAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  },
});

const overrideIdFromUrl = (url: string) =>
  url.match(/[?&]simCfg=([^&]+)/)?.[1] || "";

const stripSimCfg = (url: string) => url.replace(/[?&]simCfg=[^&]+/, "");

const newSlot = (): TopicSimEntry => ({
  id: `gsim-slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
});

export const simGroupsFromSaved = (
  saved: SavedSimulationGroup[] | undefined
): SimGroupEntry[] =>
  (saved || []).map((group, groupIndex) => ({
    id: `sgroup-${Date.now()}-${groupIndex}`,
    name: group.name || "",
    bgImageUrl: group.bgImageUrl || "",
    slots: (group.slots || []).map((slot, slotIndex) => ({
      id: `gsim-slot-${Date.now()}-${groupIndex}-${slotIndex}`,
      title: slot.title || "",
      url: slot.url || "",
      imageUrl: slot.imageUrl || "",
      credFields: [],
      bannerText: "",
      validate: true,
      overrideId: overrideIdFromUrl(slot.url || ""),
      credsLoaded: !overrideIdFromUrl(slot.url || ""),
    })),
  }));

// Creates/updates/deletes each slot's SimulationOverride and returns the
// group list to persist on the case study. Call from the builder's save.
export const syncSimulationGroups = async (
  groups: SimGroupEntry[]
): Promise<SavedSimulationGroup[]> => {
  const API_BASE = getApiBase();
  const result: SavedSimulationGroup[] = [];

  for (const group of groups) {
    const slots: SavedSimulationGroupSlot[] = [];

    for (const slot of group.slots) {
      const baseUrl = stripSimCfg(slot.url.trim());
      if (!baseUrl) continue;
      const credFields = slot.credFields.filter(
        (field) => field.label.trim() && field.value.trim()
      );
      const bannerText = slot.bannerText.trim();
      const slug = simulationSlugFromUrl(baseUrl);
      let overrideId = slot.overrideId;

      if ((credFields.length || bannerText) && slug) {
        const payload = {
          slug,
          name: slug,
          credentialFields: credFields,
          bannerText,
          requireCredentialValidation: slot.validate,
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
        await axios
          .delete(
            `${API_BASE}/simulation-configs/overrides/${overrideId}`,
            adminAuthHeaders()
          )
          .catch(() => {});
        overrideId = "";
      }

      slots.push({
        url: overrideId
          ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}simCfg=${overrideId}`
          : baseUrl,
        title: slot.title.trim(),
        imageUrl: slot.imageUrl.trim(),
      });
    }

    result.push({
      name: group.name.trim(),
      bgImageUrl: group.bgImageUrl.trim(),
      slots,
    });
  }

  return result;
};

export default function SimulationGroupsManager({
  groups,
  onChange,
}: {
  groups: SimGroupEntry[];
  onChange: (groups: SimGroupEntry[]) => void;
}) {
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(
    null
  );

  const handleGroupImageUpload = async (groupId: string, file?: File | null) => {
    if (!file || uploadingImageFor) return;
    try {
      setUploadingImageFor(groupId);
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
        updateGroup(groupId, { bgImageUrl: url });
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

  // Prefill credential fields for saved slots that carry an override id
  useEffect(() => {
    groups.forEach((group) => {
      group.slots.forEach((slot) => {
        if (!slot.overrideId || slot.credsLoaded) return;
        fetch(`${getApiBase()}/simulation-configs/public/override/${slot.overrideId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            onChange(
              groups.map((g) =>
                g.id === group.id
                  ? {
                      ...g,
                      slots: g.slots.map((s) =>
                        s.id === slot.id
                          ? {
                              ...s,
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
                          : s
                      ),
                    }
                  : g
              )
            );
          })
          .catch(() => {
            onChange(
              groups.map((g) =>
                g.id === group.id
                  ? {
                      ...g,
                      slots: g.slots.map((s) =>
                        s.id === slot.id ? { ...s, credsLoaded: true } : s
                      ),
                    }
                  : g
              )
            );
          });
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    groups
      .map((g) => g.slots.map((s) => `${s.id}:${s.credsLoaded}`).join(","))
      .join("|"),
  ]);

  const addGroup = () =>
    onChange([
      ...groups,
      {
        id: `sgroup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: `Group ${groups.length + 1}`,
        bgImageUrl: "",
        slots: [newSlot()],
      },
    ]);

  const removeGroup = (group: SimGroupEntry) => {
    group.slots.forEach((slot) => {
      if (slot.overrideId) {
        axios
          .delete(
            `${getApiBase()}/simulation-configs/overrides/${slot.overrideId}`,
            adminAuthHeaders()
          )
          .catch(() => {});
      }
    });
    onChange(groups.filter((g) => g.id !== group.id));
  };

  const updateGroup = (groupId: string, patch: Partial<SimGroupEntry>) =>
    onChange(groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)));

  const addSlot = (groupId: string) =>
    updateGroup(groupId, {
      slots: [...(groups.find((g) => g.id === groupId)?.slots || []), newSlot()],
    });

  const removeSlot = (groupId: string, slot: TopicSimEntry) => {
    if (slot.overrideId) {
      axios
        .delete(
          `${getApiBase()}/simulation-configs/overrides/${slot.overrideId}`,
          adminAuthHeaders()
        )
        .catch(() => {});
    }
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    updateGroup(groupId, { slots: group.slots.filter((s) => s.id !== slot.id) });
  };

  const updateSlot = (groupId: string, slotId: string, patch: Partial<TopicSimEntry>) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    updateGroup(groupId, {
      slots: group.slots.map((s) => (s.id === slotId ? { ...s, ...patch } : s)),
    });
  };

  const moveSlot = (groupId: string, index: number, direction: -1 | 1) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const target = index + direction;
    if (target < 0 || target >= group.slots.length) return;
    const slots = [...group.slots];
    [slots[index], slots[target]] = [slots[target], slots[index]];
    updateGroup(groupId, { slots });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Group Simulations (Optional)
          </h3>
          <p className="text-sm text-gray-500">
            Chain multiple simulations into one ordered sequence — each with its
            own credentials — that auto-advances for the student once started.
          </p>
        </div>
        <button
          type="button"
          onClick={addGroup}
          className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
        >
          + Add Group
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="py-10 text-center text-gray-500">
          No simulation groups added yet. Click &quot;Add Group&quot; to get started.
        </p>
      ) : (
        groups.map((group, groupIndex) => (
          <div
            key={group.id}
            className="space-y-4 rounded-lg border-2 border-gray-200 bg-gray-50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-3">
                <span className="font-semibold text-gray-700">
                  Group {groupIndex + 1}
                </span>
                <input
                  value={group.name}
                  onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                  placeholder="Group name (shown to students)"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="button"
                onClick={() => removeGroup(group)}
                className="text-sm font-medium text-red-500 hover:text-red-700"
              >
                Remove Group
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">
                Background image (optional — shown behind the group's card on
                the digital hub)
              </label>
              <div className="flex items-center gap-2">
                <input
                  value={group.bgImageUrl}
                  onChange={(e) =>
                    updateGroup(group.id, { bgImageUrl: e.target.value })
                  }
                  placeholder="https://cdn.iicpa.in/... or upload a file"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <label className="cursor-pointer whitespace-nowrap rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50">
                  {uploadingImageFor === group.id
                    ? "Uploading..."
                    : "Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImageFor !== null}
                    onChange={(e) => {
                      handleGroupImageUpload(group.id, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {group.bgImageUrl.trim() && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={group.bgImageUrl}
                  alt="Group card background preview"
                  className="mt-2 h-24 w-full max-w-sm rounded-lg border border-gray-200 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>

            <div className="space-y-3">
              {group.slots.map((slot, slotIndex) => {
                const slug = simulationSlugFromUrl(slot.url.trim());
                return (
                  <div
                    key={slot.id}
                    className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">
                        Step {slotIndex + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => moveSlot(group.id, slotIndex, -1)}
                          disabled={slotIndex === 0}
                          className="text-sm font-medium text-gray-500 hover:text-gray-800 disabled:opacity-30"
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSlot(group.id, slotIndex, 1)}
                          disabled={slotIndex === group.slots.length - 1}
                          className="text-sm font-medium text-gray-500 hover:text-gray-800 disabled:opacity-30"
                          title="Move down"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSlot(group.id, slot)}
                          className="text-sm font-medium text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-600">
                          Title (shown to students)
                        </label>
                        <input
                          value={slot.title}
                          onChange={(e) =>
                            updateSlot(group.id, slot.id, { title: e.target.value })
                          }
                          placeholder="e.g. Activate UAN"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-600">
                          Simulation URL
                        </label>
                        <input
                          value={stripSimCfg(slot.url)}
                          onChange={(e) =>
                            updateSlot(group.id, slot.id, { url: e.target.value })
                          }
                          placeholder="/simulations/epf-reg-12"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        {slot.url.trim() && (
                          <p className="mt-1 font-mono text-xs text-gray-400">
                            Slug: {slug || "— not a /simulations/... URL —"}
                          </p>
                        )}
                      </div>
                    </div>

                    <SimulationCredFieldsEditor
                      credFields={slot.credFields}
                      bannerText={slot.bannerText}
                      validate={slot.validate}
                      overrideId={slot.overrideId}
                      credsLoaded={slot.credsLoaded}
                      onPatch={(patch) => updateSlot(group.id, slot.id, patch)}
                    />
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => addSlot(group.id)}
              className="w-full rounded-lg border-2 border-dashed border-gray-300 py-2 text-sm font-medium text-gray-500 hover:border-blue-300 hover:text-blue-600"
            >
              + Add Simulation to Group
            </button>
          </div>
        ))
      )}
    </div>
  );
}
