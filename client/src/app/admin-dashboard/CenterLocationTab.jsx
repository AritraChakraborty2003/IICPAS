import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaMapMarkerAlt,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaEllipsisV,
  FaCheck,
  FaTimes,
  FaFileExcel,
} from "react-icons/fa";

const API_BASE = getApiBase();

export default function CenterLocationTab() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [newCenter, setNewCenter] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    manager: {
      name: "",
      phone: "",
      email: "",
    },
    facilities: [],
    capacity: 50,
    status: "active",
    description: "",
  });

  useEffect(() => {
    fetchCenters();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const fetchCenters = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${API_BASE}/v1/centers`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setCenters(response.data.data || []);
    } catch (error) {
      console.error("Error fetching centers:", error);
      toast.error("Failed to fetch centers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCenter = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!newCenter.name.trim()) {
        toast.error("Please enter center name");
        return;
      }
      if (!newCenter.city.trim()) {
        toast.error("Please enter city");
        return;
      }
      if (!newCenter.state.trim()) {
        toast.error("Please enter state");
        return;
      }
      if (!newCenter.phone.trim()) {
        toast.error("Please enter phone number");
        return;
      }
      if (!newCenter.email.trim()) {
        toast.error("Please enter email");
        return;
      }

      const response = await axios.post(
        `${API_BASE}/v1/centers`,
        newCenter,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Center added successfully!");
      setShowAddForm(false);
      setNewCenter({
        name: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        phone: "",
        email: "",
        manager: {
          name: "",
          phone: "",
          email: "",
        },
        facilities: [],
        capacity: 50,
        status: "active",
        description: "",
      });
      fetchCenters();
    } catch (error) {
      console.error("Error adding center:", error);
      toast.error("Failed to add center");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCenter = async () => {
    try {
      setSaving(true);

      const response = await axios.put(
        `${API_BASE}/v1/centers/${editingCenter._id}`,
        editingCenter,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Center updated successfully!");
      setEditingCenter(null);
      fetchCenters();
    } catch (error) {
      console.error("Error updating center:", error);
      toast.error("Failed to update center");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCenter = async (centerId) => {
    if (!window.confirm("Are you sure you want to delete this center?")) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/v1/centers/${centerId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      toast.success("Center deleted successfully!");
      fetchCenters();
    } catch (error) {
      console.error("Error deleting center:", error);
      toast.error("Failed to delete center");
    }
  };

  const handleStatusToggle = async (centerId, newStatus) => {
    try {
      await axios.put(
        `${API_BASE}/v1/centers/${centerId}`,
        { status: newStatus },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      toast.success(`Center status updated to ${newStatus}!`);
      fetchCenters();
    } catch (error) {
      console.error("Error updating center status:", error);
      toast.error("Failed to update center status");
    }
  };

  const toggleDropdown = (centerId) => {
    setOpenDropdown(openDropdown === centerId ? null : centerId);
  };

  const exportToExcel = () => {
    try {
      // Create Excel data structure
      const excelData = centers.map((center) => ({
        'Center Name': center.name,
        'City': center.city,
        'State': center.state,
        'Pincode': center.pincode,
        'Address': center.address,
        'Phone': center.phone,
        'Email': center.email,
        'Manager Name': center.manager?.name || '',
        'Manager Phone': center.manager?.phone || '',
        'Manager Email': center.manager?.email || '',
        'Capacity': center.capacity,
        'Status': center.status,
        'Description': center.description || '',
      }));

      // Convert to CSV format (simpler than Excel for now)
      const headers = Object.keys(excelData[0] || {});
      const csvContent = [
        headers.join(','),
        ...excelData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in CSV
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `centers_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Centers data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith("manager.")) {
      const managerField = field.split(".")[1];
      setNewCenter((prev) => ({
        ...prev,
        manager: {
          ...prev.manager,
          [managerField]: value,
        },
      }));
    } else {
      setNewCenter((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleEditInputChange = (field, value) => {
    if (field.startsWith("manager.")) {
      const managerField = field.split(".")[1];
      setEditingCenter((prev) => ({
        ...prev,
        manager: {
          ...prev.manager,
          [managerField]: value,
        },
      }));
    } else {
      setEditingCenter((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading centers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Center Location Management
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToExcel}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            disabled={centers.length === 0}
          >
            <FaFileExcel />
            Export Excel
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <FaPlus />
            Add New Center
          </button>
        </div>
      </div>

      {/* Add Center Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Add New Center</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Center Name *
              </label>
              <input
                type="text"
                value={newCenter.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter center name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={newCenter.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter city"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <input
                type="text"
                value={newCenter.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter state"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode
              </label>
              <input
                type="text"
                value={newCenter.pincode}
                onChange={(e) => handleInputChange("pincode", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter pincode"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="text"
                value={newCenter.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={newCenter.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter email"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={newCenter.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter full address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager Name
              </label>
              <input
                type="text"
                value={newCenter.manager.name}
                onChange={(e) =>
                  handleInputChange("manager.name", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter manager name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager Phone
              </label>
              <input
                type="text"
                value={newCenter.manager.phone}
                onChange={(e) =>
                  handleInputChange("manager.phone", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter manager phone"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager Email
              </label>
              <input
                type="email"
                value={newCenter.manager.email}
                onChange={(e) =>
                  handleInputChange("manager.email", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter manager email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity
              </label>
              <input
                type="number"
                value={newCenter.capacity}
                onChange={(e) =>
                  handleInputChange("capacity", parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter capacity"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={newCenter.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newCenter.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter center description"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCenter}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <FaSave />
              {saving ? "Adding..." : "Add Center"}
            </button>
          </div>
        </div>
      )}

      {/* Centers List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">
          Centers ({centers.length})
        </h3>

        {centers.length === 0 ? (
          <div className="text-center py-8">
            <FaBuilding className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Centers Found
            </h3>
            <p className="text-gray-500">
              Add your first center to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Center Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {centers.map((center) => (
                  <tr key={center._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {center.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Capacity: {center.capacity}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="text-green-500 mr-2" />
                        <div>
                          <div className="text-sm text-gray-900">
                            {center.city}, {center.state}
                          </div>
                          <div className="text-sm text-gray-500">
                            {center.pincode}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center text-sm text-gray-900 mb-1">
                          <FaPhone className="text-green-500 mr-2" />
                          {center.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <FaEnvelope className="text-green-500 mr-2" />
                          {center.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          center.status === "active"
                            ? "bg-green-100 text-green-800"
                            : center.status === "inactive"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {center.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative dropdown-container">
                        <button
                          onClick={() => toggleDropdown(center._id)}
                          className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-50 rounded"
                          title="More Actions"
                        >
                          <FaEllipsisV />
                        </button>
                        
                        {openDropdown === center._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setEditingCenter(center);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <FaEdit className="mr-3 text-blue-600" />
                                Edit
                              </button>
                              
                              <button
                                onClick={() => {
                                  handleStatusToggle(center._id, center.status === 'active' ? 'inactive' : 'active');
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                {center.status === 'active' ? (
                                  <>
                                    <FaTimes className="mr-3 text-red-600" />
                                    Set Inactive
                                  </>
                                ) : (
                                  <>
                                    <FaCheck className="mr-3 text-green-600" />
                                    Set Active
                                  </>
                                )}
                              </button>
                              
                              <button
                                onClick={() => {
                                  handleDeleteCenter(center._id);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <FaTrash className="mr-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Center Modal */}
      {editingCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Edit Center</h3>
              <button
                onClick={() => setEditingCenter(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Center Name *
                  </label>
                  <input
                    type="text"
                    value={editingCenter.name}
                    onChange={(e) =>
                      handleEditInputChange("name", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={editingCenter.city}
                    onChange={(e) =>
                      handleEditInputChange("city", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={editingCenter.state}
                    onChange={(e) =>
                      handleEditInputChange("state", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={editingCenter.pincode}
                    onChange={(e) =>
                      handleEditInputChange("pincode", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="text"
                    value={editingCenter.phone}
                    onChange={(e) =>
                      handleEditInputChange("phone", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editingCenter.email}
                    onChange={(e) =>
                      handleEditInputChange("email", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={editingCenter.address}
                    onChange={(e) =>
                      handleEditInputChange("address", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manager Name
                  </label>
                  <input
                    type="text"
                    value={editingCenter.manager?.name || ""}
                    onChange={(e) =>
                      handleEditInputChange("manager.name", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manager Phone
                  </label>
                  <input
                    type="text"
                    value={editingCenter.manager?.phone || ""}
                    onChange={(e) =>
                      handleEditInputChange("manager.phone", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manager Email
                  </label>
                  <input
                    type="email"
                    value={editingCenter.manager?.email || ""}
                    onChange={(e) =>
                      handleEditInputChange("manager.email", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={editingCenter.capacity}
                    onChange={(e) =>
                      handleEditInputChange(
                        "capacity",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editingCenter.status}
                    onChange={(e) =>
                      handleEditInputChange("status", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingCenter.description || ""}
                    onChange={(e) =>
                      handleEditInputChange("description", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditingCenter(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCenter}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <FaSave />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
