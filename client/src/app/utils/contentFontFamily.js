export const DEFAULT_CONTENT_FONT_FAMILY =
  '"Lucida Sans Unicode", "Lucida Grande", sans-serif';

export const DEFAULT_CONTENT_FONT_CLASS = "default-content-font";

const STYLE_ATTRIBUTE_REGEX = /\sstyle=(["'])([\s\S]*?)\1/gi;
const FONT_FAMILY_REGEX = /(?:^|;)\s*font-family\s*:\s*[^;]+/gi;

const normalizeStyleValue = (styleValue, fontFamily) => {
  const cleanedStyle = (styleValue || "")
    .replace(FONT_FAMILY_REGEX, "")
    .replace(/;;+/g, ";")
    .replace(/^\s*;\s*|\s*;\s*$/g, "")
    .trim();

  return cleanedStyle
    ? `${cleanedStyle}; font-family: ${fontFamily}`
    : `font-family: ${fontFamily}`;
};

export const normalizeDefaultContentFont = (
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
