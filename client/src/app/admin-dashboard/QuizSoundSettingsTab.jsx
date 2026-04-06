"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaVolumeUp, FaSave, FaUpload, FaSpinner } from "react-icons/fa";
import { getApiBase, getApiOrigin } from "@/lib/apiBase";

const DEFAULT_SETTINGS = {
  correctAnswerSound: "/sounds/success.mp3",
  wrongAnswerSound: "/sounds/error.mp3",
};

const resolveSoundUrl = (value, apiOrigin) => {
  const raw = (value || "").toString().trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/uploads/")) return `${apiOrigin}${raw}`;
  if (raw.startsWith("/")) return raw;
  return `${apiOrigin}/${raw.replace(/^\/+/, "")}`;
};

const QuizSoundSettingsTab = () => {
  const API_BASE = useMemo(() => getApiBase(), []);
  const API_ORIGIN = useMemo(() => getApiOrigin(), []);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [soundFiles, setSoundFiles] = useState({ correct: null, wrong: null });
  const [previewUrls, setPreviewUrls] = useState({ correct: "", wrong: "" });

  const resolvedCurrentSounds = useMemo(
    () => ({
      correct: resolveSoundUrl(settings.correctAnswerSound, API_ORIGIN),
      wrong: resolveSoundUrl(settings.wrongAnswerSound, API_ORIGIN),
    }),
    [settings, API_ORIGIN]
  );

  useEffect(() => {
    fetchSettings();
    return () => {
      if (previewUrls.correct?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrls.correct);
      }
      if (previewUrls.wrong?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrls.wrong);
      }
    };
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(`${API_BASE}/quiz-sounds/admin/settings`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (response.data?.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...response.data.settings });
      }
    } catch (error) {
      console.error("Error fetching quiz sound settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSoundChange = (type) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSoundFiles((prev) => ({ ...prev, [type]: file }));

    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrls((prev) => {
      if (prev[type]?.startsWith("blob:")) {
        URL.revokeObjectURL(prev[type]);
      }
      return { ...prev, [type]: newPreviewUrl };
    });
  };

  const uploadSound = async (file) => {
    const token = localStorage.getItem("adminToken");
    const formData = new FormData();
    formData.append("audio", file);

    const response = await axios.post(`${API_BASE}/quiz-sounds/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });

    if (!response.data?.success || !response.data?.soundUrl) {
      throw new Error("Upload failed");
    }

    return response.data.soundUrl;
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      let correctAnswerSound = settings.correctAnswerSound;
      let wrongAnswerSound = settings.wrongAnswerSound;

      if (soundFiles.correct) {
        correctAnswerSound = await uploadSound(soundFiles.correct);
      }

      if (soundFiles.wrong) {
        wrongAnswerSound = await uploadSound(soundFiles.wrong);
      }

      const token = localStorage.getItem("adminToken");
      const response = await axios.post(
        `${API_BASE}/quiz-sounds/settings`,
        { correctAnswerSound, wrongAnswerSound },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        }
      );

      if (response.data?.success) {
        toast.success("Quiz sound settings updated successfully");
        setSettings({ correctAnswerSound, wrongAnswerSound });
        setSoundFiles({ correct: null, wrong: null });
      } else {
        toast.error("Failed to update quiz sound settings");
      }
    } catch (error) {
      console.error("Error saving quiz sound settings:", error);
      toast.error("Error saving quiz sound settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-2xl text-blue-500" />
        <span className="ml-2 text-gray-600">Loading quiz sound settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <FaVolumeUp className="text-2xl text-blue-500" />
        <h1 className="text-2xl font-bold text-gray-800">Quiz Sound Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Correct Answer</h3>
          <audio
            controls
            className="w-full"
            src={previewUrls.correct || resolvedCurrentSounds.correct}
          />
          <label className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-600 transition-colors">
            <FaUpload />
            <span>Upload New Sound</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleSoundChange("correct")}
            />
          </label>
          <p className="text-sm text-gray-500">
            Current: {settings.correctAnswerSound || "Not set"}
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Wrong Answer</h3>
          <audio
            controls
            className="w-full"
            src={previewUrls.wrong || resolvedCurrentSounds.wrong}
          />
          <label className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-red-600 transition-colors">
            <FaUpload />
            <span>Upload New Sound</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleSoundChange("wrong")}
            />
          </label>
          <p className="text-sm text-gray-500">
            Current: {settings.wrongAnswerSound || "Not set"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-60"
        >
          <FaSave />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

export default QuizSoundSettingsTab;
