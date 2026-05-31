"use client";
import { getApiBase, getApiOrigin } from "@/lib/apiBase";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  IconButton,
  Link,
  Modal,
  Paper,
} from "@mui/material";
import * as XLSX from "xlsx";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Delete,
  Visibility,
  Close,
  Add,
  DragIndicator,
} from "@mui/icons-material";
import dynamic from "next/dynamic";
import WordImportControls from "./WordImportControls";
import WordDocumentPreview from "./WordDocumentPreview";
import {
  importWordDocument,
  mergeImportedWordContent,
  buildWordImportSummary,
  buildImportedSourceDocument,
} from "./wordImportUtils";
import {
  normalizeDigitalHubContentHtml,
} from "../../utils/contentFontFamily";
import { joditFontControl } from "../../utils/joditFontConfig";

// Dynamically import drag and drop components to avoid SSR issues
const DragDropContext = dynamic(
  () => import("@hello-pangea/dnd").then((mod) => mod.DragDropContext),
  { ssr: false }
);
const Droppable = dynamic(
  () => import("@hello-pangea/dnd").then((mod) => mod.Droppable),
  { ssr: false }
);
const Draggable = dynamic(
  () => import("@hello-pangea/dnd").then((mod) => mod.Draggable),
  { ssr: false }
);

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  }

  executedFunction.cancel = () => {
    clearTimeout(timeout);
  };

  return executedFunction;
};

const API_BASE = getApiBase();
const API_URL = getApiOrigin();
const STATIC_CDN_BASE =
  process.env.NEXT_PUBLIC_STATIC_CDN_BASE || "https://cdn.iicpa.in";
const ALLOWED_IMAGE_ACCEPT =
  ".png,.jpg,.jpeg,.gif,.webp,image/png,image/jpeg,image/jpg,image/gif,image/webp";
const JODIT_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
  const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const normalizeUrl = (value = "") => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("/")) {
    return trimmed;
  }
  if (trimmed.startsWith("www.")) {
    return `https://${trimmed}`;
  }
  if (!trimmed.includes(".")) {
    return `/${trimmed.replace(/^\/+/, "")}`;
  }
  return trimmed;
};

