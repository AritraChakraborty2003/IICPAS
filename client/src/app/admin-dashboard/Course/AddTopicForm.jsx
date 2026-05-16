"use client";
import { getApiBase } from "@/lib/apiBase";
import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Modal,
  Paper,
  IconButton,
} from "@mui/material";
import * as XLSX from "xlsx";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import axios from "axios";
import Swal from "sweetalert2";
import { Close } from "@mui/icons-material";
import WordImportControls from "./WordImportControls";
import WordDocumentPreview from "./WordDocumentPreview";
import {
  importWordDocument,
  mergeImportedWordContent,
  buildWordImportSummary,
  buildImportedSourceDocument,
} from "./wordImportUtils";
import { normalizeDigitalHubContentHtml } from "../../utils/contentFontFamily";

const API_BASE = getApiBase();

const quillModules = {
  toolbar: [
    [{ font: [] }, { size: ["small", false, "large", "huge"] }],
    [{ color: [] }, { background: [] }],
    ["bold", "italic", "underline", "strike"],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["link", "image", "video"],
    ["clean"],
  ],
};

const quillFormats = [
  "font",
  "size",
  "color",
  "background",
  "bold",
  "italic",
  "underline",
  "strike",
  "align",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
  "video",
  "clean",
];

export default function AddTopicForm({
  chapterId,
  chapterName,
  onCancel,
  onAdded,
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceDocument, setSourceDocument] = useState(null);
  const [quizFile, setQuizFile] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [wordImporting, setWordImporting] = useState(false);
  const [wordImportMode, setWordImportMode] = useState("replace");
  const [wordImportSummary, setWordImportSummary] = useState(null);

  // Excel parsing for quiz (works with .xls, .xlsx)
  const handleQuizUpload = (e) => {
    const file = e.target.files[0];
    setQuizFile(file);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      // Map rows to your schema
      const questions = rows.map((row) => ({
        question: row.question || row.Question || "",
        options: [
          row.option1 || row.Option1 || "",
          row.option2 || row.Option2 || "",
          row.option3 || row.Option3 || "",
          row.option4 || row.Option4 || "",
        ].filter(Boolean),
        answer: row.answer || row.Answer || "",
      }));
      setQuizData(questions);
      Swal.fire("Quiz Loaded", `${file.name} parsed successfully!`, "success");
    };
    reader.readAsArrayBuffer(file);
  };

  const handleWordFileSelected = async (file) => {
    if (!chapterId) {
      Swal.fire(
        "Missing Chapter",
        "Please select a chapter before importing a Word document.",
        "warning"
      );
      return;
    }

    setWordImporting(true);
    try {
      const result = await importWordDocument({ chapterId, file });
      if (!result?.html || !result.html.trim()) {
        throw new Error("The Word document could not be converted into editable content.");
      }
      const normalizedImportedContent = normalizeDigitalHubContentHtml(
        result.html || ""
      );
      const importMode = wordImportMode || "replace";
      const currentContent = content || "";

      if (importMode === "replace" && currentContent.trim()) {
        const confirmReplace = await Swal.fire({
          title: "Replace existing content?",
          text: "This will replace the current content with the imported Word document.",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Replace",
          cancelButtonText: "Cancel",
        });

        if (!confirmReplace.isConfirmed) {
          return;
        }
      }

      const mergedContent = mergeImportedWordContent({
        currentContent,
        importedContent: normalizedImportedContent,
        importMode,
      });

      const nextSourceDocument = buildImportedSourceDocument({
        result,
        file,
        importMode,
      });

      setContent(mergedContent);
      setSourceDocument(nextSourceDocument);
      setWordImportSummary(
        buildWordImportSummary(result, file.name, importMode)
      );

      Swal.fire({
        title: "Word Imported",
        text: `${file.name} converted successfully and loaded into the editor.`,
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (error) {
      console.error("Word import error:", error);
      Swal.fire(
        "Import Failed",
        error?.response?.data?.error ||
          error?.message ||
          "Failed to import the Word document.",
        "error"
      );
    } finally {
      setWordImporting(false);
    }
  };

  // Form submission: create topic first, then quiz (if any)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      Swal.fire("Validation", "Title and content required!", "warning");
      return;
    }
    setSaving(true);
    try {
      // 1. Create topic first
      const topicRes = await axios.post(
        `${API_BASE}/topics/by-chapter/${chapterId}`,
        {
          chapterId,
          title: title.trim(),
          content: normalizeDigitalHubContentHtml(content), // HTML + Base64 images/videos
          sourceDocument: sourceDocument || undefined,
        }
      );
      const topicId = topicRes.data._id;

      // 2. If quiz present, create quiz (link to topic)
      if (quizData && quizData.length > 0) {
        await axios.post(`${API_BASE}/quizzes`, {
          topic: topicId,
          questions: quizData,
        });
      }

      // Reset form and notify
      setTitle("");
      setContent("");
      setSourceDocument(null);
      setQuizFile(null);
      setQuizData(null);
      setWordImportSummary(null);
      onAdded && onAdded();
      Swal.fire("Success!", "Topic added successfully.", "success");
    } catch (err) {
      console.log(err);
      Swal.fire("Error", "Failed to add topic/quiz.", "error");
    }
    setSaving(false);
  };

  return (
    <Box
      sx={{
        p: { xs: 1, md: 4 },
        maxWidth: 750,
        mx: "auto",
        mt: 6,
        bgcolor: "white",
        borderRadius: 3,
        boxShadow: 3,
      }}
    >
      <Typography variant="h5" fontWeight={700} gutterBottom align="center">
        Add Topic for "{chapterName}"
      </Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            label="Topic Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            inputProps={{ style: { fontSize: 18, fontWeight: 500 } }}
          />

          <WordImportControls
            importMode={wordImportMode}
            onImportModeChange={setWordImportMode}
            onFileSelected={handleWordFileSelected}
            onPreview={() => setPreviewOpen(true)}
            importing={wordImporting}
            importSummary={wordImportSummary}
          />

          {/* Quill Editor */}
          <Box>
            <Typography
              fontWeight={600}
              fontSize={15}
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Content (Rich text, images, video, color...)
            </Typography>
          <div
            className="lucida-sans-content"
            style={{
              resize: "vertical",
              overflow: "auto",
              minHeight: 180,
                maxHeight: 800,
                borderRadius: 10,
                background: "#fafbfc",
                border: "1px solid #d1d5db",
                marginBottom: 20,
              }}
            >
              <ReactQuill
                value={content}
                onChange={setContent}
                modules={quillModules}
                formats={quillFormats}
                className="lucida-sans-content"
                style={{
                  height: "100%",
                  border: "none",
                  background: "transparent",
                }}
                placeholder="Write content here... you can use images, videos, colors, etc."
              />
            </div>
          </Box>

          <Box>
            <Button component="label" variant="outlined" sx={{ mr: 2 }}>
              Upload Quiz (Excel)
              <input
                type="file"
                accept=".xls,.xlsx"
                hidden
                onChange={handleQuizUpload}
                disabled={saving}
              />
            </Button>
            {quizFile && (
              <Typography fontSize={14} mt={1} color="primary">
                {quizFile.name}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={saving}
              sx={{ minWidth: 120 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={saving}
              sx={{
                minWidth: 140,
                fontWeight: 600,
                fontSize: 16,
                bgcolor: "#1976d2",
                "&:hover": { bgcolor: "#115293" },
              }}
            >
              {saving ? "Adding..." : "Add Topic"}
            </Button>
          </Stack>
        </Stack>
      </form>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        aria-labelledby="topic-preview-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1300,
        }}
      >
        <Paper
          sx={{
            width: "92vw",
            maxWidth: "1100px",
            maxHeight: "90vh",
            overflow: "auto",
            p: 3,
            position: "relative",
            margin: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            borderRadius: 3,
            backgroundColor: "#ffffff",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6" id="topic-preview-title">
              {title || "Untitled Topic"}
            </Typography>
            <IconButton onClick={() => setPreviewOpen(false)}>
              <Close />
            </IconButton>
          </Box>

          {sourceDocument ? (
            <WordDocumentPreview
              html={content}
              fileName={sourceDocument?.originalName || ""}
              pageCount={sourceDocument?.pageCount || 1}
              warnings={sourceDocument?.warnings || []}
            />
          ) : (
            <Box
              sx={{
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "#2d3748",
                "& h1": {
                  fontSize: "2rem",
                  fontWeight: 700,
                  marginTop: "2rem",
                  marginBottom: "1rem",
                },
                "& p": {
                  marginBottom: "1rem",
                },
                "& img": {
                  display: "block",
                  margin: "1.5rem auto",
                  maxWidth: "100%",
                  height: "auto",
                },
                "& ul, & ol": {
                  marginBottom: "1rem",
                  paddingLeft: "1.5rem",
                },
                "& ul": {
                  listStyleType: "disc",
                  listStylePosition: "outside",
                },
                "& ol": {
                  listStyleType: "decimal",
                  listStylePosition: "outside",
                },
                "& li": {
                  display: "list-item",
                },
                "& table": {
                  width: "100%",
                  borderCollapse: "collapse",
                },
              }}
              dangerouslySetInnerHTML={{
                __html: normalizeDigitalHubContentHtml(content),
              }}
            />
          )}
        </Paper>
      </Modal>
    </Box>
  );
}
