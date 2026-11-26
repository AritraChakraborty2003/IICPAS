"use client";
// Course overview for the Digital Hub: course header (access info, overall
// progress, course assessment) followed by numbered chapter cards with their
// lessons, practical assignments, chapter quiz, progress and a Start button.
import React from "react";
import { FaClipboardCheck, FaLock, FaPlay, FaRedo, FaCheckCircle, FaArrowLeft, FaTasks } from "react-icons/fa";

export interface OverviewChapter {
  _id: string;
  title: string;
  topics?: Array<{ _id: string }>;
}

export interface ChapterItemSummary {
  _id: string;
  chapterId: string;
  title: string;
  kind: "assignment" | "quiz";
  questionCount: number;
}

interface CourseOverviewProps<C extends OverviewChapter> {
  courseTitle: string;
  chapters: C[];
  isDarkMode: boolean;
  courseProgress: number;
  accessGivenOn?: Date | null;
  daysRemaining?: number | null;
  items: ChapterItemSummary[];
  currentChapterId?: string | null;
  getChapterPercent: (chapter: C) => number;
  isChapterLocked: (chapter: C, index: number) => boolean;
  onStartChapter: (chapter: C) => void;
  onOpenItem: (chapter: C, itemId: string) => void;
  onTakeAssessment?: () => void;
  onBack?: () => void;
}

const formatDate = (d?: Date | null) =>
  d ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(d) : "-";

export default function CourseOverview<C extends OverviewChapter>({
  courseTitle,
  chapters,
  isDarkMode,
  courseProgress,
  accessGivenOn,
  daysRemaining,
  items,
  currentChapterId,
  getChapterPercent,
  isChapterLocked,
  onStartChapter,
  onOpenItem,
  onTakeAssessment,
  onBack,
}: CourseOverviewProps<C>) {
  const card = isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white";
  const muted = isDarkMode ? "text-slate-400" : "text-slate-500";
  const heading = isDarkMode ? "text-slate-100" : "text-slate-900";
  const track = isDarkMode ? "bg-slate-800" : "bg-slate-200";
  const pct = Math.max(0, Math.min(100, Math.round(courseProgress || 0)));

  return (
    <div className="not-prose mx-auto w-full max-w-6xl space-y-5">
      {/* Course header */}
      <section className={`rounded-xl border p-5 shadow-sm ${card}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            {onBack && (
              <button type="button" onClick={onBack} className={`mb-2 inline-flex items-center gap-1.5 text-xs font-semibold ${muted} hover:underline`}>
                <FaArrowLeft className="h-3 w-3" /> My Courses
              </button>
            )}
            <h1 className={`text-xl font-bold sm:text-2xl ${heading}`}>{courseTitle || "Course"}</h1>
            <p className="mt-1 text-xs text-blue-600">
              Access given on: {formatDate(accessGivenOn)} &nbsp;·&nbsp; Days remaining:{" "}
              {typeof daysRemaining === "number" ? Math.max(0, daysRemaining) : "-"}
            </p>
            {onTakeAssessment && (
              <button
                type="button"
                onClick={onTakeAssessment}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800"
              >
                <FaClipboardCheck /> Take Assessment
              </button>
            )}
          </div>

          <div className={`w-full rounded-lg border p-4 lg:max-w-xl ${isDarkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-center gap-3">
              <span className={`shrink-0 text-xs font-semibold ${heading}`}>Course progress</span>
              {/* One segment per chapter */}
              <div className="flex flex-1 gap-1">
                {(chapters.length ? chapters : [null]).map((ch, i) => {
                  const p = ch ? getChapterPercent(ch) : pct;
                  return (
                    <div key={ch?._id || i} className={`h-1.5 flex-1 overflow-hidden rounded-full ${track}`}>
                      <div className={`h-full rounded-full ${p >= 100 ? "bg-green-600" : "bg-blue-600"}`} style={{ width: `${p}%` }} />
                    </div>
                  );
                })}
              </div>
              <span className={`shrink-0 text-xs font-semibold ${muted}`}>{pct}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Chapters */}
      <section className={`overflow-hidden rounded-xl border shadow-sm ${card}`}>
        {chapters.length === 0 && <p className={`p-6 text-sm ${muted}`}>No chapters are available for this course yet.</p>}
        {chapters.map((chapter, index) => {
          const locked = isChapterLocked(chapter, index);
          const percent = getChapterPercent(chapter);
          const chapterItems = items.filter((x) => String(x.chapterId) === String(chapter._id));
          const assignments = chapterItems.filter((x) => x.kind === "assignment");
          const quiz = chapterItems.find((x) => x.kind === "quiz");
          const lessons = chapter.topics?.length || 0;
          const isCurrent = String(currentChapterId || "") === String(chapter._id);
          const action = locked ? "Locked" : percent >= 100 ? "Review" : percent > 0 || isCurrent ? "Continue" : "Start";
          return (
            <div
              key={chapter._id}
              className={`border-b px-5 py-4 last:border-b-0 ${isDarkMode ? "border-slate-800" : "border-slate-100"} ${locked ? "opacity-70" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className={`flex items-center gap-2 text-sm font-semibold sm:text-base ${heading}`}>
                    {index + 1}. {chapter.title}
                    {percent >= 100 && <FaCheckCircle className="h-3.5 w-3.5 text-green-600" title="Completed" />}
                    {locked && <FaLock className="h-3 w-3 text-amber-500" title="Locked" />}
                  </h2>
                  <p className={`mt-2 text-xs ${muted}`}>
                    {lessons} {lessons === 1 ? "Lesson" : "Lessons"}
                    {assignments.length > 0 && ` · ${assignments.length} Practical ${assignments.length === 1 ? "Assignment" : "Assignments"}`}
                    {quiz && ` · Chapter Assessment (${quiz.questionCount} questions)`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {quiz && (
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => onOpenItem(chapter, quiz._id)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FaTasks className="h-3 w-3" /> Chapter Assessment
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => onStartChapter(chapter)}
                    className={`inline-flex min-w-[84px] items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed ${
                      locked
                        ? "border-slate-300 text-slate-400"
                        : isDarkMode
                          ? "border-blue-500 text-blue-300 hover:bg-slate-800"
                          : "border-blue-300 text-blue-700 hover:bg-blue-50"
                    }`}
                  >
                    {action === "Locked" ? <FaLock className="h-3 w-3" /> : action === "Review" ? <FaRedo className="h-3 w-3" /> : <FaPlay className="h-2.5 w-2.5" />}
                    {action}
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className={`h-1.5 flex-1 overflow-hidden rounded-full ${track}`}>
                  <div className={`h-full rounded-full ${percent >= 100 ? "bg-green-600" : "bg-blue-600"}`} style={{ width: `${percent}%` }} />
                </div>
                <span className={`w-9 shrink-0 text-right text-xs ${muted}`}>{percent}%</span>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
