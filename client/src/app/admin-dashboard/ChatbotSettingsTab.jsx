"use client";

import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaRobot, FaSave, FaUpload, FaUser, FaSpinner } from "react-icons/fa";

const API = getApiBase();

const ChatbotSettingsTab = () => {
  const [settings, setSettings] = useState({
    assistantName: "Neha Singh",
    profilePicture:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    welcomeMessage:
      "Hi! I'm your course assistant. To provide you with personalized assistance, I'll need a few details from you.\n\nLet's start with your **Full Name** please:",
    status: "Online",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(`${API}/chatbot/admin/settings`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (response.data.success) {
        setSettings(response.data.settings);
        setImagePreview(response.data.settings.profilePicture);
      }
    } catch (error) {
      console.error("Error fetching chatbot settings:", error);
      // Use default settings if API fails
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("adminToken");

      let profilePictureUrl = settings.profilePicture;

      // Upload new image if selected
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const uploadResponse = await axios.post(
          `${API}/chatbot/upload/chatbot-image`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          }
        );

        if (uploadResponse.data.success) {
          profilePictureUrl = uploadResponse.data.imageUrl;
        }
      }

      const updatedSettings = {
        ...settings,
        profilePicture: profilePictureUrl,
      };

      const response = await axios.post(
        `${API}/chatbot/settings`,
        updatedSettings,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        }
      );

      if (response.data.success) {
        toast.success("Chatbot settings updated successfully!");
        setSettings(updatedSettings);
        setImageFile(null);
      } else {
        toast.error("Failed to update chatbot settings");
      }
    } catch (error) {
      console.error("Error saving chatbot settings:", error);
      toast.error("Error saving chatbot settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-2xl text-blue-500" />
        <span className="ml-2 text-gray-600">Loading chatbot settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <FaRobot className="text-2xl text-green-500" />
        <h1 className="text-2xl font-bold text-gray-800">Chatbot Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Profile Picture */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaUser className="text-green-500" />
              Assistant Profile
            </h3>

            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-green-500">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Assistant Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <FaUser className="text-4xl text-gray-500" />
                    </div>
                  )}
                </div>

                <label className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full cursor-pointer hover:bg-green-600 transition-colors">
                  <FaUpload className="text-sm" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              <p className="text-sm text-gray-600 text-center">
                Click the upload icon to change the assistant's profile picture
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Preview
            </h3>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white bg-opacity-20 flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Assistant"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaUser className="text-sm" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold">{settings.assistantName}</h4>
                  <p className="text-xs opacity-90">{settings.status}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Settings Form */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Assistant Details
            </h3>

            <div className="space-y-4">
              {/* Assistant Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assistant Name
                </label>
                <input
                  type="text"
                  name="assistantName"
                  value={settings.assistantName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter assistant name"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={settings.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Online">Online</option>
                  <option value="Away">Away</option>
                  <option value="Busy">Busy</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>

              {/* Welcome Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Welcome Message
                </label>
                <textarea
                  name="welcomeMessage"
                  value={settings.welcomeMessage}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter the welcome message for new users"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use **bold text** for emphasis. This message will be shown to
                  new users.
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• The assistant name will appear in the chatbot header</li>
          <li>
            • The profile picture will be displayed in both the chat button and
            header
          </li>
          <li>
            • The welcome message will be shown to new users when they start a
            conversation
          </li>
          <li>• Changes will be applied immediately after saving</li>
        </ul>
      </div>
    </div>
  );
};

export default ChatbotSettingsTab;
