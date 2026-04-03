"use client";
import { getApiOrigin } from "@/lib/apiBase";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Pencil, Trash2 } from "lucide-react";
import { Switch } from "@headlessui/react";
import Swal from "sweetalert2";
import EditTopic from "./EditTopics";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = getApiOrigin();

const ViewTrainingsTab = ({ topics, fetchTopics }) => {
  const [editingTopic, setEditingTopic] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    pricePerHour: "",
  });
  const { hasPermission } = useAuth();

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the training.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/api/v1/topics-trainings/${id}`);
        fetchTopics();
        Swal.fire("Deleted!", "Training has been deleted.", "success");
      } catch (err) {
        console.error("Failed to delete topic", err);
        Swal.fire("Error", "Something went wrong!", "error");
      }
    }
  };

  // Toggle topic status
  const handleToggleStatus = async (id) => {
    try {
      await axios.put(`${API_URL}/api/v1/topics-trainings/${id}/toggle-status`);
      fetchTopics();
    } catch (err) {
      Swal.fire("Error", "Failed to toggle status", "error");
    }
  };

  const handleEditClick = (topic) => {
    setEditingTopic(topic);
    setFormData({
      title: topic.title,
      description: topic.description,
      price: topic.price,
      pricePerHour: topic.pricePerHour,
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_URL}/api/v1/topics-trainings/${editingTopic._id}`,
        formData
      );
      fetchTopics();
      setEditingTopic(null);
      Swal.fire("Updated!", "Training has been updated.", "success");
    } catch (err) {
      console.error("Failed to update topic", err);
      Swal.fire("Error", "Something went wrong!", "error");
    }
  };

  return (
    <div className="p-4">
      {editingTopic ? (
        <EditTopic
          formData={formData}
          onChange={handleFormChange}
          onSubmit={handleUpdate}
          onCancel={() => setEditingTopic(null)}
        />
      ) : (
        <div className="relative w-full overflow-x-auto  bg-white">
          <div className="absolute top-0 right-0 h-full w-6 bg-gradient-to-l from-white pointer-events-none z-10" />
          <table className="min-w-[600px] md:min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-blue-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">
                  Price/Hour
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {topics.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-gray-400 py-12 text-lg font-medium whitespace-nowrap"
                  >
                    No topics found.
                  </td>
                </tr>
              ) : (
                topics.map((topic, idx) => (
                  <tr
                    key={topic._id}
                    className="even:bg-gray-50 hover:bg-blue-50 transition"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {topic.title}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {topic.description}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-normal whitespace-nowrap">
                      ₹{topic.pricePerHour || topic.price}/hour
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {topic.status === "active" ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex items-center justify-center gap-2 whitespace-nowrap">
                      {/* Toggle Switch */}
                      <button
                        onClick={() => handleToggleStatus(topic._id)}
                        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                          topic.status === "active"
                            ? "bg-green-400"
                            : "bg-gray-300"
                        }`}
                        title="Toggle Status"
                      >
                        <span
                          className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 ${
                            topic.status === "active"
                              ? "translate-x-4"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                      {hasPermission("edit_training") && (
                        <button
                          onClick={() => handleEditClick(topic)}
                          className="rounded-full p-2 bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-700 transition"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                      {hasPermission("delete_training") && (
                        <button
                          onClick={() => handleDelete(topic._id)}
                          className="rounded-full p-2 bg-red-100 hover:bg-red-600 hover:text-white text-red-700 transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 bg-gray-50 border-t gap-2">
            <div className="text-xs text-gray-500 flex items-center gap-1">
              Rows per page:{" "}
              <select className="border rounded px-1 py-0.5 text-xs">
                <option>100</option>
              </select>
            </div>
            <div className="text-xs text-gray-500">
              1–{topics.length} of {topics.length}
            </div>
            <div className="flex gap-1">
              <button
                className="p-1 text-gray-400 hover:text-blue-600"
                disabled
              >
                &lt;
              </button>
              <button className="p-1 text-gray-400 hover:text-blue-600">
                &gt;
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        /* No block display for table elements on mobile, just let overflow-x handle scroll */
      `}</style>
    </div>
  );
};

export default ViewTrainingsTab;
