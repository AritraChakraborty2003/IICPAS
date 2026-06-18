"use client";
import { getApiBase } from "@/lib/apiBase";

import React, {
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useAuth } from "@/contexts/AuthContext";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const MySwal = withReactContent(Swal);
const API_BASE = getApiBase();

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

function SortableChapterRow({ chapter, index, courseName, onViewTopics, onEditChapter, onDelete, hasPermission }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: chapter._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: isDragging ? "#e3f2fd" : index % 2 === 0 ? "#fff" : "#fafafa",
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td style={{ padding: "12px 8px", width: 36, cursor: "grab", color: "#bbb", textAlign: "center" }} {...attributes} {...listeners}>
        <DragIndicatorIcon fontSize="small" sx={{ display: "block", margin: "0 auto" }} />
      </td>
      <td style={{ padding: "12px 16px", fontSize: 15, color: "#475569" }}>{index + 1}</td>
      <td style={{ padding: "12px 16px", fontSize: 15 }}>{courseName}</td>
      <td style={{ padding: "12px 16px", fontSize: 15, fontWeight: 500 }}>{chapter.title}</td>
      <td style={{ padding: "12px 16px", fontSize: 14, color: "#475569" }}>
        {formatDateTime(chapter.publishAt || chapter.updatedAt || chapter.createdAt)}
      </td>
      <td style={{ padding: "12px 16px" }}>
        <Stack direction="row" spacing={1}>
          {hasPermission("course", "read") && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => onViewTopics(chapter)}
              sx={{ textTransform: "none", fontWeight: 600, fontSize: 13 }}
            >
              Topics
            </Button>
          )}
          {hasPermission("course", "update") && (
            <Tooltip title="Edit Chapter">
              <IconButton color="info" size="small" onClick={() => onEditChapter(chapter)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission("course", "delete") && (
            <Tooltip title="Delete Chapter">
              <IconButton color="error" size="small" onClick={() => onDelete(chapter._id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </td>
    </tr>
  );
}

const ChapterList = forwardRef(
  ({ courseId, courseName, onViewCourse, onViewTopics, onEditChapter }, ref) => {
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [addingChapter, setAddingChapter] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [saving, setSaving] = useState(false);
    const { hasPermission } = useAuth();

    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    useImperativeHandle(ref, () => ({ fetchChapters }));

    const fetchChapters = useCallback(() => {
      setLoading(true);
      axios
        .get(`${API_BASE}/chapters/course/${courseId}`)
        .then((res) => {
          if (res.data.success) setChapters(res.data.chapters || []);
          else setChapters([]);
        })
        .catch(() => setChapters([]))
        .finally(() => setLoading(false));
    }, [courseId]);

    useEffect(() => {
      if (courseId) fetchChapters();
    }, [courseId, fetchChapters]);

    const handleDelete = async (id) => {
      const result = await MySwal.fire({
        title: "Are you sure?",
        text: "You will not be able to recover this chapter!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      });
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_BASE}/chapters/${id}`);
          fetchChapters();
          MySwal.fire("Deleted!", "Chapter has been deleted.", "success");
        } catch {
          MySwal.fire("Error!", "Failed to delete chapter", "error");
        }
      }
    };

    const handleDragEnd = async ({ active, over }) => {
      if (!over || active.id === over.id) return;
      const oldIndex = chapters.findIndex((c) => c._id === active.id);
      const newIndex = chapters.findIndex((c) => c._id === over.id);
      const reordered = arrayMove(chapters, oldIndex, newIndex);
      setChapters(reordered);
      try {
        await axios.put(`${API_BASE}/chapters/reorder/${courseId}`, {
          orderedIds: reordered.map((c) => c._id),
        });
      } catch {
        MySwal.fire("Error!", "Failed to save chapter order", "error");
        fetchChapters();
      }
    };

    const handleAddChapter = async (e) => {
      e.preventDefault();
      if (!newTitle.trim()) return;
      setSaving(true);
      try {
        await axios.post(`${API_BASE}/chapters/by-course/${courseId}`, {
          title: newTitle.trim(),
          order: chapters.length + 1,
          status: "Active",
          publishAt: new Date().toISOString(),
          seoTitle: "",
          seoKeywords: "",
          seoDescription: "",
          metaTitle: "",
          metaKeywords: "",
          metaDescription: "",
        });
        setNewTitle("");
        setAddingChapter(false);
        fetchChapters();
        MySwal.fire("Success!", "Chapter added successfully", "success");
      } catch (error) {
        console.error("Error adding chapter:", error);
        MySwal.fire("Error!", "Failed to add chapter", "error");
      }
      setSaving(false);
    };

    const filteredChapters = chapters.filter((ch) =>
      ch.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h5" fontWeight={700}>
            Chapters for "{courseName}"
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search..."
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {!addingChapter && hasPermission("course", "add") && (
              <Button
                variant="contained"
                sx={{
                  bgcolor: "#1a237e",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  px: 3,
                  py: 1.2,
                  borderRadius: 1.5,
                  "&:hover": { bgcolor: "#283593" },
                }}
                onClick={() => setAddingChapter(true)}
              >
                Add Chapter
              </Button>
            )}
            <Button variant="outlined" onClick={onViewCourse}>
              VIEW COURSE
            </Button>
          </Stack>
        </Stack>

        {addingChapter && (
          <Box
            component="form"
            onSubmit={handleAddChapter}
            sx={{ bgcolor: "white", p: 3, borderRadius: 2, boxShadow: 3, maxWidth: 480, mb: 3 }}
          >
            <Stack spacing={2}>
              <TextField
                label="Chapter Title"
                required
                fullWidth
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => { setAddingChapter(false); setNewTitle(""); }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={saving}>
                  {saving ? "Adding..." : "Add Chapter"}
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}

        <Box sx={{ bgcolor: "white", borderRadius: 3, boxShadow: 2, overflow: "hidden" }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: "center", color: "#888" }}>Loading chapters...</Box>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={filteredChapters.map((c) => c._id)}
                strategy={verticalListSortingStrategy}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f6f8fa" }}>
                      <th style={{ padding: "14px 8px", width: 36 }} title="Drag to reorder" />
                      <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 700, fontSize: 15 }}>Sr. No.</th>
                      <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 700, fontSize: 15 }}>Course Name</th>
                      <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 700, fontSize: 15 }}>Chapter Name</th>
                      <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 700, fontSize: 15 }}>Date & Time</th>
                      <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 700, fontSize: 15 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChapters.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#888" }}>
                          No chapters found.
                        </td>
                      </tr>
                    ) : (
                      filteredChapters.map((chapter, index) => (
                        <SortableChapterRow
                          key={chapter._id}
                          chapter={chapter}
                          index={index}
                          courseName={courseName}
                          onViewTopics={onViewTopics}
                          onEditChapter={onEditChapter}
                          onDelete={handleDelete}
                          hasPermission={hasPermission}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          )}
        </Box>

        <Typography variant="caption" sx={{ mt: 1.5, display: "block", color: "#888" }}>
          Drag the ⠿ handle to reorder chapters. Order is saved automatically.
        </Typography>
      </Box>
    );
  }
);

ChapterList.displayName = "ChapterList";

export default ChapterList;
