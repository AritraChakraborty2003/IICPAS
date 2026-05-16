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
