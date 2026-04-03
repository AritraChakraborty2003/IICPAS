"use client";
import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaArrowLeft } from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const API_BASE = getApiBase();

// Default course levels
const DEFAULT_LEVELS = [
  { value: "Executive Level", label: "Executive Level" },
  { value: "Professional Level", label: "Professional Level" },
];

export default function CourseLevelManager({ onBack }) {
  const [levels, setLevels] = useState(DEFAULT_LEVELS);
  const [loading, setLoading] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [newLevel, setNewLevel] = useState({ value: "", label: "" });

  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    try {
      const response = await axios.get(`${API_BASE}/course-levels`);
      if (response.data && response.data.length > 0) {
        setLevels(response.data);
      }
    } catch (error) {
      console.log("Using default levels");
    }
  };

  const saveLevels = async (updatedLevels) => {
    try {
      await axios.post(`${API_BASE}/course-levels`, { levels: updatedLevels });
      setLevels(updatedLevels);
      MySwal.fire("Success", "Course levels updated successfully!", "success");
    } catch (error) {
      MySwal.fire("Error", "Failed to update course levels", "error");
    }
  };

  const handleAddLevel = () => {
    if (!newLevel.value.trim() || !newLevel.label.trim()) {
      MySwal.fire("Error", "Please enter both value and label", "error");
      return;
    }

    const valueExists = levels.some(level => level.value.toLowerCase() === newLevel.value.toLowerCase());
    if (valueExists) {
      MySwal.fire("Error", "A level with this value already exists", "error");
      return;
    }

    const updatedLevels = [...levels, { ...newLevel }];
    saveLevels(updatedLevels);
    setNewLevel({ value: "", label: "" });
  };

  const handleEditLevel = (index) => {
    setEditingLevel({ index, ...levels[index] });
  };

  const handleUpdateLevel = () => {
    if (!editingLevel.value.trim() || !editingLevel.label.trim()) {
      MySwal.fire("Error", "Please enter both value and label", "error");
      return;
    }

    const valueExists = levels.some((level, idx) => 
      idx !== editingLevel.index && level.value.toLowerCase() === editingLevel.value.toLowerCase()
    );
    if (valueExists) {
      MySwal.fire("Error", "A level with this value already exists", "error");
      return;
    }

    const updatedLevels = [...levels];
    updatedLevels[editingLevel.index] = { value: editingLevel.value, label: editingLevel.label };
    saveLevels(updatedLevels);
    setEditingLevel(null);
  };

  const handleDeleteLevel = (index) => {
    MySwal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedLevels = levels.filter((_, idx) => idx !== index);
        saveLevels(updatedLevels);
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingLevel(null);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto bg-white rounded-2xl p-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold">Course Level Management</h3>
        <button
          type="button"
          onClick={onBack}
          className="bg-blue-700 text-white px-5 py-2 rounded flex items-center gap-2"
        >
          <FaArrowLeft /> Back to Courses
        </button>
      </div>

      {/* Add New Level */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h4 className="text-lg font-semibold mb-4">Add New Course Level</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Value</label>
            <input
              type="text"
              placeholder="e.g., executive-level"
              className="w-full border p-2 rounded"
              value={newLevel.value}
              onChange={(e) => setNewLevel({ ...newLevel, value: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Label</label>
            <input
              type="text"
              placeholder="e.g., Executive Level"
              className="w-full border p-2 rounded"
              value={newLevel.label}
              onChange={(e) => setNewLevel({ ...newLevel, label: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddLevel}
              className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 w-full justify-center"
            >
              <FaPlus /> Add Level
            </button>
          </div>
        </div>
      </div>

      {/* Levels List */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h4 className="text-lg font-semibold">Current Course Levels</h4>
        </div>
        <div className="divide-y">
          {levels.map((level, index) => (
            <div key={index} className="p-4 flex items-center justify-between">
              {editingLevel && editingLevel.index === index ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Value</label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded"
                      value={editingLevel.value}
                      onChange={(e) => setEditingLevel({ ...editingLevel, value: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Label</label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded"
                      value={editingLevel.label}
                      onChange={(e) => setEditingLevel({ ...editingLevel, label: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateLevel}
                      className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-1"
                    >
                      <FaEdit /> Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-500 text-white px-3 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="font-medium">{level.label}</div>
                    <div className="text-sm text-gray-500">Value: {level.value}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditLevel(index)}
                      className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-1"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLevel(index)}
                      className="bg-red-600 text-white px-3 py-2 rounded flex items-center gap-1"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {levels.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No course levels found. Add some levels to get started.
        </div>
      )}
    </div>
  );
}
