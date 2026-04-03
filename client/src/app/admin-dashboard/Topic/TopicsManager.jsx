"use client";
import { getApiOrigin } from "@/lib/apiBase";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Pencil, Trash2, Plus } from "lucide-react";
import ViewTrainingsTab from "./ViewTrainingsTab";

const API_URL = getApiOrigin();

export default function TopicsPage() {
  const [topics, setTopics] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    pricePerHour: "",
  });

  // Fetch topics once on mount
  useEffect(() => {
    fetchTopics();
  }, []);

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Topic?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/api/v1/topics-trainings/${id}`);
        fetchTopics();
        Swal.fire("Deleted!", "Topic has been deleted.", "success");
      } catch (err) {
        Swal.fire("Error!", "Failed to delete topic.", "error");
      }
    }
  };

  const fetchTopics = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/topics-trainings`);
      setTopics(res.data);
    } catch (err) {
      console.error("Failed to fetch topics", err);
    }
  };
  const handleAddTopic = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/v1/topics-trainings`, formData);
      setFormData({ title: "", description: "", price: "", pricePerHour: "" });
      setIsAdding(false);
      fetchTopics();
      Swal.fire("Success!", "Topic has been added.", "success");
    } catch (err) {
      console.log(err);
      Swal.fire("Error!", "Failed to add topic.", "error");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Training Topics</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={16} /> {isAdding ? "Cancel" : "ADD TOPIC"}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAddTopic}
          className="bg-white p-4 rounded-md shadow-md mb-6 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            placeholder="Price per Hour (₹)"
            value={formData.pricePerHour}
            onChange={(e) =>
              setFormData({ ...formData, pricePerHour: e.target.value })
            }
            className="border p-2 rounded"
            min="0"
            step="0.01"
            required
          />
          <div className="md:col-span-3">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Save Topic
            </button>
          </div>
        </form>
      )}

      <ViewTrainingsTab topics={topics} fetchTopics={fetchTopics} />
    </div>
  );
}
