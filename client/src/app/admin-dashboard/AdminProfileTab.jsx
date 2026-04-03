"use client";
import { getApiBase, getApiOrigin } from "@/lib/apiBase";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Upload,
  User,
  Save,
  Edit3,
  X,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Phone,
  Mail,
  User as UserIcon,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function AdminProfileTab() {
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    professional: true,
    social: false,
    preferences: false,
    visibility: false,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    image: "",
    bio: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
    dateOfBirth: "",
    gender: "",
    department: "",
    designation: "",
    employeeId: "",
    joiningDate: "",
    experience: "",
    qualifications: "",
    socialLinks: {
      linkedin: "",
      twitter: "",
      facebook: "",
      instagram: "",
      website: "",
    },
    preferences: {
      theme: "light",
      language: "en",
      timezone: "Asia/Kolkata",
      notifications: {
        email: true,
        sms: true,
        push: true,
      },
    },
    fieldVisibility: {
      phone: true,
      address: false,
      dateOfBirth: false,
      gender: false,
      department: true,
      designation: true,
      employeeId: false,
      joiningDate: false,
      experience: true,
      qualifications: true,
      socialLinks: true,
      bio: true,
    },
  });

  const [originalData, setOriginalData] = useState({});

  // Fetch admin data on mount
  useEffect(() => {
    if (user) {
      const userData = {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "",
        image: user.image || "",
        bio: user.bio || "",
        address: user.address || {
          street: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
        },
        dateOfBirth: user.dateOfBirth || "",
        gender: user.gender || "",
        department: user.department || "",
        designation: user.designation || "",
        employeeId: user.employeeId || "",
        joiningDate: user.joiningDate || "",
        experience: user.experience || "",
        qualifications: user.qualifications || "",
        socialLinks: user.socialLinks || {
          linkedin: "",
          twitter: "",
          facebook: "",
          instagram: "",
          website: "",
        },
        preferences: user.preferences || {
          theme: "light",
          language: "en",
          timezone: "Asia/Kolkata",
          notifications: {
            email: true,
            sms: true,
            push: true,
          },
        },
        fieldVisibility: user.fieldVisibility || {
          phone: true,
          address: false,
          dateOfBirth: false,
          gender: false,
          department: true,
          designation: true,
          employeeId: false,
          joiningDate: false,
          experience: true,
          qualifications: true,
          socialLinks: true,
          bio: true,
        },
      };

      setFormData(userData);
      setOriginalData(userData);
      setLoading(false);
    }
  }, [user]);

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => {
      if (field.includes(".")) {
        const parts = field.split(".");
        if (parts.length === 2) {
          const [parent, child] = parts;
          return {
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: value,
            },
          };
        } else if (parts.length === 3) {
          const [parent, child, grandchild] = parts;
          return {
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: {
                ...prev[parent][child],
                [grandchild]: value,
              },
            },
          };
        }
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  }, []);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle profile image upload
  const handleImageUpload = async () => {
    if (!profileImage) {
      toast.error("Please select an image first");
      return;
    }

    setImageLoading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", profileImage);

      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        handleInputChange("image", data.relativePath);
        setImagePreview(null);
        setProfileImage(null);
        toast.success("Profile image uploaded successfully!");
        await refreshUser();
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Error uploading image");
    } finally {
      setImageLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const API_BASE =
        getApiBase();
      const token = localStorage.getItem("adminToken");

      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE}/admin/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Profile updated successfully!");
        setOriginalData({ ...formData });
        setEditing(false);
        await refreshUser();
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...originalData });
    setEditing(false);
    setImagePreview(null);
    setProfileImage(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  const toggleFieldVisibility = (field) => {
    setFormData((prev) => ({
      ...prev,
      fieldVisibility: {
        ...prev.fieldVisibility,
        [field]: !prev.fieldVisibility[field],
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const SectionHeader = ({
    title,
    icon: Icon,
    isExpanded,
    onToggle,
    count,
  }) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {count > 0 && (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {count} fields
          </span>
        )}
      </div>
      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
    </button>
  );

  const FormField = ({
    label,
    children,
    icon: Icon,
    visibilityField,
    isVisible,
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          {Icon && <Icon size={16} />}
          {label}
        </label>
        {visibilityField && (
          <button
            onClick={() => toggleFieldVisibility(visibilityField)}
            className={`p-1 rounded ${
              isVisible
                ? "text-green-600 bg-green-100"
                : "text-gray-400 bg-gray-100"
            }`}
            title={isVisible ? "Visible to others" : "Hidden from others"}
          >
            {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen lg:flex-row gap-6 px-6 pt-4 pb-10 font-sans">
      {/* Left Sidebar */}
      <div className="w-full lg:w-1/4 bg-white border rounded-xl shadow-md p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          {/* Profile Image */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : formData.image ? (
                <img
                  src={`${
                    getApiOrigin()
                  }${formData.image}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} className="text-gray-500" />
              )}
            </div>
            {/* Upload Button */}
            <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
              <Upload size={16} />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Upload Image Button */}
          {profileImage && (
            <div className="w-full">
              <button
                onClick={handleImageUpload}
                disabled={imageLoading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {imageLoading ? "Uploading..." : "Upload Image"}
              </button>
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-blue-700">{formData.name}</h2>
            <p className="text-sm text-gray-700">{formData.email}</p>
            <p className="text-sm text-gray-800 font-semibold">
              {formData.phone || "Not provided"}
            </p>
            <p className="text-sm text-blue-600 font-medium capitalize">
              {formData.role}
            </p>
            {formData.department && (
              <p className="text-xs text-gray-600 mt-1">
                {formData.department}
              </p>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="text-red-600 mt-4 border px-4 py-2 rounded-lg hover:bg-red-50"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Right Content */}
      <div className="w-full lg:w-3/4 bg-white rounded-xl shadow-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-semibold text-blue-800 mb-2">
                Profile Information
              </h3>
              <p className="text-sm text-blue-600">
                Manage your admin profile information. You can update all your
                details and control what others can see.
              </p>
            </div>

            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Personal Information Section */}
            <div className="border rounded-lg overflow-hidden">
              <SectionHeader
                title="Personal Information"
                icon={UserIcon}
                isExpanded={expandedSections.personal}
                onToggle={() => toggleSection("personal")}
                count={6}
              />
              {expandedSections.personal && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Full Name" icon={UserIcon}>
                      {editing ? (
                        <input
                          key="name-input"
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.name}
                        </div>
                      )}
                    </FormField>

                    <FormField label="Email Address" icon={Mail}>
                      {editing ? (
                        <input
                          key="email-input"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your email"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.email}
                        </div>
                      )}
                    </FormField>

                    <FormField
                      label="Phone Number"
                      icon={Phone}
                      visibilityField="phone"
                      isVisible={formData.fieldVisibility.phone}
                    >
                      {editing ? (
                        <input
                          key="phone-input"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your phone number"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.phone || "Not provided"}
                        </div>
                      )}
                    </FormField>

                    <FormField label="Gender">
                      {editing ? (
                        <select
                          key="gender-select"
                          value={formData.gender}
                          onChange={(e) =>
                            handleInputChange("gender", e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700 capitalize">
                          {formData.gender || "Not specified"}
                        </div>
                      )}
                    </FormField>

                    <FormField label="Date of Birth" icon={Calendar}>
                      {editing ? (
                        <input
                          key="dateOfBirth-input"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) =>
                            handleInputChange("dateOfBirth", e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.dateOfBirth || "Not provided"}
                        </div>
                      )}
                    </FormField>

                    <FormField label="Role">
                      {editing ? (
                        <select
                          key="role-select"
                          value={formData.role}
                          onChange={(e) =>
                            handleInputChange("role", e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="superadmin">Super Admin</option>
                          <option value="hr">HR</option>
                          <option value="sales">Sales</option>
                        </select>
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700 capitalize">
                          {formData.role}
                        </div>
                      )}
                    </FormField>
                  </div>

                  <FormField label="Bio" icon={UserIcon}>
                    {editing ? (
                      <textarea
                        key="bio-textarea"
                        value={formData.bio}
                        onChange={(e) =>
                          handleInputChange("bio", e.target.value)
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    ) : (
                      <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                        {formData.bio || "No bio provided"}
                      </div>
                    )}
                  </FormField>

                  {/* Address Fields */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin size={18} />
                      Address Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Street Address">
                        {editing ? (
                          <input
                            key="address-street-input"
                            type="text"
                            value={formData.address.street}
                            onChange={(e) =>
                              handleInputChange(
                                "address.street",
                                e.target.value
                              )
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter street address"
                          />
                        ) : (
                          <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                            {formData.address.street || "Not provided"}
                          </div>
                        )}
                      </FormField>

                      <FormField label="City">
                        {editing ? (
                          <input
                            key="address-city-input"
                            type="text"
                            value={formData.address.city}
                            onChange={(e) =>
                              handleInputChange("address.city", e.target.value)
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter city"
                          />
                        ) : (
                          <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                            {formData.address.city || "Not provided"}
                          </div>
                        )}
                      </FormField>

                      <FormField label="State">
                        {editing ? (
                          <input
                            key="address-state-input"
                            type="text"
                            value={formData.address.state}
                            onChange={(e) =>
                              handleInputChange("address.state", e.target.value)
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter state"
                          />
                        ) : (
                          <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                            {formData.address.state || "Not provided"}
                          </div>
                        )}
                      </FormField>

                      <FormField label="Pincode">
                        {editing ? (
                          <input
                            key="address-pincode-input"
                            type="text"
                            value={formData.address.pincode}
                            onChange={(e) =>
                              handleInputChange(
                                "address.pincode",
                                e.target.value
                              )
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter pincode"
                          />
                        ) : (
                          <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                            {formData.address.pincode || "Not provided"}
                          </div>
                        )}
                      </FormField>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Professional Information Section */}
            <div className="border rounded-lg overflow-hidden">
              <SectionHeader
                title="Professional Information"
                icon={Briefcase}
                isExpanded={expandedSections.professional}
                onToggle={() => toggleSection("professional")}
                count={6}
              />
              {expandedSections.professional && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Department"
                      icon={Briefcase}
                      visibilityField="department"
                      isVisible={formData.fieldVisibility.department}
                    >
                      {editing ? (
                        <input
                          key="department-input"
                          type="text"
                          value={formData.department}
                          onChange={(e) =>
                            handleInputChange("department", e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter department"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.department || "Not specified"}
                        </div>
                      )}
                    </FormField>

                    <FormField
                      label="Designation"
                      icon={Briefcase}
                      visibilityField="designation"
                      isVisible={formData.fieldVisibility.designation}
                    >
                      {editing ? (
                        <input
                          key="designation-input"
                          type="text"
                          value={formData.designation}
                          onChange={(e) =>
                            handleInputChange("designation", e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter designation"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.designation || "Not specified"}
                        </div>
                      )}
                    </FormField>

                    <FormField
                      label="Employee ID"
                      icon={UserIcon}
                      visibilityField="employeeId"
                      isVisible={formData.fieldVisibility.employeeId}
                    >
                      {editing ? (
                        <input
                          type="text"
                          value={formData.employeeId}
                          onChange={(e) =>
                            handleInputChange("employeeId", e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter employee ID"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.employeeId || "Not provided"}
                        </div>
                      )}
                    </FormField>

                    <FormField
                      label="Joining Date"
                      icon={Calendar}
                      visibilityField="joiningDate"
                      isVisible={formData.fieldVisibility.joiningDate}
                    >
                      {editing ? (
                        <input
                          type="date"
                          value={formData.joiningDate}
                          onChange={(e) =>
                            handleInputChange("joiningDate", e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.joiningDate || "Not provided"}
                        </div>
                      )}
                    </FormField>

                    <FormField
                      label="Experience"
                      icon={Briefcase}
                      visibilityField="experience"
                      isVisible={formData.fieldVisibility.experience}
                    >
                      {editing ? (
                        <input
                          type="text"
                          value={formData.experience}
                          onChange={(e) =>
                            handleInputChange("experience", e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 5 years in IT"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.experience || "Not specified"}
                        </div>
                      )}
                    </FormField>

                    <FormField
                      label="Qualifications"
                      icon={GraduationCap}
                      visibilityField="qualifications"
                      isVisible={formData.fieldVisibility.qualifications}
                    >
                      {editing ? (
                        <input
                          type="text"
                          value={formData.qualifications}
                          onChange={(e) =>
                            handleInputChange("qualifications", e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., B.Tech, MBA"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.qualifications || "Not specified"}
                        </div>
                      )}
                    </FormField>
                  </div>
                </div>
              )}
            </div>

            {/* Social Links Section */}
            <div className="border rounded-lg overflow-hidden">
              <SectionHeader
                title="Social Links"
                icon={Globe}
                isExpanded={expandedSections.social}
                onToggle={() => toggleSection("social")}
                count={5}
              />
              {expandedSections.social && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="LinkedIn" icon={Linkedin}>
                      {editing ? (
                        <input
                          type="url"
                          value={formData.socialLinks.linkedin}
                          onChange={(e) =>
                            handleInputChange(
                              "socialLinks.linkedin",
                              e.target.value
                            )
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://linkedin.com/in/yourprofile"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.socialLinks.linkedin || "Not provided"}
                        </div>
                      )}
                    </FormField>

                    <FormField label="Twitter" icon={Twitter}>
                      {editing ? (
                        <input
                          type="url"
                          value={formData.socialLinks.twitter}
                          onChange={(e) =>
                            handleInputChange(
                              "socialLinks.twitter",
                              e.target.value
                            )
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://twitter.com/yourprofile"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.socialLinks.twitter || "Not provided"}
                        </div>
                      )}
                    </FormField>

                    <FormField label="Facebook" icon={Facebook}>
                      {editing ? (
                        <input
                          type="url"
                          value={formData.socialLinks.facebook}
                          onChange={(e) =>
                            handleInputChange(
                              "socialLinks.facebook",
                              e.target.value
                            )
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://facebook.com/yourprofile"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.socialLinks.facebook || "Not provided"}
                        </div>
                      )}
                    </FormField>

                    <FormField label="Instagram" icon={Instagram}>
                      {editing ? (
                        <input
                          type="url"
                          value={formData.socialLinks.instagram}
                          onChange={(e) =>
                            handleInputChange(
                              "socialLinks.instagram",
                              e.target.value
                            )
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://instagram.com/yourprofile"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.socialLinks.instagram || "Not provided"}
                        </div>
                      )}
                    </FormField>

                    <FormField label="Website" icon={Globe}>
                      {editing ? (
                        <input
                          type="url"
                          value={formData.socialLinks.website}
                          onChange={(e) =>
                            handleInputChange(
                              "socialLinks.website",
                              e.target.value
                            )
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://yourwebsite.com"
                        />
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.socialLinks.website || "Not provided"}
                        </div>
                      )}
                    </FormField>
                  </div>
                </div>
              )}
            </div>

            {/* Preferences Section */}
            <div className="border rounded-lg overflow-hidden">
              <SectionHeader
                title="Preferences & Settings"
                icon={UserIcon}
                isExpanded={expandedSections.preferences}
                onToggle={() => toggleSection("preferences")}
                count={4}
              />
              {expandedSections.preferences && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Theme">
                      {editing ? (
                        <select
                          value={formData.preferences.theme}
                          onChange={(e) =>
                            handleInputChange(
                              "preferences.theme",
                              e.target.value
                            )
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="auto">Auto</option>
                        </select>
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700 capitalize">
                          {formData.preferences.theme}
                        </div>
                      )}
                    </FormField>

                    <FormField label="Language">
                      {editing ? (
                        <select
                          value={formData.preferences.language}
                          onChange={(e) =>
                            handleInputChange(
                              "preferences.language",
                              e.target.value
                            )
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="en">English</option>
                          <option value="hi">Hindi</option>
                        </select>
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.preferences.language === "en"
                            ? "English"
                            : "Hindi"}
                        </div>
                      )}
                    </FormField>

                    <FormField label="Timezone">
                      {editing ? (
                        <select
                          value={formData.preferences.timezone}
                          onChange={(e) =>
                            handleInputChange(
                              "preferences.timezone",
                              e.target.value
                            )
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Asia/Kolkata">
                            Asia/Kolkata (IST)
                          </option>
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">
                            America/New_York (EST)
                          </option>
                        </select>
                      ) : (
                        <div className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700">
                          {formData.preferences.timezone}
                        </div>
                      )}
                    </FormField>
                  </div>

                  {/* Notification Preferences */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-700">
                      Notification Preferences
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium">
                          Email Notifications
                        </span>
                        {editing ? (
                          <input
                            type="checkbox"
                            checked={formData.preferences.notifications.email}
                            onChange={(e) =>
                              handleInputChange(
                                "preferences.notifications.email",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        ) : (
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              formData.preferences.notifications.email
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {formData.preferences.notifications.email
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium">
                          SMS Notifications
                        </span>
                        {editing ? (
                          <input
                            type="checkbox"
                            checked={formData.preferences.notifications.sms}
                            onChange={(e) =>
                              handleInputChange(
                                "preferences.notifications.sms",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        ) : (
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              formData.preferences.notifications.sms
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {formData.preferences.notifications.sms
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium">
                          Push Notifications
                        </span>
                        {editing ? (
                          <input
                            type="checkbox"
                            checked={formData.preferences.notifications.push}
                            onChange={(e) =>
                              handleInputChange(
                                "preferences.notifications.push",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        ) : (
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              formData.preferences.notifications.push
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {formData.preferences.notifications.push
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Field Visibility Settings */}
            <div className="border rounded-lg overflow-hidden">
              <SectionHeader
                title="Field Visibility Settings"
                icon={Eye}
                isExpanded={expandedSections.visibility}
                onToggle={() => toggleSection("visibility")}
                count={Object.keys(formData.fieldVisibility).length}
              />
              {expandedSections.visibility && (
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Control which information is visible to other users. Toggle
                    the eye icon to show/hide fields.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(formData.fieldVisibility).map(
                      ([field, isVisible]) => (
                        <div
                          key={field}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <span className="text-sm font-medium capitalize">
                            {field.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <button
                            onClick={() => toggleFieldVisibility(field)}
                            className={`p-2 rounded-full transition-colors ${
                              isVisible
                                ? "text-green-600 bg-green-100 hover:bg-green-200"
                                : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                            }`}
                            title={
                              isVisible
                                ? "Visible to others"
                                : "Hidden from others"
                            }
                          >
                            {isVisible ? (
                              <Eye size={16} />
                            ) : (
                              <EyeOff size={16} />
                            )}
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-1">
              Profile Management
            </h4>
            <p className="text-sm text-blue-700">
              As a super admin, you have full control over your profile
              information. You can update all your details, manage social links,
              set preferences, and control what information is visible to
              others. Changes will be saved immediately and reflected across the
              system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
