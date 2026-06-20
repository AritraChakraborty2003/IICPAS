"use client";

import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaRobot,
  FaSave,
  FaUpload,
  FaUser,
  FaSpinner,
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

const API = getApiBase();

const DEFAULT_RESPONSES = [
  {
    trigger: "what courses do you offer?",
    text: "We offer courses in Accounting, HR, Finance, US CMA, and Excel. Here are our top courses:",
    showCourses: true,
    actions: [
      { label: "Check Prices", trigger: "get prices" },
      { label: "Course Duration", trigger: "what is the duration?" },
    ],
  },
  {
    trigger: "get prices",
    text: "Sure! Here are our available courses and their pricing:",
    showCourses: true,
    actions: [
      { label: "How do I enroll?", trigger: "how do i enroll?" },
      { label: "Certificates", trigger: "do you provide certificates?" },
    ],
  },
  {
    trigger: "what is the duration?",
    text: "Course duration depends on the level and content. Foundation courses typically take 2-4 weeks, Core courses 4-8 weeks, and Expert courses 8-12 weeks.",
    showCourses: false,
    actions: [
      { label: "Check Prices", trigger: "get prices" },
      { label: "How do I enroll?", trigger: "how do i enroll?" },
    ],
  },
  {
    trigger: "do you provide certificates?",
    text: "Yes! We provide completion certificates for all our courses. These certificates are industry-recognized and can help boost your career prospects.",
    showCourses: false,
    actions: [
      { label: "View Courses", trigger: "what courses do you offer?" },
      { label: "How do I enroll?", trigger: "how do i enroll?" },
    ],
  },
  {
    trigger: "how do i enroll?",
    text: "Simply click the 'Enroll Now' button on any course card, or visit the course detail page. You'll be redirected to our enrollment process where you can complete your registration.",
    showCourses: false,
    actions: [
      { label: "Check Prices", trigger: "get prices" },
      { label: "Prerequisites", trigger: "what are the prerequisites?" },
    ],
  },
  {
    trigger: "what are the prerequisites?",
    text: "Prerequisites vary by course level. Foundation courses have no prerequisites, Core courses may require basic knowledge, and Expert courses require intermediate to advanced knowledge.",
    showCourses: false,
    actions: [{ label: "View Courses", trigger: "what courses do you offer?" }],
  },
];

