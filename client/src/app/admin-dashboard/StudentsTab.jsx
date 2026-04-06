"use client";
import { getApiBase } from "@/lib/apiBase";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Loader2,
  UserPlus,
  Mail,
  Smartphone,
  List as ListIcon,
  PlusCircle,
  Download,
  Edit,
  Trash2,
  UserX,
  Save,
  X,
  User,
  Phone,
  MapPin,
  Building,
  Monitor,
  UserCheck,
  AlertCircle,
  Search,
  Unlock,
  Lock,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

const API_BASE = getApiBase();
const extractStudents = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.students)) return payload.students;
  if (Array.isArray(payload?.data?.students)) return payload.data.students;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

// BASIC COMPONENTS
const Button = ({ className = "", children, ...props }) => (
  <button
    className={
      "px-4 py-2 rounded-xl font-semibold focus:outline-none transition-all " +
      className
    }
    {...props}
  >
    {children}
  </button>
);

const Input = React.forwardRef(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={
      "peer block w-full p-4 pt-6 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 transition-all " +
      className
    }
    {...props}
  />
));
Input.displayName = "Input";

const Label = ({ htmlFor, floating, active, className = "", children }) => (
  <label
    htmlFor={htmlFor}
    className={`
      absolute left-4 bg-white px-1 rounded pointer-events-none transition-all
      text-gray-500
      ${
        floating
          ? "peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:-top-2 peer-focus:text-xs"
          : ""
      }
      ${active ? "-top-2 text-xs" : "top-4 text-base"}
      ${className}
    `}
  >
    {children}
  </label>
);

const getWhatsAppLink = (phone) => `https://wa.me/${phone.replace(/\D/g, "")}`;

const initialState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  location: "",
  course: "",
  teacher: "",
};

// Edit Student Modal Component
function EditStudentModal({ student, isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    mode: "",
    location: "",
    center: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize form when student changes
  useEffect(() => {
    if (student) {
      setForm({
        name: student.name || "",
        email: student.email || "",
        phone: student.phone || "",
        mode: student.mode || "",
        location: student.location || "",
        center: student.center || "",
        password: "", // Don't pre-fill password
      });
    }
  }, [student]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No admin token found");
      }

      // Prepare update data (exclude empty password)
      const updateData = { ...form };
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await axios.put(
        `${API_BASE}/v1/students/admin/update-profile/${student._id}`,
        updateData,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      toast.success("Student profile updated successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating student:", err);
      setError(
        err.response?.data?.message || err.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Edit className="text-indigo-500" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">
                Edit Student Profile
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Full Name", name: "name", type: "text", required: true },
                { label: "Email Address", name: "email", type: "email", required: true },
                { label: "Phone Number", name: "phone", type: "tel", required: true },
                { label: "Mode", name: "mode", type: "select", options: ["online", "offline"] },
                { label: "Location", name: "location", type: "text" },
                { label: "Center", name: "center", type: "text" },
                { label: "New Password (optional)", name: "password", type: "password" },
              ].map((field) => (
                <div key={field.name} className="relative">
                  {field.type === "select" ? (
                    <select
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      required={field.required}
                      className="peer block w-full p-4 pt-6 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      name={field.name}
                      type={field.type}
                      placeholder=" "
                      required={field.required}
                      value={form[field.name]}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full"
                    />
                  )}
                  <Label
                    htmlFor={field.name}
                    floating
                    active={!!form[field.name]}
                    className="text-gray-500"
                  >
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>

            {/* Note about profile image */}
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> Profile image cannot be changed through this interface. 
                Students can update their profile image from their dashboard.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {loading ? "Updating..." : "Update Profile"}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function AddStudentForm({ onSuccess }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post(
        `${API_BASE}/v1/students/register`,
        form,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setSuccess("Student registered successfully!");
      setForm(initialState);
      if (onSuccess) onSuccess(res.data.student);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Something went wrong"
      );
    }
    setLoading(false);
  };

  return (
    <motion.div
      key="add"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <UserPlus className="text-indigo-500" size={28} />
          <h2 className="text-2xl font-bold tracking-tight text-gray-800">Add New Student</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "Full Name", name: "name", type: "text" },
              { label: "Email Address", name: "email", type: "email" },
              { label: "Phone Number", name: "phone", type: "tel" },
              { label: "Password", name: "password", type: "password" },
              { label: "Location", name: "location", type: "text" },
              { label: "Course", name: "course", type: "text" },
              { label: "Teacher", name: "teacher", type: "text" },
            ].map((field) => (
              <div key={field.name} className="relative">
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  placeholder=" "
                  required
                  autoComplete="off"
                  value={form[field.name]}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full"
                />
                <Label
                  htmlFor={field.name}
                  floating
                  active={!!form[field.name]}
                >
                  {field.label}
                </Label>
              </div>
            ))}
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm rounded-lg p-4 bg-red-50 border border-red-200"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-green-600 text-sm rounded-lg p-4 bg-green-50 border border-green-200"
            >
              {success}
            </motion.div>
          )}
          
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              className="px-8 py-3 rounded-xl text-lg font-semibold gap-2 bg-gradient-to-r from-indigo-500 to-sky-400 hover:from-indigo-600 hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Adding Student...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Add Student
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

