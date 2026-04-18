import axios from "axios";
import { getApiBase } from "@/lib/apiBase";

const API_BASE = getApiBase();

export const importWordDocument = async ({
  chapterId,
  file,
}) => {
  const formData = new FormData();
  formData.append("document", file);

  const response = await axios.post(
    `${API_BASE}/topics/by-chapter/${chapterId}/import-word`,
    formData,
    {}
  );

  return response.data;
};

const isPageBreakNode = (node) => {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;

  const element = node;
  const className = (element.className || "").toString().toLowerCase();
  const style = (element.getAttribute("style") || "").toLowerCase();
  const tagName = element.tagName.toLowerCase();

  if (tagName === "hr" && className.includes("word-page-break")) {
    return true;
  }

  if (element.getAttribute("data-word-page-break") === "true") {
    return true;
  }

  return false;
};

export const splitHtmlIntoPages = (html) => {
  if (!html) return [];

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return [html];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, "text/html");
  const body = doc.body;
  const pages = [];
  let currentHtml = "";

  const flushCurrent = () => {
    if (currentHtml.trim()) {
      pages.push(currentHtml);
    }
    currentHtml = "";
  };

  const appendNode = (node) => {
    currentHtml += node.outerHTML || node.textContent || "";
  };

  Array.from(body.childNodes).forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const style = (node.getAttribute("style") || "").toLowerCase();
      const hasBreakBefore = /page-break-before\s*:\s*always|break-before\s*:\s*page/i.test(
        style
      );
      const hasBreakAfter = /page-break-after\s*:\s*always|break-after\s*:\s*page/i.test(
        style
      );

      if (hasBreakBefore) {
        flushCurrent();
        appendNode(node);
        return;
      }

      if (hasBreakAfter) {
        appendNode(node);
        flushCurrent();
        return;
      }
    }

    if (isPageBreakNode(node)) {
      flushCurrent();
      return;
    }

    appendNode(node);
  });

  if (currentHtml.trim()) {
    pages.push(currentHtml);
  }

  return pages.length > 0 ? pages : [html];
};

export const buildWordImportSummary = (result, fileName, importMode) => ({
  fileName,
  importMode,
  pageCount: result?.pageCount || 1,
  pageBreakCount: result?.pageBreakCount || 0,
  warnings: Array.isArray(result?.warnings) ? result.warnings : [],
});

export const mergeImportedWordContent = ({
  currentContent = "",
  importedContent = "",
  importMode = "replace",
}) => {
  const normalizedCurrent = currentContent.trim();
  const normalizedImported = importedContent.trim();

  if (!normalizedImported) {
    return normalizedCurrent;
  }

  if (importMode !== "append" || !normalizedCurrent) {
    return normalizedImported;
  }

  const pageBreakHtml =
    '<div class="word-page-break" data-word-page-break="true" style="page-break-before: always;"></div>';
  const endsWithPageBreak =
    /data-word-page-break\s*=\s*["']true["']/i.test(normalizedCurrent) ||
    /page-break-before\s*:\s*always/i.test(normalizedCurrent) ||
    /break-before\s*:\s*page/i.test(normalizedCurrent);

  if (endsWithPageBreak) {
    return `${normalizedCurrent}\n${normalizedImported}`;
  }

  return `${normalizedCurrent}\n${pageBreakHtml}\n${normalizedImported}`;
};

export const buildImportedSourceDocument = ({
  result,
  file,
  importMode,
}) => ({
  originalName: file?.name || result?.sourceDocument?.originalName || "",
  mimeType: file?.type || result?.sourceDocument?.mimeType || "",
  size: file?.size || result?.sourceDocument?.size || 0,
  extension:
    (file?.name || "")
      .split(".")
      .pop()
      ?.toLowerCase() || result?.sourceDocument?.extension || "",
  pageCount: result?.pageCount || 1,
  pageBreakCount: result?.pageBreakCount || 0,
  importMode,
  warnings: Array.isArray(result?.warnings) ? result.warnings : [],
  importedAt: new Date().toISOString(),
});
