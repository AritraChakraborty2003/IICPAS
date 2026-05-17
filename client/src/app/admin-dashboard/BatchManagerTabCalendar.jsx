import React, { useState } from "react";
import { X, Calendar as CalendarIcon, Save } from "lucide-react";

export function CalendarSidePanel({ selectedItem, onClose, onSave }) {
  const [startTime, setStartTime] = useState(selectedItem?.start_time || "");
  const [endTime, setEndTime] = useState(selectedItem?.end_time || "");

  const handleSave = () => {
    onSave(selectedItem.id, selectedItem.type, startTime, endTime, selectedItem.parentIds);
    onClose();
  };

  if (!selectedItem) return null;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-gray-100 bg-white shadow-sm w-80 shrink-0">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-emerald-600" />
          Set Time
        </h4>
        <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{selectedItem.type}</span>
          <h5 className="text-sm font-semibold text-gray-900 mt-1">{selectedItem.title}</h5>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 p-5">
        <button
          onClick={handleSave}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Save className="h-4 w-4" />
          Apply Schedule
        </button>
      </div>
    </div>
  );
}
