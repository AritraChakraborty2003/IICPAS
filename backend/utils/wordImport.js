import fs from "fs";
import fsp from "fs/promises";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const PUBLIC_IMPORT_DIR = path.join("uploads", "topic_word_imports");

const ensureDirSync = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDirSync(PUBLIC_IMPORT_DIR);

const normalizeWhitespace = (value) =>
  value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

const mergeStyles = (existing = "", incoming = "") => {
  const styles = new Map();

  const parse = (styleString) => {
    styleString
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((pair) => {
        const separatorIndex = pair.indexOf(":");
        if (separatorIndex === -1) return;
        const key = pair.slice(0, separatorIndex).trim().toLowerCase();
        const value = pair.slice(separatorIndex + 1).trim();
        if (key) {
          styles.set(key, value);
        }
      });
  };

  parse(existing);
  parse(incoming);

  return Array.from(styles.entries())
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");
};

const collectCssRules = (cssText) => {
  const rules = [];
  const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(cssText))) {
    const selectors = match[1]
      .split(",")
      .map((selector) => selector.trim())
      .filter(Boolean);
    const declarations = match[2].trim().replace(/\s+/g, " ");

    selectors.forEach((selector) => {
      rules.push({ selector, declarations });
    });
  }

  return rules;
};

const inlineTextutilStyles = (html, cssText) => {
  const tagStyles = new Map();
  const classStyles = new Map();

  for (const { selector, declarations } of collectCssRules(cssText)) {
    const normalized = selector.replace(/\s+/g, " ").trim();
    if (/[\s>:+~]/.test(normalized)) {
      continue;
    }

    const classMatch = normalized.match(/^([a-z0-9-]+)?\.([a-z0-9_-]+)$/i);
    if (classMatch) {
      const tag = (classMatch[1] || "").toLowerCase();
      const className = classMatch[2];
      const current = classStyles.get(className) || {};
      classStyles.set(className, {
        ...current,
        ...(tag ? { tag } : {}),
        style: mergeStyles(current.style || "", declarations),
      });
      continue;
    }

    const tagMatch = normalized.match(/^[a-z0-9-]+$/i);
    if (tagMatch) {
      const tag = normalized.toLowerCase();
      const existing = tagStyles.get(tag) || "";
      tagStyles.set(tag, mergeStyles(existing, declarations));
    }
  }

  const applyStylesToTag = (match, tagName, attributes, closing) => {
    const tag = tagName.toLowerCase();
    const classAttrMatch = attributes.match(/\sclass=(["'])([^"']+)\1/i);
    const styleAttrMatch = attributes.match(/\sstyle=(["'])([\s\S]*?)\1/i);

    let mergedStyle = styleAttrMatch ? styleAttrMatch[2] : "";
    const classNames = classAttrMatch ? classAttrMatch[2].split(/\s+/) : [];

    if (tagStyles.has(tag)) {
      mergedStyle = mergeStyles(mergedStyle, tagStyles.get(tag));
    }

    for (const className of classNames) {
      if (classStyles.has(className)) {
        const classStyle = classStyles.get(className);
        if (!classStyle.tag || classStyle.tag === tag) {
          mergedStyle = mergeStyles(mergedStyle, classStyle.style);
        }
      }
    }

    let nextAttributes = attributes;
    if (mergedStyle) {
      if (styleAttrMatch) {
        nextAttributes = nextAttributes.replace(
          /\sstyle=(["'])([\s\S]*?)\1/i,
          ` style="${mergedStyle}"`
        );
      } else {
        nextAttributes += ` style="${mergedStyle}"`;
      }
    }

    return `<${closing}${tagName}${nextAttributes}>`;
  };

  return html.replace(
    /<(\/?)([a-z0-9-]+)([^>]*)>/gi,
    (match, isClosing, tagName, attributes) => {
      if (isClosing) {
        return match;
      }

      return applyStylesToTag(match, tagName, attributes, "");
    }
  );
};

const extractBodyHtml = (html) => {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : html;
};

const extractHeadStyle = (html) => {
  const styleMatches = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
  return styleMatches.map((match) => match[1]).join("\n");
};

const stripUnsafeMarkup = (html) => {
  let sanitized = html;
  sanitized = sanitized.replace(
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    ""
  );
  sanitized = sanitized.replace(
    /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
    ""
  );
  sanitized = sanitized.replace(
    /<object\b[^>]*>[\s\S]*?<\/object>/gi,
    ""
  );
  sanitized = sanitized.replace(/<embed\b[^>]*>/gi, "");
  sanitized = sanitized.replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");
  sanitized = sanitized.replace(
    /\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi,
    ""
  );
  sanitized = sanitized.replace(
    /\s(href|src)\s*=\s*(["'])\s*file:[\s\S]*?\2/gi,
    ""
  );
  return sanitized;
};

const rewriteResourceUrls = (html, resourceMap) =>
  html.replace(
    /\s(src|href)=("([^"]+)"|'([^']+)')/gi,
    (match, attribute, quotedValue, doubleQuoted, singleQuoted) => {
      const rawValue = doubleQuoted || singleQuoted || "";
      const normalized = rawValue.trim();

      if (
        !normalized ||
        normalized.startsWith("http://") ||
        normalized.startsWith("https://") ||
        normalized.startsWith("data:") ||
        normalized.startsWith("mailto:") ||
        normalized.startsWith("tel:") ||
        normalized.startsWith("/")
      ) {
        return match;
      }

      const rewritten = resourceMap.get(normalized) || resourceMap.get(path.basename(normalized));
      if (!rewritten) {
        return match;
      }

      return ` ${attribute}="${rewritten}"`;
    }
  );

const collectResourceFiles = async (rootDir, htmlFilePath) => {
  const resources = [];
  const entries = await fsp.readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (fullPath === htmlFilePath) continue;

    if (entry.isDirectory()) {
      const nested = await collectResourceFiles(fullPath, htmlFilePath);
      resources.push(...nested);
      continue;
    }

    resources.push(fullPath);
  }

  return resources;
};

const copyResourceFiles = async (resourceFiles, tempDir, importId) => {
  const publicDir = path.join(PUBLIC_IMPORT_DIR, importId);
  await fsp.mkdir(publicDir, { recursive: true });

  const resourceMap = new Map();

  for (const resourcePath of resourceFiles) {
    const relativePath = path.relative(tempDir, resourcePath);
    const targetPath = path.join(publicDir, relativePath);
    await fsp.mkdir(path.dirname(targetPath), { recursive: true });
    await fsp.copyFile(resourcePath, targetPath);

    const publicUrl = `/uploads/topic_word_imports/${importId}/${relativePath
      .split(path.sep)
      .join("/")}`;
    resourceMap.set(relativePath.split(path.sep).join("/"), publicUrl);
    resourceMap.set(path.basename(relativePath), publicUrl);
  }

  return resourceMap;
};

const extractWarningNotes = (html) => {
  const warnings = [];
  if (/<table[\s>]/i.test(html)) warnings.push("Tables were imported best-effort.");
  if (/<img[\s>]/i.test(html)) warnings.push("Images were preserved where supported by the converter.");
  if (/page-break-(before|after)\s*:\s*always/i.test(html)) {
    warnings.push("Hard page breaks were detected and preserved.");
  }
  return warnings;
};

const normalizeTextutilOutput = (html) => {
  const headStyles = extractHeadStyle(html);
  const bodyHtml = extractBodyHtml(html);
  const inlined = inlineTextutilStyles(bodyHtml, headStyles);
  return stripUnsafeMarkup(inlined).trim();
};

const countPageBreakMarkers = (html) => {
  const matches = html.match(/page-break-(before|after)\s*:\s*always/gi);
  return matches ? matches.length : 0;
};

const stripHtmlTags = (html) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const estimatePageCount = (html, pageBreakCount) => {
  if (!html) return 1;

  const explicitPages = pageBreakCount > 0 ? pageBreakCount + 1 : 0;
  const plainTextLength = stripHtmlTags(html).length;
  const heuristicPages = Math.max(1, Math.ceil(plainTextLength / 2200));

  return Math.max(explicitPages || 1, heuristicPages);
};

export const convertWordDocumentToHtml = async (filePath, originalName) => {
  const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "iicpa-word-"));
  const importId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const outputHtmlPath = path.join(tempDir, "converted.html");

  try {
    await execFileAsync(
      "textutil",
      ["-convert", "html", "-output", outputHtmlPath, filePath],
      { timeout: 30000, maxBuffer: 20 * 1024 * 1024 }
    );

    const rawHtml = await fsp.readFile(outputHtmlPath, "utf8");
    const resourceFiles = await collectResourceFiles(tempDir, outputHtmlPath);
    const resourceMap = await copyResourceFiles(resourceFiles, tempDir, importId);

    let html = normalizeTextutilOutput(normalizeWhitespace(rawHtml));
    if (resourceMap.size > 0) {
      html = rewriteResourceUrls(html, resourceMap);
    }

    const pageBreakCount = countPageBreakMarkers(html);
    const warnings = extractWarningNotes(html);
    const pageCount = estimatePageCount(html, pageBreakCount);

    return {
      html,
      pageBreakCount,
      pageCount,
      warnings,
      sourceDocument: {
        originalName,
        mimeType: "application/vnd.wordprocessingml",
        size: (await fsp.stat(filePath)).size,
        extension: path.extname(originalName).toLowerCase().replace(/^\./, ""),
        pageCount,
        warnings,
        importedAt: new Date().toISOString(),
      },
      importId,
    };
  } finally {
    await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
};

export const getSupportedWordExtensions = () => [".doc", ".docx"];

