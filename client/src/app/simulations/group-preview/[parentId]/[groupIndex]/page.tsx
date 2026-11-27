"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { getApiBase } from "@/lib/apiBase";
import { SIM_GROUP_COMPLETE_MESSAGE } from "@/lib/useSimGroupComplete";
import { simulationSlugFromUrl } from "@/app/components/TopicSimulationsManager";

interface PreviewSlot {
  url: string;
  title?: string;
}

interface PreviewGroup {
  parentType: "case-study" | "assignment";
  parentTitle: string;
  name: string;
  slots: PreviewSlot[];
}

type LoadState =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "login" }
  | { kind: "denied"; message: string }
  | { kind: "error"; message: string };

// Presentation-style ("PPT") preview of a case study / assignment simulation
// group: one simulation per slide, with a slide list, prev/next and
// fullscreen. The backend only returns the group to admins, employees with
// course/topic access and students who purchased the course.
export default function SimulationGroupPreviewPage() {
  const params = useParams<{ parentId: string; groupIndex: string }>();
  const parentId = params.parentId;
  const groupIndex = params.groupIndex;

  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [group, setGroup] = useState<PreviewGroup | null>(null);
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [showTick, setShowTick] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    let cancelled = false;
    const adminToken =
      typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

    fetch(`${getApiBase()}/simulation-groups/preview/${parentId}/${groupIndex}`, {
      credentials: "include",
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 401) return setState({ kind: "login" });
        if (res.status === 403)
          return setState({
            kind: "denied",
            message: data?.message || "You don't have access to this simulation group.",
          });
        if (!res.ok)
          return setState({
            kind: "error",
            message: data?.message || "This simulation group could not be loaded.",
          });
        setGroup(data);
        setState({ kind: "ready" });
      })
      .catch(() => {
        if (!cancelled)
          setState({ kind: "error", message: "This simulation group could not be loaded." });
      });
    return () => {
      cancelled = true;
    };
  }, [parentId, groupIndex]);

  const total = group?.slots.length || 0;
  // Index `total` is the closing "all done" slide
  const goTo = useCallback(
    (index: number) => setCurrent(Math.max(0, Math.min(index, total))),
    [total]
  );

  // A simulation reporting completion marks its slide done and moves on
  useEffect(() => {
    if (!group) return;
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== SIM_GROUP_COMPLETE_MESSAGE) return;
      const index = currentRef.current;
      const slot = group.slots[index];
      if (!slot || event.data.slug !== simulationSlugFromUrl(slot.url)) return;
      setDone((prev) => new Set(prev).add(index));
      setShowTick(true);
      setTimeout(() => {
        setShowTick(false);
        setCurrent((i) => (i === index ? i + 1 : i));
      }, 1000);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [group]);

  // Keyboard navigation while focus is on the presentation (not the slide)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") goTo(currentRef.current + 1);
      if (event.key === "ArrowLeft" || event.key === "PageUp") goTo(currentRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else stageRef.current?.requestFullscreen().catch(() => {});
  };

  if (state.kind !== "ready" || !group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 px-4 text-center">
        {state.kind === "loading" ? (
          <p className="text-[15px] text-slate-500">Loading presentation…</p>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow">
              <Lock size={26} className="text-slate-500" />
            </div>
            <p className="text-[17px] font-semibold text-slate-800">
              {state.kind === "login"
                ? "Please log in to open this simulation preview"
                : state.message}
            </p>
            {state.kind === "login" && (
              <div className="flex gap-3 text-sm">
                <Link href="/student-login" className="rounded-full bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700">
                  Student login
                </Link>
                <Link href="/admin" className="rounded-full border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">
                  Staff login
                </Link>
              </div>
            )}
            {state.kind === "denied" && (
              <p className="max-w-md text-sm text-slate-500">
                This preview is available to admins, staff with course access and
                students who have purchased the course.
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  const slot = group.slots[current];
  const isEnd = current >= total;
  const progress = Math.round((done.size / total) * 100);

  return (
    <div ref={stageRef} className="flex h-screen flex-col bg-slate-900 text-white">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-slate-950 px-4 py-2.5">
        <button
          onClick={() => setShowSidebar((v) => !v)}
          className="rounded p-1.5 text-slate-300 hover:bg-white/10"
          title={showSidebar ? "Hide slides" : "Show slides"}
        >
          {showSidebar ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold">
            {group.name || "Simulation Group"}
          </div>
          <div className="truncate text-[12px] text-slate-400">
            {group.parentType === "assignment" ? "Assignment" : "Case study"}
            {group.parentTitle ? ` · ${group.parentTitle}` : ""} · Preview
          </div>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[12.5px] font-medium">
          {isEnd ? "End" : `Slide ${current + 1} / ${total}`}
        </span>
        <button
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          className="flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 text-[13px] font-medium hover:bg-white/10 disabled:opacity-30"
        >
          <ChevronLeft size={15} /> Prev
        </button>
        <button
          onClick={() => goTo(current + 1)}
          disabled={isEnd}
          className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-emerald-600 disabled:opacity-30"
        >
          Next <ChevronRight size={15} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="rounded p-1.5 text-slate-300 hover:bg-white/10"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {/* Progress */}
      <div className="h-1 w-full bg-white/10">
        <div className="h-full bg-emerald-400 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Slide list */}
        {showSidebar && (
          <div className="w-60 shrink-0 overflow-y-auto border-r border-white/10 bg-slate-950/60 p-3">
            {group.slots.map((s, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`mb-2 flex w-full gap-2 rounded-lg border p-2 text-left transition ${
                  i === current
                    ? "border-emerald-400 bg-emerald-500/15"
                    : "border-white/10 hover:border-white/30 hover:bg-white/5"
                }`}
              >
                <span className="w-5 shrink-0 text-[12px] font-bold text-slate-400">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">
                    {s.title || `Simulation ${i + 1}`}
                  </span>
                  <span className="block truncate font-mono text-[11px] text-slate-500">
                    {simulationSlugFromUrl(s.url)}
                  </span>
                </span>
                {done.has(i) && <CheckCircle size={15} className="shrink-0 text-emerald-400" />}
              </button>
            ))}
          </div>
        )}

        {/* Slide stage */}
        <div className="relative flex min-w-0 flex-1 flex-col p-3">
          {isEnd ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl bg-white text-slate-800">
              <CheckCircle size={64} className="text-emerald-500" />
              <p className="text-2xl font-bold">End of presentation</p>
              <p className="text-sm text-slate-500">
                {done.size} of {total} simulations completed.
              </p>
              <button
                onClick={() => {
                  setDone(new Set());
                  goTo(0);
                }}
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Start again
              </button>
            </div>
          ) : (
            <>
              <div className="mb-2 text-[13px] text-slate-300">
                <span className="font-semibold text-white">
                  {slot.title || `Simulation ${current + 1}`}
                </span>
              </div>
              <iframe
                key={current}
                src={slot.url}
                title={slot.title || `Simulation ${current + 1}`}
                className="w-full flex-1 rounded-xl border-0 bg-white shadow-2xl"
              />
            </>
          )}

          {showTick && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/45 backdrop-blur-sm">
              <div className="flex h-[90px] w-[90px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]">
                <CheckCircle size={44} className="text-white" />
              </div>
              <p className="text-[16px] font-bold text-white">Slide complete!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
