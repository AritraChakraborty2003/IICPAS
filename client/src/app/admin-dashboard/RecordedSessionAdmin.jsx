"use client";

import { getApiOrigin } from "@/lib/apiBase";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, CalendarDays, Clock3, RefreshCw, PlayCircle } from "lucide-react";

const API = getApiOrigin();

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not available";

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const formatTimeRange = (timeRange = "") => {
  const [start = "", end = ""] = String(timeRange).split(" - ");

  const formatTime = (timeStr) => {
    if (!timeStr) return "";

    const [hour, minute] = timeStr.split(":").map(Number);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return timeStr;

    const date = new Date();
    date.setHours(hour, minute, 0, 0);

    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const formattedStart = formatTime(start);
  const formattedEnd = formatTime(end);

  if (!formattedStart && !formattedEnd) return "Time not available";
  if (!formattedEnd) return formattedStart;
  return `${formattedStart} - ${formattedEnd}`;
};

const buildSessionLink = (value = "") => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export default function RecordedSessionAdmin() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Admin session not found. Please log in again.");
        return;
      }

      const res = await fetch(`${API}/api/live-sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to fetch recorded sessions");
      }

      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Recorded session fetch failed:", err);
      setError(err?.message || "Failed to fetch recorded sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const completedSessions = useMemo(() => {
    return sessions
      .filter((session) => String(session?.status || "").toLowerCase() === "completed")
      .sort((left, right) => {
        const leftTime = new Date(left?.date || 0).getTime();
        const rightTime = new Date(right?.date || 0).getTime();
        return rightTime - leftTime;
      });
  }, [sessions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
            <PlayCircle className="h-3.5 w-3.5" />
            Recorded Sessions
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Completed Live Sessions</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Sessions move here automatically once their live date and time are over. The existing live-session link is shown as the recorded-session link.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Total Completed
            </div>
            <div className="mt-1 text-2xl font-bold text-emerald-900">{completedSessions.length}</div>
          </div>
          <button
            onClick={fetchSessions}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          Loading recorded sessions...
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-10 text-center text-red-700 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          {error}
        </div>
      ) : completedSessions.length === 0 ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <h2 className="text-xl font-semibold text-slate-900">No completed sessions yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Completed live sessions will appear here automatically once their scheduled time is over.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {completedSessions.map((session) => {
            const sessionLink = buildSessionLink(session?.link);

            return (
              <article
                key={session._id}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      Completed
                    </div>
                    <h2 className="mt-4 text-2xl font-bold leading-tight text-slate-900">
                      {session?.title || "Untitled session"}
                    </h2>
                  </div>

                  {sessionLink ? (
                    <a
                      href={sessionLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                      aria-label="Open recorded session link"
                      title="Open recorded session link"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  ) : (
                    <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                      <ExternalLink className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div>
                    <span className="font-semibold text-slate-900">Instructor:</span>{" "}
                    {session?.instructor || "Not specified"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Course:</span>{" "}
                    {session?.courseId?.title || "Unassigned"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Chapter:</span>{" "}
                    {session?.chapterId?.title || "Unassigned"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Category:</span>{" "}
                    {session?.category || "Unassigned"}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-emerald-700" />
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Completed Date
                      </div>
                      <div className="font-semibold text-slate-900">{formatDate(session?.date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock3 className="h-4 w-4 text-emerald-700" />
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Time
                      </div>
                      <div className="font-semibold text-slate-900">
                        {formatTimeRange(session?.time)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Recorded link:{" "}
                    <span className="font-medium text-slate-700">
                      {sessionLink ? "Available" : "Not available"}
                    </span>
                  </div>

                  {sessionLink ? (
                    <a
                      href={sessionLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Open Recording Link
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-400">
                      Link Missing
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
