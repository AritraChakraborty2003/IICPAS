"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { getApiBase } from "@/lib/apiBase";
import {
  buildTopicLessonRows,
  formatTopicLessonDateTime,
  getTopicLessonSourceLabel,
  getTopicLessonSourceUrl,
} from "@/lib/topicLessons";

const MySwal = withReactContent(Swal);
const API_BASE = getApiBase();
const STATIC_CDN_BASE =
  process.env.NEXT_PUBLIC_STATIC_CDN_BASE || "https://cdn.iicpa.in";
const MAX_VIDEO_SIZE_BYTES = 350 * 1024 * 1024;

const toDateTimeLocalValue = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const defaultSourceMode = (kind) => (kind === "live" ? "liveSession" : "link");

const createEmptyForm = (kind, topics) => ({
  topicId: topics?.[0]?._id || "",
  title: "",
  order: 1,
  status: "active",
  publishAt: toDateTimeLocalValue(),
  sourceMode: defaultSourceMode(kind),
  sourceUrl: "",
  liveSessionId: "",
  selectedFile: null,
  originalTopicId: "",
  originalLessonId: "",
  isLegacyIntro: false,
});

export default function TopicLessonsPanel({
  chapterId,
  chapterName,
  kind,
  topics = [],
  onRefresh,
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(createEmptyForm(kind, topics));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [liveSessions, setLiveSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const rows = useMemo(
    () => buildTopicLessonRows(topics, kind),
    [topics, kind]
  );

  const topicCounts = useMemo(() => {
    const counts = new Map();
    (Array.isArray(topics) ? topics : []).forEach((topic) => {
      counts.set(topic?._id || "", Array.isArray(topic?.lessons) ? topic.lessons.length : 0);
    });
    return counts;
  }, [topics]);

  const loadLiveSessions = useCallback(async () => {
    if (kind !== "live") return;
    try {
      setLoadingSessions(true);
      const response = await axios.get(`${API_BASE}/live-sessions`);
      setLiveSessions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching live sessions:", error);
      setLiveSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [kind]);

  useEffect(() => {
    if (kind === "live") {
      loadLiveSessions();
    }
  }, [kind, loadLiveSessions]);

  useEffect(() => {
    if (!dialogOpen) {
      setForm(createEmptyForm(kind, topics));
    }
  }, [dialogOpen, kind, topics]);

  const topicOptions = useMemo(
    () =>
      (Array.isArray(topics) ? topics : []).map((topic) => ({
        _id: topic?._id || "",
        title: topic?.title || "Untitled topic",
        count: topicCounts.get(topic?._id || "") || 0,
      })),
    [topicCounts, topics]
  );

  const openAddDialog = () => {
    const defaultTopic = topicOptions[0]?._id || "";
    const existingTopic = topics.find((topic) => topic?._id === defaultTopic);
    const nextOrder = Math.max(
      0,
      ...(Array.isArray(existingTopic?.lessons)
        ? existingTopic.lessons
            .filter((lesson) => lesson?.kind === kind)
            .map((lesson) => Number(lesson?.order || 0))
        : [0])
    );

    setForm({
      ...createEmptyForm(kind, topics),
      topicId: defaultTopic,
      order: Number.isFinite(nextOrder) ? nextOrder + 1 : 1,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (row) => {
    const existingLiveSessionId =
      row?.liveSessionId && typeof row.liveSessionId === "object"
        ? row.liveSessionId._id
        : row?.liveSessionId || "";

    setForm({
      topicId: row?.topicId || "",
      title: row?.title || "",
      order: Number(row?.order || 1),
      status: row?.status || "active",
      publishAt: toDateTimeLocalValue(row?.publishAt || new Date()),
      sourceMode: row?.isLegacyIntro
        ? "link"
        : row?.sourceType || defaultSourceMode(kind),
      sourceUrl: row?.sourceUrl || "",
      liveSessionId: existingLiveSessionId,
      selectedFile: null,
      originalTopicId: row?.topicId || "",
      originalLessonId: row?.lessonId || "",
      isLegacyIntro: Boolean(row?.isLegacyIntro),
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSaving(false);
    setUploading(false);
  };

  const updateTopicLessons = async (topicId, nextLessons) => {
    const response = await axios.put(`${API_BASE}/topics/${topicId}`, {
      lessons: nextLessons,
    });
    return response.data;
  };

  const uploadVideo = async (file) => {
    const formData = new FormData();
    formData.append("video", file);

    const response = await axios.post(
      `${STATIC_CDN_BASE}/upload/video`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    return (
      response.data?.data?.cdnUrl ||
      response.data?.videoUrl ||
      response.data?.data?.videoUrl ||
      ""
    );
  };

  const handleDelete = async (row) => {
    if (row?.isLegacyIntro) {
      MySwal.fire(
        "Legacy item",
        "Intro videos are managed from the topic editor.",
        "info"
      );
      return;
    }

    const result = await MySwal.fire({
      title: "Delete lesson?",
      text: `This will remove "${row?.title}" from ${row?.topicTitle}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      const targetTopic = topics.find((topic) => topic?._id === row?.topicId);
      if (!targetTopic) throw new Error("Topic not found");

      const nextLessons = (Array.isArray(targetTopic.lessons) ? targetTopic.lessons : []).filter(
        (lesson) => String(lesson?._id) !== String(row?.lessonId)
      );
      await updateTopicLessons(targetTopic._id, nextLessons);
      await onRefresh?.();
      MySwal.fire("Deleted", "Lesson removed successfully.", "success");
    } catch (error) {
      console.error("Error deleting topic lesson:", error);
      MySwal.fire(
        "Error",
        error?.response?.data?.error || error?.message || "Failed to delete lesson",
        "error"
      );
    }
  };

  const handleCopy = async (row) => {
    const url = getTopicLessonSourceUrl(row);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      MySwal.fire("Copied", "Lesson link copied to clipboard.", "success");
    } catch (error) {
      console.error("Copy failed:", error);
      MySwal.fire("Error", "Failed to copy lesson link.", "error");
    }
  };

  const handlePreview = (row) => {
    const url = getTopicLessonSourceUrl(row);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSave = async () => {
    if (!form.topicId) {
      MySwal.fire("Validation", "Please choose a topic.", "warning");
      return;
    }

    const title = form.title.trim();
    if (!title) {
      MySwal.fire("Validation", "Lesson title is required.", "warning");
      return;
    }

    const topic = topics.find((entry) => entry?._id === form.topicId);
    if (!topic) {
      MySwal.fire("Validation", "Selected topic was not found.", "warning");
      return;
    }

    setSaving(true);
    try {
      let resolvedSourceUrl = form.sourceUrl.trim();
      let selectedLiveSession = null;

      if (kind === "recorded") {
        if (form.sourceMode === "upload" && form.selectedFile) {
          if (form.selectedFile.size > MAX_VIDEO_SIZE_BYTES) {
            throw new Error("Video size must be less than 350MB.");
          }
          if (!form.selectedFile.type.startsWith("video/")) {
            throw new Error("Please select a valid video file.");
          }
          setUploading(true);
          resolvedSourceUrl = await uploadVideo(form.selectedFile);
        }

        if (!resolvedSourceUrl) {
          throw new Error("Recorded lessons require a video link or uploaded file.");
        }
      } else {
        if (form.sourceMode === "liveSession") {
          selectedLiveSession = liveSessions.find(
            (session) => String(session?._id) === String(form.liveSessionId)
          );
          if (!resolvedSourceUrl) {
            resolvedSourceUrl = selectedLiveSession?.link?.trim() || "";
          }
        }

        if (!resolvedSourceUrl && !form.liveSessionId) {
          throw new Error("Live lessons require a live session or a link.");
        }
      }

      const lessonPayload = {
        kind,
        title,
        order: Number(form.order || 0) || 1,
        status: form.status || "active",
        publishAt: form.publishAt
          ? new Date(form.publishAt).toISOString()
          : new Date().toISOString(),
        sourceType: form.sourceMode,
        sourceUrl: resolvedSourceUrl,
        liveSessionId:
          kind === "live" && form.sourceMode === "liveSession"
            ? form.liveSessionId || ""
            : "",
      };

      const originalTopicId = form.originalTopicId || form.topicId;
      const originalLessonId = form.originalLessonId || "";
      const targetTopicId = form.topicId;
      const sourceTopic = topics.find((entry) => entry?._id === originalTopicId);

      const targetSource = topics.find((entry) => entry?._id === targetTopicId);
      const currentLessons = Array.isArray(targetSource?.lessons)
        ? [...targetSource.lessons]
        : [];

      let nextLessons;
      if (originalLessonId && String(originalTopicId) === String(targetTopicId)) {
        nextLessons = currentLessons.map((lesson) =>
          String(lesson?._id) === String(originalLessonId)
            ? {
                ...lesson,
                ...lessonPayload,
              }
            : lesson
        );
      } else {
        nextLessons = [
          ...currentLessons,
          {
            ...lessonPayload,
          },
        ];
      }

      if (originalLessonId && String(originalTopicId) === String(targetTopicId)) {
        nextLessons = nextLessons.map((lesson) => ({
          ...lesson,
          sourceType: lesson.sourceType || defaultSourceMode(kind),
        }));
      }

      await updateTopicLessons(targetTopicId, nextLessons);

      if (originalLessonId && sourceTopic && originalTopicId !== targetTopicId) {
        const sourceLessons = (Array.isArray(sourceTopic.lessons) ? sourceTopic.lessons : []).filter(
          (lesson) => String(lesson?._id) !== String(originalLessonId)
        );
        await updateTopicLessons(sourceTopic._id, sourceLessons);
      }

      await onRefresh?.();
      closeDialog();
      MySwal.fire(
        "Saved",
        `${kind === "live" ? "Live" : "Recorded"} lesson updated successfully.`,
        "success"
      );
    } catch (error) {
      console.error("Error saving topic lesson:", error);
      MySwal.fire(
        "Error",
        error?.response?.data?.error || error?.message || "Failed to save lesson.",
        "error"
      );
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  const panelTitle = kind === "recorded" ? "Recorded Classes" : "Live Classes";
  const panelIcon = kind === "recorded" ? <OndemandVideoIcon /> : <LiveTvIcon />;
  const panelColor = kind === "recorded" ? "#2563eb" : "#16a34a";
  const emptyMessage =
    kind === "recorded"
      ? "No recorded classes added yet."
      : "No live classes added yet.";

  return (
    <Box
      sx={{
        mt: 4,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          color: panelColor,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {panelIcon}
        {panelTitle}
      </Typography>

      <Box sx={{ bgcolor: "white", borderRadius: 3, boxShadow: 2, p: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          gap={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {panelTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage multiple {kind} lessons for each topic in {chapterName || "this chapter"}.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
            disabled={!topicOptions.length}
            sx={{
              bgcolor: panelColor,
              "&:hover": { bgcolor: panelColor },
            }}
          >
            Add {kind === "recorded" ? "Recorded Class" : "Live Class"}
          </Button>
        </Stack>

        {rows.length === 0 ? (
          <Alert severity="info" sx={{ mt: 1 }}>
            {emptyMessage} Create one from the button above.
          </Alert>
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
                  <th style={headerStyle}>Topic</th>
                  <th style={headerStyle}>Lesson Title</th>
                  <th style={headerStyle}>Source</th>
                  <th style={headerStyle}>Order</th>
                  <th style={headerStyle}>Status</th>
                  <th style={headerStyle}>Published</th>
                  <th style={headerStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const sourceLabel = getTopicLessonSourceLabel(row);
                  const sourceUrl = getTopicLessonSourceUrl(row);
                  const liveSession = row?.liveSessionId;
                  const liveSessionLabel =
                    liveSession && typeof liveSession === "object"
                      ? `${liveSession.title || "Live session"}${
                          liveSession.date ? ` • ${formatTopicLessonDateTime(liveSession.date)}` : ""
                        }`
                      : "";

                  return (
                    <tr
                      key={row.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? "#fff" : "#f8fafc",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 600, color: "#111827" }}>
                          {row.topicTitle}
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 600, color: "#111827" }}>
                          {row.title}
                        </div>
                        {row.isLegacyIntro ? (
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                            Legacy intro video from the topic editor.
                          </div>
                        ) : null}
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <Chip
                            size="small"
                            label={sourceLabel}
                            color={kind === "live" ? "success" : "primary"}
                            variant="outlined"
                            sx={{ width: "fit-content" }}
                          />
                          <span
                            style={{
                              fontSize: 12,
                              color: "#6b7280",
                              maxWidth: 260,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={sourceUrl || liveSessionLabel}
                          >
                            {liveSessionLabel || sourceUrl || "-"}
                          </span>
                        </div>
                      </td>
                      <td style={cellStyle}>{row.order}</td>
                      <td style={cellStyle}>
                        <Chip
                          size="small"
                          label={row.status === "active" ? "Active" : "Inactive"}
                          color={row.status === "active" ? "success" : "default"}
                        />
                      </td>
                      <td style={cellStyle}>
                        <span style={{ fontSize: 14, color: "#475569" }}>
                          {formatTopicLessonDateTime(row.publishAt)}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Tooltip title="Preview">
                            <span>
                              <IconButton
                                color="info"
                                size="small"
                                onClick={() => handlePreview(row)}
                                disabled={!sourceUrl}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Copy Link">
                            <span>
                              <IconButton
                                color="secondary"
                                size="small"
                                onClick={() => handleCopy(row)}
                                disabled={!sourceUrl}
                              >
                                <ContentCopyIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          {!row.isLegacyIntro ? (
                            <>
                              <Tooltip title="Edit Lesson">
                                <IconButton
                                  color="info"
                                  size="small"
                                  onClick={() => openEditDialog(row)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Lesson">
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleDelete(row)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : null}
                        </Stack>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>
          {form.originalLessonId ? "Edit" : "Add"}{" "}
          {kind === "recorded" ? "Recorded Class" : "Live Class"}
          <Typography variant="body2" color="text.secondary">
            {chapterName || "Current chapter"} • assign the lesson to a topic
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Topic</InputLabel>
              <Select
                label="Topic"
                value={form.topicId}
                onChange={(event) => {
                  const nextTopicId = event.target.value;
                  const nextTopic = topics.find((topic) => topic?._id === nextTopicId);
                  const nextLessonCount = Math.max(
                    0,
                    ...(Array.isArray(nextTopic?.lessons)
                      ? nextTopic.lessons
                          .filter((lesson) => lesson?.kind === kind)
                          .map((lesson) => Number(lesson?.order || 0))
                      : [0])
                  );
                  setForm((current) => ({
                    ...current,
                    topicId: nextTopicId,
                    order: current.originalLessonId ? current.order : nextLessonCount + 1,
                  }));
                }}
              >
                {topicOptions.map((topic) => (
                  <MenuItem key={topic._id} value={topic._id}>
                    {topic.title} ({topic.count})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Lesson Title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              fullWidth
              required
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Order"
                type="number"
                value={form.order}
                onChange={(event) =>
                  setForm((current) => ({ ...current, order: event.target.value }))
                }
                fullWidth
                inputProps={{ min: 1 }}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value }))
                  }
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <TextField
              label="Publish At"
              type="datetime-local"
              value={form.publishAt}
              onChange={(event) =>
                setForm((current) => ({ ...current, publishAt: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              helperText="Used to hide future lessons until they are ready."
              fullWidth
            />

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Source
              </Typography>
              <RadioGroup
                row
                value={form.sourceMode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sourceMode: event.target.value,
                    selectedFile:
                      kind === "recorded" && event.target.value === "upload"
                        ? current.selectedFile
                        : null,
                    liveSessionId:
                      kind === "live" && event.target.value === "liveSession"
                        ? current.liveSessionId
                        : "",
                  }))
                }
              >
                {kind === "recorded" ? (
                  <>
                    <FormControlLabel
                      value="upload"
                      control={<Radio />}
                      label="Upload video"
                    />
                    <FormControlLabel value="link" control={<Radio />} label="Paste link" />
                  </>
                ) : (
                  <>
                    <FormControlLabel
                      value="liveSession"
                      control={<Radio />}
                      label="Live session"
                    />
                    <FormControlLabel value="link" control={<Radio />} label="Paste link" />
                  </>
                )}
              </RadioGroup>

              {kind === "recorded" ? (
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {form.sourceMode === "upload" ? (
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      disabled={uploading}
                    >
                      {uploading
                        ? "Uploading..."
                        : form.selectedFile?.name || "Choose Video File"}
                      <input
                        type="file"
                        accept="video/*"
                        hidden
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          setForm((current) => ({ ...current, selectedFile: file }));
                        }}
                      />
                    </Button>
                  ) : (
                    <TextField
                      label="Video URL"
                      value={form.sourceUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          sourceUrl: event.target.value,
                        }))
                      }
                      fullWidth
                      placeholder="Paste the recorded lesson link"
                    />
                  )}

                  {form.sourceUrl ? (
                    <Alert severity="info">
                      Current link: {form.sourceUrl}
                    </Alert>
                  ) : null}
                </Stack>
              ) : (
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {form.sourceMode === "liveSession" ? (
                    <FormControl fullWidth>
                      <InputLabel>Live Session</InputLabel>
                      <Select
                        label="Live Session"
                        value={form.liveSessionId}
                        onChange={(event) => {
                          const nextSessionId = event.target.value;
                          const session = liveSessions.find(
                            (item) => String(item?._id) === String(nextSessionId)
                          );
                          setForm((current) => ({
                            ...current,
                            liveSessionId: nextSessionId,
                            sourceUrl: session?.link || current.sourceUrl || "",
                            title: current.title || session?.title || "",
                          }));
                        }}
                        disabled={loadingSessions}
                      >
                        {liveSessions.map((session) => (
                          <MenuItem key={session._id} value={session._id}>
                            {session.title} • {formatTopicLessonDateTime(session.date)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      label="Live Link"
                      value={form.sourceUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          sourceUrl: event.target.value,
                        }))
                      }
                      fullWidth
                      placeholder="Paste the live class URL"
                    />
                  )}

                  {form.sourceMode === "liveSession" ? (
                    <Alert severity="info">
                      Live session details will be pulled from the selected session.
                    </Alert>
                  ) : null}
                </Stack>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || uploading}
            sx={{ bgcolor: panelColor, "&:hover": { bgcolor: panelColor } }}
          >
            {saving ? "Saving..." : "Save Lesson"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

const headerStyle = {
  padding: "16px",
  textAlign: "left",
  fontWeight: 700,
  fontSize: 15,
  borderBottom: "2px solid #dee2e6",
};

const cellStyle = {
  padding: "16px",
  verticalAlign: "top",
  fontSize: 14,
};
