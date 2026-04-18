"use client";

import React from "react";

export default function WordImportControls({
  importMode,
  onImportModeChange,
  onFileSelected,
  onPreview,
  importing = false,
  importSummary = null,
}) {
  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Word Import
          </div>
          <div className="text-xs text-slate-600">
            Upload a `.doc` or `.docx` file and preserve spacing, page breaks,
            and formatting as much as Word allows.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            Mode
            <select
              value={importMode}
              onChange={(e) => onImportModeChange(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
              disabled={importing}
            >
              <option value="replace">Replace content</option>
              <option value="append">Append content</option>
            </select>
          </label>

          <label className="inline-flex cursor-pointer items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300">
            <input
              type="file"
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onFileSelected(file);
                }
                e.target.value = "";
              }}
              disabled={importing}
            />
            {importing ? "Importing..." : "Upload Word"}
          </label>

          <button
            type="button"
            onClick={onPreview}
            disabled={!importSummary}
            className="rounded-md border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Preview Imported Document
          </button>
        </div>
      </div>

      {importSummary && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-semibold text-green-900">
                {importSummary.fileName}
              </div>
              <div className="text-xs text-green-800">
                Mode: {importSummary.importMode} · Estimated pages:{" "}
                {importSummary.pageCount} · Page breaks:{" "}
                {importSummary.pageBreakCount}
              </div>
            </div>
            <div className="text-xs font-medium text-green-700">
              Conversion ready
            </div>
          </div>

          {Array.isArray(importSummary.warnings) &&
            importSummary.warnings.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-700">
                {importSummary.warnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            )}
        </div>
      )}
    </div>
  );
}

