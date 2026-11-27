"use client";
import React, { useEffect, useMemo, useState } from "react";
import { getApiBase } from "@/lib/apiBase";
import { simulationSlugFromUrl } from "./TopicSimulationsManager";
import type { TopicSimEntry } from "./TopicSimulationsManager";

// "Add Group" picker for Group Simulations: lists every simulation card
// inserted into the chapter's topics (the "Inserted Simulations" of the
// topic editor), lets the admin tick the ones to chain, and builds one group
// from the selection or one group per topic. Each new step is prefilled with
// the credential fields it should be checked against, so the admin only has
// to adjust the values.

export interface PickedGroup {
  name: string;
  slots: TopicSimEntry[];
}

interface ChapterSim {
  key: string;
  url: string; // /simulations/... path, without ?simCfg
  slug: string;
  overrideId: string;
}

interface ChapterTopicSims {
  topicId: string;
  title: string;
  sims: ChapterSim[];
}

const overrideIdFromUrl = (url: string) =>
  url.match(/[?&]simCfg=([^&#]+)/)?.[1] || "";

// The group player embeds each step in an iframe and only trusts completion
// messages from its own origin, so keep just the /simulations/... path even
// when the topic card used an absolute https://iicpa.in/... link.
const toSimulationPath = (href: string): string => {
  try {
    const parsed = new URL(href, window.location.origin);
    if (!/\/simulations\//.test(parsed.pathname)) return "";
    parsed.searchParams.delete("simCfg");
    const search = parsed.searchParams.toString();
    return `${parsed.pathname}${search ? `?${search}` : ""}`;
  } catch {
    return "";
  }
};

const extractTopicSims = (topicId: string, html: string): ChapterSim[] => {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const cards = Array.from(doc.querySelectorAll("[data-simulation-card='true']"));
  // Fall back to plain links for topics written before simulation cards
  const anchors = cards.length
    ? cards.map((card) => card.querySelector("a"))
    : Array.from(doc.querySelectorAll("a[href*='/simulations/']"));

  const sims: ChapterSim[] = [];
  anchors.forEach((anchor, index) => {
    const href = anchor?.getAttribute("href") || "";
    const url = toSimulationPath(href);
    const slug = url ? simulationSlugFromUrl(url) : "";
    if (!url || !slug) return;
    sims.push({
      key: `${topicId}:${index}`,
      url,
      slug,
      overrideId: overrideIdFromUrl(href),
    });
  });
  return sims;
};

type CredConfig = {
  credentialFields?: { label?: string; value?: string }[];
  bannerText?: string;
  requireCredentialValidation?: boolean;
};

const fetchConfig = (endpoint: string): Promise<CredConfig | null> =>
  fetch(endpoint)
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);

// Snapshot of a step's credentials; when a step still matches the Simulation
// Manager defaults it was prefilled from, saving does not create an override.
export const credSnapshot = (entry: {
  credFields: { label: string; value: string }[];
  bannerText: string;
  validate: boolean;
}) =>
  JSON.stringify({
    f: entry.credFields
      .filter((field) => field.label.trim() && field.value.trim())
      .map((field) => [field.label.trim(), field.value.trim()]),
    b: entry.bannerText.trim(),
    v: entry.validate,
  });

const buildSlot = async (sim: ChapterSim, title: string): Promise<TopicSimEntry> => {
  const API_BASE = getApiBase();
  // A topic card with its own credentials is copied as an independent
  // override (removing the group must never delete the topic's override).
  const fromTopic = sim.overrideId
    ? await fetchConfig(`${API_BASE}/simulation-configs/public/override/${sim.overrideId}`)
    : null;
  const config =
    fromTopic || (await fetchConfig(`${API_BASE}/simulation-configs/public/${sim.slug}`));

  const credFields = (config?.credentialFields || [])
    .filter((field) => field?.label)
    .map((field) => ({ label: field.label || "", value: field.value || "" }));
  const entry: TopicSimEntry = {
    id: `gsim-slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    url: sim.url,
    imageUrl: "",
    credFields: credFields.length
      ? credFields
      : [
          { label: "Username", value: "" },
          { label: "Password", value: "" },
        ],
    bannerText: config?.bannerText || "",
    validate: config?.requireCredentialValidation !== false,
    overrideId: "",
    credsLoaded: true,
  };
  if (!fromTopic && config) entry.defaultSnapshot = credSnapshot(entry);
  return entry;
};

export default function ChapterSimulationPicker({
  chapterId,
  existingGroupCount,
  onCancel,
  onCreate,
}: {
  chapterId: string;
  existingGroupCount: number;
  onCancel: () => void;
  onCreate: (groups: PickedGroup[]) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topics, setTopics] = useState<ChapterTopicSims[]>([]);
  const [emptyTopicCount, setEmptyTopicCount] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${getApiBase()}/topics/by-chapter/${chapterId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        if (cancelled) return;
        const list: { _id: string; title?: string; content?: string }[] =
          Array.isArray(data) ? data : data?.topics || [];
        const withSims: ChapterTopicSims[] = [];
        let empty = 0;
        list.forEach((topic) => {
          const sims = extractTopicSims(String(topic._id), topic.content || "");
          if (sims.length) {
            withSims.push({
              topicId: String(topic._id),
              title: topic.title || "Untitled topic",
              sims,
            });
          } else {
            empty += 1;
          }
        });
        setTopics(withSims);
        setEmptyTopicCount(empty);
        setSelected(new Set(withSims.flatMap((t) => t.sims.map((s) => s.key))));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this chapter's topics.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [chapterId]);

  const allKeys = useMemo(
    () => topics.flatMap((t) => t.sims.map((s) => s.key)),
    [topics]
  );
  const selectedTopics = topics
    .map((topic) => ({
      ...topic,
      sims: topic.sims.filter((sim) => selected.has(sim.key)),
    }))
    .filter((topic) => topic.sims.length);
  const selectedCount = selectedTopics.reduce((n, t) => n + t.sims.length, 0);

  const toggle = (keys: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      keys.forEach((key) => (on ? next.add(key) : next.delete(key)));
      return next;
    });

  const stepTitle = (topic: ChapterTopicSims, index: number) =>
    topic.sims.length > 1 ? `${topic.title} – Part ${index + 1}` : topic.title;

  const create = async (mode: "single" | "perTopic") => {
    if (!selectedCount || creating) return;
    setCreating(true);
    try {
      const builtTopics = await Promise.all(
        selectedTopics.map(async (topic) => ({
          title: topic.title,
          slots: await Promise.all(
            topic.sims.map((sim, i) => buildSlot(sim, stepTitle(topic, i)))
          ),
        }))
      );
      if (mode === "perTopic") {
        onCreate(builtTopics.map((t) => ({ name: t.title, slots: t.slots })));
      } else {
        onCreate([
          {
            name:
              builtTopics.length === 1
                ? builtTopics[0].title
                : `Group ${existingGroupCount + 1}`,
            slots: builtTopics.flatMap((t) => t.slots),
          },
        ]);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Add group from this chapter&apos;s simulations
          </h3>
          <p className="text-sm text-gray-500">
            Simulations inserted in each topic of the chapter. Tick the ones to
            chain, in topic order. Credential boxes are prefilled on every step
            so you can change the values afterwards.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Loading topics…
            </p>
          ) : error ? (
            <p className="py-10 text-center text-sm text-red-600">{error}</p>
          ) : topics.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">
              No simulations are inserted in this chapter&apos;s topics yet. Use
              &quot;Empty group&quot; to add simulation URLs by hand.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {selectedCount} of {allKeys.length} selected
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => toggle(allKeys, true)}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(allKeys, false)}
                    className="font-medium text-gray-500 hover:text-gray-800"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {topics.map((topic) => {
                const keys = topic.sims.map((s) => s.key);
                const allOn = keys.every((key) => selected.has(key));
                return (
                  <div
                    key={topic.topicId}
                    className="rounded-lg border border-gray-200"
                  >
                    <label className="flex cursor-pointer items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={allOn}
                        onChange={(e) => toggle(keys, e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span className="flex-1 font-semibold text-gray-800">
                        {topic.title}
                      </span>
                      <span className="text-xs text-gray-500">
                        {topic.sims.length} simulation
                        {topic.sims.length > 1 ? "s" : ""}
                      </span>
                    </label>
                    <div className="divide-y divide-gray-100">
                      {topic.sims.map((sim) => (
                        <label
                          key={sim.key}
                          className="flex cursor-pointer items-center gap-3 px-4 py-2"
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(sim.key)}
                            onChange={(e) => toggle([sim.key], e.target.checked)}
                            className="h-4 w-4"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-sm text-gray-800">
                              {sim.slug}
                            </div>
                            <div className="truncate text-xs text-gray-400">
                              {sim.url}
                            </div>
                          </div>
                          <span
                            className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${
                              sim.overrideId
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {sim.overrideId
                              ? "Custom credentials"
                              : "Simulation Manager defaults"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}

              {emptyTopicCount > 0 && (
                <p className="text-xs text-gray-400">
                  {emptyTopicCount} topic{emptyTopicCount > 1 ? "s have" : " has"}{" "}
                  no inserted simulations.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 px-6 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={creating}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onCreate([{ name: `Group ${existingGroupCount + 1}`, slots: [] }])}
            disabled={creating}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Empty group
          </button>
          <button
            type="button"
            onClick={() => create("perTopic")}
            disabled={!selectedCount || creating}
            className="rounded-lg border border-green-500 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-40"
          >
            One group per topic ({selectedTopics.length})
          </button>
          <button
            type="button"
            onClick={() => create("single")}
            disabled={!selectedCount || creating}
            className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-40"
          >
            {creating ? "Creating…" : `Create 1 group (${selectedCount} steps)`}
          </button>
        </div>
      </div>
    </div>
  );
}
