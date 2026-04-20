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

const getBaseName = (filePathOrName) => {
  const safeName = filePathOrName || "";
  const ext = path.extname(safeName);
  return path.basename(safeName, ext);
};

const normalizeResourceKey = (value) =>
  (value || "")
    .split("#")[0]
    .split("?")[0]
    .replace(/\\/g, "/");

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

const decodeCssContentValue = (rawValue) => {
  let value = (rawValue || "").trim();
  if (!value) return "";

  const quotedMatch = value.match(/^(['"])([\s\S]*)\1$/);
  if (quotedMatch) {
    value = quotedMatch[2];
  }

  value = value.replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_match, hex) =>
    String.fromCodePoint(Number.parseInt(hex, 16))
  );
  value = value.replace(/\\([\\'"nrtfb])/g, (_match, escaped) => {
    switch (escaped) {
      case "n":
        return "\n";
      case "r":
        return "\r";
      case "t":
        return "\t";
      case "f":
        return "\f";
      case "b":
        return "\b";
      case "\\":
        return "\\";
      case '"':
        return '"';
      case "'":
        return "'";
      default:
        return escaped;
    }
  });
  value = value.replace(/\\(.)/g, "$1");
  return value;
};

const extractBeforeContentRules = (cssText) => {
  const rules = [];

  for (const { selector, declarations } of collectCssRules(cssText)) {
    const normalized = selector.replace(/\s+/g, " ").trim();
    const pseudoMatch = normalized.match(/^(.+?)(::?before)$/i);
    if (!pseudoMatch) continue;

    const baseSelector = pseudoMatch[1].trim();
    if (!baseSelector || /[\s>:+~]/.test(baseSelector)) {
      continue;
    }

    const contentMatch = declarations.match(/content\s*:\s*([^;]+)(?:;|$)/i);
    if (!contentMatch) continue;

    const rawContent = contentMatch[1].trim();
    const isCounter = /counter\s*\(/i.test(rawContent);
    const prefix = isCounter ? "" : decodeCssContentValue(rawContent);

    if (!prefix && !isCounter) {
      continue;
    }

    rules.push({
      selector: baseSelector,
      prefix,
      isCounter,
    });
  }

  return rules;
};

const selectorMatchesElement = (selector, tagName, attributes) => {
  const normalized = (selector || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!normalized || /[\s>:+~]/.test(normalized)) {
    return false;
  }

  const tag = tagName.toLowerCase();
  const classAttrMatch = attributes.match(/\sclass=(["'])([^"']+)\1/i);
  const classNames = classAttrMatch
    ? classAttrMatch[2].split(/\s+/).map((name) => name.toLowerCase())
    : [];

  if (normalized === tag) {
    return true;
  }

  const classMatch = normalized.match(/^([a-z0-9-]+)?\.([a-z0-9_-]+)$/i);
  if (classMatch) {
    const selectorTag = (classMatch[1] || "").toLowerCase();
    const selectorClass = classMatch[2].toLowerCase();
    if (selectorTag && selectorTag !== tag) {
      return false;
    }
    return classNames.includes(selectorClass);
  }

  return false;
};

const inlineTextutilStyles = (html, cssText) => {
  const tagStyles = new Map();
  const classStyles = new Map();
  const beforeRules = extractBeforeContentRules(cssText);
  const beforeRuleCounts = new Map();

  for (const { selector, declarations } of collectCssRules(cssText)) {
    const normalized = selector.replace(/\s+/g, " ").trim();
    if (/[\s>+~]/.test(normalized) || /:(?!before\b|:before\b)/i.test(normalized)) {
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
    let prefix = "";

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

    for (const rule of beforeRules) {
      if (!selectorMatchesElement(rule.selector, tagName, attributes)) {
        continue;
      }

      const count = beforeRuleCounts.get(rule.selector) || 0;
      beforeRuleCounts.set(rule.selector, count + 1);

      prefix = rule.isCounter
        ? `${count + 1}. `
        : rule.prefix.endsWith(" ")
        ? rule.prefix
        : `${rule.prefix} `;
      break;
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

    return `<${closing}${tagName}${nextAttributes}>${prefix}`;
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

      let resourceKey = path.basename(normalized);
      if (normalized.startsWith("file:")) {
        try {
          resourceKey = path.basename(
            decodeURIComponent(new URL(normalized).pathname || "")
          );
        } catch (_error) {
          resourceKey = path.basename(normalized.replace(/^file:/i, ""));
        }
      }

      const rewritten =
        resourceMap.get(normalized) ||
        resourceMap.get(normalizeResourceKey(resourceKey)) ||
        resourceMap.get(resourceKey) ||
        resourceMap.get(resourceKey.replace(/\\/g, "/"));
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

const DEFAULT_CONTENT_FONT_FAMILY =
  'Lucida Sans, "Lucida Sans Unicode", "Lucida Grande", "Noto Sans", sans-serif';

const normalizeDefaultContentFont = (
  html,
  fontFamily = DEFAULT_CONTENT_FONT_FAMILY
) => {
  if (!html) return html;

  const styleAttributeRegex = /\sstyle=(["'])([\s\S]*?)\1/gi;
  const cleanedHtml = html.replace(
    styleAttributeRegex,
    (_match, quote, styleValue) => {
      const cleanedStyle = (styleValue || "")
        .replace(/(?:^|;)\s*font-family\s*:\s*[^;]+/gi, "")
        .replace(/;;+/g, ";")
        .replace(/^\s*;\s*|\s*;\s*$/g, "")
        .trim();

      const nextStyle = cleanedStyle
        ? `${cleanedStyle}; font-family: ${fontFamily}`
        : `font-family: ${fontFamily}`;

      return ` style=${quote}${nextStyle}${quote}`;
    }
  );

  if (/data-default-content-font=["']true["']/i.test(cleanedHtml)) {
    return cleanedHtml;
  }

  return `<div class="default-content-font" data-default-content-font="true" style="font-family: ${fontFamily};">${cleanedHtml}</div>`;
};

const decodeHtmlEntities = (value) => {
  let decoded = value || "";
  decoded = decoded.replace(/&nbsp;/gi, " ");
  decoded = decoded.replace(/&amp;/gi, "&");
  decoded = decoded.replace(/&lt;/gi, "<");
  decoded = decoded.replace(/&gt;/gi, ">");
  decoded = decoded.replace(/&quot;/gi, '"');
  decoded = decoded.replace(/&#39;/gi, "'");
  decoded = decoded.replace(/&#(\d+);/g, (_match, decimal) =>
    String.fromCodePoint(Number.parseInt(decimal, 10))
  );
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_match, hex) =>
    String.fromCodePoint(Number.parseInt(hex, 16))
  );
  return decoded;
};

const stripHtmlToPlainText = (value) =>
  decodeHtmlEntities(
    value
      .replace(/<br\b[^>]*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();

const BULLET_MARKER_PATTERN = /^(?:[•◦▪‣∙·]|\u2022|\u25e6|\u25aa|\u25ab)\s*/i;
const ARROW_MARKER_PATTERN = /^(?:[➤➢➔➜➡]|\u27a4|\u27a2|\u2794|\u279c|\u27a1|>>|>\s?>)\s*/i;
const ORDERED_MARKER_PATTERN = /^(\d+)[.)]\s*/i;

const stripLeadingSpaceArtifacts = (value) =>
  value.replace(
    /^(?:\s|&nbsp;|&#160;|<span[^>]*class=(["'])Apple-converted-space\1[^>]*>(?:\s|&nbsp;|&#160;)*<\/span>)*/gi,
    ""
  );

const stripListMarkerFromLineHtml = (lineHtml, kind) => {
  let cleaned = stripLeadingSpaceArtifacts((lineHtml || "").trim());

  if (kind === "ul") {
    cleaned = cleaned.replace(
      /^(?:[•◦▪‣∙·]|\u2022|\u25e6|\u25aa|\u25ab|&bull;|&#8226;)\s*/i,
      ""
    );
  } else if (kind === "ul-arrow") {
    // Strip both arrow-specific markers and standard bullets if we are forcing arrow style
    cleaned = cleaned.replace(
      /^(?:[➤➢➔➜➡]|\u27a4|\u27a2|\u2794|\u279c|\u27a1|>>|>\s?>|[•◦▪‣∙·]|\u2022|\u25e6|\u25aa|\u25ab|&bull;|&#8226;)\s*/i,
      ""
    );
  } else if (kind === "ol") {
    cleaned = cleaned.replace(/^\d+[.)]\s*/i, "");
  }

  return cleaned.trim();
};

const classifyListLine = (lineHtml) => {
  const plainText = stripHtmlToPlainText(lineHtml);
  if (!plainText) return null;

  if (ARROW_MARKER_PATTERN.test(plainText)) {
    return "ul-arrow";
  }

  if (BULLET_MARKER_PATTERN.test(plainText)) {
    return "ul";
  }

  if (ORDERED_MARKER_PATTERN.test(plainText)) {
    return "ol";
  }

  return null;
};

const getParagraphListCandidate = (paragraphHtml) => {
  const paragraphMatch = paragraphHtml.match(/^<p\b([^>]*)>([\s\S]*?)<\/p>$/i);
  if (!paragraphMatch) return null;

  const attributes = paragraphMatch[1] || "";
  const innerHtml = paragraphMatch[2] || "";
  const styleAttrMatch = attributes.match(/\sstyle=(["'])([\s\S]*?)\1/i);
  const liStyle = styleAttrMatch ? styleAttrMatch[2] : "";

  const lines = innerHtml
    .split(/<br\b[^>]*\/?>/i)
    .map((line) => line.trim())
    .filter((line) => stripHtmlToPlainText(line));

  if (lines.length === 0) {
    return null;
  }

  const kinds = lines.map((line) => classifyListLine(line));
  if (kinds.some((kind) => !kind)) {
    return null;
  }

  const primaryKind = kinds[0];
  if (!kinds.every((kind) => kind === primaryKind)) {
    return null;
  }

  return {
    kind: primaryKind,
    items: lines.map((line) => stripListMarkerFromLineHtml(line, primaryKind)),
    style: liStyle,
  };
};

const normalizeWordListMarkup = (html) => {
  const tokenRegex =
    /<table\b[\s\S]*?<\/table>|<ul\b[\s\S]*?<\/ul>|<ol\b[\s\S]*?<\/ol>|<blockquote\b[\s\S]*?<\/blockquote>|<pre\b[\s\S]*?<\/pre>|<div\b[\s\S]*?<\/div>|<h[1-6]\b[\s\S]*?<\/h[1-6]>|<p\b[\s\S]*?<\/p>|<hr\b[^>]*\/?>|<br\b[^>]*\/?>|<!--[\s\S]*?-->|[^<]+/gi;
  const tokens = html.match(tokenRegex) || [html];

  const isWhitespaceToken = (token) => /^[\s\u00a0]*$/.test(token);
  const isParagraphToken = (token) => /^<p\b/i.test(token);
  const isBlockBreaker = (token) =>
    /^<(table|ul|ol|blockquote|pre|div|h[1-6]|hr|br)\b/i.test(token);

  let output = "";
  let lastMeaningfulText = "";
  let openListKind = null;

  const closeOpenList = () => {
    if (openListKind) {
      output += `</${openListKind === "ul-arrow" ? "ul" : openListKind}>`;
      openListKind = null;
    }
  };

  const openList = (kind) => {
    if (openListKind !== kind) {
      closeOpenList();
      const tag = kind === "ul-arrow" ? "ul" : kind;
      const className = kind === "ul-arrow" ? ' class="arrow-list"' : "";
      output += `<${tag}${className}>`;
      openListKind = kind;
    }
  };

  const findNextMeaningfulTokenIndex = (startIndex) => {
    for (let index = startIndex; index < tokens.length; index += 1) {
      const token = tokens[index];
      if (isWhitespaceToken(token) || token.startsWith("<!--")) {
        continue;
      }
      return index;
    }
    return -1;
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (isWhitespaceToken(token)) {
      output += token;
      continue;
    }

    if (!isParagraphToken(token)) {
      const plainText = stripHtmlTags(token).trim();
      if (plainText) {
        lastMeaningfulText = plainText;
      }
      closeOpenList();
      output += token;
      continue;
    }

    let candidate = getParagraphListCandidate(token);

    // Heuristic: If a list follows a paragraph that looks like "Key Points", 
    // treat it as an arrow list even if markers are standard bullets.
    if (candidate && /key\s*points/i.test(lastMeaningfulText)) {
      candidate.kind = "ul-arrow";
      // Re-strip using the new kind
      const innerHtml = token.match(/^<p\b([^>]*)>([\s\S]*?)<\/p>$/i)?.[2] || "";
      const lines = innerHtml
        .split(/<br\b[^>]*\/?>/i)
        .map((line) => line.trim())
        .filter((line) => stripHtmlToPlainText(line));
      candidate.items = lines.map((line) => stripListMarkerFromLineHtml(line, "ul-arrow"));
    }

    if (!candidate) {
      const plainText = stripHtmlTags(token).trim();
      if (plainText) {
        lastMeaningfulText = plainText;
      }
      closeOpenList();
      output += token;
      continue;
    }

    const nextMeaningfulIndex = findNextMeaningfulTokenIndex(index + 1);
    const nextToken =
      nextMeaningfulIndex >= 0 ? tokens[nextMeaningfulIndex] : null;
    const nextCandidate =
      nextToken && isParagraphToken(nextToken)
        ? getParagraphListCandidate(nextToken)
        : null;

    const shouldConvertToList =
      candidate.items.length > 1 ||
      Boolean(nextCandidate && nextCandidate.kind === candidate.kind) ||
      Boolean(openListKind === candidate.kind);

    if (!shouldConvertToList) {
      const plainText = stripHtmlTags(token).trim();
      if (plainText) {
        lastMeaningfulText = plainText;
      }
      closeOpenList();
      output += token;
      continue;
    }

    openList(candidate.kind);
    const liStyle = candidate.style ? ` style="${candidate.style}"` : "";

    candidate.items.forEach((item) => {
      output += `<li${liStyle}>${item || "<br>"}</li>`;
    });

    if (!nextCandidate || nextCandidate.kind !== candidate.kind) {
      closeOpenList();
    }
  }

  closeOpenList();
  return output;
};

const normalizeTextutilOutput = (html) => {
  const headStyles = extractHeadStyle(html);
  const bodyHtml = extractBodyHtml(html);
  const inlined = inlineTextutilStyles(bodyHtml, headStyles);
  const sanitized = stripUnsafeMarkup(inlined).trim();
  return normalizeWordListMarkup(sanitized);
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

const findConvertedHtmlFile = async (rootDir, originalName) => {
  const baseName = getBaseName(originalName);
  const candidateNames = [
    "converted.html",
    `${baseName}.html`,
    `${baseName}.htm`,
  ].filter(Boolean);

  for (const candidate of candidateNames) {
    const candidatePath = path.join(rootDir, candidate);
    if (await fsp
      .access(candidatePath)
      .then(() => true)
      .catch(() => false)) {
      return candidatePath;
    }
  }

  const entries = await fsp.readdir(rootDir, { withFileTypes: true });
  const htmlFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /\.html?$/i.test(name));

  if (htmlFiles.length > 0) {
    return path.join(rootDir, htmlFiles[0]);
  }

  return null;
};

const runConversionCommand = async ({
  command,
  args,
  outputHtmlPath,
  tempDir,
}) => {
  await execFileAsync(command, args, {
    timeout: 60000,
    maxBuffer: 20 * 1024 * 1024,
  });

  if (outputHtmlPath) {
    try {
      await fsp.access(outputHtmlPath);
      return outputHtmlPath;
    } catch (_error) {
      // Fall through and try to discover the produced HTML file.
    }
  }

  return findConvertedHtmlFile(tempDir, args[args.length - 1]);
};

export const convertWordDocumentToHtml = async (filePath, originalName) => {
  const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "iicpa-word-"));
  const importId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const outputHtmlPath = path.join(tempDir, "converted.html");
  let convertedHtmlPath = null;

  try {
    const conversionAttempts = [
      {
        command: "textutil",
        args: ["-convert", "html", "-output", outputHtmlPath, filePath],
        outputHtmlPath,
      },
      {
        command: "libreoffice",
        args: ["--headless", "--convert-to", "html", "--outdir", tempDir, filePath],
        outputHtmlPath: null,
      },
      {
        command: "soffice",
        args: ["--headless", "--convert-to", "html", "--outdir", tempDir, filePath],
        outputHtmlPath: null,
      },
    ];

    let lastError = null;
    for (const attempt of conversionAttempts) {
      try {
        convertedHtmlPath = await runConversionCommand({
          command: attempt.command,
          args: attempt.args,
          outputHtmlPath: attempt.outputHtmlPath,
          tempDir,
        });

        if (convertedHtmlPath) {
          break;
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (!convertedHtmlPath) {
      if (lastError?.code === "ENOENT") {
        throw new Error(
          "Word import is unavailable because neither macOS textutil nor LibreOffice/soffice is installed on this server."
        );
      }

      throw new Error(
        lastError?.stderr?.toString?.().trim() ||
          lastError?.message ||
          "Failed to convert the Word document."
      );
    }

    const rawHtml = await fsp.readFile(convertedHtmlPath, "utf8");
    const resourceFiles = await collectResourceFiles(tempDir, convertedHtmlPath);
    const resourceMap = await copyResourceFiles(resourceFiles, tempDir, importId);

    let html = normalizeTextutilOutput(normalizeWhitespace(rawHtml));
    if (resourceMap.size > 0) {
      html = rewriteResourceUrls(html, resourceMap);
    }

    html = normalizeDefaultContentFont(html);

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
