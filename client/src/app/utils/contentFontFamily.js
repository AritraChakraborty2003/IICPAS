export const DEFAULT_CONTENT_FONT_FAMILY =
  '"Roboto", sans-serif';

export const DEFAULT_CONTENT_FONT_CLASS = "default-content-font";

const DEFAULT_CONTENT_TEXT_COLORS = new Set([
  "#0000ff",
  "#007bff",
  "#1255cc",
  "#1d4ed8",
  "#2563eb",
  "#3b82f6",
  "#0000ee",
  "blue",
  "rgb(0,0,255)",
  "rgb(29,78,216)",
  "rgb(37,99,235)",
  "rgb(59,130,246)",
]);

const STYLE_ATTRIBUTE_REGEX = /\sstyle=(["'])([\s\S]*?)\1/gi;

const normalizeCssValue = (value = "") =>
  String(value)
    .replace(/!important/gi, "")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const isDefaultContentColor = (value = "") => {
  return DEFAULT_CONTENT_TEXT_COLORS.has(normalizeCssValue(value));
};

const normalizeStyleValue = (styleValue, fontFamily) => {
  const declarations = String(styleValue || "")
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const normalizedDeclarations = [];

  declarations.forEach((declaration) => {
    const colonIndex = declaration.indexOf(":");
    if (colonIndex === -1) {
      return;
    }

    const property = declaration.slice(0, colonIndex).trim().toLowerCase();
    const value = declaration.slice(colonIndex + 1).trim();

    if (!property || !value) {
      return;
    }

    if (property === "font-family") {
      return;
    }

    if (property === "color" && isDefaultContentColor(value)) {
      return;
    }

    normalizedDeclarations.push(`${property}: ${value}`);
  });

  return normalizedDeclarations.length
    ? `${normalizedDeclarations.join("; ")}; font-family: ${fontFamily}`
    : `font-family: ${fontFamily}`;
};

export const normalizeDefaultContentStyles = (
  html,
  fontFamily = DEFAULT_CONTENT_FONT_FAMILY
) => {
  if (!html) return html;

  const cleanedHtml = html.replace(
    STYLE_ATTRIBUTE_REGEX,
    (_match, quote, styleValue) =>
      ` style=${quote}${normalizeStyleValue(styleValue, fontFamily)}${quote}`
  );

  if (/data-default-content-font=["']true["']/i.test(cleanedHtml)) {
    return cleanedHtml;
  }

  return `<div class="${DEFAULT_CONTENT_FONT_CLASS}" data-default-content-font="true" style="font-family: ${fontFamily};">${cleanedHtml}</div>`;
};

export const normalizeDefaultContentFont = (
  html,
  fontFamily = DEFAULT_CONTENT_FONT_FAMILY
) => normalizeDefaultContentStyles(html, fontFamily);

export const normalizeDigitalHubContentHtml = (
  html,
  fontFamily = DEFAULT_CONTENT_FONT_FAMILY
) => normalizeDefaultContentStyles(html, fontFamily);
