"use client";
import { getApiBase } from "@/lib/apiBase";

import React, { useEffect, useState, useCallback } from "react";
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
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useAuth } from "@/contexts/AuthContext";
import CaseStudyBuilder from "../../components/CaseStudyBuilder";
import AssignmentBuilder from "../../components/AssignmentBuilder";
import AssignmentsList from "../../components/AssignmentsList";
import CaseStudiesList from "../../components/CaseStudiesList";
import TopicLessonsPanel from "./TopicLessonsPanel";

const MySwal = withReactContent(Swal);
const API_BASE = getApiBase();

export default function TopicList({
  chapterId,
  chapterName,
  onViewChapters,
  onAddTopic,
  onEditTopic, // <-- NEW!
  onAddCaseStudy, // NEW!
  onAddAssignment, // NEW!
}) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("topics"); // 'topics', 'caseStudy', 'assignment'
  const [editingItem, setEditingItem] = useState(null); // Track what we're editing
  const { hasPermission } = useAuth();

  // Handle case study button click
  const handleAddCaseStudy = () => {
    setEditingItem(null); // Reset editing state
    setViewMode("caseStudy");
  };

  // Handle assignment button click
  const handleAddAssignment = () => {
    setEditingItem(null); // Reset editing state
    setViewMode("assignment");
  };

  // Handle edit assignment
  const handleEditAssignment = (assignment) => {
    setEditingItem(assignment);
    setViewMode("assignment");
  };

  // Handle edit case study
  const handleEditCaseStudy = (caseStudy) => {
    setEditingItem(caseStudy);
    setViewMode("caseStudy");
  };

  // Handle back to topics
  const handleBackToTopics = () => {
    setViewMode("topics");
    setEditingItem(null); // Reset editing state
  };

  const fetchTopics = useCallback(() => {
    setLoading(true);
    axios
      .get(`${API_BASE}/topics/by-chapter/${chapterId}`)
      .then((res) => setTopics((res.data || []).filter(Boolean)))
      .finally(() => setLoading(false));
  }, [chapterId]);

  useEffect(() => {
    if (chapterId) fetchTopics();
  }, [chapterId, fetchTopics]);

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "You will not be able to recover this topic!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE}/topics/${id}`);
        fetchTopics();
        MySwal.fire("Deleted!", "Topic has been deleted.", "success");
      } catch {
        MySwal.fire("Error!", "Failed to delete topic", "error");
      }
    }
  };

  const filteredTopics = (topics || []).filter(
    (topic) =>
      topic &&
      topic.title &&
      topic.title.toLowerCase().includes(search.toLowerCase())
  );

  // Drag-to-reorder is only meaningful when viewing the full, unfiltered list
  const canReorder = !search.trim() && hasPermission("course", "update");

  const handleDragEnd = async (result) => {
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }

    const reordered = Array.from(topics);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    const previousTopics = topics;
    setTopics(reordered); // optimistic update

    try {
      await axios.put(`${API_BASE}/chapters/${chapterId}/topics/reorder`, {
        topicIds: reordered.map((t) => t._id),
      });
    } catch (error) {
      console.error("Failed to reorder topics:", error);
      setTopics(previousTopics); // revert on failure
      MySwal.fire("Error", "Failed to save the new topic order.", "error");
    }
  };

  const renderTopicActions = (topic) => (
    <Stack direction="row" spacing={1}>
      {hasPermission("course", "update") && (
        <Tooltip title="Edit Topic">
          <IconButton
            color="info"
            size="small"
            onClick={() => onEditTopic && onEditTopic(topic)}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      )}
      {hasPermission("course", "delete") && (
        <Tooltip title="Delete Topic">
          <IconButton
            color="error"
            size="small"
            onClick={() => handleDelete(topic?._id)}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );

  // Render different views based on viewMode
  if (viewMode === "caseStudy") {
    return (
      <CaseStudyBuilder
        chapterId={chapterId}
        chapterName={chapterName}
        onBack={handleBackToTopics}
        editingItem={editingItem}
        onEdit={handleEditCaseStudy}
      />
    );
  }

  if (viewMode === "assignment") {
    return (
      <AssignmentBuilder
        chapterId={chapterId}
        chapterName={chapterName}
        onBack={handleBackToTopics}
        editingItem={editingItem}
        onEdit={handleEditAssignment}
      />
    );
  }

  // Default topics view
  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" fontWeight={700}>
          Topics for "{chapterName}"
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={onViewChapters}>
            View Chapters
          </Button>
          {hasPermission("course", "add") && (
            <Button variant="contained" onClick={onAddTopic}>
              Add Topic
            </Button>
          )}
          {/* NEW BUTTONS */}
          {hasPermission("course", "add") && (
            <Button
              variant="contained"
              onClick={handleAddCaseStudy}
              sx={{
                bgcolor: "#22c55e",
                "&:hover": { bgcolor: "#16a34a" },
              }}
            >
              Add Case Study
            </Button>
          )}
          {hasPermission("course", "add") && (
            <Button
              variant="contained"
              onClick={handleAddAssignment}
              sx={{
                bgcolor: "#a855f7",
                "&:hover": { bgcolor: "#9333ea" },
              }}
            >
              Add Assignment
            </Button>
          )}
        </Stack>
      </Stack>

      <TextField
        placeholder="Search..."
        variant="outlined"
        size="small"
        fullWidth
        sx={{ mb: 2 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Topics Section */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            color: "#1e40af",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          🎯 Topics
        </Typography>
      </Box>

      <Box sx={{ bgcolor: "white", borderRadius: 3, boxShadow: 2, p: 2 }}>
        <DataGrid
          autoHeight
          rows={filteredTopics
            .filter(Boolean)
            .map((t) => ({ ...t, id: t._id }))}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 20, 50]}
          loading={loading}
          disableRowSelectionOnClick
          sx={{
            border: "none",
            fontSize: 15,
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #e0e0e0",
            },
            "& .MuiDataGrid-columnHeaders": {
              background: "#f6f8fa",
              fontWeight: 700,
              fontSize: 15,
            },
          }}
        />
      </Box>

      {/* Enhanced Assignments List */}
      <TopicLessonsPanel
        chapterId={chapterId}
        chapterName={chapterName}
        kind="recorded"
        topics={topics}
        onRefresh={fetchTopics}
      />

      <TopicLessonsPanel
        chapterId={chapterId}
        chapterName={chapterName}
        kind="live"
        topics={topics}
        onRefresh={fetchTopics}
      />

      {/* Enhanced Assignments List */}
      <Box sx={{ mt: 4 }}>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            color: "#6b21a8",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          📚 Assignments
        </Typography>
        <AssignmentsList
          chapterId={chapterId}
          onEdit={handleEditAssignment}
          onAdd={handleAddAssignment}
        />
      </Box>

      {/* Enhanced Case Studies List */}
      <Box sx={{ mt: 4 }}>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            color: "#16a34a",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          📖 Case Studies
        </Typography>
        <CaseStudiesList
          chapterId={chapterId}
          onEdit={handleEditCaseStudy}
          onAdd={handleAddCaseStudy}
        />
      </Box>
    </Box>
  );
}
