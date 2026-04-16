const isValidDate = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const formatTopicLessonDateTime = (value) => {
  if (!isValidDate(value)) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const getTopicLessonSourceUrl = (lesson) => {
  if (!lesson) return "";

  if (lesson.liveSessionId && typeof lesson.liveSessionId === "object") {
    return lesson.liveSessionId.link || lesson.sourceUrl || "";
  }

  return lesson.sourceUrl || "";
};

export const getTopicLessonSourceLabel = (lesson) => {
  if (!lesson) return "Source unavailable";

  if (lesson.isLegacyIntro) return "Legacy intro video";

  if (lesson.kind === "live") {
    if (lesson.sourceType === "liveSession") return "Live session";
    if (lesson.sourceUrl) return "Live link";
    return "Live lesson";
  }

  if (lesson.sourceType === "upload") return "Uploaded video";
  if (lesson.sourceType === "legacy") return "Legacy intro video";
  if (lesson.sourceUrl) return "Video link";

  return "Recorded lesson";
};

export const isTopicLessonVisible = (lesson, now = new Date()) => {
  if (!lesson) return false;

  const status = String(lesson.status || "active").toLowerCase();
  if (status !== "active") return false;

  if (!lesson.publishAt) return true;

  const publishDate = new Date(lesson.publishAt);
  if (Number.isNaN(publishDate.getTime())) return true;

  return publishDate.getTime() <= now.getTime();
};

export const buildTopicLessonRows = (
  topics = [],
  kind = "recorded",
  options = {}
) => {
  const includeLegacyIntro = options?.includeLegacyIntro !== false;
  const rows = [];

  (Array.isArray(topics) ? topics : []).forEach((topic, topicIndex) => {
    const topicId = topic?._id || "";
    const topicTitle = topic?.title || "Untitled topic";
    const topicLessons = Array.isArray(topic?.lessons) ? topic.lessons : [];

    if (
      kind === "recorded" &&
      includeLegacyIntro &&
      typeof topic?.introVideo === "string"
    ) {
      const legacyIntroVideo = topic.introVideo.trim();
      if (legacyIntroVideo) {
        rows.push({
          id: `legacy-intro-${topicId}`,
          lessonId: `legacy-intro-${topicId}`,
          topicId,
          topicTitle,
          topicIndex,
          kind: "recorded",
          title: "Intro Video",
          order: 0,
          status: "active",
          publishAt: topic.publishAt || topic.updatedAt || topic.createdAt || null,
          sourceType: "legacy",
          sourceUrl: legacyIntroVideo,
          liveSessionId: null,
          isLegacyIntro: true,
          originalLesson: null,
        });
      }
    }

    topicLessons
      .filter((lesson) => lesson?.kind === kind)
      .forEach((lesson, index) => {
        rows.push({
          id: lesson?._id || `${topicId}-${kind}-${index}`,
          lessonId: lesson?._id || "",
          topicId,
          topicTitle,
          topicIndex,
          kind: lesson?.kind || kind,
          title: lesson?.title || (kind === "live" ? "Live class" : "Recorded class"),
          order: Number.isFinite(Number(lesson?.order))
            ? Number(lesson.order)
            : index + 1,
          status: String(lesson?.status || "active").toLowerCase(),
          publishAt: lesson?.publishAt || null,
          sourceType: lesson?.sourceType || (kind === "live" ? "liveSession" : "link"),
          sourceUrl: getTopicLessonSourceUrl(lesson),
          liveSessionId: lesson?.liveSessionId || null,
          isLegacyIntro: false,
          originalLesson: lesson,
        });
      });
  });

  return rows.sort((left, right) => {
    const leftTopicIndex = Number(left.topicIndex || 0);
    const rightTopicIndex = Number(right.topicIndex || 0);
    if (leftTopicIndex !== rightTopicIndex) return leftTopicIndex - rightTopicIndex;

    const leftOrder = Number(left.order || 0);
    const rightOrder = Number(right.order || 0);
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;

    return String(left.title || "").localeCompare(String(right.title || ""));
  });
};
