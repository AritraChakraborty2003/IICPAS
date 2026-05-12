import { getApiBase } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import { X, Plus, Edit, Trash2, Eye, EyeOff, UserPlus } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  showDeleteConfirmation,
  showSuccess,
  showError,
} from "@/utils/sweetAlert";

const API_BASE = getApiBase();

// All modules with their display names
const MODULES = [
  { id: "course-category", name: "Course Category", icon: "📚" },
  { id: "course", name: "Course", icon: "🎓" },
  { id: "course-display", name: "Course Display", icon: "👁️" },
  { id: "chapter-schedule", name: "Chapter Schedule", icon: "⏰" },
  { id: "topic-schedule", name: "Topic Schedule", icon: "🕒" },
  { id: "live-session", name: "Live Session", icon: "📺" },
  { id: "recorded-session", name: "Recorded Session", icon: "🎬" },
  { id: "live-bookings", name: "Live Bookings", icon: "🧾" },
  { id: "batch-manager", name: "Batch Manager", icon: "🗂️" },
  { id: "blogs", name: "Blogs", icon: "📝" },
  { id: "testimonials", name: "Testimonials", icon: "💬" },
  { id: "about", name: "About Us", icon: "ℹ️" },
  { id: "about-us-section", name: "About Us Section Management", icon: "👔" },
  { id: "meta", name: "Manage Metatags", icon: "🏷️" },
  { id: "alert", name: "Alert", icon: "🔔" },
  { id: "enquiries", name: "Enquiries", icon: "📧" },
  { id: "jobs", name: "Jobs", icon: "💼" },
  { id: "news", name: "News", icon: "📰" },
  { id: "students", name: "Students", icon: "👨‍🎓" },
  { id: "staff", name: "Staff Management", icon: "👥" },
  { id: "companies", name: "Companies", icon: "🏢" },
  { id: "colleges", name: "Colleges", icon: "🎓" },
  { id: "calendar", name: "Calendar", icon: "📅" },
  { id: "team", name: "Our Team", icon: "👥" },
  { id: "topics", name: "Training Topics", icon: "📖" },
  { id: "revision", name: "Revision Tests", icon: "🔄" },
  { id: "support", name: "Support Requests", icon: "🆘" },
  { id: "hero", name: "Hero Section", icon: "🏠" },
  { id: "why-iicpa", name: "WhyIICPA Section", icon: "⭐" },
  { id: "contact", name: "Contact Section", icon: "📞" },
  { id: "footer", name: "Footer Section", icon: "📋" },
  { id: "yellow-stats-strip", name: "Stats Strip Section", icon: "📊" },
  { id: "newsletter-section", name: "Newsletter Section", icon: "📧" },
  { id: "newsletter-subscriptions", name: "Newsletter Subscriptions", icon: "📬" },
  { id: "payments", name: "Payments", icon: "💳" },
  { id: "guides", name: "Guides & Resources", icon: "📄" },
  { id: "kits", name: "Kit Stock", icon: "📦" },
  { id: "quiz-sound-settings", name: "Quiz Sound Settings", icon: "🔊" },
  { id: "audit", name: "IP Logs", icon: "🛡️" },
  { id: "ip-whitelist", name: "IP Whitelisting", icon: "🔒" },
  { id: "study-material", name: "Study Material", icon: "📚" },
  { id: "faq", name: "FAQ", icon: "❓" },
  { id: "booking-settings", name: "Booking Settings", icon: "⚙️" },
  { id: "batch-manager", name: "Batch Manager", icon: "🗂️" },
  {
    id: "invoice-company-settings",
    name: "Invoice Company Settings",
    icon: "🧾",
  },
  { id: "quotation", name: "Quotation Studio", icon: "🧾" },
  {
    id: "job-sidebar-marquee",
    name: "Jobs Sidebar Marquee",
    icon: "🪄",
  },
  {
    id: "referral-code-settings",
    name: "Referral Code Settings",
    icon: "🎁",
  },
  { id: "our-partners", name: "Our Partners", icon: "🤝" },
  { id: "bookings", name: "Bookings", icon: "🧾" },
];

const PERMISSIONS = [
  { id: "add", name: "Add", color: "bg-green-500" },
  { id: "read", name: "Read", color: "bg-blue-500" },
  { id: "update", name: "Update", color: "bg-yellow-500" },
  { id: "delete", name: "Delete", color: "bg-red-500" },
  { id: "active", name: "Active/Inactive", color: "bg-purple-500" },
];

