"use client";
import { getApiBase, getApiOrigin } from "@/lib/apiBase";

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { toast } from "react-hot-toast";
import { formatTextAsParagraphs } from "@/lib/blogUtils";
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
const extractCourseList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.courses)) return payload.courses;
  if (Array.isArray(payload?.data?.courses)) return payload.data.courses;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const extractGroupPricingList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.groupPricing)) return payload.groupPricing;
  if (Array.isArray(payload?.data?.groupPricing)) {
    return payload.data.groupPricing;
  }
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const GroupPricingTab = ({ onBack }) => {
  const [groupPricing, setGroupPricing] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    groupName: "",
    level: "",
    courseIds: [],
    groupPrice: "",
    description: "",
    duration: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    image: null,
    certificateImage: null,
    certificateText: "",
    recordedPrice: "",
    recordedFinalPrice: "",
    recordedDiscount: "",
    livePrice: "",
    liveFinalPrice: "",
    liveDiscount: "",
    recordedPriceCenter: "0",
    recordedFinalPriceCenter: "0",
    recordedDiscountCenter: "0",
    livePriceCenter: "0",
    liveFinalPriceCenter: "0",
    liveDiscountCenter: "0",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [certImagePreview, setCertImagePreview] = useState(null);
  const [imageDimensions, setImageDimensions] = useState(null);

  const courseLevels = [
    { value: "Executive Level", label: "Executive Level" },
    { value: "Professional Level", label: "Professional Level" },
  ];

  useEffect(() => {
    fetchGroupPricing();
    fetchCourses();
  }, []);

  const fetchGroupPricing = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/group-pricing`);
      const groupPricingData = extractGroupPricingList(response.data);

      // Ensure courses are populated
      const populatedGroupPricing = groupPricingData.map((item) => ({
        ...item,
        courseIds: item.courseIds || [],
      }));

      setGroupPricing(populatedGroupPricing);
    } catch (error) {
      console.error("Error fetching group pricing:", error);
      // Initialize with empty array if API doesn't exist yet
      setGroupPricing([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_BASE}/courses`);
      setCourses(extractCourseList(response.data));
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      groupName: "",
      level: "",
      courseIds: [],
      groupPrice: "",
      description: "",
      duration: "",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      image: null,
      certificateImage: null,
      certificateText: "",
      recordedPrice: "",
      recordedFinalPrice: "",
      recordedDiscount: "",
      livePrice: "",
      liveFinalPrice: "",
      liveDiscount: "",
      recordedPriceCenter: "0",
      recordedFinalPriceCenter: "0",
      recordedDiscountCenter: "0",
      livePriceCenter: "0",
      liveFinalPriceCenter: "0",
      liveDiscountCenter: "0",
    });
    setImagePreview(null);
    setImageDimensions(null);
    setCertImagePreview(null);
    setOpenDialog(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);

    // Debug: Log the item data to see what's available
    console.log("Editing item:", item);
    console.log("Item pricing:", item.pricing);
    console.log(
      "Recorded session center:",
      item.pricing?.recordedSessionCenter
    );
    console.log("Live session center:", item.pricing?.liveSessionCenter);

    // Extract course IDs from populated objects
    const courseIds = (item.courseIds || []).map((course) =>
      typeof course === "object" ? course._id : course
    );

    setFormData({
      groupName: item.groupName || "",
      level: item.level,
      courseIds: courseIds,
      groupPrice: item.groupPrice.toString(),
      description: item.description || "",
      duration: item.duration || "",
      metaTitle: item.metaTitle || "",
      metaDescription: item.metaDescription || "",
      metaKeywords: item.metaKeywords || "",
      image: null,
      certificateImage: null,
      certificateText: item.certificate?.text || "",
      recordedPrice: item.pricing?.recordedSession?.price?.toString() || "",
      recordedFinalPrice:
        item.pricing?.recordedSession?.finalPrice?.toString() || "",
      recordedDiscount:
        item.pricing?.recordedSession?.discount?.toString() || "",
      livePrice: item.pricing?.liveSession?.price?.toString() || "",
      liveFinalPrice: item.pricing?.liveSession?.finalPrice?.toString() || "",
      liveDiscount: item.pricing?.liveSession?.discount?.toString() || "",
      recordedPriceCenter:
        item.pricing?.recordedSessionCenter?.price !== undefined
          ? item.pricing.recordedSessionCenter.price.toString()
          : "",
      recordedFinalPriceCenter:
        item.pricing?.recordedSessionCenter?.finalPrice !== undefined
          ? item.pricing.recordedSessionCenter.finalPrice.toString()
          : "",
      recordedDiscountCenter:
        item.pricing?.recordedSessionCenter?.discount !== undefined
          ? item.pricing.recordedSessionCenter.discount.toString()
          : "",
      livePriceCenter:
        item.pricing?.liveSessionCenter?.price !== undefined
          ? item.pricing.liveSessionCenter.price.toString()
          : "",
      liveFinalPriceCenter:
        item.pricing?.liveSessionCenter?.finalPrice !== undefined
          ? item.pricing.liveSessionCenter.finalPrice.toString()
          : "",
      liveDiscountCenter:
        item.pricing?.liveSessionCenter?.discount !== undefined
          ? item.pricing.liveSessionCenter.discount.toString()
          : "",
    });
    const rawImage = item.image || null;
    const fullImageUrl = rawImage
      ? rawImage.startsWith("http")
        ? rawImage
        : `${getApiOrigin()}${rawImage}`
      : null;
    setImagePreview(fullImageUrl);
    setImageDimensions(null);
    if (fullImageUrl) {
      const img = new Image();
      img.onload = () => setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      img.src = fullImageUrl;
    }
    const rawCertImage = item.certificate?.image || null;
    const fullCertUrl = rawCertImage
      ? rawCertImage.startsWith("http") ? rawCertImage : `${getApiOrigin()}${rawCertImage}`
      : null;
    setCertImagePreview(fullCertUrl);
    setOpenDialog(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        setImagePreview(dataUrl);
        const img = new Image();
        img.onload = () => setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (item) => {
    const result = await MySwal.fire({
      title: `Delete group pricing for ${item.level}?`,
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE}/group-pricing/${item._id}`);
      toast.success("Group pricing deleted successfully!", {
        style: {
          zIndex: 9999,
          position: "top-center",
        },
      });
      fetchGroupPricing();
    } catch (error) {
      console.error("Error deleting group pricing:", error);
      toast.error("Failed to delete group pricing", {
        style: {
          zIndex: 9999,
          position: "top-center",
        },
      });
    }
  };

  const handleSave = async () => {
    if (
      !formData.groupName ||
      !formData.level ||
      !formData.courseIds.length ||
      !formData.groupPrice ||
      !formData.recordedPrice ||
      !formData.recordedFinalPrice ||
      !formData.livePrice ||
      !formData.liveFinalPrice ||
      !formData.recordedPriceCenter ||
      !formData.recordedFinalPriceCenter ||
      !formData.livePriceCenter ||
      !formData.liveFinalPriceCenter
    ) {
      toast.error(
        "Please fill in all required fields including group name and center session pricing",
        {
          style: {
            zIndex: 9999,
            position: "top-center",
          },
        }
      );
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("groupName", formData.groupName);
      formDataToSend.append("level", formData.level);
      formDataToSend.append("courseIds", JSON.stringify(formData.courseIds));
      formDataToSend.append("groupPrice", formData.groupPrice);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("duration", formData.duration);
      formDataToSend.append("metaTitle", formData.metaTitle);
      formDataToSend.append("metaDescription", formData.metaDescription);
      formDataToSend.append("metaKeywords", formData.metaKeywords);
      formDataToSend.append("recordedPrice", formData.recordedPrice);
      formDataToSend.append("recordedFinalPrice", formData.recordedFinalPrice);
      formDataToSend.append("recordedDiscount", formData.recordedDiscount);
      formDataToSend.append("livePrice", formData.livePrice);
      formDataToSend.append("liveFinalPrice", formData.liveFinalPrice);
      formDataToSend.append("liveDiscount", formData.liveDiscount);

      // Add center session pricing data
      formDataToSend.append(
        "recordedPriceCenter",
        formData.recordedPriceCenter
      );
      formDataToSend.append(
        "recordedFinalPriceCenter",
        formData.recordedFinalPriceCenter
      );
      formDataToSend.append(
        "recordedDiscountCenter",
        formData.recordedDiscountCenter
      );
      formDataToSend.append("livePriceCenter", formData.livePriceCenter);
      formDataToSend.append(
        "liveFinalPriceCenter",
        formData.liveFinalPriceCenter
      );
      formDataToSend.append("liveDiscountCenter", formData.liveDiscountCenter);

      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }
      if (formData.certificateImage) {
        formDataToSend.append("certificateImage", formData.certificateImage);
      }
      formDataToSend.append("certificateText", formData.certificateText || "");

      if (editingItem) {
        await axios.put(
          `${API_BASE}/group-pricing/${editingItem._id}`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success("Group pricing updated successfully!", {
          style: {
            zIndex: 9999,
            position: "top-center",
          },
        });
      } else {
        await axios.post(`${API_BASE}/group-pricing`, formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Group pricing created successfully!", {
          style: {
            zIndex: 9999,
            position: "top-center",
          },
        });
      }

      setOpenDialog(false);
      fetchGroupPricing();
    } catch (error) {
      console.error("Error saving group pricing:", error);

      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;

      toast.error(apiMessage || "Failed to save group pricing", {
        style: {
          zIndex: 9999,
          position: "top-center",
        },
      });
    }
  };

  const computeGroupDuration = (selectedIds, courseList) => {
    if (!selectedIds?.length || !courseList?.length) return "";
    let totalHours = 0;
    let hasAny = false;
    selectedIds.forEach((id) => {
      const course = courseList.find((c) => c._id === id);
      if (!course?.duration) return;
      const match = course.duration.match(/(\d+(\.\d+)?)/);
      if (match) {
        totalHours += parseFloat(match[1]);
        hasAny = true;
      }
    });
    if (!hasAny) return "";
    const weeks = (totalHours / 6).toFixed(1).replace(/\.0$/, "");
    return `${totalHours} Hours (${weeks} weeks)`;
  };

  const getSelectedCourseNames = (courseIds) => {
    if (!courseIds || !Array.isArray(courseIds)) return [];

    return courseIds.map((courseId) => {
      // Handle both string IDs and populated course objects
      if (typeof courseId === "object" && courseId.title) {
        return courseId.title;
      }

      const course = courses.find((c) => c._id === courseId);
      return course ? course.title : `Course ID: ${courseId}`;
    });
  };

  return (
    <Box
      sx={{
        height: "auto",
        overflow: "visible",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Typography variant="h5" fontWeight={700} sx={{ color: "#1a237e" }}>
          Group Pricing Management
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={onBack}
            sx={{
              borderColor: "#1976d2",
              color: "#1976d2",
              borderRadius: "8px",
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            ← Back
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            sx={{
              background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
              borderRadius: "8px",
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
            }}
          >
            Add Group Pricing
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography>Loading group pricing...</Typography>
        </Box>
      ) : groupPricing.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No group pricing configurations found. Click "Add Group Pricing" to
          create one.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {groupPricing.map((item) => (
            <Grid item xs={12} md={6} lg={4} key={item._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  border: "1px solid #e8eaf6",
                  "&:hover": {
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Chip
                      label={item.level}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Edit" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(item)}
                          sx={{
                            bgcolor: "#e3f2fd",
                            color: "#1976d2",
                            "&:hover": { bgcolor: "#bbdefb" },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(item)}
                          sx={{
                            bgcolor: "#ffebee",
                            color: "#d32f2f",
                            "&:hover": { bgcolor: "#ffcdd2" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  {item.groupName && (
                    <Typography
                      variant="h5"
                      sx={{ mb: 1, color: "#1976d2", fontWeight: 700 }}
                    >
                      {item.groupName}
                    </Typography>
                  )}

                  <Typography
                    variant="h6"
                    sx={{ mb: 1, color: "#2e7d32", fontWeight: 600 }}
                  >
                    ₹{item.groupPrice.toLocaleString()}
                  </Typography>

                  {item.description && (
                    <Typography
                      component="div"
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, "& p": { margin: "0 0 8px 0" } }}
                      dangerouslySetInnerHTML={{
                        __html: formatTextAsParagraphs(item.description),
                      }}
                    />
                  )}

                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    Courses Included:
                  </Typography>
                  <Stack spacing={0.5}>
                    {getSelectedCourseNames(item.courseIds).map(
                      (courseName, index) => (
                        <Chip
                          key={index}
                          label={courseName}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.75rem" }}
                        />
                      )
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? "Edit Group Pricing" : "Add Group Pricing"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Group Name"
              value={formData.groupName}
              onChange={(e) =>
                setFormData({ ...formData, groupName: e.target.value })
              }
              required
              placeholder="e.g., GST Pro, Accounting Master"
            />

            <FormControl fullWidth required>
              <InputLabel>Course Level</InputLabel>
              <Select
                value={formData.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: e.target.value })
                }
                label="Course Level"
              >
                {courseLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Select Courses</InputLabel>
              <Select
                multiple
                value={formData.courseIds}
                onChange={(e) => {
                  const newIds = e.target.value;
                  setFormData({
                    ...formData,
                    courseIds: newIds,
                    duration: computeGroupDuration(newIds, courses),
                  });
                }}
                label="Select Courses"
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => {
                      const course = courses.find((c) => c._id === value);
                      return (
                        <Chip
                          key={value}
                          label={course?.title || "Unknown"}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {courses.map((course) => (
                  <MenuItem key={course._id} value={course._id}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Group Price (₹)"
              type="number"
              value={formData.groupPrice}
              onChange={(e) =>
                setFormData({ ...formData, groupPrice: e.target.value })
              }
              required
              inputProps={{ min: 0, step: 0.01 }}
            />

            <Box>
              <TextField
                fullWidth
                label="Duration"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
                placeholder="e.g., 62 Hours (10 weeks)"
                helperText={(() => {
                  if (!formData.courseIds?.length) return "Shown on the course card. Leave blank to hide.";
                  const breakdown = formData.courseIds.map((id) => {
                    const c = courses.find((x) => x._id === id);
                    return c ? `${c.title}: ${c.duration || "—"}` : null;
                  }).filter(Boolean).join(" | ");
                  return `Auto-computed from selected courses. ${breakdown}`;
                })()}
              />
              {formData.courseIds?.length > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ mt: 0.5, fontSize: 12 }}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      duration: computeGroupDuration(formData.courseIds, courses),
                    })
                  }
                >
                  Recalculate from courses
                </Button>
              )}
            </Box>

            <TextField
              fullWidth
              label="Description (Optional)"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe this group pricing package..."
            />

            {/* SEO / Meta Section */}
            <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
              SEO / Meta Information
            </Typography>
            <TextField
              fullWidth
              label="Meta Title"
              value={formData.metaTitle}
              onChange={(e) =>
                setFormData({ ...formData, metaTitle: e.target.value })
              }
              placeholder="Title that appears in search engines and browser tabs"
              helperText="Leave blank to use the group name. Recommended: up to ~60 characters."
            />
            <TextField
              fullWidth
              label="Meta Description"
              multiline
              rows={2}
              value={formData.metaDescription}
              onChange={(e) =>
                setFormData({ ...formData, metaDescription: e.target.value })
              }
              placeholder="Short summary shown in search engine results"
              helperText="Leave blank to use the description. Recommended: up to ~160 characters."
            />
            <TextField
              fullWidth
              label="Meta Keywords / Tags"
              value={formData.metaKeywords}
              onChange={(e) =>
                setFormData({ ...formData, metaKeywords: e.target.value })
              }
              placeholder="e.g., gst course, taxation training, accounting"
              helperText="Comma-separated keywords for SEO."
            />

            {/* Pricing Section */}
            <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
              Pricing Configuration
            </Typography>

            {/* Recorded Session Pricing */}
            <Typography
              variant="subtitle1"
              sx={{ mt: 2, mb: 1, fontWeight: 500 }}
            >
              Recorded Session Pricing
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Original Price (₹)"
                  type="number"
                  value={formData.recordedPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, recordedPrice: e.target.value })
                  }
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Final Price (₹)"
                  type="number"
                  value={formData.recordedFinalPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recordedFinalPrice: e.target.value,
                    })
                  }
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Discount (%)"
                  type="number"
                  value={formData.recordedDiscount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recordedDiscount: e.target.value,
                    })
                  }
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
              </Grid>
            </Grid>

            {/* Live Session Pricing */}
            <Typography
              variant="subtitle1"
              sx={{ mt: 2, mb: 1, fontWeight: 500 }}
            >
              Live Session Pricing
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Original Price (₹)"
                  type="number"
                  value={formData.livePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, livePrice: e.target.value })
                  }
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Final Price (₹)"
                  type="number"
                  value={formData.liveFinalPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, liveFinalPrice: e.target.value })
                  }
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Discount (%)"
                  type="number"
                  value={formData.liveDiscount}
                  onChange={(e) =>
                    setFormData({ ...formData, liveDiscount: e.target.value })
                  }
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
              </Grid>
            </Grid>

            {/* Recorded Session Center Pricing */}
            <Typography
              variant="subtitle1"
              sx={{ mt: 2, mb: 1, fontWeight: 500 }}
            >
              Recorded Session Center Pricing
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Original Price (₹)"
                  type="number"
                  value={formData.recordedPriceCenter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recordedPriceCenter: e.target.value,
                    })
                  }
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Final Price (₹)"
                  type="number"
                  value={formData.recordedFinalPriceCenter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recordedFinalPriceCenter: e.target.value,
                    })
                  }
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Discount (%)"
                  type="number"
                  value={formData.recordedDiscountCenter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recordedDiscountCenter: e.target.value,
                    })
                  }
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
              </Grid>
            </Grid>

            {/* Live Session Center Pricing */}
            <Typography
              variant="subtitle1"
              sx={{ mt: 2, mb: 1, fontWeight: 500 }}
            >
              Live Session Center Pricing
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Original Price (₹)"
                  type="number"
                  value={formData.livePriceCenter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      livePriceCenter: e.target.value,
                    })
                  }
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Final Price (₹)"
                  type="number"
                  value={formData.liveFinalPriceCenter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      liveFinalPriceCenter: e.target.value,
                    })
                  }
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Discount (%)"
                  type="number"
                  value={formData.liveDiscountCenter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      liveDiscountCenter: e.target.value,
                    })
                  }
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
              </Grid>
            </Grid>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Group Pricing Image (Optional)
              </Typography>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ marginBottom: 16 }}
              />
              {imagePreview && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Image Preview:
                  </Typography>
                  <img
                    src={imagePreview}
                    alt="Group Pricing Preview"
                    style={{
                      width: "100%",
                      maxWidth: "480px",
                      height: "270px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      border: "1px solid #ddd",
                      display: "block",
                    }}
                  />
                  <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#555" }}>
                    {imageDimensions
                      ? `Current image size: ${imageDimensions.width} × ${imageDimensions.height} px`
                      : "Measuring image..."}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: "#888" }}>
                    Recommended: 480 × 270 px (16:9 ratio) for best display.
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Certificate Section */}
            <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 2 }}>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                Sample Certificate (Optional)
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Certificate Image
              </Typography>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setFormData({ ...formData, certificateImage: file });
                    const reader = new FileReader();
                    reader.onloadend = () => setCertImagePreview(reader.result);
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ marginBottom: 12 }}
              />
              {certImagePreview && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <img
                    src={certImagePreview}
                    alt="Certificate Preview"
                    style={{
                      width: "100%",
                      maxWidth: "480px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      display: "block",
                    }}
                  />
                </Box>
              )}
              <TextField
                fullWidth
                label="Certificate Description / Text"
                multiline
                rows={3}
                value={formData.certificateText}
                onChange={(e) => setFormData({ ...formData, certificateText: e.target.value })}
                placeholder="e.g. Upon completion, students receive an industry-recognised certificate from IICPA Institute."
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDialog(false)}
            startIcon={<CancelIcon />}
            sx={{ color: "#666" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
            }}
          >
            {editingItem ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupPricingTab;
