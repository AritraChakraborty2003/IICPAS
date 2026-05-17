export const parseDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const resolveBatchPhaseFromDates = (startsAt, endsAt) => {
  if (!startsAt || !endsAt) return null;

  const now = Date.now();
  const startTime = startsAt.getTime();
  const endTime = endsAt.getTime();

  if (now < startTime) {
    return "preview";
  }

  if (now > endTime) {
    return "expired";
  }

  return "active";
};

export const getBatchWindowState = (courseAccess) => {
  const batchLockStartsAt = parseDateOrNull(
    courseAccess?.batchLockStartsAt || null
  );
  const batchLockEndsAt = parseDateOrNull(
    courseAccess?.batchLockEndsAt || null
  );
  const accessState = String(courseAccess?.batchAccessState || "").toLowerCase();
  const phaseFromDates = resolveBatchPhaseFromDates(
    batchLockStartsAt,
    batchLockEndsAt
  );

  let phase = phaseFromDates;

  if (!phase) {
    if (accessState === "active") {
      phase = "active";
    } else if (accessState === "preview") {
      phase = "preview";
    } else if (accessState === "expired") {
      phase = "expired";
    } else if (typeof courseAccess?.batchWindowActive === "boolean") {
      phase = courseAccess.batchWindowActive ? "active" : "preview";
    } else if (typeof courseAccess?.batchPreviewOnly === "boolean") {
      phase = courseAccess.batchPreviewOnly ? "preview" : "active";
    } else if (batchLockStartsAt && batchLockEndsAt) {
      phase = "active";
    } else {
      phase = "active";
    }
  }

  return {
    hasBatchWindow: Boolean(batchLockStartsAt && batchLockEndsAt),
    phase,
    isBatchPreviewOnly: phase === "preview",
    isBatchWindowActive: phase === "active",
    isBatchPostEndLocked: phase === "expired",
    batchLockStartsAt,
    batchLockEndsAt,
  };
};

export const getBatchChapterState = (courseAccess, chapterId) => {
  const batchChapters = courseAccess?.batchChapters || [];
  const chapterLock = batchChapters.find(
    (c) => String(c.chapterId) === String(chapterId)
  );

  if (!chapterLock || (!chapterLock.start_time && !chapterLock.end_time)) {
    return { hasBatchWindow: false, phase: "active", isLocked: false };
  }

  const startsAt = parseDateOrNull(chapterLock.start_time);
  const endsAt = parseDateOrNull(chapterLock.end_time);
  const phase = resolveBatchPhaseFromDates(startsAt, endsAt);

  return {
    hasBatchWindow: true,
    phase,
    isLocked: phase !== "active",
    startsAt,
    endsAt,
  };
};

export const getBatchTopicState = (courseAccess, chapterId, topicId) => {
  const batchChapters = courseAccess?.batchChapters || [];
  const chapterLock = batchChapters.find(
    (c) => String(c.chapterId) === String(chapterId)
  );

  if (!chapterLock) {
    return { hasBatchWindow: false, phase: "active", isLocked: false };
  }

  const topics = chapterLock.topics || [];
  const topicLock = topics.find((t) => String(t.topicId) === String(topicId));

  if (!topicLock || (!topicLock.start_time && !topicLock.end_time)) {
    return { hasBatchWindow: false, phase: "active", isLocked: false };
  }

  const startsAt = parseDateOrNull(topicLock.start_time);
  const endsAt = parseDateOrNull(topicLock.end_time);
  const phase = resolveBatchPhaseFromDates(startsAt, endsAt);

  return {
    hasBatchWindow: true,
    phase,
    isLocked: phase !== "active",
    startsAt,
    endsAt,
  };
};
