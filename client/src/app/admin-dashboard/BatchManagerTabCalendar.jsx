import React, { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, Save, ChevronLeft, ChevronRight, Clock, Check } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const prevMonthLastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const daysInPrevMonth = prevMonthLastDay.getDate();
  const startDay = firstDay.getDay();
  const matrix = [];
  let day = 1;
  let nextMonthDay = 1;
  for (let i = 0; i < 6; i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      if (i === 0 && j < startDay) {
        week.push({
          day: daysInPrevMonth - startDay + j + 1,
          isCurrentMonth: false,
          date: new Date(year, month - 1, daysInPrevMonth - startDay + j + 1),
        });
      } else if (day > daysInMonth) {
        week.push({
          day: nextMonthDay,
          isCurrentMonth: false,
          date: new Date(year, month + 1, nextMonthDay++),
        });
      } else {
        week.push({
          day,
          isCurrentMonth: true,
          date: new Date(year, month, day++),
        });
      }
    }
    matrix.push(week);
    if (day > daysInMonth && nextMonthDay > 7) break;
  }
  return matrix;
}

export function CalendarSidePanel({ selectedItem, onClose, onSave }) {
  const [startTime, setStartTime] = useState(selectedItem?.start_time || "");
  const [endTime, setEndTime] = useState(selectedItem?.end_time || "");
  const [activeInput, setActiveInput] = useState("start"); // "start" or "end"

  // Calendar navigation state
  const initialDate = selectedItem?.start_time ? new Date(selectedItem.start_time) : new Date();
  const [currentMonth, setCurrentMonth] = useState(
    isNaN(initialDate.getTime()) ? new Date() : initialDate
  );

  useEffect(() => {
    if (selectedItem) {
      setStartTime(selectedItem.start_time || "");
      setEndTime(selectedItem.end_time || "");
      const start = selectedItem.start_time ? new Date(selectedItem.start_time) : null;
      if (start && !isNaN(start.getTime())) {
        setCurrentMonth(start);
      } else {
        setCurrentMonth(new Date());
      }
    }
  }, [selectedItem]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const matrix = getMonthMatrix(year, month);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const getDatePart = (dateTimeStr) => {
    if (!dateTimeStr) return "";
    return dateTimeStr.split("T")[0];
  };

  const getTimePart = (dateTimeStr) => {
    if (!dateTimeStr) return "";
    const parts = dateTimeStr.split("T");
    return parts.length > 1 ? parts[1] : "";
  };

  const handleDateClick = (cellDate) => {
    const y = cellDate.getFullYear();
    const m = String(cellDate.getMonth() + 1).padStart(2, "0");
    const d = String(cellDate.getDate()).padStart(2, "0");
    const formattedDate = `${y}-${m}-${d}`;

    if (activeInput === "start") {
      const existingTime = getTimePart(startTime) || "09:00";
      setStartTime(`${formattedDate}T${existingTime}`);
      setActiveInput("end"); // Auto-switch to end date selection
    } else {
      const existingTime = getTimePart(endTime) || "18:00";
      setEndTime(`${formattedDate}T${existingTime}`);
    }
  };

  const handleTimeChange = (type, timeVal) => {
    if (type === "start") {
      const datePart = getDatePart(startTime) || getDatePart(new Date().toISOString());
      setStartTime(`${datePart}T${timeVal}`);
    } else {
      const datePart = getDatePart(endTime) || getDatePart(new Date().toISOString());
      setEndTime(`${datePart}T${timeVal}`);
    }
  };

  const handleSave = () => {
    onSave(selectedItem.id, selectedItem.type, startTime, endTime, selectedItem.parentIds);
    onClose();
  };

  if (!selectedItem) return null;

  // Compute date matches for grid highlights
  const parseLocalDateOnly = (dateTimeStr) => {
    if (!dateTimeStr) return null;
    const parts = dateTimeStr.split("T")[0].split("-");
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };

  const startD = parseLocalDateOnly(startTime);
  const endD = parseLocalDateOnly(endTime);

  return (
    <div className="flex h-full flex-col rounded-3xl border border-gray-100 bg-white shadow-lg w-[380px] shrink-0 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-emerald-600" />
          Set Time
        </h4>
        <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{selectedItem.type}</span>
          <h5 className="text-base font-bold text-gray-900 mt-2 leading-snug">{selectedItem.title}</h5>
        </div>

        {/* Input Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveInput("start")}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
              activeInput === "start"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Start: {getDatePart(startTime) || "Select..."}
          </button>
          <button
            type="button"
            onClick={() => setActiveInput("end")}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
              activeInput === "end"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            End: {getDatePart(endTime) || "Select..."}
          </button>
        </div>

        {/* Monthly Grid Calendar */}
        <div className="border border-gray-100 rounded-2xl p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-3 px-1">
            <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-lg bg-white hover:bg-gray-100 shadow-sm transition">
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-sm font-bold text-gray-800">
              {currentMonth.toLocaleString("default", { month: "long" })} {year}
            </span>
            <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-lg bg-white hover:bg-gray-100 shadow-sm transition">
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-[10px] font-bold text-gray-400 py-1 uppercase tracking-wide">
                {d}
              </div>
            ))}
            {matrix.flat().map((cell, idx) => {
              const cellDateZero = new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate());
              const isStart = startD && cellDateZero.getTime() === startD.getTime();
              const isEnd = endD && cellDateZero.getTime() === endD.getTime();
              const isBetween = startD && endD && cellDateZero.getTime() > startD.getTime() && cellDateZero.getTime() < endD.getTime();

              let cellStyle = "text-gray-700 hover:bg-gray-200";
              if (!cell.isCurrentMonth) {
                cellStyle = "text-gray-300";
              }
              if (isStart) {
                cellStyle = "bg-emerald-600 text-white font-bold ring-2 ring-emerald-100 shadow-md shadow-emerald-100";
              } else if (isEnd) {
                cellStyle = "bg-blue-600 text-white font-bold ring-2 ring-blue-100 shadow-md shadow-blue-100";
              } else if (isBetween) {
                cellStyle = "bg-emerald-50 text-emerald-800 font-semibold rounded-lg";
              }

              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleDateClick(cell.date)}
                  className={`h-9 w-9 text-xs flex flex-col items-center justify-center rounded-xl transition-all relative ${cellStyle}`}
                >
                  <span className={`${isStart || isEnd ? "mb-1 text-[10px]" : ""}`}>{cell.day}</span>
                  {isStart && (
                    <span className="absolute bottom-0.5 text-[6px] text-white bg-emerald-500 rounded-full p-0.5 border border-white/20 shadow-sm">
                      <Check className="h-1.5 w-1.5 stroke-[4]" />
                    </span>
                  )}
                  {isEnd && (
                    <span className="absolute bottom-0.5 text-[6px] text-white bg-blue-500 rounded-full p-0.5 border border-white/20 shadow-sm">
                      <X className="h-1.5 w-1.5 stroke-[4]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Fine Tuning */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 justify-between p-3 bg-gray-50 border border-gray-100 rounded-2xl">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-gray-800">Start Time</p>
                <p className="text-[10px] text-gray-500">{getDatePart(startTime) || "No date set"}</p>
              </div>
            </div>
            <input
              type="time"
              value={getTimePart(startTime)}
              onChange={(e) => handleTimeChange("start", e.target.value)}
              className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3 justify-between p-3 bg-gray-50 border border-gray-100 rounded-2xl">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs font-bold text-gray-800">End Time</p>
                <p className="text-[10px] text-gray-500">{getDatePart(endTime) || "No date set"}</p>
              </div>
            </div>
            <input
              type="time"
              value={getTimePart(endTime)}
              onChange={(e) => handleTimeChange("end", e.target.value)}
              className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <div className="border-t border-gray-100 p-5 bg-white">
        <button
          onClick={handleSave}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-95 duration-150"
        >
          <Save className="h-4 w-4" />
          Apply Schedule
        </button>
      </div>
    </div>
  );
}
