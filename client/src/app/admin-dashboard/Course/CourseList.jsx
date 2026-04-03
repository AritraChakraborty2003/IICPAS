"use client";
import { getApiBase } from "@/lib/apiBase";

import React, { useEffect, useState, useRef, forwardRef } from "react";
import {
  Box,
  Button,
  TextField,
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
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useAuth } from "@/contexts/AuthContext";

const MySwal = withReactContent(Swal);
const API_BASE = getApiBase();
const extractCourseList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.courses)) return payload.courses;
  if (Array.isArray(payload?.data?.courses)) return payload.data.courses;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const CourseList = forwardRef(
  (
    {
      onAddCourse,
      onEditCourse,
      onAddChapter,
      onDeleteCourse,
      onToggleStatus,
      onManageLevels,
      onGroupPricing,
    },
    ref
  ) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const { hasPermission } = useAuth();

    const statusColors = {
      Active: "success",
      Inactive: "error",
    };

    const fetchCourses = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE}/courses`);
        setCourses(extractCourseList(response.data));
      } catch (error) {
        console.error("Error fetching courses:", error);
        MySwal.fire("Error!", "Failed to fetch courses", "error");
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchCourses();
    }, []);

    // Expose fetchCourses to parent component
    React.useImperativeHandle(ref, () => ({
      fetchCourses,
    }));

    const handleToggleStatus = async (course) => {
      try {
        await axios.put(`${API_BASE}/courses/${course._id}/toggle-status`);
        await onToggleStatus(course);
        fetchCourses();
      } catch (error) {
        console.error("Error toggling status:", error);
        MySwal.fire("Error!", "Failed to toggle status", "error");
      }
    };

    return (
      <Box sx={{ height: "auto", overflow: "visible" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={3}
        >
          <Typography variant="h5" fontWeight={700} sx={{ color: "#1a237e" }}>
            Courses
          </Typography>
          <Stack direction="row" spacing={2}>
            {hasPermission("course", "add") && (
              <Button
                variant="outlined"
                onClick={onManageLevels}
                sx={{
                  borderColor: "#1976d2",
                  color: "#1976d2",
                  borderRadius: "8px",
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#1565c0",
                    backgroundColor: "#e3f2fd",
                  },
                }}
              >
                Manage Levels
              </Button>
            )}
            {hasPermission("course", "add") && (
              <Button
                variant="outlined"
                onClick={onGroupPricing}
                sx={{
                  borderColor: "#2e7d32",
                  color: "#2e7d32",
                  borderRadius: "8px",
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#1b5e20",
                    backgroundColor: "#e8f5e8",
                  },
                }}
              >
                Group Pricing
              </Button>
            )}
            {hasPermission("course", "add") && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAddCourse}
                sx={{
                  background:
                    "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
                  borderRadius: "8px",
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)",
                    boxShadow: "0 6px 16px rgba(25, 118, 210, 0.4)",
                  },
                }}
              >
                ADD COURSE
              </Button>
            )}
          </Stack>
        </Stack>
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            p: 2,
            border: "1px solid #e8eaf6",
            height: "auto",
            overflow: "visible",
          }}
        >
          {loading ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography>Loading courses...</Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      background:
                        "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                      borderBottom: "2px solid #dee2e6",
                    }}
                  >
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontWeight: 700,
                        fontSize: 15,
                        borderBottom: "2px solid #dee2e6",
                      }}
                    >
                      Category
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontWeight: 700,
                        fontSize: 15,
                        borderBottom: "2px solid #dee2e6",
                      }}
                    >
                      Course Name
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontWeight: 700,
                        fontSize: 15,
                        borderBottom: "2px solid #dee2e6",
                      }}
                    >
                      Level
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontWeight: 700,
                        fontSize: 15,
                        borderBottom: "2px solid #dee2e6",
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontWeight: 700,
                        fontSize: 15,
                        borderBottom: "2px solid #dee2e6",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr
                      key={course._id}
                      style={{
                        borderBottom: "1px solid #f0f0f0",
                        minHeight: "60px",
                        "&:hover": {
                          backgroundColor: "#f8f9fa",
                        },
                      }}
                    >
                      <td style={{ padding: "16px", fontSize: 15 }}>
                        {course.category}
                      </td>
                      <td style={{ padding: "16px", fontSize: 15 }}>
                        {course.title}
                      </td>
                      <td style={{ padding: "16px", fontSize: 15 }}>
                        {course.level}
                      </td>
                      <td style={{ padding: "16px", fontSize: 15 }}>
                        <Chip
                          label={course.status}
                          color={statusColors[course.status] || "default"}
                          variant="outlined"
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            borderRadius: "12px",
                          }}
                        />
                      </td>
                      <td style={{ padding: "16px", fontSize: 15 }}>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >
                          {hasPermission("course", "read") && (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => onAddChapter(course)}
                              sx={{
                                px: 2,
                                py: 0.75,
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                borderRadius: "8px",
                                textTransform: "none",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                height: 32,
                                minWidth: "auto",
                                "&:hover": {
                                  boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                                },
                              }}
                            >
                              Chapters
                            </Button>
                          )}

                          {hasPermission("course", "update") && (
                            <Tooltip title="Edit Course" arrow>
                              <IconButton
                                size="small"
                                onClick={() => onEditCourse(course)}
                                sx={{
                                  bgcolor: "#e3f2fd",
                                  color: "#1976d2",
                                  "&:hover": {
                                    bgcolor: "#bbdefb",
                                  },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {hasPermission("course", "read") && (
                            <Tooltip title="View Course" arrow>
                              <IconButton
                                size="small"
                                onClick={() => onEditCourse(course)}
                                sx={{
                                  bgcolor: "#e8f5e8",
                                  color: "#2e7d32",
                                  "&:hover": {
                                    bgcolor: "#c8e6c9",
                                  },
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {hasPermission("course", "delete") && (
                            <Tooltip title="Delete Course" arrow>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  onDeleteCourse(course, fetchCourses)
                                }
                                sx={{
                                  bgcolor: "#ffebee",
                                  color: "#d32f2f",
                                  "&:hover": {
                                    bgcolor: "#ffcdd2",
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </Box>
      </Box>
    );
  }
);

export default CourseList;
