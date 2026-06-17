"use client";
import { getApiBase } from "@/lib/apiBase";

import React, { useEffect, useState, forwardRef } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
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
  DragOverlay,
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

const extractCourseList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.courses)) return payload.courses;
  if (Array.isArray(payload?.data?.courses)) return payload.data.courses;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const statusColors = { Active: "success", Inactive: "error" };

// ─── Single sortable row ───────────────────────────────────────────────────────
function SortableRow({ course, onAddChapter, onEditCourse, onDeleteCourse, fetchCourses, hasPermission }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: course._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    borderBottom: "1px solid #f0f0f0",
    background: isDragging ? "#e3f2fd" : "white",
  };

  return (
    <tr ref={setNodeRef} style={style}>
      {/* Drag handle */}
      <td style={{ padding: "12px 8px", width: 36, cursor: "grab" }} {...attributes} {...listeners}>
        <DragIndicatorIcon fontSize="small" sx={{ color: "#aaa", display: "block" }} />
      </td>
      <td style={{ padding: "12px 16px", fontSize: 15 }}>{course.category}</td>
      <td style={{ padding: "12px 16px", fontSize: 15 }}>{course.title}</td>
      <td style={{ padding: "12px 16px", fontSize: 15 }}>{course.level}</td>
      <td style={{ padding: "12px 16px", fontSize: 15 }}>
        <Chip
          label={course.status}
          color={statusColors[course.status] || "default"}
          variant="outlined"
          size="small"
          sx={{ fontWeight: 600, fontSize: "0.75rem", borderRadius: "12px" }}
        />
      </td>
      <td style={{ padding: "12px 16px", fontSize: 15 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {hasPermission("course", "read") && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => onAddChapter(course)}
              sx={{ px: 2, py: 0.75, fontSize: "0.75rem", fontWeight: 600, borderRadius: "8px", textTransform: "none", height: 32 }}
            >
              Chapters
            </Button>
          )}
          {hasPermission("course", "update") && (
            <Tooltip title="Edit Course" arrow>
              <IconButton size="small" onClick={() => onEditCourse(course)} sx={{ bgcolor: "#e3f2fd", color: "#1976d2", "&:hover": { bgcolor: "#bbdefb" } }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission("course", "read") && (
            <Tooltip title="View Course" arrow>
              <IconButton size="small" onClick={() => onEditCourse(course)} sx={{ bgcolor: "#e8f5e8", color: "#2e7d32", "&:hover": { bgcolor: "#c8e6c9" } }}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasPermission("course", "delete") && (
            <Tooltip title="Delete Course" arrow>
              <IconButton size="small" onClick={() => onDeleteCourse(course, fetchCourses)} sx={{ bgcolor: "#ffebee", color: "#d32f2f", "&:hover": { bgcolor: "#ffcdd2" } }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </td>
    </tr>
  );
}

// ─── Main CourseList ───────────────────────────────────────────────────────────
const CourseList = forwardRef(
  ({ onAddCourse, onEditCourse, onAddChapter, onDeleteCourse, onToggleStatus, onManageLevels, onGroupPricing }, ref) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeId, setActiveId] = useState(null);
    const { hasPermission } = useAuth();

    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const fetchCourses = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE}/courses`);
        setCourses(extractCourseList(response.data));
      } catch {
        MySwal.fire("Error!", "Failed to fetch courses", "error");
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => { fetchCourses(); }, []);

    React.useImperativeHandle(ref, () => ({ fetchCourses }));

    const handleDragStart = ({ active }) => setActiveId(active.id);

    const handleDragEnd = async ({ active, over }) => {
      setActiveId(null);
      if (!over || active.id === over.id) return;

      const oldIndex = courses.findIndex((c) => c._id === active.id);
      const newIndex = courses.findIndex((c) => c._id === over.id);
      const reordered = arrayMove(courses, oldIndex, newIndex);
      setCourses(reordered);

      setSaving(true);
      try {
        await axios.put(`${API_BASE}/courses/reorder`, {
          orderedIds: reordered.map((c) => c._id),
        });
      } catch {
        MySwal.fire("Error!", "Failed to save order", "error");
        fetchCourses();
      } finally {
        setSaving(false);
      }
    };

    const activeCourse = courses.find((c) => c._id === activeId);

    return (
      <Box sx={{ height: "auto", overflow: "visible" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#1a237e" }}>Courses</Typography>
            {saving && <Typography variant="caption" sx={{ color: "#1976d2" }}>Saving order...</Typography>}
          </Stack>
          <Stack direction="row" spacing={2}>
            {hasPermission("course", "add") && (
              <Button variant="outlined" onClick={onManageLevels} sx={{ borderColor: "#1976d2", color: "#1976d2", borderRadius: "8px", px: 3, py: 1, fontWeight: 600, textTransform: "none" }}>
                Manage Levels
              </Button>
            )}
            {hasPermission("course", "add") && (
              <Button variant="outlined" onClick={onGroupPricing} sx={{ borderColor: "#2e7d32", color: "#2e7d32", borderRadius: "8px", px: 3, py: 1, fontWeight: 600, textTransform: "none" }}>
                Group Pricing
              </Button>
            )}
            {hasPermission("course", "add") && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAddCourse}
                sx={{ background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)", borderRadius: "8px", px: 3, py: 1, fontWeight: 600, textTransform: "none" }}
              >
                ADD COURSE
              </Button>
            )}
          </Stack>
        </Stack>

        <Box sx={{ bgcolor: "white", borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", p: 2, border: "1px solid #e8eaf6" }}>
          {loading ? (
            <Box sx={{ textAlign: "center", py: 4 }}><Typography>Loading courses...</Typography></Box>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={courses.map((c) => c._id)} strategy={verticalListSortingStrategy}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)", borderBottom: "2px solid #dee2e6" }}>
                        <th style={{ padding: "16px 8px", width: 36 }} title="Drag to reorder">⠿</th>
                        {["Category", "Course Name", "Level", "Status", "Action"].map((h) => (
                          <th key={h} style={{ padding: "16px", textAlign: "left", fontWeight: 700, fontSize: 15, borderBottom: "2px solid #dee2e6" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <SortableRow
                          key={course._id}
                          course={course}
                          onAddChapter={onAddChapter}
                          onEditCourse={onEditCourse}
                          onDeleteCourse={onDeleteCourse}
                          fetchCourses={fetchCourses}
                          hasPermission={hasPermission}
                        />
                      ))}
                    </tbody>
                  </table>
                </SortableContext>

                {/* Ghost row while dragging */}
                <DragOverlay>
                  {activeCourse && (
                    <table style={{ width: "100%", borderCollapse: "collapse", background: "#e3f2fd", borderRadius: 8, boxShadow: "0 8px 24px rgba(25,118,210,0.2)" }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: "12px 8px", width: 36 }}><DragIndicatorIcon fontSize="small" sx={{ color: "#1976d2" }} /></td>
                          <td style={{ padding: "12px 16px", fontSize: 15, fontWeight: 600 }}>{activeCourse.category}</td>
                          <td style={{ padding: "12px 16px", fontSize: 15, fontWeight: 600 }}>{activeCourse.title}</td>
                          <td style={{ padding: "12px 16px", fontSize: 15 }}>{activeCourse.level}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <Chip label={activeCourse.status} color={statusColors[activeCourse.status] || "default"} variant="outlined" size="small" />
                          </td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  )}
                </DragOverlay>
              </DndContext>

              <Typography variant="caption" sx={{ color: "#999", mt: 1, display: "block", pl: 1 }}>
                Drag the ⠿ handle to reorder courses. Order is saved automatically and reflects on the public courses page.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  }
);

CourseList.displayName = "CourseList";
export default CourseList;
