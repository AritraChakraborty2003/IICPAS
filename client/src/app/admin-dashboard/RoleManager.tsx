"use client";

import React, { useState } from "react";

const allTabs = [
  "Dashboard",
  "Course Category",
  "Course",
  "Live Session",
  "Recorded Session",
  "Center",
  "Teachers",
  "Students",
  "Batch Manager",
  "Manage Roles",
  "Staff Management",
  "Orders",
  "Enquiries",
  "Jobs",
  "Calendar",
  "Blogs",
  "Our Team",
  "Testimonials",
  "About Us",
  "Manage Metatags",
  "Companies",
  "Colleges",
  "Support Requests",
];

const RoleManager = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Admin");
  const [permissions, setPermissions] = useState<string[]>([]);

  const toggleTab = (tab: string) => {
    setPermissions((prev) =>
      prev.includes(tab) ? prev.filter((t) => t !== tab) : [...prev, tab]
    );
  };

  const handleSubmit = () => {
    const data = { email, role, allowedTabs: permissions };
    console.log("Saving permissions:", data);
    alert("Permissions saved!");
    // Call backend API here
  };

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 shadow rounded-lg space-y-6">
      <h2 className="text-3xl font-bold text-blue-800">Manage Role Access</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="font-semibold text-gray-700">User Email</label>
          <input
            type="email"
            placeholder="example@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="font-semibold text-gray-700">Select Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option>Admin</option>
            <option>HR</option>
            <option>Sales</option>
            <option>Instructor</option>
            <option>Marketing</option>
          </select>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3 text-gray-800">
          Allowed Dashboard Tabs
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {allTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => toggleTab(tab)}
              className={`px-4 py-2 rounded-full text-sm shadow transition-all duration-200 ${
                permissions.includes(tab)
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow-lg font-semibold"
      >
        Save Permissions
      </button>
    </div>
  );
};

export default RoleManager;