const ChatbotSettingsTab = () => {
  const [settings, setSettings] = useState({
    assistantName: "Neha Singh",
    profilePicture:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    welcomeMessage:
      "Hi! I'm your course assistant. To provide you with personalized assistance, I'll need a few details from you.\n\nLet's start with your **Full Name** please:",
    status: "Online",
    welcomeQuickReplies: [
      { label: "Check Prices", trigger: "get prices" },
      { label: "View Courses", trigger: "what courses do you offer?" },
      { label: "Course Duration", trigger: "what is the duration?" },
      { label: "Certificates", trigger: "do you provide certificates?" },
    ],
    responses: DEFAULT_RESPONSES,
    defaultResponse:
      "I'm here to help with course-related questions! Here are our available courses and their pricing. You can also ask me about specific details like certificates or enrollment.",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [expandedResponse, setExpandedResponse] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(`${API}/chatbot/admin/settings`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      if (response.data.success) {
        const fetched = response.data.settings;
        setSettings((prev) => ({
          ...prev,
          ...fetched,
          responses:
            fetched.responses && fetched.responses.length > 0
              ? fetched.responses
              : DEFAULT_RESPONSES,
          welcomeQuickReplies:
            fetched.welcomeQuickReplies && fetched.welcomeQuickReplies.length > 0
              ? fetched.welcomeQuickReplies
              : prev.welcomeQuickReplies,
        }));
        setImagePreview(fetched.profilePicture);
      }
    } catch (error) {
      console.error("Error fetching chatbot settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // --- Quick replies ---
  const updateQuickReply = (idx, field, value) => {
    setSettings((prev) => {
      const updated = [...prev.welcomeQuickReplies];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, welcomeQuickReplies: updated };
    });
  };
  const addQuickReply = () => {
    setSettings((prev) => ({
      ...prev,
      welcomeQuickReplies: [...prev.welcomeQuickReplies, { label: "", trigger: "" }],
    }));
  };
  const removeQuickReply = (idx) => {
    setSettings((prev) => ({
      ...prev,
      welcomeQuickReplies: prev.welcomeQuickReplies.filter((_, i) => i !== idx),
    }));
  };

  // --- Responses ---
  const updateResponse = (idx, field, value) => {
    setSettings((prev) => {
      const updated = [...prev.responses];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, responses: updated };
    });
  };
  const addResponse = () => {
    setSettings((prev) => ({
      ...prev,
      responses: [
        ...prev.responses,
        { trigger: "", text: "", showCourses: false, actions: [] },
      ],
    }));
    setExpandedResponse(settings.responses.length);
  };
  const removeResponse = (idx) => {
    setSettings((prev) => ({
      ...prev,
      responses: prev.responses.filter((_, i) => i !== idx),
    }));
    setExpandedResponse(null);
  };
  const updateResponseAction = (respIdx, actionIdx, field, value) => {
    setSettings((prev) => {
      const updated = [...prev.responses];
      const actions = [...(updated[respIdx].actions || [])];
      actions[actionIdx] = { ...actions[actionIdx], [field]: value };
      updated[respIdx] = { ...updated[respIdx], actions };
      return { ...prev, responses: updated };
    });
  };
  const addResponseAction = (respIdx) => {
    setSettings((prev) => {
      const updated = [...prev.responses];
      updated[respIdx] = {
        ...updated[respIdx],
        actions: [...(updated[respIdx].actions || []), { label: "", trigger: "" }],
      };
      return { ...prev, responses: updated };
    });
  };
  const removeResponseAction = (respIdx, actionIdx) => {
    setSettings((prev) => {
      const updated = [...prev.responses];
      updated[respIdx] = {
        ...updated[respIdx],
        actions: updated[respIdx].actions.filter((_, i) => i !== actionIdx),
      };
      return { ...prev, responses: updated };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("adminToken");

      let profilePictureUrl = settings.profilePicture;
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

      const updatedSettings = { ...settings, profilePicture: profilePictureUrl };
      const response = await axios.post(`${API}/chatbot/settings`, updatedSettings, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });

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
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-lg space-y-8">
      <div className="flex items-center gap-3">
        <FaRobot className="text-2xl text-green-500" />
        <h1 className="text-2xl font-bold text-gray-800">Chatbot Settings</h1>
      </div>

      {/* Profile + Basic Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Profile Picture */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaUser className="text-green-500" />
              Assistant Profile
            </h3>
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
                Click the upload icon to change the assistant&apos;s profile picture
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview</h3>
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

        {/* Right: Details */}
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Assistant Details</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assistant Name
            </label>
            <input
              type="text"
              name="assistantName"
              value={settings.assistantName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              placeholder="Enter assistant name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={settings.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            >
              <option value="Online">Online</option>
              <option value="Away">Away</option>
              <option value="Busy">Busy</option>
              <option value="Offline">Offline</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Welcome Message
            </label>
            <textarea
              name="welcomeMessage"
              value={settings.welcomeMessage}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              placeholder="Enter the welcome message for new users"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use **bold text** for emphasis.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Fallback Response
            </label>
            <textarea
              name="defaultResponse"
              value={settings.defaultResponse}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              placeholder="Response when no trigger matches"
            />
          </div>
        </div>
      </div>

      {/* Welcome Quick Replies */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Welcome Quick Reply Buttons
          </h3>
          <button
            onClick={addQuickReply}
            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            <FaPlus className="text-xs" /> Add Button
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          These buttons appear after the user submits their details and can be clicked to trigger a response.
        </p>
        <div className="space-y-2">
          {settings.welcomeQuickReplies.map((qr, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                value={qr.label}
                onChange={(e) => updateQuickReply(idx, "label", e.target.value)}
                placeholder="Button label (shown to user)"
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input
                type="text"
                value={qr.trigger}
                onChange={(e) => updateQuickReply(idx, "trigger", e.target.value)}
                placeholder="Trigger text (must match a response)"
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={() => removeQuickReply(idx)}
                className="text-red-400 hover:text-red-600 p-1.5"
              >
                <FaTrash className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Response Flow Editor */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Response Flow</h3>
          <button
            onClick={addResponse}
            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            <FaPlus className="text-xs" /> Add Response
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Each response maps a trigger phrase to a bot reply. Trigger text must exactly match what a quick reply button sends.
        </p>
        <div className="space-y-3">
          {settings.responses.map((resp, rIdx) => (
            <div key={rIdx} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
              {/* Accordion header */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                onClick={() =>
                  setExpandedResponse(expandedResponse === rIdx ? null : rIdx)
                }
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded mr-2">
                    Trigger
                  </span>
                  <span className="text-sm text-gray-700 truncate">
                    {resp.trigger || <span className="text-gray-400 italic">No trigger set</span>}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeResponse(rIdx);
                    }}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                  {expandedResponse === rIdx ? (
                    <FaChevronUp className="text-gray-400 text-xs" />
                  ) : (
                    <FaChevronDown className="text-gray-400 text-xs" />
                  )}
                </div>
              </div>

              {/* Accordion body */}
              {expandedResponse === rIdx && (
                <div className="p-4 border-t border-gray-100 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Trigger Text (case-insensitive match)
                    </label>
                    <input
                      type="text"
                      value={resp.trigger}
                      onChange={(e) => updateResponse(rIdx, "trigger", e.target.value)}
                      placeholder="e.g. get prices"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Bot Response Text
                    </label>
                    <textarea
                      value={resp.text}
                      onChange={(e) => updateResponse(rIdx, "text", e.target.value)}
                      rows={3}
                      placeholder="What the bot will say..."
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`showCourses-${rIdx}`}
                      checked={resp.showCourses}
                      onChange={(e) =>
                        updateResponse(rIdx, "showCourses", e.target.checked)
                      }
                      className="rounded border-gray-300 text-green-500 focus:ring-green-500"
                    />
                    <label
                      htmlFor={`showCourses-${rIdx}`}
                      className="text-sm text-gray-700"
                    >
                      Show course cards with pricing after this response
                    </label>
                  </div>

                  {/* Actions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-gray-600">
                        Follow-up Quick Reply Buttons
                      </label>
                      <button
                        onClick={() => addResponseAction(rIdx)}
                        className="flex items-center gap-1 text-green-600 hover:text-green-700 text-xs font-semibold"
                      >
                        <FaPlus className="text-[10px]" /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(resp.actions || []).map((action, aIdx) => (
                        <div key={aIdx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={action.label}
                            onChange={(e) =>
                              updateResponseAction(rIdx, aIdx, "label", e.target.value)
                            }
                            placeholder="Button label"
                            className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-green-500"
                          />
                          <input
                            type="text"
                            value={action.trigger}
                            onChange={(e) =>
                              updateResponseAction(rIdx, aIdx, "trigger", e.target.value)
                            }
                            placeholder="Trigger text"
                            className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-green-500"
                          />
                          <button
                            onClick={() => removeResponseAction(rIdx, aIdx)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <FaTrash className="text-[10px]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-500 text-white px-8 py-2.5 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-semibold"
        >
          {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">How it works:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Welcome Quick Replies</strong> appear after the user submits their name & phone</li>
          <li>• Each button&apos;s trigger must exactly match a Response trigger (case-insensitive)</li>
          <li>• Responses can show course cards with live pricing fetched from the database</li>
          <li>• If no trigger matches, the Default Fallback Response is shown</li>
          <li>• Changes take effect immediately after saving</li>
        </ul>
      </div>
    </div>
  );
};

export default ChatbotSettingsTab;