const generateSimulationId = () =>
  `sim-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

console.log(STATIC_CDN_BASE);
const joditConfig = {
  readonly: false,
  height: 300,
  editorClassName: "lucida-sans-content",
  uploader: {
    insertImageAsBase64URI: true,
    accept: ALLOWED_IMAGE_ACCEPT,
    imagesExtensions: JODIT_IMAGE_EXTENSIONS,
  },
  toolbarAdaptive: false,
  showCharsCounter: false,
  showWordsCounter: false,
  spellcheck: true,
  askBeforePasteHTML: false,
  askBeforePasteFromWord: false,
  defaultActionOnPaste: "insert_clear_html",
  enterMode: "BR",
  useSearch: false,
  showXPathInStatusbar: false,
  toolbar: [
    "source",
    "|",
    "bold",
    "strikethrough",
    "underline",
    "italic",
    "|",
    "ul",
    "ol",
    "arrowlist",
    "|",
    "outdent",
    "indent",
    "|",
    "font",
    "fontsize",
    "brush",
    "paragraph",
    "|",
    "image",
    "link",
    "table",
    "|",
    "align",
    "undo",
    "redo",
    "|",
    "hr",
    "eraser",
    "copyformat",
    "|",
    "fullsize",
  ],
  controls: {
    font: joditFontControl,
    arrowlist: {
      icon: "➤",
      tooltip: "Arrow List",
      exec: (editor) => {
        const list =
          editor.selection.ancestor("ul") || editor.selection.ancestor("ol");
        if (list) {
          if (list.classList.contains("arrow-list")) {
            list.classList.remove("arrow-list");
          } else {
            list.classList.add("arrow-list");
          }
        } else {
          editor.execCommand("insertUnorderedList");
          setTimeout(() => {
            const newList = editor.selection.ancestor("ul");
            if (newList) newList.classList.add("arrow-list");
          }, 10);
        }
      },
    },
  },
};
const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

const toDateTimeLocalValue = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

export default function AddOrEditTopicForm({
  chapterId,
  chapterName,
  topic,
  onCancel,
  onSaved,
}) {
  const editor = useRef(null);
  const [title, setTitle] = useState(topic?.title || "");
  const [content, setContent] = useState(topic?.content || "");
  const [introVideo, setIntroVideo] = useState(topic?.introVideo || "");
  const [sourceDocument, setSourceDocument] = useState(
    topic?.sourceDocument || null
  );
  const [publishAt, setPublishAt] = useState(
    toDateTimeLocalValue(topic?.publishAt || topic?.updatedAt || topic?.createdAt)
  );
  const [quizFile, setQuizFile] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [videoLinks, setVideoLinks] = useState([]);
  const [imageLinks, setImageLinks] = useState([]);
  const [simulationLinkUrl, setSimulationLinkUrl] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [introVideoPreviewOpen, setIntroVideoPreviewOpen] = useState(false);
  const [introVideoSaving, setIntroVideoSaving] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [quizPreviewOpen, setQuizPreviewOpen] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [wordImporting, setWordImporting] = useState(false);
  const [wordImportMode, setWordImportMode] = useState("replace");
  const [wordImportSummary, setWordImportSummary] = useState(null);
  const [quizEditorOpen, setQuizEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);
  const [uploadedFiles, setUploadedFiles] = useState({
    images: [],
    videos: [],
  });
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadingIntroVideo, setUploadingIntroVideo] = useState(false);
  const [showAiEditor, setShowAiEditor] = useState(false);
  const [aiContent, setAiContent] = useState("");
  const [isHumanizing, setIsHumanizing] = useState(false);
  const currentTopicId = topic?._id || "";

  // Debounced content update to prevent typing interruption
  const debouncedSetContent = useCallback(
    debounce((newContent) => {
      setContent(newContent);
    }, 250),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSetContent.cancel?.();
    };
  }, [debouncedSetContent]);

  const handleHumanizeWithAI = async () => {
    if (!content || !content.trim()) {
      Swal.fire("Warning", "Please add some content to humanize.", "warning");
      return;
    }
    setShowAiEditor(true);
    setIsHumanizing(true);
    try {
      const response = await axios.post(
        "https://n8n.iicpa.in/webhook-test/de295ee3-3154-4d45-a907-fac35c4b2633",
        { content: content }
      );
      
      if (response.data) {
        if (typeof response.data === "string") {
          setAiContent(response.data);
        } else if (response.data.content) {
          setAiContent(response.data.content);
        } else if (response.data.output) {
          setAiContent(response.data.output);
        } else if (response.data.response) {
          setAiContent(response.data.response);
        } else {
          setAiContent(JSON.stringify(response.data));
        }
      } else {
        setAiContent("<p>No response from AI.</p>");
      }
    } catch (error) {
      console.error("Failed to humanize content:", error);
      Swal.fire("Error", "Failed to connect to AI webhook.", "error");
    } finally {
      setIsHumanizing(false);
    }
  };

  // Quiz editing functions
  const openQuizEditor = () => {
    setQuizEditorOpen(true);
  };

  const closeQuizEditor = () => {
    setQuizEditorOpen(false);
    setEditingQuestion(null);
    setEditingQuestionIndex(-1);
  };

  const addNewQuestion = () => {
    setEditingQuestion({
      question: "",
      options: ["", "", "", ""],
      answer: "",
    });
    setEditingQuestionIndex(-1); // -1 means new question
    setQuizEditorOpen(true);
  };

  const editQuestion = (question, index) => {
    setEditingQuestion({ ...question });
    setEditingQuestionIndex(index);
    setQuizEditorOpen(true);
  };

  const deleteQuestion = (index) => {
    const newQuizData = [...quizData];
    newQuizData.splice(index, 1);
    setQuizData(newQuizData);
    Swal.fire(
      "Question Deleted",
      "Question has been removed from the quiz.",
      "success"
    );
  };

  const saveQuestion = () => {
    if (!editingQuestion.question.trim()) {
      Swal.fire("Error", "Question text is required", "error");
      return;
    }

    const validOptions = editingQuestion.options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      Swal.fire("Error", "At least 2 options are required", "error");
      return;
    }

    if (!editingQuestion.answer.trim()) {
      Swal.fire("Error", "Correct answer is required", "error");
      return;
    }

    if (!validOptions.includes(editingQuestion.answer)) {
      Swal.fire(
        "Error",
        "Correct answer must match one of the options",
        "error"
      );
      return;
    }

    const newQuizData = [...quizData];
    if (editingQuestionIndex >= 0) {
      // Update existing question
      newQuizData[editingQuestionIndex] = {
        ...editingQuestion,
        options: validOptions,
      };
    } else {
      // Add new question
      newQuizData.push({
        ...editingQuestion,
        options: validOptions,
      });
    }

    setQuizData(newQuizData);
    closeQuizEditor();
    Swal.fire(
      "Success",
      editingQuestionIndex >= 0 ? "Question updated!" : "Question added!",
      "success"
    );
  };

  // Drag and drop handler for reordering questions
  const handleDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(quizData);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQuizData(items);
    Swal.fire(
      "Question Reordered",
      "Question order has been updated!",
      "success"
    );
  };

  useEffect(() => {
    if (topic) {
      console.log("Topic data received:", topic);
      setTitle(topic.title || "");
      setContent(normalizeDigitalHubContentHtml(topic.content || ""));
      setIntroVideo(topic.introVideo || "");
      setSourceDocument(topic.sourceDocument || null);
      setWordImportSummary(
        topic.sourceDocument
          ? {
              fileName: topic.sourceDocument.originalName || "Imported Word",
              importMode: topic.sourceDocument.importMode || "replace",
              pageCount: topic.sourceDocument.pageCount || 1,
              pageBreakCount: topic.sourceDocument.pageBreakCount || 0,
              warnings: topic.sourceDocument.warnings || [],
            }
          : null
      );
      setVideoLinks(topic.videos || []);

      // Load existing quiz data if available
      if (topic.quiz) {
        console.log("Topic has quiz:", topic.quiz);
        loadExistingQuiz(topic.quiz);
      } else {
        console.log("Topic has no quiz");
      }
    } else {
      setSourceDocument(null);
      setWordImportSummary(null);
    }

    // Fetch uploaded files when component mounts
    fetchUploadedFiles();
  }, [topic]);

  // Fetch uploaded files from static-backend
  const fetchUploadedFiles = async () => {
    setLoadingFiles(true);
    try {
      const normalizeFiles = (files = []) =>
        files.map((file) => ({
          ...file,
          id:
            file.id ||
            (typeof file._id === "string"
              ? file._id
              : file._id?.$oid || file.filename),
        }));

      const videosPromise = axios.get(`${STATIC_CDN_BASE}/files/videos`);
      const imagesPromise = currentTopicId
        ? axios.get(`${STATIC_CDN_BASE}/files/images`, {
            params: { topicId: currentTopicId },
          })
        : Promise.resolve({ data: { success: true, data: [] } });

      const [videosRes, imagesRes] = await Promise.all([
        videosPromise,
        imagesPromise,
      ]);

      setUploadedFiles({
        images:
          imagesRes.data?.success === true
            ? normalizeFiles(imagesRes.data.data)
            : [],
        videos:
          videosRes.data?.success === true
            ? normalizeFiles(videosRes.data.data)
            : [],
      });
    } catch (error) {
      console.error("Error fetching uploaded files:", error);
      // Don't show error to user as this is not critical
    } finally {
      setLoadingFiles(false);
    }
  };

  // Delete uploaded file
  const handleDeleteFile = async (fileId, fileType) => {
    if (!fileId) {
      Swal.fire("Error", "Invalid file id. Refresh files and try again.", "error");
      return;
    }

    try {
      await axios.delete(`${STATIC_CDN_BASE}/files/${fileId}`);

      // Remove from local state
      setUploadedFiles((prev) => ({
        ...prev,
        [fileType]: prev[fileType].filter((file) => file.id !== fileId),
      }));

      // Also remove from links if present
      if (fileType === "videos") {
        setVideoLinks((prev) =>
          prev.filter((link) => !link.includes(fileId.toString()))
        );
      } else if (fileType === "images") {
        setImageLinks((prev) =>
          prev.filter((link) => !link.includes(fileId.toString()))
        );
      }

      Swal.fire("Success", "File deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting file:", error);
      Swal.fire("Error", "Failed to delete file", "error");
    }
  };

  const loadExistingQuiz = async (quizId) => {
    try {
      console.log("loadExistingQuiz called with:", quizId, typeof quizId);

      // Ensure quizId is a string
      const id = typeof quizId === "object" ? quizId._id || quizId : quizId;
      console.log("Processed quiz ID:", id);

      if (!id) {
        console.log("No quiz ID found, skipping quiz load");
        return;
      }

      const response = await axios.get(`${API_BASE}/quizzes/${id}`);
      console.log("Quiz API response:", response.data);

      if (
        response.data &&
        response.data.success &&
        response.data.quiz &&
        response.data.quiz.questions
      ) {
        setQuizData(response.data.quiz.questions);
        console.log("Loaded existing quiz:", response.data.quiz.questions);
      }
    } catch (error) {
      console.error("Error loading existing quiz:", error);
      // Try to load quiz by topic ID as fallback
      if (topic && topic._id) {
        try {
          console.log("Trying to load quiz by topic ID:", topic._id);
          const topicResponse = await axios.get(
            `${API_BASE}/quizzes/topic/${topic._id}`
          );
          console.log("Topic quiz response:", topicResponse.data);

          if (
            topicResponse.data &&
            topicResponse.data.success &&
            topicResponse.data.quiz &&
            topicResponse.data.quiz.questions
          ) {
            setQuizData(topicResponse.data.quiz.questions);
            console.log(
              "Loaded quiz by topic:",
              topicResponse.data.quiz.questions
            );
          }
        } catch (topicError) {
          console.error("Error loading quiz by topic:", topicError);
        }
      }
    }
  };

  const handleEditorReady = (editorInstance) => {
    if (editorInstance) {
      editor.current = editorInstance;
      setEditorReady(true);
    }
  };

  const insertHtmlAtCursor = (html, successTitle, successText) => {
    if (!editor.current || !editor.current.selection) {
      Swal.fire(
        "Editor Not Ready",
        "Please click inside the editor before inserting content.",
        "warning"
      );
      return false;
    }

    editor.current.selection.insertHTML(html);

    if (successTitle) {
      Swal.fire(successTitle, successText || "Content inserted into the editor.", "success");
    }

    return true;
  };

  const getSimulationBackgroundAsset = () => {
    const bannerCandidate = normalizeUrl(bannerImageUrl);
    if (bannerCandidate) {
      return {
        url: bannerCandidate,
        alt: "Simulation background",
      };
    }

    const manualImageLink = [...imageLinks]
      .reverse()
      .find((link) => normalizeUrl(link));
    if (manualImageLink) {
      return {
        url: normalizeUrl(manualImageLink),
        alt: "Simulation background",
      };
    }

    const uploadedImage = [...uploadedFiles.images]
      .reverse()
      .find((file) => normalizeUrl(file?.cdn_url));
    if (uploadedImage?.cdn_url) {
      return {
        url: normalizeUrl(uploadedImage.cdn_url),
        alt: uploadedImage.original_name || "Simulation background",
      };
    }

    return null;
  };

  const buildSimulationLinkHtml = (rawUrl, simulationId = "") => {
    const url = normalizeUrl(rawUrl);
    const safeUrl = escapeHtml(url);
    const safeId = escapeHtml(simulationId);
    const backgroundAsset = getSimulationBackgroundAsset();
    const safeBackgroundUrl = backgroundAsset
      ? escapeHtml(backgroundAsset.url)
      : "";
    const safeBackgroundAlt = backgroundAsset
      ? escapeHtml(backgroundAsset.alt || "Simulation background")
      : "Simulation background";

    return `
      <div class="topic-simulation-card" data-simulation-card="true" data-simulation-id="${safeId}" style="margin: 1.5rem 0; border-radius: 18px; overflow: hidden; box-shadow: 0 14px 34px rgba(0,0,0,0.16); border: 1px solid #93c5fd; background: #dbeafe;">
        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="topic-simulation-link" style="position: relative; display: block; min-height: 300px; text-decoration: none; color: inherit;">
          ${
            safeBackgroundUrl
              ? `<img
                  src="${safeBackgroundUrl}"
                  alt="${safeBackgroundAlt}"
                  class="topic-simulation-background"
                  style="display: block; width: 100%; height: 100%; min-height: 300px; object-fit: cover; object-position: center; filter: saturate(1.05);"
                />`
              : `<div style="position: absolute; inset: 0; background:
                  radial-gradient(circle at 18% 26%, rgba(255,255,255,0.34), transparent 22%),
                  radial-gradient(circle at 80% 72%, rgba(255,255,255,0.22), transparent 26%),
                  linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(29, 78, 216, 0.55) 100%);">
                </div>`
          }
          <div style="position: absolute; inset: 0; background:
            radial-gradient(circle at 18% 26%, rgba(255,255,255,0.26), transparent 22%),
            radial-gradient(circle at 80% 72%, rgba(255,255,255,0.18), transparent 26%),
            linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(29, 78, 216, 0.58) 100%);">
          </div>
          <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 1rem;">
            <div style="display: inline-flex; align-items: center; justify-content: center; min-width: 240px; padding: 1rem 1.75rem; border-radius: 999px; background: rgba(255,255,255,0.97); color: #1d4ed8; font-size: 0.95rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; box-shadow: 0 12px 28px rgba(0,0,0,0.22); border: 1px solid rgba(37, 99, 235, 0.15);">
              Experiment
            </div>
          </div>
          <div style="position: absolute; left: 1rem; right: 1rem; bottom: 1rem; color: rgba(255,255,255,0.95); font-size: 0.82rem; line-height: 1.45; word-break: break-word; text-align: center;">
            ${safeUrl}
          </div>
        </a>
      </div>
    `;
  };

  const buildBannerImageHtml = (rawUrl, rawAlt = "Banner image") => {
    const url = normalizeUrl(rawUrl);
    const alt = rawAlt.trim() || "Banner image";
    const safeUrl = escapeHtml(url);
    const safeAlt = escapeHtml(alt);

    return `
      <div class="topic-banner-card" style="margin: 1.75rem 0; border-radius: 18px; overflow: hidden; box-shadow: 0 14px 34px rgba(0,0,0,0.18); border: 1px solid rgba(255,255,255,0.08); background: #000;">
        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="topic-banner-link" style="position: relative; display: block; text-decoration: none; color: inherit; min-height: 260px;">
          <img
            src="${safeUrl}"
            alt="${safeAlt}"
            class="topic-banner-image"
            style="display: block; width: 100%; max-width: 100%; height: auto; object-fit: cover;"
          />
          <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.45) 100%);"></div>
          <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 1rem;">
            <div style="display: inline-flex; align-items: center; justify-content: center; padding: 0.9rem 1.5rem; border-radius: 999px; background: rgba(255,255,255,0.95); color: #111827; font-size: 0.85rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; box-shadow: 0 10px 24px rgba(0,0,0,0.28);">
              Experiment
            </div>
          </div>
        </a>
      </div>
    `;
  };

  const insertSimulationLink = (url, label = "") => {
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) {
      Swal.fire("Validation", "Please enter a simulation page URL.", "warning");
      return;
    }

    const simulationId = generateSimulationId();
    insertHtmlAtCursor(
      buildSimulationLinkHtml(normalizedUrl, simulationId),
      "Simulation Inserted!",
      "Simulation card has been inserted into the editor."
    );
  };

  const extractSimulationCards = (htmlContent) => {
    if (!htmlContent) return [];

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");
      return Array.from(doc.querySelectorAll("[data-simulation-card='true']")).map(
        (card) => ({
          id: card.getAttribute("data-simulation-id") || "",
          label: "Simulation",
          url: card.querySelector("a")?.getAttribute("href") || "",
        })
      );
    } catch (error) {
      console.error("Failed to extract simulation cards:", error);
      return [];
    }
  };

  const removeSimulationCardFromContent = (simulationId) => {
    if (!simulationId || !content) return;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");
      const target = doc.querySelector(
        `[data-simulation-card='true'][data-simulation-id='${CSS.escape(
          simulationId
        )}']`
      );

      if (!target) {
        Swal.fire("Not Found", "That simulation block was not found.", "info");
        return;
      }

      target.remove();
      const updatedHtml = doc.body.innerHTML;
      setContent(updatedHtml);
      if (editor.current && typeof editor.current.value !== "undefined") {
        editor.current.value = updatedHtml;
      }
      Swal.fire("Removed", "Simulation block removed from the editor.", "success");
    } catch (error) {
      console.error("Failed to remove simulation card:", error);
      Swal.fire("Error", "Could not remove the simulation block.", "error");
    }
  };

  const insertedSimulationCards = extractSimulationCards(content);

  const insertBannerImage = (url, altText = "") => {
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) {
      Swal.fire("Validation", "Please enter a banner image URL.", "warning");
      return;
    }

    insertHtmlAtCursor(
      buildBannerImageHtml(normalizedUrl, altText || "Banner image"),
      "Banner Image Inserted!",
      "Banner image has been inserted into the editor."
    );
  };

  const buildTopicPayload = (overrides = {}) => {
    const introVideoValue =
      overrides.introVideo !== undefined ? overrides.introVideo : introVideo;

    return {
      title: title.trim(),
      content: normalizeDigitalHubContentHtml(content),
      introVideo: introVideoValue.trim() || "",
      publishAt: publishAt ? new Date(publishAt).toISOString() : undefined,
      sourceDocument: sourceDocument || undefined,
    };
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
          text: "This will replace the current editor content with the imported Word document.",
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

      if (editor.current && typeof editor.current.value !== "undefined") {
        editor.current.value = mergedContent;
      }

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

  const persistIntroVideoUpdate = async (nextIntroVideo) => {
    if (!topic?._id) {
      return null;
    }

    const response = await axios.put(
      `${API_BASE}/topics/${topic._id}`,
      {
        introVideo: (nextIntroVideo || "").trim() || "",
      }
    );

    return response.data;
  };

  const saveIntroVideoLink = async (nextIntroVideo, successMessage) => {
    const normalizedIntroVideo = (nextIntroVideo || "").trim();

    if (!topic?._id) {
      return false;
    }

    setIntroVideoSaving(true);
    try {
      await persistIntroVideoUpdate(normalizedIntroVideo);
      setIntroVideo(normalizedIntroVideo);
      onSaved && onSaved();
      Swal.fire("Success", successMessage, "success");
      return true;
    } catch (error) {
      console.error("Error updating intro video link:", error);
      Swal.fire("Error", "Failed to save intro video link.", "error");
      return false;
    } finally {
      setIntroVideoSaving(false);
    }
  };

  const handleIntroVideoLinkUpdate = async () => {
    const normalizedIntroVideo = introVideo.trim();

    if (!normalizedIntroVideo) {
      Swal.fire("Validation", "Intro video URL is required", "warning");
      return;
    }

    if (!topic?._id) {
      Swal.fire(
        "Save Topic First",
        "Create the topic once before saving the intro video link separately.",
        "info"
      );
      return;
    }

    await saveIntroVideoLink(normalizedIntroVideo, "Intro video link updated!");
  };

  const getIntroVideoPreview = (url) => {
    const normalizedUrl = (url || "").trim();

    if (!normalizedUrl) return null;

    const youtubeMatch = normalizedUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    );
    if (
      normalizedUrl.includes("youtube.com") ||
      normalizedUrl.includes("youtu.be")
    ) {
      const videoId = youtubeMatch?.[1];
      if (videoId) {
        return {
          type: "iframe",
          src: `https://www.youtube.com/embed/${videoId}`,
          label: "YouTube video",
        };
      }
    }

    const vimeoMatch = normalizedUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (normalizedUrl.includes("vimeo.com") && vimeoMatch?.[1]) {
      return {
        type: "iframe",
        src: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        label: "Vimeo video",
      };
    }

    if (/\.(mp4|webm|ogg|mov|m4v|avi|wmv|flv|mkv)(\?.*)?$/i.test(normalizedUrl)) {
      return {
        type: "video",
        src: normalizedUrl,
        label: "Direct video",
      };
    }

    return {
      type: "link",
      href: normalizedUrl,
      label: "Video link",
    };
  };

  // Preserve scroll position when opening/closing modal
  const handlePreviewOpen = () => {
    setScrollPosition(window.scrollY);
    setPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    // Restore scroll position after modal closes
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 100);
  };

  // Function to process content for preview with proper formatting
  const processContentForPreview = (htmlContent) => {
    if (!htmlContent) return "";

    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = normalizeDigitalHubContentHtml(htmlContent);

    // Enhance headings with proper styling
    const headings = tempDiv.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headings.forEach((heading) => {
      heading.style.fontWeight = "600";
      heading.style.marginTop = "1.5rem";
      heading.style.marginBottom = "1rem";
      heading.style.color = "#1a202c";
      heading.style.borderBottom = "2px solid #e2e8f0";
      heading.style.paddingBottom = "0.5rem";
      heading.style.fontSize = "inherit";
    });

    // Style paragraphs
    const paragraphs = tempDiv.querySelectorAll("p");
    paragraphs.forEach((p) => {
      p.style.marginBottom = "1rem";
      p.style.lineHeight = "1.6";
      p.style.color = "#2d3748";
      p.style.fontSize = "inherit";
    });

    // Center and style images
    const images = tempDiv.querySelectorAll("img");
    images.forEach((img) => {
      const isSimulationBackground = img.classList.contains(
        "topic-simulation-background"
      );
      const isBannerCardImage = img.classList.contains("topic-banner-image");
      const isLinkedBanner =
        isBannerCardImage &&
        Boolean(
          img.closest(".topic-banner-card") || img.closest(".topic-banner-link")
        );

      if (isSimulationBackground) {
        img.style.display = "block";
        img.style.margin = "0";
        img.style.maxWidth = "100%";
        img.style.width = "100%";
        img.style.minWidth = "0";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.objectPosition = "center";
        img.style.borderRadius = "0";
        img.style.boxShadow = "none";
        img.style.border = "none";
      } else if (isLinkedBanner) {
        img.style.display = "block";
        img.style.margin = "0";
        img.style.maxWidth = "100%";
        img.style.width = "100%";
        img.style.minWidth = "0";
        img.style.height = "auto";
        img.style.borderRadius = "14px";
        img.style.boxShadow = "0 8px 18px rgba(0, 0, 0, 0.10)";
        img.style.border = "1px solid #e2e8f0";
      } else if (isBannerCardImage) {
        img.style.display = "block";
        img.style.margin = "2rem auto";
        img.style.maxWidth = "100%";
        img.style.width = "100%";
        img.style.minWidth = "0";
        img.style.height = "auto";
        img.style.borderRadius = "16px";
        img.style.boxShadow = "0 12px 28px rgba(0, 0, 0, 0.12)";
        img.style.border = "1px solid #e2e8f0";
      } else {
        img.style.display = "block";
        img.style.margin = "2rem auto";
        img.style.maxWidth = "90%";
        img.style.minWidth = "400px";
        img.style.height = "auto";
        img.style.borderRadius = "12px";
        img.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.15)";
        img.style.border = "2px solid #f0f0f0";
      }
    });

    // Center and style videos
    const videos = tempDiv.querySelectorAll("video");
    videos.forEach((video) => {
      video.style.display = "block";
      video.style.margin = "2rem auto";
      video.style.maxWidth = "80%";
      video.style.minWidth = "500px";
      video.style.height = "auto";
      video.style.borderRadius = "12px";
      video.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.15)";
      video.style.border = "2px solid #f0f0f0";
    });

    // Center and style iframes (for embedded videos)
    const iframes = tempDiv.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      iframe.style.display = "block";
      iframe.style.margin = "2rem auto";
      iframe.style.maxWidth = "80%";
      iframe.style.minWidth = "500px";
      iframe.style.borderRadius = "12px";
      iframe.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.15)";
      iframe.style.border = "2px solid #f0f0f0";
    });

    // Style lists
    const lists = tempDiv.querySelectorAll("ul, ol");
    lists.forEach((list) => {
      list.style.marginBottom = "1rem";
      if (!list.classList.contains("arrow-list")) {
        list.style.paddingLeft = "1.5rem";
      }
    });

    // Style list items
    const listItems = tempDiv.querySelectorAll("li");
    listItems.forEach((li) => {
      li.style.marginBottom = "0.5rem";
      li.style.lineHeight = "1.6";
      if (li.parentElement?.classList.contains("arrow-list")) {
        li.style.listStyleType = "none";
      }
    });

    // Style tables
    const tables = tempDiv.querySelectorAll("table");
    tables.forEach((table) => {
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.marginBottom = "1.5rem";
      table.style.borderRadius = "8px";
      table.style.overflow = "hidden";
      table.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
    });

    // Style table cells
    const cells = tempDiv.querySelectorAll("td, th");
    cells.forEach((cell) => {
      cell.style.padding = "0.75rem";
      cell.style.border = "1px solid #e2e8f0";
      cell.style.textAlign = "left";
    });

    // Style table headers
    const headers = tempDiv.querySelectorAll("th");
    headers.forEach((header) => {
      header.style.backgroundColor = "#f7fafc";
      header.style.fontWeight = "600";
    });

    const removeButtons = tempDiv.querySelectorAll(
      "[data-remove-topic-card], .topic-remove-button"
    );
    removeButtons.forEach((button) => button.remove());

    return tempDiv.innerHTML;
  };

  const downloadQuizTemplate = () => {
    const templateData = [
      {
        question: "What is the capital of France?",
        option1: "London",
        option2: "Paris",
        option3: "Berlin",
        option4: "Madrid",
        answer: "Paris",
      },
      {
        question: "Which planet is closest to the Sun?",
        option1: "Venus",
        option2: "Earth",
        option3: "Mars",
        option4: "Mercury",
        answer: "Mercury",
      },
      {
        question: "What is 2 + 2?",
        option1: "3",
        option2: "4",
        option3: "5",
        option4: "6",
        answer: "4",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Quiz Template");

    // Generate and download the file
    XLSX.writeFile(workbook, "quiz_template.xlsx");

    Swal.fire({
      title: "Template Downloaded!",
      text: "quiz_template.xlsx has been downloaded. Use this as a reference for your quiz format.",
      icon: "success",
      confirmButtonText: "OK",
    });
  };

  const handleQuizUpload = (e) => {
    const file = e.target.files[0];
    setQuizFile(file);
    if (!file) return;

    // Check file size (5MB limit for Excel files)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire("Error", "Excel file size must be less than 5MB", "error");
      return;
    }

    // Check file type
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel.sheet.macroEnabled.12",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xls|xlsx)$/i)) {
      Swal.fire(
        "Error",
        "Please select a valid Excel file (.xls or .xlsx)",
        "error"
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (rows.length === 0) {
          Swal.fire("Error", "Excel file is empty or has no data", "error");
          return;
        }

        const questions = [];
        const errors = [];

        rows.forEach((row, index) => {
          const question = row.question || row.Question || "";
          const option1 = row.option1 || row.Option1 || "";
          const option2 = row.option2 || row.Option2 || "";
          const option3 = row.option3 || row.Option3 || "";
          const option4 = row.option4 || row.Option4 || "";
          const answer = row.answer || row.Answer || "";

          // Skip completely empty rows
          if (
            !question.trim() &&
            !option1.trim() &&
            !option2.trim() &&
            !option3.trim() &&
            !option4.trim() &&
            !answer.trim()
          ) {
            return; // Skip this row entirely
          }

          // Validation
          if (!question.trim()) {
            errors.push(`Row ${index + 1}: Question is required`);
            return;
          }

          const options = [option1, option2, option3, option4].filter(Boolean);
          if (options.length < 2) {
            errors.push(`Row ${index + 1}: At least 2 options are required`);
            return;
          }

          if (!answer.trim()) {
            errors.push(`Row ${index + 1}: Answer is required`);
            return;
          }

          if (!options.includes(answer)) {
            errors.push(
              `Row ${index + 1}: Answer must match one of the options exactly`
            );
            return;
          }

          questions.push({
            question: question.trim(),
            options: options,
            answer: answer.trim(),
          });
        });

        if (errors.length > 0) {
          let errorMessage = "";
          if (errors.length > 10) {
            errorMessage =
              `Found ${errors.length} validation errors. The first 5 errors are:<br><br>` +
              errors.slice(0, 5).join("<br>") +
              `<br><br><strong>Please check your Excel file format. Make sure:</strong><br>` +
              `• Column headers are: question, option1, option2, option3, option4, answer<br>` +
              `• All required fields are filled<br>` +
              `• Answer matches one of the options exactly<br>` +
              `• Empty rows are removed`;
          } else {
            errorMessage = errors.join("<br>");
          }

          Swal.fire({
            title: "Validation Errors",
            html: errorMessage,
            icon: "error",
            confirmButtonText: "OK",
            width: "600px",
          });
          return;
        }

        if (questions.length === 0) {
          Swal.fire({
            title: "No Valid Questions Found",
            text: "No valid quiz questions were found in the Excel file. Please check the format and try again.",
            icon: "warning",
            confirmButtonText: "OK",
          });
          return;
        }

        setQuizData(questions);
        Swal.fire({
          title: "Quiz Loaded Successfully!",
          text: `${questions.length} questions parsed from ${file.name}`,
          icon: "success",
          confirmButtonText: "OK",
        });
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        Swal.fire(
          "Error",
          "Failed to parse Excel file. Please check the format.",
          "error"
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (350MB limit for videos)
    if (file.size > 350 * 1024 * 1024) {
      Swal.fire("Error", "Video size must be less than 350MB", "error");
      return;
    }

    // Check file type
    if (!file.type.startsWith("video/")) {
      Swal.fire("Error", "Please select a valid video file", "error");
      return;
    }

    const formData = new FormData();

    console.log("11", STATIC_CDN_BASE);
    formData.append("video", file);

    try {
      // Upload to static-backend microservice

      const res = await axios.post(
        `${STATIC_CDN_BASE}/upload/video`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data.success && res.data.data.cdnUrl) {
        // Add the video URL to the list
        setVideoLinks((prev) => [...prev, res.data.data.cdnUrl]);
        Swal.fire({
          title: "Video Uploaded Successfully!",
          text: "Video URL is now available below. You can copy and use it in the editor.",
          icon: "success",
          confirmButtonText: "OK",
        });
      } else {
        Swal.fire("Error", "Failed to get video URL", "error");
      }
    } catch (err) {
      console.error("Video upload error:", err);
      Swal.fire("Error", err.response?.data?.error || "Upload failed", "error");
    }
  };

  // Handle multiple video uploads
  const handleMultipleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check if too many files
    if (files.length > 5) {
      Swal.fire("Error", "Maximum 5 videos allowed per upload", "error");
      return;
    }

    // Validate files
    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      if (file.size > 350 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (too large)`);
      } else if (!file.type.startsWith("video/")) {
        invalidFiles.push(`${file.name} (invalid type)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      Swal.fire("Error", `Invalid files: ${invalidFiles.join(", ")}`, "error");
      return;
    }

    if (validFiles.length === 0) return;

    const formData = new FormData();
    validFiles.forEach((file) => {
      formData.append("videos", file);
    });

    try {
      // Upload to static-backend microservice
      const res = await axios.post(
        `${STATIC_CDN_BASE}/upload/videos`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data.success) {
        // Add all video URLs to the list
        const newUrls = res.data.data.uploaded.map((file) => file.cdnUrl);
        setVideoLinks((prev) => [...prev, ...newUrls]);

        Swal.fire({
          title: "Videos Uploaded Successfully!",
          text: `${res.data.data.successful} videos uploaded. URLs are now available below.`,
          icon: "success",
          confirmButtonText: "OK",
        });

        // Refresh the uploaded files list
        fetchUploadedFiles();
      } else {
        Swal.fire("Error", "Failed to upload videos", "error");
      }
    } catch (err) {
      console.error("Multiple videos upload error:", err);
      Swal.fire("Error", err.response?.data?.error || "Upload failed", "error");
    }
  };

  const handleIntroVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 350 * 1024 * 1024) {
      Swal.fire("Error", "Video size must be less than 350MB", "error");
      return;
    }

    if (!file.type.startsWith("video/")) {
      Swal.fire("Error", "Please select a valid video file", "error");
      return;
    }

    const formData = new FormData();
    formData.append("video", file);
    setUploadingIntroVideo(true);

    try {
      const res = await axios.post(`${STATIC_CDN_BASE}/upload/video`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl =
        res.data?.data?.cdnUrl || res.data?.videoUrl || res.data?.data?.videoUrl;

      if (uploadedUrl) {
        setIntroVideo(uploadedUrl);
        if (topic?._id) {
          await saveIntroVideoLink(
            uploadedUrl,
            "Intro video uploaded and link updated!"
          );
        } else {
          Swal.fire({
            title: "Intro Video Uploaded!",
            text: "The intro video URL has been added to the form. Save the topic to persist it.",
            icon: "success",
            confirmButtonText: "OK",
          });
        }
      } else {
        Swal.fire("Error", "Failed to get video URL", "error");
      }
    } catch (err) {
      console.error("Intro video upload error:", err);
      Swal.fire("Error", err.response?.data?.error || "Upload failed", "error");
    } finally {
      setUploadingIntroVideo(false);
    }
  };

  const uploadImageFileForTopic = async (file) => {
    if (!currentTopicId) {
      Swal.fire(
        "Save Topic First",
        "Save topic once to start topic-scoped media library.",
        "info"
      );
      return null;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire("Error", "Image size must be less than 5MB", "error");
      return null;
    }

    if (!file.type.startsWith("image/")) {
      Swal.fire("Error", "Please select a valid image file", "error");
      return null;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("topicId", currentTopicId);
    if (chapterId) {
      formData.append("chapterId", chapterId);
    }

    try {
      const res = await axios.post(
        `${STATIC_CDN_BASE}/upload/image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      return res.data.success && res.data.data.cdnUrl
        ? res.data.data.cdnUrl
        : null;
    } catch (err) {
      console.error("Image upload error:", err);
      throw err;
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    try {
      const uploadedUrl = await uploadImageFileForTopic(file);
      if (!uploadedUrl) return;

      setImageLinks((prev) => [...prev, uploadedUrl]);
      fetchUploadedFiles();
      Swal.fire({
        title: "Image Uploaded Successfully!",
        text: "Image URL is now available below. You can copy and use it in the editor.",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || "Upload failed", "error");
    }
  };

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const uploadedUrl = await uploadImageFileForTopic(file);
      if (!uploadedUrl) return;

      setBannerImageUrl(uploadedUrl);
      fetchUploadedFiles();
      Swal.fire({
        title: "Banner Image Uploaded!",
        text: "The uploaded image URL has been added to the banner field.",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || "Upload failed", "error");
    }
  };

  // Handle multiple image uploads
  const handleMultipleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (!currentTopicId) {
      Swal.fire(
        "Save Topic First",
        "Save topic once to start topic-scoped media library.",
        "info"
      );
      return;
    }

    // Check if too many files
    if (files.length > 10) {
      Swal.fire("Error", "Maximum 10 images allowed per upload", "error");
      return;
    }

    // Validate files
    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (too large)`);
      } else if (!file.type.startsWith("image/")) {
        invalidFiles.push(`${file.name} (invalid type)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      Swal.fire("Error", `Invalid files: ${invalidFiles.join(", ")}`, "error");
      return;
    }

    if (validFiles.length === 0) return;

    const formData = new FormData();
    validFiles.forEach((file) => {
      formData.append("images", file);
    });
    formData.append("topicId", currentTopicId);
    if (chapterId) {
      formData.append("chapterId", chapterId);
    }

    try {
      // Upload to static-backend microservice
      const res = await axios.post(
        `${STATIC_CDN_BASE}/upload/images`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data.success) {
        // Add all image URLs to the list
        const newUrls = res.data.data.uploaded.map((file) => file.cdnUrl);
        setImageLinks((prev) => [...prev, ...newUrls]);

        Swal.fire({
          title: "Images Uploaded Successfully!",
          text: `${res.data.data.successful} images uploaded. URLs are now available below.`,
          icon: "success",
          confirmButtonText: "OK",
        });

        // Refresh the uploaded files list
        fetchUploadedFiles();
      } else {
        Swal.fire("Error", "Failed to upload images", "error");
      }
    } catch (err) {
      console.error("Multiple images upload error:", err);
      Swal.fire("Error", err.response?.data?.error || "Upload failed", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      Swal.fire("Validation", "Title and content required!", "warning");
      return;
    }
    setSaving(true);
    try {
      let topicId;
      const payload = buildTopicPayload();
      if (topic) {
        // Update existing topic
        await axios.put(`${API_BASE}/topics/${topic._id}`, payload);
        topicId = topic._id;
      } else {
        // Create new topic
        const topicRes = await axios.post(
          `${API_BASE}/topics/by-chapter/${chapterId}`,
          payload
        );
        topicId = topicRes.data._id;
      }

      // Handle quiz creation/update
      if (quizData && quizData.length > 0) {
        try {
          await axios.post(`${API_BASE}/quizzes/topic/${topicId}`, {
            questions: quizData,
          });
        } catch (quizError) {
          console.error("Error saving quiz:", quizError);
          // Don't fail the entire operation if quiz fails
          Swal.fire(
            "Warning",
            "Topic saved but quiz update failed. Please try again.",
            "warning"
          );
        }
      }

      setTitle("");
      setContent("");
      setIntroVideo("");
      setSourceDocument(null);
      setPublishAt(toDateTimeLocalValue());
      setQuizFile(null);
      setQuizData(null);
      setIntroVideoPreviewOpen(false);
      setVideoLinks([]);
      setWordImportSummary(null);
      onSaved && onSaved();
      const quizMessage =
        quizData?.length > 0 ? ` with ${quizData.length} quiz questions` : "";
      Swal.fire(
        "Success!",
        topic ? `Topic updated${quizMessage}!` : `Topic added${quizMessage}!`,
        "success"
      );
    } catch (err) {
      console.error("Error saving topic:", err);
      Swal.fire("Error", "Failed to save topic.", "error");
    }
    setSaving(false);
  };

  const introVideoPreview = getIntroVideoPreview(introVideo);

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "calc(100vh - 120px)",
      }}
    >
      <Box
        sx={{
          width: "100%",
          minHeight: "calc(100vh - 120px)",
          bgcolor: "#fff",
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            px: { xs: 2, md: 3 },
            py: 2,
            borderBottom: "1px solid #e2e8f0",
            position: "sticky",
            top: 0,
            zIndex: 2,
            bgcolor: "#fff",
          }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton
                onClick={onCancel}
              sx={{
                color: "#334155",
                border: "1px solid #cbd5e1",
                borderRadius: 2,
              }}
            >
              <Close />
            </IconButton>
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ fontSize: { xs: 20, md: 24 }, lineHeight: 1.2 }}
              >
                {topic ? "Edit Topic" : "Add Topic"} for "{chapterName}"
              </Typography>
            </Stack>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3} sx={{ p: { xs: 2, md: 4 } }}>

          <TextField
            label="Topic Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Date & Time"
            type="datetime-local"
            fullWidth
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="Managed topic date and time"
          />

          <Box
            sx={{
              border: "1px solid #dbeafe",
              borderRadius: 2,
              p: 2.5,
              bgcolor: "#f8fbff",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1.5}
              gap={2}
            >
              <Typography fontWeight={700} fontSize={15}>
                Intro Video
              </Typography>
              {introVideo.trim() ? (
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => setIntroVideoPreviewOpen(true)}
                  >
                    Watch
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={handleIntroVideoLinkUpdate}
                    disabled={
                      introVideoSaving || uploadingIntroVideo || !topic?._id
                    }
                  >
                    {introVideoSaving ? "Saving..." : "Update Link"}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => setIntroVideo("")}
                  >
                    Clear
                  </Button>
                </Stack>
              ) : null}
            </Stack>

            <TextField
              label="Intro Video URL"
              value={introVideo}
              onChange={(e) => setIntroVideo(e.target.value)}
              fullWidth
              placeholder="Paste a direct video URL or upload one below"
              helperText="Paste a direct video URL or upload one below. Use Update Link to save changes immediately for existing topics."
              sx={{ mb: 2 }}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component="label"
                variant="contained"
                disabled={uploadingIntroVideo || introVideoSaving}
              >
                {uploadingIntroVideo
                  ? "Uploading..."
                  : introVideoSaving
                  ? "Saving..."
                  : "Upload Intro Video"}
                <input
                  type="file"
                  accept="video/*"
                  hidden
                  onChange={handleIntroVideoUpload}
                />
              </Button>
            </Stack>
          </Box>

          {/* Upload and show video links */}
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography fontWeight={600} fontSize={15}>
                Upload Videos
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={fetchUploadedFiles}
                disabled={loadingFiles}
              >
                {loadingFiles ? "Loading..." : "Refresh Files"}
              </Button>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Upload videos to get a direct link. Copy the link below and use it
              in the editor.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Button component="label" variant="contained">
                Upload Single Video
                <input
                  type="file"
                  accept="video/*"
                  hidden
                  onChange={handleVideoUpload}
                />
              </Button>
              <Button component="label" variant="outlined" color="primary">
                Upload Multiple Videos
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  hidden
                  onChange={handleMultipleVideoUpload}
                />
              </Button>
            </Stack>

            {/* Display existing uploaded videos */}
            {uploadedFiles.videos.length > 0 && (
              <Box mt={2} mb={2}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1, fontWeight: 500 }}
                >
                  📁 Previously Uploaded Videos:
                </Typography>
                <Stack spacing={1}>
                  {uploadedFiles.videos.map((file) => (
                    <Box
                      key={file.id || file.filename}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "#f0f9ff",
                        p: 2,
                        borderRadius: 1,
                        border: "1px solid #bae6fd",
                      }}
                    >
                      <Box sx={{ flex: 1, mr: 2 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, mb: 0.5 }}
                        >
                          {file.original_name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            wordBreak: "break-all",
                            fontFamily: "monospace",
                            fontSize: "0.8rem",
                            color: "#0369a1",
                          }}
                        >
                          {file.cdn_url}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Size: {(file.file_size / (1024 * 1024)).toFixed(2)} MB
                          • Uploaded:{" "}
                          {new Date(file.upload_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            navigator.clipboard.writeText(file.cdn_url);
                            Swal.fire(
                              "Copied!",
                              "Video URL copied to clipboard",
                              "success"
                            );
                          }}
                        >
                          Copy
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            if (editor.current) {
                              const videoHtml = `<div style="text-align: center; margin: 2rem 0;">
                                <video controls controlsList="nodownload" disablePictureInPicture oncontextmenu="return false;" style="width: min(100%, 1000px); height: auto; border-radius: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.15); border: 2px solid #f0f0f0;">
                                  <source src="${file.cdn_url}" type="video/mp4">
                                  <source src="${file.cdn_url}" type="video/webm">
                                  <source src="${file.cdn_url}" type="video/ogg">
                                  Your browser does not support the video tag.
                                </video>
                              </div>`;
                              editor.current.selection.insertHTML(videoHtml);
                              Swal.fire(
                                "Video Inserted!",
                                "Video has been inserted into the editor",
                                "success"
                              );
                            }
                          }}
                        >
                          Insert
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() =>
                            handleDeleteFile(file.id || file._id, "videos")
                          }
                        >
                          Delete
                        </Button>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Display uploaded video links */}
            <Stack mt={2} spacing={1}>
              {videoLinks.map((url, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#f8f9fa",
                    p: 2,
                    borderRadius: 1,
                    border: "1px solid #e9ecef",
                  }}
                >
                  <Box sx={{ flex: 1, mr: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Video URL:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        wordBreak: "break-all",
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                        color: "#007bff",
                      }}
                    >
                      {url}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        navigator.clipboard.writeText(url);
                        Swal.fire(
                          "Copied!",
                          "Video URL copied to clipboard",
                          "success"
                        );
                      }}
                    >
                      Copy
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        if (editor.current) {
                          // Insert video as embedded player with better formatting
                          const videoHtml = `<div style="text-align: center; margin: 2rem 0;">
                            <video controls controlsList="nodownload" disablePictureInPicture oncontextmenu="return false;" style="width: min(100%, 1000px); height: auto; border-radius: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.15); border: 2px solid #f0f0f0;">
                              <source src="${url}" type="video/mp4">
                              <source src="${url}" type="video/webm">
                              <source src="${url}" type="video/ogg">
                              Your browser does not support the video tag.
                            </video>
                          </div>`;
                          editor.current.selection.insertHTML(videoHtml);
                          Swal.fire(
                            "Video Inserted!",
                            "Video has been inserted into the editor as a player",
                            "success"
                          );
                        }
                      }}
                    >
                      Insert
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="info"
                      onClick={() => {
                        if (editor.current) {
                          // Insert as clickable link
                          const linkHtml = `<a href="${url}" target="_blank" style="color: #007bff; text-decoration: underline;">📹 Watch Video: ${url
                            .split("/")
                            .pop()}</a>`;
                          editor.current.selection.insertHTML(linkHtml);
                          Swal.fire(
                            "Link Inserted!",
                            "Video link has been inserted into the editor",
                            "success"
                          );
                        }
                      }}
                    >
                      Link
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        const testVideo = document.createElement("video");
                        testVideo.src = url;
                        testVideo.controls = true;
                        testVideo.style.width = "300px";
                        testVideo.style.height = "200px";

                        Swal.fire({
                          title: "Video Test",
                          html: testVideo.outerHTML,
                          width: 400,
                          showConfirmButton: true,
                          confirmButtonText: "Close",
                        });
                      }}
                    >
                      Test
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        setVideoLinks((prev) =>
                          prev.filter((_, index) => index !== i)
                        )
                      }
                    >
                      <Delete />
                    </IconButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Upload Images */}
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography fontWeight={600} fontSize={15}>
                Upload Images
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={fetchUploadedFiles}
                disabled={loadingFiles || !currentTopicId}
              >
                {loadingFiles ? "Loading..." : "Refresh Files"}
              </Button>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Upload images to get a direct link. Copy the link below and use it
              in the editor.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Button
                component="label"
                variant="contained"
                color="secondary"
                disabled={!currentTopicId}
              >
                Upload Single Image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageUpload}
                />
              </Button>
              <Button
                component="label"
                variant="outlined"
                color="secondary"
                disabled={!currentTopicId}
              >
                Upload Multiple Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleMultipleImageUpload}
                />
              </Button>
            </Stack>

            {/* Display existing uploaded images */}
            {!currentTopicId && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Save topic once to start topic-scoped media library.
              </Typography>
            )}
            {currentTopicId && uploadedFiles.images.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No images uploaded for this topic yet.
              </Typography>
            )}
            {currentTopicId && uploadedFiles.images.length > 0 && (
              <Box mt={2} mb={2}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1, fontWeight: 500 }}
                >
                  🖼️ Previously Uploaded Images:
                </Typography>
                <Stack spacing={1}>
                  {uploadedFiles.images.map((file) => (
                    <Box
                      key={file.id || file.filename}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "#fef3c7",
                        p: 2,
                        borderRadius: 1,
                        border: "1px solid #fcd34d",
                      }}
                    >
                      <Box sx={{ flex: 1, mr: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <img
                            src={file.cdn_url}
                            alt={file.original_name}
                            style={{
                              width: 60,
                              height: 60,
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "2px solid #f59e0b",
                            }}
                          />
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500, mb: 0.5 }}
                            >
                              {file.original_name}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                wordBreak: "break-all",
                                fontFamily: "monospace",
                                fontSize: "0.8rem",
                                color: "#92400e",
                              }}
                            >
                              {file.cdn_url}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Size:{" "}
                              {(file.file_size / (1024 * 1024)).toFixed(2)} MB •
                              Uploaded:{" "}
                              {new Date(file.upload_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            navigator.clipboard.writeText(file.cdn_url);
                            Swal.fire(
                              "Copied!",
                              "Image URL copied to clipboard",
                              "success"
                            );
                          }}
                        >
                          Copy
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            if (editor.current) {
                              const imageHtml = `<div style="text-align: center; margin: 2rem 0;">
                                <img src="${file.cdn_url}" alt="${file.original_name}" style="max-width: 90%; min-width: 400px; height: auto; border-radius: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.15); border: 2px solid #f0f0f0;">
                              </div>`;
                              editor.current.selection.insertHTML(imageHtml);
                              Swal.fire(
                                "Image Inserted!",
                                "Image has been inserted into the editor",
                                "success"
                              );
                            }
                          }}
                        >
                          Insert
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() =>
                            handleDeleteFile(file.id || file._id, "images")
                          }
                        >
                          Delete
                        </Button>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Display uploaded image links */}
            <Stack mt={2} spacing={1}>
              {imageLinks.map((url, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#f8f9fa",
                    p: 2,
                    borderRadius: 1,
                    border: "1px solid #e9ecef",
                  }}
                >
                  <Box sx={{ flex: 1, mr: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Image URL:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        wordBreak: "break-all",
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                        color: "#007bff",
                      }}
                    >
                      {url}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        navigator.clipboard.writeText(url);
                        Swal.fire(
                          "Copied!",
                          "Image URL copied to clipboard",
                          "success"
                        );
                      }}
                    >
                      Copy
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        if (editor.current) {
                          // Insert image directly
                          editor.current.selection.insertImage(url);
                          Swal.fire(
                            "Image Inserted!",
                            "Image has been inserted into the editor",
                            "success"
                          );
                        }
                      }}
                    >
                      Insert
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="info"
                      onClick={() => {
                        insertBannerImage(url, "Banner image");
                      }}
                    >
                      Banner
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        const testImage = document.createElement("img");
                        testImage.src = url;
                        testImage.alt = "Uploaded preview";
                        testImage.style.width = "100%";
                        testImage.style.maxWidth = "500px";
                        testImage.style.height = "auto";
                        testImage.style.borderRadius = "12px";

                        Swal.fire({
                          title: "Image Preview",
                          html: testImage.outerHTML,
                          width: 560,
                          showConfirmButton: true,
                          confirmButtonText: "Close",
                        });
                      }}
                    >
                      Test
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        setImageLinks((prev) =>
                          prev.filter((_, index) => index !== i)
                        )
                      }
                    >
                      <Delete />
                    </IconButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box
            sx={{
              mt: 3,
              p: 2.5,
              borderRadius: 2,
              border: "1px solid #dbeafe",
              background: "linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%)",
            }}
          >
            <Typography fontWeight={700} fontSize={15} sx={{ mb: 1 }}>
              Quick Inserts
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Insert a simulation or a banner image at the current cursor
              position in the editor.
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                  Create Simulation
                </Typography>
                <Stack spacing={1.5}>
                  <TextField
                    label="Simulation URL"
                    value={simulationLinkUrl}
                    onChange={(e) => setSimulationLinkUrl(e.target.value)}
                    placeholder="/simulations/gst/e-invoicing-1"
                    size="small"
                    fullWidth
                  />
                  <Box>
                    <Button
                      variant="contained"
                      onClick={() =>
                        insertSimulationLink(simulationLinkUrl)
                      }
                      disabled={!simulationLinkUrl.trim()}
                    >
                      Create Simulation
                    </Button>
                  </Box>
                </Stack>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                  Inserted Simulations
                </Typography>
                {insertedSimulationCards.length > 0 ? (
                  <Stack spacing={1}>
                    {insertedSimulationCards.map((item, index) => (
                      <Box
                        key={`${item.id || item.url || index}`}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 2,
                          p: 1.5,
                          borderRadius: 2,
                          border: "1px solid #c7ddff",
                          background: "#f8fbff",
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={700} fontSize={14} noWrap>
                            {item.label}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              wordBreak: "break-all",
                              display: "block",
                            }}
                          >
                            {item.url}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() =>
                            removeSimulationCardFromContent(item.id)
                          }
                        >
                          Delete
                        </Button>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No simulation blocks have been inserted yet.
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                  Banner Image
                </Typography>
                <Stack spacing={1.5}>
                  <TextField
                    label="Banner image URL"
                    value={bannerImageUrl}
                    onChange={(e) => setBannerImageUrl(e.target.value)}
                    placeholder="https://cdn.iicpa.in/... or upload a file"
                    size="small"
                    fullWidth
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button component="label" variant="outlined">
                      Upload Banner Image
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleBannerImageUpload}
                      />
                    </Button>
                  </Stack>
                  <Box>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => insertBannerImage(bannerImageUrl, "Banner image")}
                      disabled={!bannerImageUrl.trim()}
                    >
                      Insert Banner Image
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Box>

          <WordImportControls
            importMode={wordImportMode}
            onImportModeChange={setWordImportMode}
            onFileSelected={handleWordFileSelected}
            onPreview={() => setPreviewOpen(true)}
            importing={wordImporting}
            importSummary={wordImportSummary}
          />

          {/* Jodit Editor */}
          <Box>
            <Typography
              fontWeight={600}
              fontSize={15}
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Content
            </Typography>
            <JoditEditor
              ref={editor}
              value={content}
              config={joditConfig}
              tabIndex={1}
              onChange={(newContent) => debouncedSetContent(newContent)}
              onBlur={(newContent) => setContent(newContent)}
              onLoad={handleEditorReady}
            />
          </Box>

          {/* AI Humanize Button */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 2 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleHumanizeWithAI}
              disabled={isHumanizing}
              sx={{
                background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
                boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
                color: "white",
                fontWeight: "bold",
                ...(isHumanizing && { opacity: 0.7 })
              }}
            >
              {isHumanizing ? "✨ Humanizing..." : "✨ Humanize and Edit in AI"}
            </Button>
          </Box>

          {showAiEditor && (
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography
                fontWeight={600}
                fontSize={15}
                color="secondary"
                sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
              >
                🤖 AI Edited Content
              </Typography>
              <JoditEditor
                value={aiContent}
                config={{ ...joditConfig, placeholder: "AI magic goes here..." }}
                tabIndex={2}
                onChange={(newContent) => setAiContent(newContent)}
              />
            </Box>
          )}

          {/* Preview Button */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              onClick={handlePreviewOpen}
              disabled={!content.trim()}
              sx={{ mr: 2 }}
            >
              Preview Content
            </Button>
          </Box>

          {/* Quiz Upload */}
          {
            <Box>
              <Typography fontWeight={600} fontSize={15} sx={{ mb: 1 }}>
                Quiz Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {topic
                  ? "Upload a new Excel file to replace the existing quiz, or edit the current quiz manually."
                  : "Upload an Excel file with quiz questions. The file should have columns: question, option1, option2, option3, option4, answer"}
              </Typography>

              {/* Display existing quiz info */}
              {topic && quizData && quizData.length > 0 && (
                <Box
                  sx={{
                    background: "#e8f5e8",
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #4caf50",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    📝 Current Quiz: {quizData.length} questions
                  </Typography>
                  <Typography
                    variant="body2"
                    fontSize="0.8rem"
                    color="text.secondary"
                  >
                    First question: "{quizData[0].question.substring(0, 50)}..."
                  </Typography>
                </Box>
              )}

              <Button
                variant="outlined"
                color="secondary"
                onClick={downloadQuizTemplate}
                sx={{ mb: 2 }}
              >
                📥 Download Excel Template
              </Button>

              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Button component="label" variant="outlined">
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
                  <Typography fontSize={14} color="primary">
                    📄 {quizFile.name}
                  </Typography>
                )}
                {quizData && quizData.length > 0 && (
                  <>
                    <Button
                      variant="outlined"
                      color="info"
                      onClick={() => setQuizPreviewOpen(true)}
                    >
                      Preview Quiz ({quizData.length} questions)
                    </Button>
                    <Button
                      variant="outlined"
                      color="success"
                      onClick={openQuizEditor}
                    >
                      Edit Quiz Manually
                    </Button>
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={() => {
                        setQuizData(null);
                        setQuizFile(null);
                        Swal.fire(
                          "Quiz Cleared",
                          "Quiz data has been cleared.",
                          "info"
                        );
                      }}
                    >
                      Clear Quiz
                    </Button>
                  </>
                )}
              </Stack>

              {/* Quiz Data Preview */}
              {quizData && quizData.length > 0 && (
                <Box
                  sx={{
                    background: "#f8f9fa",
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #e9ecef",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    ✅ Quiz loaded successfully! {quizData.length} questions
                    ready to save.
                  </Typography>
                  <Typography
                    variant="body2"
                    fontSize="0.8rem"
                    color="text.secondary"
                  >
                    First question: "{quizData[0].question.substring(0, 50)}..."
                  </Typography>
                </Box>
              )}

              {/* Show message if no quiz exists */}
              {topic && (!quizData || quizData.length === 0) && (
                <Box
                  sx={{
                    background: "#fff3cd",
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #ffeaa7",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    ℹ️ No quiz exists for this topic yet. Upload an Excel file
                    or create one manually.
                  </Typography>
                </Box>
              )}
            </Box>
          }

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="outlined" onClick={onCancel} disabled={saving}>
              Back
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={saving}
              sx={{
                fontWeight: 600,
                fontSize: 16,
                bgcolor: "#1976d2",
                "&:hover": { bgcolor: "#115293" },
              }}
            >
              {saving
                ? topic
                  ? "Updating..."
                  : "Adding..."
                : topic
                ? "Update Topic"
                : "Add Topic"}
            </Button>
          </Stack>
            </Stack>
          </form>
        </Box>
      </Box>

      {/* Content Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={handlePreviewClose}
        aria-labelledby="preview-modal-title"
        aria-describedby="preview-modal-description"
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
            width: "90vw",
            maxWidth: "900px",
            maxHeight: "90vh",
            overflow: "auto",
            p: 4,
            position: "relative",
            margin: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
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
              pb: 2,
              borderBottom: "2px solid #e2e8f0",
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              id="preview-modal-title"
              sx={{
                fontWeight: 700,
                color: "#1a202c",
                fontSize: "1.875rem",
              }}
            >
              {title || "Untitled Topic"}
            </Typography>
            <IconButton
              onClick={handlePreviewClose}
              sx={{
                color: "#666",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <Close />
            </IconButton>
          </Box>

          <Box
            id="preview-modal-description"
            sx={{ fontSize: "1rem", lineHeight: 1.7, color: "#2d3748" }}
          >
            {sourceDocument ? (
              <WordDocumentPreview
                html={content}
                fileName={sourceDocument?.originalName || ""}
                pageCount={
                  sourceDocument?.pageCount ||
                  wordImportSummary?.pageCount ||
                  1
                }
                warnings={
                  sourceDocument?.warnings || wordImportSummary?.warnings || []
                }
              />
            ) : (
              <Box
                sx={{
                  "& h1": {
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "#1a202c",
                    marginTop: "2rem",
                    marginBottom: "1rem",
                    borderBottom: "3px solid #3182ce",
                    paddingBottom: "0.5rem",
                  },
                  "& h2": {
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    color: "#1a202c",
                    marginTop: "1.5rem",
                    marginBottom: "0.75rem",
                    borderBottom: "2px solid #e2e8f0",
                    paddingBottom: "0.25rem",
                  },
                  "& h3": {
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: "#1a202c",
                    marginTop: "1.25rem",
                    marginBottom: "0.5rem",
                  },
                  "& p": {
                    marginBottom: "1rem",
                    lineHeight: 1.7,
                  },
                  "& img": {
                    display: "block",
                    margin: "1.5rem auto",
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  },
                  "& video": {
                    display: "block",
                    margin: "1.5rem auto",
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  },
                  "& iframe": {
                    display: "block",
                    margin: "1.5rem auto",
                    maxWidth: "100%",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
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
                  marginBottom: "0.5rem",
                  lineHeight: 1.6,
                  display: "list-item",
                },
                  "& table": {
                    width: "100%",
                    borderCollapse: "collapse",
                    marginBottom: "1.5rem",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  },
                  "& td, & th": {
                    padding: "0.75rem",
                    border: "1px solid #e2e8f0",
                    textAlign: "left",
                  },
                  "& th": {
                    backgroundColor: "#f7fafc",
                    fontWeight: 600,
                  },
                  "& *": {
                    maxWidth: "100%",
                  },
                }}
                dangerouslySetInnerHTML={{
                  __html: processContentForPreview(content),
                }}
              />
            )}
          </Box>
        </Paper>
      </Modal>

      <Modal
        open={introVideoPreviewOpen}
        onClose={() => setIntroVideoPreviewOpen(false)}
        aria-labelledby="intro-video-preview-title"
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
            maxWidth: "960px",
            maxHeight: "90vh",
            overflow: "auto",
            p: 3,
            position: "relative",
            margin: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            borderRadius: 3,
            backgroundColor: "#0f172a",
            color: "#e2e8f0",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              id="intro-video-preview-title"
              sx={{ fontWeight: 700 }}
            >
              Intro Video Preview
            </Typography>
            <IconButton
              onClick={() => setIntroVideoPreviewOpen(false)}
              sx={{
                color: "#cbd5e1",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
              }}
            >
              <Close />
            </IconButton>
          </Box>

          <Box
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: "#020617",
              border: "1px solid rgba(148, 163, 184, 0.25)",
            }}
          >
            {introVideoPreview?.type === "iframe" ? (
              <iframe
                title={introVideoPreview.label}
                src={introVideoPreview.src}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  display: "block",
                  width: "100%",
                  minHeight: "72vh",
                  border: 0,
                  backgroundColor: "#000",
                }}
              />
            ) : introVideoPreview?.type === "video" ? (
              <video
                key={introVideo}
                controls
                autoPlay
                playsInline
                src={introVideoPreview.src}
                style={{
                  display: "block",
                  width: "100%",
                  maxHeight: "72vh",
                  backgroundColor: "#000",
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : introVideoPreview?.type === "link" ? (
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  color: "#cbd5e1",
                }}
              >
                <Typography sx={{ mb: 1 }}>
                  This intro video is a link and cannot be played inline.
                </Typography>
                <Link
                  href={introVideoPreview.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "#60a5fa", fontWeight: 600 }}
                >
                  Open video link
                </Link>
              </Box>
            ) : null}
          </Box>

          <Typography
            variant="body2"
            sx={{
              mt: 2,
              wordBreak: "break-all",
              color: "#94a3b8",
            }}
          >
            {introVideo}
          </Typography>
        </Paper>
      </Modal>

      {/* Quiz Preview Modal */}
      <Modal
        open={quizPreviewOpen}
        onClose={() => setQuizPreviewOpen(false)}
        aria-labelledby="quiz-preview-modal-title"
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
            width: "90vw",
            maxWidth: "800px",
            maxHeight: "90vh",
            overflow: "auto",
            p: 4,
            position: "relative",
            margin: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
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
              pb: 2,
              borderBottom: "2px solid #e2e8f0",
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              id="quiz-preview-modal-title"
              sx={{
                fontWeight: 700,
                color: "#1a202c",
                fontSize: "1.5rem",
              }}
            >
              Quiz Preview ({quizData?.length || 0} Questions)
            </Typography>
            <IconButton
              onClick={() => setQuizPreviewOpen(false)}
              sx={{
                color: "#666",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <Close />
            </IconButton>
          </Box>

          <Stack spacing={3}>
            {quizData?.map((question, index) => (
              <Box
                key={index}
                sx={{
                  p: 3,
                  border: "1px solid #e2e8f0",
                  borderRadius: 2,
                  backgroundColor: "#f8f9fa",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: "#1a202c",
                    mb: 2,
                  }}
                >
                  Question {index + 1}
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    mb: 2,
                    fontWeight: 500,
                    color: "#2d3748",
                  }}
                >
                  {question.question}
                </Typography>

                <Stack spacing={1}>
                  {question.options.map((option, optionIndex) => (
                    <Box
                      key={optionIndex}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor:
                          option === question.answer ? "#e6fffa" : "#ffffff",
                        border:
                          option === question.answer
                            ? "2px solid #38b2ac"
                            : "1px solid #e2e8f0",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: option === question.answer ? 600 : 400,
                          color:
                            option === question.answer ? "#2c7a7b" : "#4a5568",
                        }}
                      >
                        {String.fromCharCode(65 + optionIndex)}. {option}
                        {option === question.answer && " ✓"}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Modal>

      {/* Quiz Editor Modal */}
      <Modal
        open={quizEditorOpen && editingQuestion}
        onClose={closeQuizEditor}
        aria-labelledby="quiz-editor-modal-title"
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
            width: "90vw",
            maxWidth: "800px",
            maxHeight: "90vh",
            overflow: "auto",
            p: 4,
            position: "relative",
            margin: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
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
              pb: 2,
              borderBottom: "2px solid #e2e8f0",
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              id="quiz-editor-modal-title"
              sx={{
                fontWeight: 700,
                color: "#1a202c",
                fontSize: "1.5rem",
              }}
            >
              {editingQuestionIndex >= 0 ? "Edit Question" : "Add New Question"}
            </Typography>
            <IconButton
              onClick={closeQuizEditor}
              sx={{
                color: "#666",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              <Close />
            </IconButton>
          </Box>

          {editingQuestion && (
            <Stack spacing={3}>
              {/* Question Text */}
              <TextField
                label="Question Text *"
                value={editingQuestion.question}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    question: e.target.value,
                  })
                }
                multiline
                rows={3}
                fullWidth
                required
              />

              {/* Options */}
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "#1a202c" }}
              >
                Answer Options *
              </Typography>
              {editingQuestion.options.map((option, index) => (
                <TextField
                  key={index}
                  label={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...editingQuestion.options];
                    newOptions[index] = e.target.value;
                    setEditingQuestion({
                      ...editingQuestion,
                      options: newOptions,
                    });
                  }}
                  fullWidth
                  required
                />
              ))}

              {/* Correct Answer */}
              <TextField
                label="Correct Answer *"
                value={editingQuestion.answer}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    answer: e.target.value,
                  })
                }
                fullWidth
                required
                helperText="Must match one of the options exactly"
              />

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={closeQuizEditor}>
                  Cancel
                </Button>
                <Button variant="contained" onClick={saveQuestion}>
                  {editingQuestionIndex >= 0
                    ? "Update Question"
                    : "Add Question"}
                </Button>
              </Stack>
            </Stack>
          )}
        </Paper>
      </Modal>

      {/* Quiz Questions List Modal */}
      <Modal
        open={quizEditorOpen && !editingQuestion}
        onClose={closeQuizEditor}
        aria-labelledby="quiz-questions-modal-title"
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
            width: "90vw",
            maxWidth: "800px",
            maxHeight: "90vh",
            overflow: "auto",
            p: 4,
            position: "relative",
            margin: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
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
              pb: 2,
              borderBottom: "2px solid #e2e8f0",
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              id="quiz-questions-modal-title"
              sx={{
                fontWeight: 700,
                color: "#1a202c",
                fontSize: "1.5rem",
              }}
            >
              Quiz Questions ({quizData?.length || 0})
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, fontStyle: "italic" }}
            >
              💡 Drag the questions to reorder them
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="primary"
                onClick={addNewQuestion}
                startIcon={<Add />}
              >
                Add Question
              </Button>
              <IconButton
                onClick={closeQuizEditor}
                sx={{
                  color: "#666",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                  },
                }}
              >
                <Close />
              </IconButton>
            </Stack>
          </Box>

          <Stack spacing={2}>
            {quizData?.map((question, index) => (
              <Box
                key={index}
                sx={{
                  p: 3,
                  border: "1px solid #e2e8f0",
                  borderRadius: 2,
                  backgroundColor: "#f8f9fa",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "#1a202c",
                    }}
                  >
                    Question {index + 1}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => editQuestion(question, index)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => deleteQuestion(index)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Box>

                <Typography
                  variant="body1"
                  sx={{
                    mb: 2,
                    fontWeight: 500,
                    color: "#2d3748",
                  }}
                >
                  {question.question}
                </Typography>

                <Stack spacing={1}>
                  {question.options.map((option, optionIndex) => (
                    <Box
                      key={optionIndex}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        p: 1,
                        borderRadius: 1,
                        backgroundColor:
                          option === question.answer ? "#e6fffa" : "#ffffff",
                        border:
                          option === question.answer
                            ? "2px solid #38b2ac"
                            : "1px solid #e2e8f0",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: option === question.answer ? 600 : 400,
                          color:
                            option === question.answer ? "#2c7a7b" : "#4a5568",
                        }}
                      >
                        {String.fromCharCode(65 + optionIndex)}. {option}
                        {option === question.answer && " ✓"}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}

            {(!quizData || quizData.length === 0) && (
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  color: "#666",
                }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  No questions yet
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  Click "Add Question" to create your first quiz question.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={addNewQuestion}
                  startIcon={<Add />}
                >
                  Add First Question
                </Button>
              </Box>
            )}
          </Stack>
        </Paper>
      </Modal>
    </Box>
  );
}
