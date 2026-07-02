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

// On the start day itself, the exact start time still gates access. Once a
// later calendar day (UTC) arrives, the time-of-day no longer matters and
// the content is unlocked regardless of the hour/minute an admin picked.
const hasStartDatePassed = (startsAt) => {
  if (!startsAt || Number.isNaN(startsAt.getTime())) return true;
  const now = new Date();
  const startDateOnly = Date.UTC(startsAt.getUTCFullYear(), startsAt.getUTCMonth(), startsAt.getUTCDate());
  const nowDateOnly = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  if (nowDateOnly > startDateOnly) return true;
  if (nowDateOnly < startDateOnly) return false;
  return now.getTime() >= startsAt.getTime();
};

// Chapter/topic drip windows unlock once their start date passes and never
// re-lock once opened — the end time is a scheduling hint, not an expiry.
const resolveDripLockState = (startsAt, endsAt) => {
  if (!startsAt) {
    return { phase: "active", isLocked: false };
  }

  const phase = hasStartDatePassed(startsAt) ? "active" : "preview";
  return { phase, isLocked: phase === "preview" };
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
  const { phase, isLocked } = resolveDripLockState(startsAt, endsAt);

  return {
    hasBatchWindow: true,
    phase,
    isLocked,
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
  const { phase, isLocked } = resolveDripLockState(startsAt, endsAt);

  return {
    hasBatchWindow: true,
    phase,
    isLocked,
    startsAt,
    endsAt,
  };
};
