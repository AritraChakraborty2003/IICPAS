"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle, Lock } from "lucide-react";
import { getApiBase } from "@/lib/apiBase";
import { SIM_GROUP_COMPLETE_MESSAGE } from "@/lib/useSimGroupComplete";

interface PreviewSlot {
  url: string;
  title?: string;
}

interface PreviewGroup {
  name: string;
  slots: PreviewSlot[];
}

type LoadState =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "login" }
  | { kind: "denied"; message: string }
  | { kind: "error"; message: string };

// Continuous run of a case study / assignment simulation group: each
// simulation fills the whole screen with no extra chrome, and the next one
// only opens once the current one reports completion. The backend only
// returns the group to admins, employees with course/topic access and
// students who purchased the course.
export default function SimulationGroupPreviewPage() {
  const params = useParams<{ parentId: string; groupIndex: string }>();
  const parentId = params.parentId;
  const groupIndex = params.groupIndex;

  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [group, setGroup] = useState<PreviewGroup | null>(null);
  const [current, setCurrent] = useState(0);
  const [showTick, setShowTick] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const advancingRef = useRef(false);

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

  // Advance only when the simulation currently on screen reports completion.
  // Matching on the sending window (not the slug) also covers simulations
  // that finish on a follow-up page, e.g. e-way-bill-1 completing on the
  // e-way bill login page it navigates to.
  useEffect(() => {
    if (!group) return;
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== SIM_GROUP_COMPLETE_MESSAGE) return;
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      if (advancingRef.current) return;
      advancingRef.current = true;
      setShowTick(true);
      setTimeout(() => {
        setShowTick(false);
        setCurrent((i) => i + 1);
        advancingRef.current = false;
      }, 1200);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [group]);

  if (state.kind !== "ready" || !group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 px-4 text-center">
        {state.kind === "loading" ? (
          <p className="text-[15px] text-slate-500">Loading…</p>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow">
              <Lock size={26} className="text-slate-500" />
            </div>
            <p className="text-[17px] font-semibold text-slate-800">
              {state.kind === "login"
                ? "Please log in to open this simulation"
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
                Available to admins, staff with course access and students who
                have purchased the course.
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  const total = group.slots.length;

  if (current >= total) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f0f0f0] text-center">
        <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]">
          <CheckCircle size={52} className="text-white" />
        </div>
        <p className="text-[22px] font-bold text-[#157a72]">All simulations complete!</p>
        <p className="text-[14px] text-[#666]">
          You finished all {total} simulations{group.name ? ` in ${group.name}` : ""}.
        </p>
        <button
          onClick={() => setCurrent(0)}
          className="rounded-full bg-[#157a72] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0f5f59]"
        >
          Start again
        </button>
      </div>
    );
  }

  const slot = group.slots[current];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white">
      <iframe
        ref={iframeRef}
        key={current}
        src={slot.url}
        title={slot.title || `Simulation ${current + 1}`}
        className="h-full w-full border-0"
      />

      {showTick && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/45 backdrop-blur-sm">
          <div className="flex h-[90px] w-[90px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]">
            <CheckCircle size={44} className="text-white" />
          </div>
          <p className="text-[16px] font-bold text-white">
            {current + 1 < total
              ? `Step ${current + 1} of ${total} complete — starting the next one…`
              : "Final step complete!"}
          </p>
        </div>
      )}
    </div>
  );
}
