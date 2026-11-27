"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { getApiBase } from "@/lib/apiBase";
import SimulationCredFieldsEditor from "./SimulationCredFieldsEditor";
import { simulationSlugFromUrl } from "./TopicSimulationsManager";
import type { TopicSimEntry } from "./TopicSimulationsManager";
import ChapterSimulationPicker, {
  credSnapshot,
  PickedGroup,
} from "./ChapterSimulationPicker";

// Slide-style preview of a saved group, restricted server-side to admins,
// permitted employees and students who purchased the course.
export const simulationGroupPreviewPath = (parentId: string, groupIndex: number) =>
  `/simulations/group-preview/${parentId}/${groupIndex}`;

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
  // Position of this group in the saved case study / assignment; undefined
  // for groups added since the last save (they have no preview link yet).
  savedIndex?: number;
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
    savedIndex: groupIndex,
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
): Promise<SavedSimulationGroup[]> =>
  (await syncSimulationGroupsDetailed(groups)).saved;

// Same as syncSimulationGroups, but also reports the override id each slot
// ended up with (keyed by slot id) so the editor state can be updated and a
// later save edits those overrides instead of creating duplicates.
const syncSimulationGroupsDetailed = async (
  groups: SimGroupEntry[]
): Promise<{ saved: SavedSimulationGroup[]; slotOverrides: Map<string, string> }> => {
  const API_BASE = getApiBase();
  const result: SavedSimulationGroup[] = [];
  const slotOverrides = new Map<string, string>();

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
      // Prefilled from the Simulation Manager and left unchanged: keep using
      // the slug config instead of freezing a copy in an override.
      const matchesDefaults =
        !overrideId &&
        Boolean(slot.defaultSnapshot) &&
        slot.defaultSnapshot === credSnapshot(slot);

      if (matchesDefaults) {
        // nothing to persist
      } else if ((credFields.length || bannerText) && slug) {
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

      slotOverrides.set(slot.id, overrideId);
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

  return { saved: result, slotOverrides };
};

export default function SimulationGroupsManager({
  groups,
  onChange,
  chapterId,
  parentId,
  parentType,
}: {
  groups: SimGroupEntry[];
  onChange: (groups: SimGroupEntry[]) => void;
  // Chapter whose topics' inserted simulations "Add Group" offers
  chapterId?: string;
  // Saved case study / assignment — groups are then saved to it instantly
  // (no need to press the builder's Save) and get their links right away
  parentId?: string;
  parentType?: "assignment" | "case-study";
}) {
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(
    null
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [copiedGroupId, setCopiedGroupId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<
    { kind: "idle" | "saving" | "saved" } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [dirty, setDirty] = useState(false);

  const canPersist = Boolean(parentId && parentType);
  const latestGroupsRef = useRef(groups);
  latestGroupsRef.current = groups;
  // Override ids created by earlier instant saves, so a save queued before
  // the state caught up doesn't create the same override twice.
  const knownOverridesRef = useRef(new Map<string, string>());
  const persistChainRef = useRef<Promise<void>>(Promise.resolve());

  const persistGroups = (next: SimGroupEntry[]) => {
    if (!canPersist) return;
    persistChainRef.current = persistChainRef.current.then(async () => {
      setSaveState({ kind: "saving" });
      try {
        const withKnownOverrides = next.map((group) => ({
          ...group,
          slots: group.slots.map((slot) =>
            !slot.overrideId && knownOverridesRef.current.get(slot.id)
              ? { ...slot, overrideId: knownOverridesRef.current.get(slot.id) || "" }
              : slot
          ),
        }));
        const { saved, slotOverrides } =
          await syncSimulationGroupsDetailed(withKnownOverrides);
        const endpoint = parentType === "assignment" ? "assignments" : "case-studies";
        await axios.put(`${getApiBase()}/${endpoint}/${parentId}`, {
          simulationGroups: saved,
        });
        slotOverrides.forEach((id, slotId) => knownOverridesRef.current.set(slotId, id));

        // Merge into whatever the editor holds now (the admin may have kept
        // typing while this was saving).
        const savedPositions = new Map<string, number>(
          next.map((g, i): [string, number] => [g.id, i])
        );
        onChange(
          latestGroupsRef.current.map((group) => ({
            ...group,
            savedIndex: savedPositions.has(group.id)
              ? savedPositions.get(group.id)
              : group.savedIndex,
            slots: group.slots.map((slot) =>
              slotOverrides.has(slot.id)
                ? { ...slot, overrideId: slotOverrides.get(slot.id) || "" }
                : slot
            ),
          }))
        );
        setDirty(false);
        setSaveState({ kind: "saved" });
      } catch (err: unknown) {
        const error = err as {
          response?: { data?: { error?: string; message?: string } };
          message?: string;
        };
        setSaveState({
          kind: "error",
          message:
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.message ||
            "Could not save the groups",
        });
      }
    });
  };

  // Field edits: keep them local and offer "Save groups" (saving on every
  // keystroke would hammer the API).
  const edit = (next: SimGroupEntry[]) => {
    onChange(next);
    if (canPersist) setDirty(true);
  };

  // Structural changes (add / duplicate / remove) are saved immediately.
  const commit = (next: SimGroupEntry[]) => {
    onChange(next);
    persistGroups(next);
  };

  const previewUrlFor = (group: SimGroupEntry, groupIndex: number) =>
    parentId && group.savedIndex === groupIndex
      ? `${window.location.origin}${simulationGroupPreviewPath(parentId, groupIndex)}`
      : "";

  const copyPreviewLink = async (groupId: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedGroupId(groupId);
      setTimeout(() => setCopiedGroupId(null), 2000);
    } catch {
      window.prompt("Copy the preview link:", url);
    }
  };

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

  const newGroupId = () =>
    `sgroup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const addGroup = () => {
    if (chapterId) {
      setPickerOpen(true);
      return;
    }
    commit([
      ...groups,
      {
        id: newGroupId(),
        name: `Group ${groups.length + 1}`,
        bgImageUrl: "",
        slots: [newSlot()],
      },
    ]);
  };

  const addPickedGroups = (picked: PickedGroup[]) => {
    setPickerOpen(false);
    commit([
      ...groups,
      ...picked.map((group) => ({
        id: newGroupId(),
        name: group.name,
        bgImageUrl: "",
        slots: group.slots.length ? group.slots : [newSlot()],
      })),
    ]);
  };

  // Copy of a group with fresh (unsaved) overrides, for quickly making
  // variants of the same sequence with different values.
  const duplicateGroup = (group: SimGroupEntry) =>
    commit([
      ...groups,
      {
        id: newGroupId(),
        name: `${group.name || "Group"} (copy)`,
        bgImageUrl: group.bgImageUrl,
        slots: group.slots.map((slot) => ({
          ...slot,
          id: `gsim-slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          url: stripSimCfg(slot.url),
          credFields: slot.credFields.map((field) => ({ ...field })),
          overrideId: "",
          credsLoaded: true,
        })),
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
    commit(groups.filter((g) => g.id !== group.id));
  };

  const updateGroup = (groupId: string, patch: Partial<SimGroupEntry>) =>
    edit(groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)));

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
    // Its override was just deleted, so save right away rather than leave
    // the saved group pointing at it.
    commit(
      groups.map((g) =>
        g.id === groupId
          ? { ...g, slots: g.slots.filter((s) => s.id !== slot.id) }
          : g
      )
    );
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
      {pickerOpen && chapterId && (
        <ChapterSimulationPicker
          chapterId={chapterId}
          existingGroupCount={groups.length}
          onCancel={() => setPickerOpen(false)}
          onCreate={addPickedGroups}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Group Simulations (Optional)
          </h3>
          <p className="text-sm text-gray-500">
            Chain multiple simulations into one ordered sequence — each with its
            own credentials — that auto-advances for the student once started.
            {chapterId &&
              " \"Add Group\" lists the simulations inserted in this chapter's topics."}
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

      {canPersist ? (
        <div
          className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
            saveState.kind === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : dirty
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          <span className="flex-1">
            {saveState.kind === "saving"
              ? "Saving groups…"
              : saveState.kind === "error"
                ? `Groups not saved: ${saveState.message}`
                : dirty
                  ? "You have unsaved changes to the groups."
                  : saveState.kind === "saved"
                    ? "Groups saved. Each group's continuous link below is live."
                    : "Groups are saved to this item as you add, duplicate or remove them."}
          </span>
          {(dirty || saveState.kind === "error") && (
            <button
              type="button"
              onClick={() => persistGroups(groups)}
              disabled={saveState.kind === "saving"}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              Save groups now
            </button>
          )}
        </div>
      ) : (
        groups.length > 0 && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Save this {parentType === "assignment" ? "assignment" : "case study"}{" "}
            once to store the groups. After that, groups save instantly and each
            gets a continuous link.
          </p>
        )
      )}

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
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => duplicateGroup(group)}
                  disabled={group.slots.some((s) => s.overrideId && !s.credsLoaded)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-40"
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => removeGroup(group)}
                  className="text-sm font-medium text-red-500 hover:text-red-700"
                >
                  Remove Group
                </button>
              </div>
            </div>

            {(() => {
              const previewUrl = previewUrlFor(group, groupIndex);
              return (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm">
                  <span className="font-medium text-indigo-800">
                    Continuous link (all {group.slots.length} simulations, one
                    after another):
                  </span>
                  {previewUrl ? (
                    <>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 flex-1 truncate font-mono text-xs text-indigo-700 underline"
                      >
                        {previewUrl}
                      </a>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-indigo-500 bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                      >
                        Open
                      </a>
                      <button
                        type="button"
                        onClick={() => copyPreviewLink(group.id, previewUrl)}
                        className="rounded border border-indigo-300 bg-white px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                      >
                        {copiedGroupId === group.id ? "Copied!" : "Copy"}
                      </button>
                      <span className="w-full text-xs text-indigo-600/80">
                        Opens for admins, employees with course/topic access and
                        students who purchased this course. Shows the last saved
                        version.
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-indigo-600/80">
                      {canPersist
                        ? saveState.kind === "saving"
                          ? "Saving — the link appears in a moment."
                          : "Click \"Save groups now\" above to get this group's link."
                        : `Save the ${parentType === "assignment" ? "assignment" : "case study"} to get this group's link.`}
                    </span>
                  )}
                </div>
              );
            })()}

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
