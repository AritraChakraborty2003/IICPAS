"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, ChevronRight } from "lucide-react";
import { getApiBase } from "@/lib/apiBase";
import { SIM_GROUP_COMPLETE_MESSAGE } from "@/lib/useSimGroupComplete";
import { simulationSlugFromUrl } from "@/app/components/TopicSimulationsManager";

interface GroupSlot {
  url: string;
  title?: string;
  imageUrl?: string;
}

interface SimulationGroup {
  name: string;
  slots: GroupSlot[];
}

type LoadState = "loading" | "error" | "ready";

// Auto-advancing player for a "Group Simulations" sequence: each slot renders
// in an iframe; when that simulation reports completion (via
// useSimGroupComplete's postMessage), the player automatically advances to
// the next slot. A manual "Skip to next" button covers simulations that
// haven't been retrofitted with the completion hook yet.
export default function SimulationGroupPlayerPage() {
  const params = useParams<{ caseStudyId: string; groupIndex: string }>();
  const caseStudyId = params.caseStudyId;
  const groupIndex = Number(params.groupIndex);

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [group, setGroup] = useState<SimulationGroup | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showStepTick, setShowStepTick] = useState(false);
  const [groupComplete, setGroupComplete] = useState(false);

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  useEffect(() => {
    let cancelled = false;
    fetch(`${getApiBase()}/case-studies/${caseStudyId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        const groups: SimulationGroup[] = data?.simulationGroups || [];
        const found = groups[groupIndex];
        if (!found || !found.slots?.length) {
          setLoadState("error");
          return;
        }
        setGroup(found);
        setLoadState("ready");
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [caseStudyId, groupIndex]);

  const advance = () => {
    setShowStepTick(true);
    setTimeout(() => {
      setShowStepTick(false);
      setCurrentIndex((i) => {
        const next = i + 1;
        if (!group || next >= group.slots.length) {
          setGroupComplete(true);
          return i;
        }
        return next;
      });
    }, 1000);
  };

  useEffect(() => {
    if (!group) return;
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== SIM_GROUP_COMPLETE_MESSAGE) return;
      const currentSlot = group.slots[currentIndexRef.current];
      if (!currentSlot) return;
      const expectedSlug = simulationSlugFromUrl(currentSlot.url);
      if (event.data.slug !== expectedSlug) return;
      advance();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  if (loadState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f0f0] text-[15px] text-[#555]">
        Loading group…
      </div>
    );
  }

  if (loadState === "error" || !group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-[#f0f0f0] text-center">
        <p className="text-[16px] font-semibold text-[#c0392b]">
          This simulation group could not be loaded.
        </p>
        <p className="text-[13px] text-[#777]">
          It may have been removed, or the group index is invalid.
        </p>
      </div>
    );
  }

  const slots = group.slots;
  const currentSlot = slots[currentIndex];

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f0f0]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ddd] bg-white px-6 py-3">
        <div>
          <div className="text-[15px] font-bold text-[#157a72]">{group.name || "Simulation Group"}</div>
          <div className="text-[12.5px] text-[#777]">
            Step {Math.min(currentIndex + 1, slots.length)} of {slots.length}
            {currentSlot?.title ? `: ${currentSlot.title}` : ""}
          </div>
        </div>
        {!groupComplete && (
          <button
            onClick={advance}
            className="flex items-center gap-1.5 rounded-full border border-[#157a72] px-4 py-1.5 text-[13px] font-semibold text-[#157a72] hover:bg-[#eaf7f4]"
          >
            Skip to next <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="relative flex-1">
        {groupComplete ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-16">
            <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]">
              <CheckCircle size={52} className="text-white" />
            </div>
            <p className="text-[20px] font-bold text-[#157a72]">Group Complete!</p>
            <p className="text-[13.5px] text-[#666]">
              You&apos;ve finished all {slots.length} simulations in this group.
            </p>
          </div>
        ) : (
          <iframe
            key={currentIndex}
            src={currentSlot.url}
            className="h-full min-h-[calc(100vh-64px)] w-full border-0"
            title={currentSlot.title || `Simulation ${currentIndex + 1}`}
          />
        )}

        {showStepTick && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/45 backdrop-blur-sm">
            <div
              className="flex h-[90px] w-[90px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]"
              style={{ animation: "simGroupStepTick 0.4s ease-out" }}
            >
              <CheckCircle size={44} className="text-white" />
            </div>
            <p className="text-[16px] font-bold text-white">Step Complete!</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes simGroupStepTick {
          0% {
            transform: scale(0.4);
            opacity: 0;
          }
          70% {
            transform: scale(1.08);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
