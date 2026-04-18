"use client";

import React, { useMemo } from "react";
import { splitHtmlIntoPages } from "./wordImportUtils";

export default function WordDocumentPreview({
  html,
  title = "Imported Word Document",
  fileName = "",
  pageCount = 1,
  warnings = [],
}) {
  const pages = useMemo(() => splitHtmlIntoPages(html), [html]);

  return (
    <div className="w-full">
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="text-xs text-slate-600">
              {fileName ? `${fileName} · ` : ""}
              {pageCount} page{pageCount === 1 ? "" : "s"}
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Page-faithful preview
          </div>
        </div>
        {warnings.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-700">
            {warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="max-h-[75vh] overflow-auto rounded-2xl bg-[#e9eef4] p-4 md:p-6">
        <div className="mx-auto flex w-fit flex-col gap-6">
          {pages.map((pageHtml, index) => (
            <div
              key={`${index}-${pageHtml.slice(0, 20)}`}
              className="word-page rounded-xl bg-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
              style={{
                width: "210mm",
                minHeight: "297mm",
                padding: "18mm 20mm",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              <div
                className="word-page-content text-[12pt] leading-[1.6] text-slate-900"
                style={{
                  fontFamily:
                    '"Times New Roman", Times, serif, "Noto Serif", serif',
                }}
                dangerouslySetInnerHTML={{ __html: pageHtml }}
              />
              <div className="mt-4 text-right text-[10px] text-slate-400">
                Page {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