function StudentsTable({ students, onStudentUpdated }) {
  const [editingStudent, setEditingStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!students?.length)
    return (
      <div className="text-gray-500 text-center py-12">
        No students registered yet.
      </div>
    );

  // Handle edit student
  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingStudent(null);
  };

  const handleEditSuccess = () => {
    onStudentUpdated();
  };

  // Handle delete student
  const handleDeleteStudent = async (student) => {
    if (window.confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
      try {
        console.log("Deleting student with ID:", student._id);
        console.log("API Base:", API_BASE);
        console.log("Full URL:", `${API_BASE}/v1/students/${student._id}`);

        const response = await axios.delete(`${API_BASE}/v1/students/${student._id}`);
        console.log("Delete response:", response.data);
        
        toast.success(`${student.name} has been deleted successfully!`);
        if (onStudentUpdated) onStudentUpdated();
      } catch (error) {
        console.error("Error deleting student:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          studentId: student._id
        });
        toast.error(`Failed to delete student: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // Handle suspend student
  const handleSuspendStudent = async (student) => {
    const action = student.status === 'suspended' ? 'unsuspend' : 'suspend';
    const actionText = student.status === 'suspended' ? 'Unsuspend' : 'Suspend';
    
    if (window.confirm(`Are you sure you want to ${action} ${student.name}?`)) {
      try {
        await axios.put(`${API_BASE}/v1/students/${student._id}/status`, {
          status: student.status === 'suspended' ? 'active' : 'suspended'
        });
        toast.success(`${student.name} has been ${action}ed successfully!`);
        if (onStudentUpdated) onStudentUpdated();
      } catch (error) {
        console.error(`Error ${action}ing student:`, error);
        console.error("Error details:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          studentId: student._id
        });
        toast.error(`Failed to ${action} student: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // Export students to Excel
  const exportToExcel = () => {
    if (students.length === 0) {
      toast.error("No students to export");
      return;
    }

    try {
      // Prepare data for Excel export
      const excelData = students.map((student, index) => ({
        'S.No': index + 1,
        'Name': student.name || '',
        'Email': student.email || '',
        'Phone': student.phone || '',
        'Location': student.location || '',
        'Center': student.center || '',
        'Status': student.mode || 'Not specified',
        'Courses': student.course && student.course.length > 0 
          ? student.course.map(course => course.title || course).join(', ') 
          : 'No courses',
        'Live Sessions': student.enrolledLiveSessions && student.enrolledLiveSessions.length > 0 
          ? `${student.enrolledLiveSessions.length} session(s)` 
          : 'No sessions',
        'Registered Date': student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '',
        'Registered Time': student.createdAt ? new Date(student.createdAt).toLocaleTimeString() : '',
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 8 },   // S.No
        { wch: 20 },  // Name
        { wch: 30 },  // Email
        { wch: 15 },  // Phone
        { wch: 20 },  // Location
        { wch: 20 },  // Center
        { wch: 12 },  // Status
        { wch: 40 },  // Courses
        { wch: 20 },  // Live Sessions
        { wch: 15 },  // Registered Date
        { wch: 15 },  // Registered Time
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Students');

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `students_export_${currentDate}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      toast.success(`${students.length} students exported to Excel successfully!`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export students to Excel");
    }
  };

  return (
    <motion.div
      key="list"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="w-full"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Registered Students
            </h2>
            <p className="text-gray-600 mt-1">
              Total: {students.length} students enrolled
            </p>
          </div>
          <div className="flex items-center">
            <Button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <Download size={16} />
              Export Excel
            </Button>
          </div>
        </div>
        
        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0 mr-3">
                        {student.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {student.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.location}
                      {student.center && (
                        <div className="text-xs text-gray-500">{student.center}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      student.mode === 'online' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {student.mode || 'Not specified'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.course && student.course.length > 0 ? (
                        <div className="space-y-1">
                          {student.course.slice(0, 2).map((course, index) => (
                            <div key={index} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                              {course.title || course}
                            </div>
                          ))}
                          {student.course.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{student.course.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">No courses</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(student.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-1">
                      {/* Contact Actions */}
                      <a
                        href={`mailto:${student.email}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Send Email"
                        className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded transition-colors flex items-center justify-center"
                      >
                        <Mail size={14} />
                      </a>
                      <a
                        href={getWhatsAppLink(student.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="WhatsApp"
                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded transition-colors flex items-center justify-center"
                      >
                        <FaWhatsapp size={14} />
                      </a>
                      <a
                        href={`tel:${student.phone}`}
                        title="Call"
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition-colors flex items-center justify-center"
                      >
                        <Smartphone size={14} />
                      </a>
                      
                      {/* Management Actions */}
                      <button
                        onClick={() => handleEditStudent(student)}
                        title="Edit Student"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded transition-colors flex items-center justify-center"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleSuspendStudent(student)}
                        title={student.status === 'suspended' ? 'Unsuspend Student' : 'Suspend Student'}
                        className={`p-2 rounded transition-colors flex items-center justify-center ${
                          student.status === 'suspended' 
                            ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                      >
                        <UserX size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student)}
                        title="Delete Student"
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors flex items-center justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      <EditStudentModal
        student={editingStudent}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
      />
    </motion.div>
  );
}

function DigitalHubAccessTab({ students, loading, onStudentUpdated }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStudentId, setUpdatingStudentId] = useState(null);

  const filteredStudents = students.filter((student) =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone?.includes(searchTerm) ||
    student.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.center?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleAccess = async (student) => {
    const nextUnlocked = !Boolean(student.digitalHubAccessOverride);
    const actionLabel = nextUnlocked ? "unfreeze" : "restore normal locking for";

    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel} ${student.name}'s Digital Hub access?`
      )
    ) {
      return;
    }

    try {
      setUpdatingStudentId(student._id);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No admin token found");
      }

      await axios.put(
        `${API_BASE}/v1/students/admin/digital-hub-access/${student._id}`,
        { unlocked: nextUnlocked },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(
        nextUnlocked
          ? `${student.name}'s Digital Hub access is now fully unfrozen.`
          : `${student.name}'s Digital Hub access is back to normal lock order.`
      );

      if (onStudentUpdated) onStudentUpdated();
    } catch (error) {
      console.error("Error updating Digital Hub access:", error);
      toast.error(
        error.response?.data?.message || error.message || "Failed to update Digital Hub access"
      );
    } finally {
      setUpdatingStudentId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
      </div>
    );
  }

  if (!students?.length) {
    return (
      <div className="text-gray-500 text-center py-12">
        No students available.
      </div>
    );
  }

  return (
    <motion.div
      key="access"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="w-full"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Digital Hub Access Override
            </h2>
            <p className="text-gray-600 mt-1">
              Unfreeze all chapters and topics for a specific student without affecting others.
            </p>
          </div>
          <div className="relative max-w-md w-full md:w-96">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Use <strong>Unfreeze All</strong> to bypass chapter/topic lock order for one student only.
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Digital Hub Access
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                const accessEnabled = Boolean(student.digitalHubAccessOverride);
                return (
                  <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0 mr-3">
                          {student.name?.charAt(0)?.toUpperCase() || "S"}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {student.course && student.course.length > 0 ? (
                          <div className="space-y-1">
                            {student.course.slice(0, 2).map((course, index) => (
                              <div key={index} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                                {course.title || course}
                              </div>
                            ))}
                            {student.course.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{student.course.length - 2} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">No courses</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full ${
                        accessEnabled
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {accessEnabled ? <Unlock size={14} /> : <Lock size={14} />}
                        {accessEnabled ? "Unfrozen" : "Locked by order"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleAccess(student)}
                        disabled={updatingStudentId === student._id}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          accessEnabled
                            ? "bg-gray-900 hover:bg-gray-800 text-white"
                            : "bg-indigo-500 hover:bg-indigo-600 text-white"
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {updatingStudentId === student._id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : accessEnabled ? (
                          <Lock size={16} />
                        ) : (
                          <Unlock size={16} />
                        )}
                        {accessEnabled ? "Restore Lock Order" : "Unfreeze All"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

// Student Profile Card Component
function StudentProfileCard({ student, onEdit }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
            {student.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{student.name}</h3>
            <p className="text-gray-600">{student.email}</p>
          </div>
        </div>
        <button
          onClick={() => onEdit(student)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg transition-colors flex items-center gap-2"
          title="Edit Profile"
        >
          <Edit size={16} />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 text-gray-600">
          <Phone size={16} className="text-indigo-500" />
          <span>{student.phone || 'Not provided'}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <Monitor size={16} className="text-indigo-500" />
          <span className="capitalize">{student.mode || 'Not specified'}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <MapPin size={16} className="text-indigo-500" />
          <span>{student.location || 'Not provided'}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <Building size={16} className="text-indigo-500" />
          <span>{student.center || 'Not provided'}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Student ID: {student._id?.slice(-8) || 'N/A'}</span>
          <span>Joined: {new Date(student.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );
}

// Student Profile Management Component
function StudentProfileManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    mode: "",
    location: "",
    center: "",
    password: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE}/v1/students`
      );
      setStudents(extractStudents(response.data));
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudentId(student._id);
    setEditForm({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      mode: student.mode || "",
      location: student.location || "",
      center: student.center || "",
      password: "", // Don't pre-fill password
    });
    setEditError("");
  };

  const handleCancelEdit = () => {
    setEditingStudentId(null);
    setEditForm({
      name: "",
      email: "",
      phone: "",
      mode: "",
      location: "",
      center: "",
      password: "",
    });
    setEditError("");
  };

  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
    setEditError("");
  };

  const handleSaveEdit = async (studentId) => {
    setEditLoading(true);
    setEditError("");

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("No admin token found");
      }

      // Prepare update data (exclude empty password)
      const updateData = { ...editForm };
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await axios.put(
        `${API_BASE}/v1/students/admin/update-profile/${studentId}`,
        updateData,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      toast.success("Student profile updated successfully!");
      setEditingStudentId(null);
      fetchStudents(); // Refresh the list
    } catch (err) {
      console.error("Error updating student:", err);
      setEditError(
        err.response?.data?.message || err.message || "Something went wrong"
      );
    } finally {
      setEditLoading(false);
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter((student) =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone?.includes(searchTerm) ||
    student.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.center?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Export to Excel function
  const exportToExcel = () => {
    if (filteredStudents.length === 0) {
      toast.error("No students to export");
      return;
    }

    try {
      // Prepare data for Excel export
      const excelData = filteredStudents.map((student, index) => ({
        'S.No': index + 1,
        'Name': student.name || '',
        'Email': student.email || '',
        'Phone': student.phone || '',
        'Status': student.mode || 'Not specified',
        'Location': student.location || '',
        'Center': student.center || '',
        'Student ID': student._id?.slice(-8) || 'N/A',
        'Joined Date': student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '',
        'Courses': student.course && student.course.length > 0 
          ? student.course.map(course => course.title || course).join(', ') 
          : 'No courses',
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 8 },   // S.No
        { wch: 20 },  // Name
        { wch: 30 },  // Email
        { wch: 15 },  // Phone
        { wch: 12 },  // Status
        { wch: 20 },  // Location
        { wch: 20 },  // Center
        { wch: 12 },  // Student ID
        { wch: 15 },  // Joined Date
        { wch: 40 },  // Courses
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Student Profiles');

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `student_profiles_${currentDate}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      toast.success(`${filteredStudents.length} student profiles exported to Excel successfully!`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export student profiles to Excel");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading student profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Student Profile Management</h2>
          <p className="text-gray-600">Manage and update student profile information</p>
        </div>

        {/* Search and Export Section */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search students by name, email, phone, location, or center..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <Button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Download size={16} />
            Export Excel
          </Button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Students</p>
                <p className="text-2xl font-bold text-gray-800">{students.length}</p>
              </div>
              <User className="text-indigo-500" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Online Students</p>
                <p className="text-2xl font-bold text-green-600">
                  {students.filter(s => s.mode === 'online').length}
                </p>
              </div>
              <Monitor className="text-green-500" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Offline Students</p>
                <p className="text-2xl font-bold text-blue-600">
                  {students.filter(s => s.mode === 'offline').length}
                </p>
              </div>
              <Building className="text-blue-500" size={32} />
            </div>
          </div>
        </div>

        {/* Excel-style Table */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <User className="text-gray-400 mx-auto mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm ? 'No students found' : 'No students registered'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Students will appear here once they register'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                    S.No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                    Center
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                    Joined Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student, index) => (
                  <React.Fragment key={student._id}>
                    {/* Regular row */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-300">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0 mr-3">
                            {student.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">
                        {student.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-300">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.mode === 'online' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {student.mode || 'Not specified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">
                        {student.location || 'Not provided'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">
                        {student.center || 'Not provided'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">
                        {student._id?.slice(-8) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-300">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">
                        {student.course && student.course.length > 0 ? (
                          <div className="space-y-1">
                            {student.course.slice(0, 2).map((course, courseIndex) => (
                              <div key={courseIndex} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                                {course.title || course}
                              </div>
                            ))}
                            {student.course.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{student.course.length - 2} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">No courses</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditStudent(student)}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded transition-colors flex items-center gap-1"
                          title="Edit Profile"
                          disabled={editingStudentId === student._id}
                        >
                          <Edit size={14} />
                          {editingStudentId === student._id ? 'Editing...' : 'Edit'}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Edit form row */}
                    {editingStudentId === student._id && (
                      <tr className="bg-blue-50 border-t-2 border-blue-200">
                        <td colSpan="11" className="px-6 py-6">
                          <div className="bg-white rounded-lg border border-blue-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Edit size={20} className="text-indigo-500" />
                                Edit Student Profile
                              </h3>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                                disabled={editLoading}
                              >
                                <X size={20} />
                              </button>
                            </div>
                            
                            {editError && (
                              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                                <AlertCircle size={16} />
                                {editError}
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                  <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    disabled={editLoading}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                  <input
                                    type="tel"
                                    name="phone"
                                    value={editForm.phone}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    disabled={editLoading}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                  <input
                                    type="text"
                                    name="location"
                                    value={editForm.location}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    disabled={editLoading}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password (optional)</label>
                                  <input
                                    type="password"
                                    name="password"
                                    value={editForm.password}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    disabled={editLoading}
                                    placeholder="Leave empty to keep current password"
                                  />
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                  <input
                                    type="email"
                                    name="email"
                                    value={editForm.email}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    disabled={editLoading}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                                  <select
                                    name="mode"
                                    value={editForm.mode}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    disabled={editLoading}
                                  >
                                    <option value="">Select Mode</option>
                                    <option value="Digital Hub+Virtual">Digital Hub+Virtual</option>
                                    <option value="Digital Hub+Center">Digital Hub+Center</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Center</label>
                                  <input
                                    type="text"
                                    name="center"
                                    value={editForm.center}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    disabled={editLoading}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
                              <p className="text-sm">
                                <strong>Note:</strong> Profile image cannot be changed through this interface. 
                                Students can update their profile image from their dashboard.
                              </p>
                            </div>

                            <div className="flex justify-end space-x-3">
                              <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                disabled={editLoading}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(student._id)}
                                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                disabled={editLoading}
                              >
                                {editLoading ? (
                                  <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <Save size={16} />
                                    Update Profile
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </motion.div>
  );
}

export default function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("add"); // "add", "list", "access", or "profile"

  useEffect(() => {
    if (activeTab === "list" || activeTab === "access") {
      setLoading(true);
      axios
        .get(`${API_BASE}/v1/students`)
        .then((res) => setStudents(extractStudents(res.data)))
        .catch((err) => {
          console.error("Error fetching students:", err);
          setStudents([]);
        })
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  const handleStudentAdded = () => {
    setActiveTab("list");
    setLoading(true);
    axios
      .get(`${API_BASE}/v1/students`)
      .then((res) => setStudents(extractStudents(res.data)))
      .catch((err) => {
        console.error("Error fetching students:", err);
        setStudents([]);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="w-full px-4 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Student Management</h1>
        <p className="text-gray-600">Manage and view all enrolled students</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8">
        <Button
          onClick={() => setActiveTab("add")}
          className={`flex items-center gap-2 px-6 py-3 ${
            activeTab === "add"
              ? "bg-indigo-500 text-white shadow-lg"
              : "bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
          }`}
        >
          <PlusCircle size={18} />
          Add Student
        </Button>
        <Button
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-2 px-6 py-3 ${
            activeTab === "list"
              ? "bg-indigo-500 text-white shadow-lg"
              : "bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
          }`}
        >
          <ListIcon size={18} />
          View Students
        </Button>
        <Button
          onClick={() => setActiveTab("access")}
          className={`flex items-center gap-2 px-6 py-3 ${
            activeTab === "access"
              ? "bg-indigo-500 text-white shadow-lg"
              : "bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
          }`}
        >
          <Unlock size={18} />
          Digital Hub Access
        </Button>
        <Button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-6 py-3 ${
            activeTab === "profile"
              ? "bg-indigo-500 text-white shadow-lg"
              : "bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
          }`}
        >
          <User size={18} />
          Profile Management
        </Button>
      </div>

      {/* Tab panels */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {activeTab === "add" && (
            <AddStudentForm key="addform" onSuccess={handleStudentAdded} />
          )}
          {activeTab === "list" &&
            (loading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-64"
              >
                <Loader2 className="animate-spin text-indigo-500" size={36} />
              </motion.div>
            ) : (
              <StudentsTable key="studentstable" students={students} onStudentUpdated={handleStudentAdded} />
            ))}
          {activeTab === "access" &&
            (loading ? (
              <motion.div
                key="access-loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-64"
              >
                <Loader2 className="animate-spin text-indigo-500" size={36} />
              </motion.div>
            ) : (
              <DigitalHubAccessTab
                key="digitalhubaccess"
                students={students}
                loading={loading}
                onStudentUpdated={handleStudentAdded}
              />
            ))}
          {activeTab === "profile" && (
            <StudentProfileManagement key="profilemanagement" />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
