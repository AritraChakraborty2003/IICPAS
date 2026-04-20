const DEFAULT_FONT_LIST = {
  '"Noto Sans", "Lucida Grande", sans-serif': "Noto Sans",
  "": "Default",
  "Arial, Helvetica, sans-serif": "Arial",
  "'Courier New', Courier, monospace": "Courier New",
  "Georgia, Palatino, serif": "Georgia",
  "Tahoma, Geneva, sans-serif": "Tahoma",
  "'Times New Roman', Times, serif": "Times New Roman",
  "'Trebuchet MS', Helvetica, sans-serif": "Trebuchet MS",
  "Helvetica, sans-serif": "Helvetica",
  "Impact, Charcoal, sans-serif": "Impact",
  "Verdana, Geneva, sans-serif": "Verdana",
};

const trimFontFamilyName = (value) => {
  const [first] = (value || "").split(",");
  return first.trim().replace(/^['"]|['"]$/g, "");
};

export const joditFontControl = {
  list: DEFAULT_FONT_LIST,
  textTemplate: (_editor, value) => {
    if (!value) return "Default";
    if (/noto\s+sans/i.test(value) || /lucida\s+grande/i.test(value)) {
      return "Noto Sans";
    }

    return trimFontFamilyName(value);
  },
  data: {
    cssRule: "font-family",
    normalize: (value) =>
      (value || "")
        .toLowerCase()
        .replace(/['"]+/g, "")
        .replace(/lucida\s+grande/g, "noto sans")
        .replace(/noto\s+sans/g, "noto sans")
        .replace(/[^a-z0-9-]+/g, ","),
  },
  childTemplate: (_editor, key, value) => {
    let isAvailable = false;

    try {
      isAvailable =
        key.indexOf("dings") === -1 &&
        typeof document !== "undefined" &&
        document.fonts?.check(`16px ${key}`, value);
    } catch (_error) {
      isAvailable = false;
    }

    return `<span data-style="${key}" style="${
      isAvailable ? `font-family: ${key}!important;` : ""
    }">${value}</span>`;
  },
};
