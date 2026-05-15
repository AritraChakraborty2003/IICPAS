"use client";

import React, { useMemo } from "react";
import {
  buildTopicLessonRows,
  formatTopicLessonDateTime,
  getTopicLessonSourceLabel,
  getTopicLessonSourceUrl,
  isTopicLessonVisible,
} from "@/lib/topicLessons";
import { DEFAULT_CONTENT_FONT_FAMILY } from "../utils/contentFontFamily";
import { PlayCircle, Radio, CalendarDays, ExternalLink } from "lucide-react";

const DIGITAL_HUB_FONT_STACK = DEFAULT_CONTENT_FONT_FAMILY;

const LessonList = ({ title, rows, actionLabel, actionTone = "blue" }) => {
  if (!rows.length) return null;

  const accent =
    actionTone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-blue-200 bg-blue-50 text-blue-800";
  const buttonClass =
    actionTone === "green"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : "bg-blue-600 hover:bg-blue-700";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">
            {rows.length} {rows.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const url = getTopicLessonSourceUrl(row);
          const sourceLabel = getTopicLessonSourceLabel(row);
          const liveSession =
            row.liveSessionId && typeof row.liveSessionId === "object"
              ? row.liveSessionId
              : null;
          return (
            <div
              key={row.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                      {row.kind === "live" ? (
                        <Radio className="h-3.5 w-3.5" />
                      ) : (
                        <PlayCircle className="h-3.5 w-3.5" />
                      )}
                      {row.kind === "live" ? "Live" : "Recorded"}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${accent}`}>
                      {sourceLabel}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      Order {row.order}
                    </span>
                  </div>

                  <h4 className="mt-2 text-sm font-semibold text-slate-900">
                    {row.title}
                  </h4>

                  <p className="mt-1 text-sm text-slate-600">
                    Topic: <span className="font-medium">{row.topicTitle}</span>
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatTopicLessonDateTime(row.publishAt)}
                    </span>
                    {liveSession ? (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatTopicLessonDateTime(liveSession.date)}
                        {liveSession.time ? ` • ${liveSession.time}` : ""}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                    disabled={!url}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
                      url ? buttonClass : "cursor-not-allowed bg-slate-300"
                    }`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {actionLabel}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function TopicLessonsDisplay({
  topic,
  showLegacyIntroVideo = true,
}) {
  const recordedRows = useMemo(
    () =>
      buildTopicLessonRows(topic ? [topic] : [], "recorded", {
        includeLegacyIntro: showLegacyIntroVideo,
      }),
    [topic, showLegacyIntroVideo]
  );
  const liveRows = useMemo(
    () => buildTopicLessonRows(topic ? [topic] : [], "live"),
    [topic]
  );

  const visibleRecorded = recordedRows.filter((row) =>
    isTopicLessonVisible(row)
  );
  const visibleLive = liveRows.filter((row) => isTopicLessonVisible(row));

  if (visibleRecorded.length === 0 && visibleLive.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4" style={{ fontFamily: DIGITAL_HUB_FONT_STACK }}>
      {visibleRecorded.length > 0 ? (
        <LessonList
          title="Recorded Classes"
          rows={visibleRecorded}
          actionLabel="Watch"
          actionTone="blue"
        />
      ) : null}

      {visibleLive.length > 0 ? (
        <LessonList
          title="Live Classes"
          rows={visibleLive}
          actionLabel="Join Live"
          actionTone="green"
        />
      ) : null}
    </div>
  );
}
