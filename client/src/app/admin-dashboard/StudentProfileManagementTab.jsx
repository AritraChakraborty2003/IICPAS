"use client";
import { getApiBase } from "@/lib/apiBase";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Loader2,
  Search,
  Edit,
  Save,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Monitor,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

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

// Edit Student Profile Modal Component
function EditStudentProfileModal({ student, isOpen, onClose, onSuccess }) {
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
        `${getApiBase()}/v1/students/admin/update-profile/${student._id}`,
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
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Full Name", name: "name", type: "text", required: true, icon: <User size={16} /> },
                { label: "Email Address", name: "email", type: "email", required: true, icon: <Mail size={16} /> },
                { label: "Phone Number", name: "phone", type: "tel", required: true, icon: <Phone size={16} /> },
                { label: "Mode", name: "mode", type: "select", options: ["online", "offline"], icon: <Monitor size={16} /> },
                { label: "Location", name: "location", type: "text", icon: <MapPin size={16} /> },
                { label: "Center", name: "center", type: "text", icon: <Building size={16} /> },
                { label: "New Password (optional)", name: "password", type: "password", icon: <UserCheck size={16} /> },
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
                    className="text-gray-500 flex items-center gap-2"
                  >
                    {field.icon}
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

export default function StudentProfileManagementTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${getApiBase()}/v1/students`
      );
      setStudents(response.data.students || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingStudent(null);
  };

  const handleEditSuccess = () => {
    fetchStudents(); // Refresh the list
  };

  // Filter students based on search term
  const filteredStudents = students.filter((student) =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone?.includes(searchTerm) ||
    student.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.center?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="w-full px-4 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Student Profile Management</h1>
        <p className="text-gray-600">Manage and update student profile information</p>
      </div>

      {/* Search Section */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search students by name, email, phone, location, or center..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
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

      {/* Students Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredStudents.map((student) => (
              <StudentProfileCard
                key={student._id}
                student={student}
                onEdit={handleEditStudent}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Student Modal */}
      <EditStudentProfileModal
        student={editingStudent}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
