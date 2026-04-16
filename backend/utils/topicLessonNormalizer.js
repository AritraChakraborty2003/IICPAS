const normalizeDateValue = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : String(value || "").trim();

const normalizeStatus = (value) => {
  const normalized = normalizeString(value).toLowerCase();
  return normalized === "inactive" ? "inactive" : "active";
};

const normalizeSourceType = (value, kind) => {
  const normalized = normalizeString(value).toLowerCase();
  if (normalized) {
    if (["upload", "link", "livesession", "legacy"].includes(normalized)) {
      return normalized === "livesession" ? "liveSession" : normalized;
    }
  }

  if (kind === "live") return "liveSession";
  return "link";
};

export const normalizeTopicLessons = (lessons) => {
  if (lessons === undefined) return undefined;
  if (!Array.isArray(lessons)) {
    throw new Error("Lessons must be an array.");
  }

  return lessons
    .map((lesson, index) => {
      if (!lesson || typeof lesson !== "object") {
        throw new Error(`Lesson at position ${index + 1} is invalid.`);
      }

      const kind = normalizeString(lesson.kind).toLowerCase();
      if (!["recorded", "live"].includes(kind)) {
        throw new Error(`Lesson at position ${index + 1} must be recorded or live.`);
      }

      const title = normalizeString(lesson.title);
      if (!title) {
        throw new Error(`Lesson at position ${index + 1} requires a title.`);
      }

      const sourceType = normalizeSourceType(lesson.sourceType, kind);
      const sourceUrl = normalizeString(lesson.sourceUrl || lesson.link || lesson.url);
      const liveSessionId =
        typeof lesson.liveSessionId === "object" && lesson.liveSessionId?._id
          ? lesson.liveSessionId._id
          : normalizeString(lesson.liveSessionId);
      const publishAt = normalizeDateValue(lesson.publishAt) || new Date();

      if (kind === "recorded" && !sourceUrl) {
        throw new Error(
          `Recorded lesson "${title}" requires a video URL or uploaded file link.`
        );
      }

      if (kind === "live" && !sourceUrl && !liveSessionId) {
        throw new Error(
          `Live lesson "${title}" requires a live session reference or live URL.`
        );
      }

      return {
        kind,
        title,
        order: Number.isFinite(Number(lesson.order)) ? Number(lesson.order) : index + 1,
        status: normalizeStatus(lesson.status),
        publishAt,
        sourceType,
        sourceUrl,
        liveSessionId: liveSessionId || null,
      };
    })
    .sort((left, right) => {
      const leftOrder = Number(left.order || 0);
      const rightOrder = Number(right.order || 0);
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return String(left.title || "").localeCompare(String(right.title || ""));
    });
};