export default function StaffManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Coordinator",
    status: "Active",
    permissions: {},
  });

  // Initialize permissions
  useEffect(() => {
    const initialPermissions = {};
    MODULES.forEach((module) => {
      initialPermissions[module.id] = {
        add: false,
        read: false,
        update: false,
        delete: false,
        active: false,
      };
    });
    setFormData((prev) => ({ ...prev, permissions: initialPermissions }));
  }, []);

  // Fetch employees
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(`${API_BASE}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (employee = null) => {
    if (employee) {
      setSelectedEmployee(employee);
      setIsEdit(true);
      setFormData({
        name: employee.name,
        email: employee.email,
        password: "",
        role: employee.role,
        status: employee.status,
        permissions: employee.permissions || {},
      });
    } else {
      setSelectedEmployee(null);
      setIsEdit(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "Coordinator",
        status: "Active",
        permissions: {},
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!formData.name.trim()) {
        toast.error("Name is required");
        return;
      }
      if (!formData.email.trim()) {
        toast.error("Email is required");
        return;
      }
      if (!isEdit && !formData.password.trim()) {
        toast.error("Password is required for new employees");
        return;
      }

      const token = localStorage.getItem("adminToken");
      const data = { ...formData };

      // For edit mode, only send password if it's not empty
      if (isEdit && !data.password) {
        delete data.password;
      }

      if (isEdit) {
        await axios.put(`${API_BASE}/employees/${selectedEmployee._id}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Employee updated successfully!");
      } else {
        await axios.post(`${API_BASE}/employees`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Employee created successfully!");
      }

      setModalOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error("Error saving employee:", error);
      const errorMessage =
        error.response?.data?.message || "Error saving employee";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showDeleteConfirmation("employee");

    if (confirmed) {
      try {
        const token = localStorage.getItem("adminToken");
        await axios.delete(`${API_BASE}/employees/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Employee deleted successfully!");
        fetchEmployees();
      } catch (error) {
        console.error("Error deleting employee:", error);
        toast.error("Error deleting employee");
      }
    }
  };

  const handlePermissionChange = (moduleId, permissionId, checked) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleId]: {
          ...prev.permissions[moduleId],
          [permissionId]: checked,
        },
      },
    }));
  };

  const handleModuleSelectAll = (moduleId, checked) => {
    const newPermissions = { ...formData.permissions };
    PERMISSIONS.forEach((perm) => {
      newPermissions[moduleId][perm.id] = checked;
    });
    setFormData((prev) => ({ ...prev, permissions: newPermissions }));
  };

  const handlePermissionSelectAll = (permissionId, checked) => {
    const newPermissions = { ...formData.permissions };
    MODULES.forEach((module) => {
      newPermissions[module.id][permissionId] = checked;
    });
    setFormData((prev) => ({ ...prev, permissions: newPermissions }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Employee Management
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <UserPlus size={20} />
          Add Employee
        </button>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
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
            {employees
              .filter((employee) => employee.role !== "Admin")
              .map((employee, index) => (
                <tr key={employee._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(employee)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(employee._id)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Employee Modal */}
      {modalOpen && (
        <EmployeeModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          formData={formData}
          setFormData={setFormData}
          isEdit={isEdit}
          modules={MODULES}
          permissions={PERMISSIONS}
          onPermissionChange={handlePermissionChange}
          onModuleSelectAll={handleModuleSelectAll}
          onPermissionSelectAll={handlePermissionSelectAll}
        />
      )}
    </div>
  );
}

// Employee Modal Component
function EmployeeModal({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  isEdit,
  modules,
  permissions,
  onPermissionChange,
  onModuleSelectAll,
  onPermissionSelectAll,
}) {
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">
            {isEdit ? "Edit Employee" : "Add New Employee"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter employee name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password {!isEdit && "*"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    isEdit ? "Leave blank to keep current" : "Enter password"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Coordinator">Coordinator</option>
                <option value="Content Writer">Content Writer</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Permissions
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Module
                    </th>
                    {permissions.map((perm) => (
                      <th
                        key={perm.id}
                        className="border px-4 py-2 text-center text-sm font-medium text-gray-700"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{perm.name}</span>
                          <input
                            type="checkbox"
                            checked={modules.every(
                              (module) =>
                                formData.permissions[module.id]?.[perm.id]
                            )}
                            onChange={(e) =>
                              onPermissionSelectAll(perm.id, e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                      </th>
                    ))}
                    <th className="border px-4 py-2 text-center text-sm font-medium text-gray-700">
                      All
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((module) => (
                    <tr key={module.id}>
                      <td className="border px-4 py-2 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>{module.icon}</span>
                          {module.name}
                        </div>
                      </td>
                      {permissions.map((perm) => (
                        <td
                          key={perm.id}
                          className="border px-4 py-2 text-center"
                        >
                          <input
                            type="checkbox"
                            checked={
                              formData.permissions[module.id]?.[perm.id] ||
                              false
                            }
                            onChange={(e) =>
                              onPermissionChange(
                                module.id,
                                perm.id,
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                      ))}
                      <td className="border px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={permissions.every(
                            (perm) => formData.permissions[module.id]?.[perm.id]
                          )}
                          onChange={(e) =>
                            onModuleSelectAll(module.id, e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {isEdit ? "Update Employee" : "Add Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}
