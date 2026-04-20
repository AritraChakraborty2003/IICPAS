const DEFAULT_FONT_LIST = {
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

const LUCIDA_FONT_PATTERN = /lucida\s+sans/i;

const trimFontFamilyName = (value) => {
  const [first] = (value || "").split(",");
  return first.trim().replace(/^['"]|['"]$/g, "");
};

export const joditFontControl = {
  list: DEFAULT_FONT_LIST,
  textTemplate: (_editor, value) => {
    if (!value || LUCIDA_FONT_PATTERN.test(value)) {
      return "Default";
    }

    return trimFontFamilyName(value);
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
