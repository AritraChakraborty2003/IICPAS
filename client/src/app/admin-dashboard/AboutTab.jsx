"use client";
import { getApiBase, getApiOrigin } from "@/lib/apiBase";
import React, { useState, useEffect } from "react";
import {
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import QuillEditor from "../components/QuillEditor";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const API_BASE = getApiBase();
const API_ORIGIN = getApiOrigin();

const extractAbout = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.about)) return payload.about;
  return [];
};

export default function AboutTab() {
  const [aboutList, setAboutList] = useState([]);
  const [mode, setMode] = useState("view");
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    content: "",
  });
  const { hasPermission } = useAuth();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await axios.get(
        `${API_ORIGIN}/api/about`
      );
      setAboutList(extractAbout(res.data));
    } catch (err) {
      console.error("Failed to fetch content", err);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        await axios.put(
          `${API_ORIGIN}/api/about/${editingItem}`,
          { content: form.content }
        );
      } else {
        await axios.post(`${API_ORIGIN}/api/about`, {
          content: form.content,
        });
      }
      resetForm();
      fetchContent();
      setMode("view");
    } catch (err) {
      console.error("Error saving content", err);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item._id);
    setForm({ content: item.content });
    setMode("edit");
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the content.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${API_ORIGIN}/api/about/${id}`
        );
        fetchContent();
        MySwal.fire("Deleted!", "The content has been removed.", "success");
      } catch (err) {
        console.error("Delete failed", err);
        MySwal.fire("Error!", "Failed to delete content.", "error");
      }
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setForm({ content: "" });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">About Us</h2>
        <div className="flex gap-2">
          <Button
            variant={mode === "edit" ? "contained" : "outlined"}
            onClick={() => {
              resetForm();
              setMode("edit");
            }}
          >
            Add About Content
          </Button>
          <Button
            variant={mode === "view" ? "contained" : "outlined"}
            onClick={() => setMode("view")}
          >
            View About Content
          </Button>
        </div>
      </div>

      {mode === "edit" && (
        <div className="bg-white rounded-md p-1 w-full max-w-6xl">
          <QuillEditor
            value={form.content}
            onChange={(value) => setForm({ ...form, content: value })}
            height={300}
          />
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="contained" onClick={handleSubmit}>
              {editingItem ? "Update" : "Submit"}
            </Button>
            <Button variant="outlined" onClick={() => setMode("view")}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {mode === "view" && (
        <div className="bg-white rounded-md p-1 w-full max-w-6xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">About Us</h2>
            {hasPermission("about", "add") && (
              <Button variant="contained" onClick={() => setMode("add")}>
                Add About
              </Button>
            )}
          </div>
          {aboutList.length === 0 ? (
            <p>No About Us content added yet.</p>
          ) : (
            aboutList.map((item) => (
              <div key={item._id} className="border-b py-4 relative">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  {hasPermission("edit_about") && (
                    <IconButton onClick={() => handleEdit(item)} size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                  {hasPermission("delete_about") && (
                    <IconButton
                      onClick={() => handleDelete(item._id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
