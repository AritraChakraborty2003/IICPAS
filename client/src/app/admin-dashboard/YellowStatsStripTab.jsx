"use client";
import { getApiBase } from "@/lib/apiBase";

import { useState, useEffect } from "react";
import { FaSave, FaEdit, FaTrash, FaCheck, FaTimes, FaPlus, FaMinus, FaGraduationCap, FaClipboardCheck, FaBookOpen, FaTrophy, FaRocket, FaChartLine } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function YellowStatsStripTab() {
  const { user } = useAuth();
  const [yellowStatsStripEntries, setYellowStatsStripEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    statistics: [],
    colors: {
      title: "text-white",
      accent: "text-[#3cd664]",
      background: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    }
  });
  const [newStatistic, setNewStatistic] = useState({
    icon: "FaGraduationCap",
    number: "",
    label: "",
    color: "from-blue-500 to-cyan-500",
    bgColor: "from-blue-600/20 to-cyan-600/20"
  });

  const iconOptions = [
    { value: "FaGraduationCap", label: "Graduation Cap", icon: FaGraduationCap },
    { value: "FaClipboardCheck", label: "Clipboard Check", icon: FaClipboardCheck },
    { value: "FaBookOpen", label: "Book Open", icon: FaBookOpen },
    { value: "FaTrophy", label: "Trophy", icon: FaTrophy },
    { value: "FaRocket", label: "Rocket", icon: FaRocket },
    { value: "FaChartLine", label: "Chart Line", icon: FaChartLine }
  ];

  const colorOptions = [
    { value: "from-blue-500 to-cyan-500", label: "Blue to Cyan" },
    { value: "from-green-500 to-emerald-500", label: "Green to Emerald" },
    { value: "from-purple-500 to-pink-500", label: "Purple to Pink" },
    { value: "from-orange-500 to-red-500", label: "Orange to Red" },
    { value: "from-yellow-500 to-orange-500", label: "Yellow to Orange" },
    { value: "from-indigo-500 to-purple-500", label: "Indigo to Purple" },
    { value: "from-pink-500 to-rose-500", label: "Pink to Rose" },
    { value: "from-teal-500 to-cyan-500", label: "Teal to Cyan" }
  ];

  const bgColorOptions = [
    { value: "from-blue-600/20 to-cyan-600/20", label: "Blue to Cyan" },
    { value: "from-green-600/20 to-emerald-600/20", label: "Green to Emerald" },
    { value: "from-purple-600/20 to-pink-600/20", label: "Purple to Pink" },
    { value: "from-orange-600/20 to-red-600/20", label: "Orange to Red" },
    { value: "from-yellow-600/20 to-orange-600/20", label: "Yellow to Orange" },
    { value: "from-indigo-600/20 to-purple-600/20", label: "Indigo to Purple" },
    { value: "from-pink-600/20 to-rose-600/20", label: "Pink to Rose" },
    { value: "from-teal-600/20 to-cyan-600/20", label: "Teal to Cyan" }
  ];

  const textColorOptions = [
    { value: "text-white", label: "White" },
    { value: "text-[#3cd664]", label: "Green" },
    { value: "text-blue-500", label: "Blue" },
    { value: "text-purple-500", label: "Purple" },
    { value: "text-yellow-500", label: "Yellow" },
    { value: "text-red-500", label: "Red" },
    { value: "text-gray-300", label: "Gray" }
  ];

  const backgroundOptions = [
    { value: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900", label: "Dark Gradient" },
    { value: "bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900", label: "Blue Gradient" },
    { value: "bg-gradient-to-br from-green-900 via-green-800 to-green-900", label: "Green Gradient" },
    { value: "bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900", label: "Purple Gradient" },
    { value: "bg-slate-900", label: "Dark Solid" },
    { value: "bg-blue-900", label: "Blue Solid" }
  ];

  useEffect(() => {
    if (user) {
      fetchYellowStatsStripEntries();
    }
  }, [user]);

  const fetchYellowStatsStripEntries = async () => {
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const response = await fetch(`${API_BASE}/yellow-stats-strip/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setYellowStatsStripEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching yellow stats strip entries:", error);
      toast.error("Failed to fetch YellowStatsStrip content");
      setYellowStatsStripEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleStatisticAdd = () => {
    if (newStatistic.number.trim() && newStatistic.label.trim()) {
      setFormData(prev => ({
        ...prev,
        statistics: [...prev.statistics, { ...newStatistic }]
      }));
      setNewStatistic({
        icon: "FaGraduationCap",
        number: "",
        label: "",
        color: "from-blue-500 to-cyan-500",
        bgColor: "from-blue-600/20 to-cyan-600/20"
      });
    }
  };

  const handleStatisticRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      statistics: prev.statistics.filter((_, i) => i !== index)
    }));
  };

  const handleStatisticUpdate = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      statistics: prev.statistics.map((stat, i) => 
        i === index ? { ...stat, [field]: value } : stat
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }
      
      const response = await fetch(`${API_BASE}/yellow-stats-strip`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("YellowStatsStrip content created successfully!");
        fetchYellowStatsStripEntries();
        resetForm();
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        if (response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        } else {
          toast.error(`Failed to create YellowStatsStrip content: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error("Error creating yellow stats strip content:", error);
      toast.error("Network error. Please check your connection and try again.");
    }
  };

  const handleUpdate = async (id) => {
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }
      
      const response = await fetch(`${API_BASE}/yellow-stats-strip/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("YellowStatsStrip content updated successfully!");
        fetchYellowStatsStripEntries();
        setEditingId(null);
        resetForm();
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        if (response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        } else {
          toast.error(`Failed to update YellowStatsStrip content: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error("Error updating yellow stats strip content:", error);
      toast.error("Network error. Please check your connection and try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this YellowStatsStrip content?")) return;

    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }
      
      const response = await fetch(`${API_BASE}/yellow-stats-strip/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("YellowStatsStrip content deleted successfully!");
        fetchYellowStatsStripEntries();
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        if (response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        } else {
          toast.error(`Failed to delete YellowStatsStrip content: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error("Error deleting yellow stats strip content:", error);
      toast.error("Network error. Please check your connection and try again.");
    }
  };

  const handleActivate = async (id) => {
    try {
      const API_BASE = getApiBase();
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }
      
      const response = await fetch(`${API_BASE}/yellow-stats-strip/activate/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("YellowStatsStrip content activated successfully!");
        fetchYellowStatsStripEntries();
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        if (response.status === 401) {
          toast.error("Authentication failed. Please log in again.");
        } else if (response.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        } else {
          toast.error(`Failed to activate YellowStatsStrip content: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error("Error activating yellow stats strip content:", error);
      toast.error("Network error. Please check your connection and try again.");
    }
  };

  const startEdit = (entry) => {
    setEditingId(entry._id);
    setFormData(entry);
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      statistics: [],
      colors: {
        title: "text-white",
        accent: "text-[#3cd664]",
        background: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      }
    });
    setNewStatistic({
      icon: "FaGraduationCap",
      number: "",
      label: "",
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-600/20 to-cyan-600/20"
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Yellow Stats Strip Management</h1>
        <p className="text-gray-600">Manage your website's statistics strip content and styling</p>
      </div>

      {/* Create New YellowStatsStrip Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Yellow Stats Strip Content" : "Create New Yellow Stats Strip Content"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Our Achievements"
              required
            />
          </div>

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Statistics</h3>
            <div className="space-y-4">
              {formData.statistics.map((stat, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-700">Statistic {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleStatisticRemove(index)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                    >
                      <FaMinus />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Icon
                      </label>
                      <select
                        value={stat.icon}
                        onChange={(e) => handleStatisticUpdate(index, "icon", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {iconOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number
                      </label>
                      <input
                        type="text"
                        value={stat.number}
                        onChange={(e) => handleStatisticUpdate(index, "number", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="120K+"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Label
                      </label>
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => handleStatisticUpdate(index, "label", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Successfully Student"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Icon Color
                      </label>
                      <select
                        value={stat.color}
                        onChange={(e) => handleStatisticUpdate(index, "color", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {colorOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Color
                      </label>
                      <select
                        value={stat.bgColor}
                        onChange={(e) => handleStatisticUpdate(index, "bgColor", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {bgColorOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add New Statistic */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">Add New Statistic</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon
                    </label>
                    <select
                      value={newStatistic.icon}
                      onChange={(e) => setNewStatistic(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {iconOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number
                    </label>
                    <input
                      type="text"
                      value={newStatistic.number}
                      onChange={(e) => setNewStatistic(prev => ({ ...prev, number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="120K+"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Label
                    </label>
                    <input
                      type="text"
                      value={newStatistic.label}
                      onChange={(e) => setNewStatistic(prev => ({ ...prev, label: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Successfully Student"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon Color
                    </label>
                    <select
                      value={newStatistic.color}
                      onChange={(e) => setNewStatistic(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {colorOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Color
                    </label>
                    <select
                      value={newStatistic.bgColor}
                      onChange={(e) => setNewStatistic(prev => ({ ...prev, bgColor: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {bgColorOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleStatisticAdd}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <FaPlus className="inline mr-2" />
                      Add Statistic
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Color Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Color Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(formData.colors).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <select
                    value={value}
                    onChange={(e) => handleInputChange(`colors.${key}`, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {key === 'background' ? 
                      backgroundOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      )) :
                      textColorOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))
                    }
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                <FaTimes className="inline mr-2" />
                Cancel
              </button>
            )}
            <button
              type={editingId ? "button" : "submit"}
              onClick={editingId ? () => handleUpdate(editingId) : undefined}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaSave className="inline mr-2" />
              {editingId ? "Update" : "Create"} Yellow Stats Strip Content
            </button>
          </div>
        </form>
      </div>

      {/* Existing YellowStatsStrip Contents */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Existing Yellow Stats Strip Contents</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {Array.isArray(yellowStatsStripEntries) && yellowStatsStripEntries.map((entry) => (
            <div key={entry._id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {entry.title}
                    </h3>
                    {entry.isActive && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div className="text-gray-600">
                    <span className="font-medium">Statistics: </span>
                    {entry.statistics.length} items
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.statistics.slice(0, 3).map((stat, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {stat.number} {stat.label}
                      </span>
                    ))}
                    {entry.statistics.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{entry.statistics.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEdit(entry)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  
                  {!entry.isActive && (
                    <button
                      onClick={() => handleActivate(entry._id)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                      title="Activate"
                    >
                      <FaCheck />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(entry._id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
