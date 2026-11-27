"use client";
import React, { useMemo, useState } from "react";
import { FaDesktop, FaMobileAlt } from "react-icons/fa";
import { Modal, Badge } from "./ui";
import { formatDate, textStats } from "./aiClient";
import {
  DEFAULT_CONTENT_FONT_FAMILY,
  normalizeDigitalHubContentHtml,
} from "../../utils/contentFontFamily";

/**
 * Shows content exactly as the Student Portal (Digital Hub) renders topic
 * content: same normalizer, same `digital-hub-content topic-content-light`
 * styles from globals.css. Preview only - never publishes.
 */
export default function StudentPreviewModal({ open, onClose, title, html, meta = {} }) {
  const [device, setDevice] = useState("desktop");
  const rendered = useMemo(
    () => normalizeDigitalHubContentHtml(html || "", DEFAULT_CONTENT_FONT_FAMILY),
    [html]
  );
  const { words } = textStats(html);
  const readMins = Math.max(1, Math.round(words / 200));
  const mobile = device === "mobile";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="full"
      title="Student Portal Preview"
      subtitle="How this content will look to students. Previewing does not publish anything."
      bodyClassName="bg-slate-100 p-3 sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1">
          {[
            ["desktop", <FaDesktop key="d" />, "Desktop"],
            ["mobile", <FaMobileAlt key="m" />, "Mobile"],
          ].map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => setDevice(id)}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-semibold ${
                device === id ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">
          {words} words · ~{readMins} min read
        </span>
      </div>

      <div className={`mx-auto transition-all ${mobile ? "w-[390px] max-w-full" : "w-full max-w-6xl"}`}>
        <div className={`overflow-hidden bg-[#f7f5f2] shadow-xl ${mobile ? "rounded-[2rem] border-[10px] border-slate-800" : "rounded-xl border border-slate-200"}`}>
          {/* Digital Hub style header */}
          <div className="flex items-center justify-between gap-3 bg-white px-4 py-3 border-b border-stone-200">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/images/logo.png" alt="IICPA" className="h-8 w-auto object-contain" />
              {!mobile && <span className="text-sm font-semibold text-slate-500">Digital Hub</span>}
            </div>
            {meta.contentType && <Badge className="border-blue-200 bg-blue-50 text-blue-700">{meta.contentType}</Badge>}
          </div>

          <div className={mobile ? "p-3" : "p-6 lg:p-8"}>
            <div className="mb-4">
              {meta.breadcrumb && <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{meta.breadcrumb}</p>}
              <h1 className={`${mobile ? "text-xl" : "text-3xl"} mt-1 font-bold text-slate-900`}>{title || "Untitled"}</h1>
              <p className="mt-1 text-xs text-slate-500">
                {[meta.tone && `${meta.tone} tone`, meta.updatedAt && `Updated ${formatDate(meta.updatedAt)}`, `~${readMins} min read`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            <div
              className={`digital-hub-content topic-content-light min-h-[20rem] rounded-2xl border border-stone-200 bg-white leading-relaxed text-slate-900 shadow-sm ${
                mobile ? "p-4 text-sm" : "p-8 text-[0.98rem]"
              }`}
              style={{ fontFamily: DEFAULT_CONTENT_FONT_FAMILY }}
            >
              {rendered ? (
                <div dangerouslySetInnerHTML={{ __html: rendered }} />
              ) : (
                <p className="text-slate-400">There is no content to preview yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
