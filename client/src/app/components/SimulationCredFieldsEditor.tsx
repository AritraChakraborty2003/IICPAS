"use client";
import React from "react";

export interface CredField {
  label: string;
  value: string;
}

// Shared "credentials for this simulation" editor block — used by both
// TopicSimulationsManager (single simulation links) and
// SimulationGroupsManager (ordered groups of simulations), so the
// label/value/banner/validate UI stays identical and isn't duplicated.
export default function SimulationCredFieldsEditor({
  credFields,
  bannerText,
  validate,
  overrideId,
  credsLoaded,
  onPatch,
}: {
  credFields: CredField[];
  bannerText: string;
  validate: boolean;
  overrideId: string;
  credsLoaded: boolean;
  onPatch: (patch: {
    credFields?: CredField[];
    bannerText?: string;
    validate?: boolean;
  }) => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/40 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">
          Credentials for this simulation (optional)
        </span>
        <button
          type="button"
          onClick={() =>
            onPatch({ credFields: [...credFields, { label: "", value: "" }] })
          }
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          + Add Field
        </button>
      </div>
      {overrideId && !credsLoaded ? (
        <p className="py-2 text-xs text-gray-400">Loading saved credentials...</p>
      ) : (
        <div className="space-y-2">
          {credFields.map((field, fieldIndex) => (
            <div key={fieldIndex} className="flex items-center gap-2">
              <input
                value={field.label}
                onChange={(e) =>
                  onPatch({
                    credFields: credFields.map((item, i) =>
                      i === fieldIndex ? { ...item, label: e.target.value } : item
                    ),
                  })
                }
                placeholder="Label (e.g. Username)"
                className="w-2/5 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <input
                value={field.value}
                onChange={(e) =>
                  onPatch({
                    credFields: credFields.map((item, i) =>
                      i === fieldIndex ? { ...item, value: e.target.value } : item
                    ),
                  })
                }
                placeholder="Value"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() =>
                  onPatch({
                    credFields: credFields.filter((_, i) => i !== fieldIndex),
                  })
                }
                className="px-1 text-gray-400 hover:text-red-500"
                title="Remove field"
              >
                ×
              </button>
            </div>
          ))}
          <textarea
            value={bannerText}
            onChange={(e) => onPatch({ bannerText: e.target.value })}
            rows={2}
            placeholder="Banner text (optional) — leave empty to auto-generate from the fields"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={validate}
              onChange={(e) => onPatch({ validate: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            Validate these credentials on the simulation
          </label>
        </div>
      )}
    </div>
  );
}
