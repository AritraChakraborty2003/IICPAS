const toIdString = (value, seen = new Set()) => {
  if (!value) return "";

  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  if (typeof value !== "object") {
    return "";
  }

  if (seen.has(value)) {
    return "";
  }
  seen.add(value);

  if (typeof value.toHexString === "function") {
    const hexString = value.toHexString();
    if (hexString) {
      return hexString;
    }
  }

  if (typeof value.toString === "function") {
    const stringValue = value.toString();
    if (stringValue && stringValue !== "[object Object]") {
      return stringValue;
    }
  }

  const candidates = [value.courseId, value._id, value.id];
  for (const candidate of candidates) {
    if (candidate == null || seen.has(candidate)) continue;
    const normalized = toIdString(candidate, seen);
    if (normalized) {
      return normalized;
    }
  }

  return "";
};

const toValidDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addOneYear = (value) => {
  const date = toValidDate(value);
  if (!date) return null;

  const nextYear = new Date(date);
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  return nextYear;
};

const pickEarliestDate = (values = []) =>
  values
    .map(toValidDate)
    .filter(Boolean)
    .sort((left, right) => left.getTime() - right.getTime())[0] || null;

const normalizeBatchCourseLocks = (batch) => {
  const rawLocks = Array.isArray(batch?.courseLocks) ? batch.courseLocks : [];
  const normalized = new Map();

  rawLocks.forEach((entry) => {
    const courseId = toIdString(entry?.courseId || entry?.course || entry?._id);
    if (!courseId) return;

    const start_time = toValidDate(entry?.start_time ?? entry?.startTime ?? entry?.start);
    const end_time = toValidDate(entry?.end_time ?? entry?.endTime ?? entry?.end);

    if (!end_time) return;

    normalized.set(courseId, {
      courseId,
      start_time,
      end_time,
      chapters: Array.isArray(entry?.chapters) ? entry.chapters : [],
    });
  });

  return normalized;
};

export const getBatchAccessState = (batchLock) => {
  const start_time = batchLock?.start_time || null;
  const end_time = batchLock?.end_time || null;
  const hasWindow = Boolean(start_time && end_time);

  if (!hasWindow) {
    return {
      batchWindowActive: false,
      batchPreviewOnly: false,
      batchAccessState: "none",
    };
  }

  const now = Date.now();
  const isWindowActive =
    start_time.getTime() <= now && now <= end_time.getTime();
  const phase = isWindowActive ? "active" : now < start_time.getTime() ? "preview" : "expired";

  return {
    batchWindowActive: isWindowActive,
    batchPreviewOnly: phase === "preview",
    batchAccessState: phase,
  };
};

export const getStudentCourseBatchAccessState = (student, courseId) => {
  const normalizedCourseId = toIdString(courseId);
  if (!student || !normalizedCourseId) {
    return getBatchAccessState(null);
  }

  const batchLockIndex = normalizeBatchCourseLocks(student?.batchId);
  return getBatchAccessState(batchLockIndex.get(normalizedCourseId));
};

const normalizeLockedValue = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "locked";
  }
  return false;
};

const getBookingPurchaseDate = (booking) => {
  if (!booking || booking.itemType !== "single_course" || !booking.courseId) {
    return null;
  }

  const paymentDates = Array.isArray(booking.payments)
    ? booking.payments.map((payment) => payment?.paidAt)
    : [];

  return pickEarliestDate([
    booking.paymentVerifiedAt,
    ...paymentDates,
    booking.updatedAt,
    booking.createdAt,
  ]);
};

const getTransactionPurchaseDate = (transaction) => {
  if (!transaction || !transaction.courseId) return null;

  return pickEarliestDate([
    transaction.verifiedAt,
    transaction.updatedAt,
    transaction.createdAt,
  ]);
};

const buildPurchaseIndex = ({ bookings = [], transactions = [] }) => {
  const purchaseIndex = new Map();

  const registerPurchase = (courseId, sourceDate) => {
    const normalizedCourseId = toIdString(courseId);
    const purchaseDate = toValidDate(sourceDate);
    if (!normalizedCourseId || !purchaseDate) return;

    const existing = purchaseIndex.get(normalizedCourseId);
    if (!existing || purchaseDate.getTime() < existing.getTime()) {
      purchaseIndex.set(normalizedCourseId, purchaseDate);
    }
  };

  (Array.isArray(bookings) ? bookings : []).forEach((booking) => {
    registerPurchase(booking?.courseId, getBookingPurchaseDate(booking));
  });

  (Array.isArray(transactions) ? transactions : []).forEach((transaction) => {
    if (String(transaction?.status || "").toLowerCase() !== "approved") return;
    registerPurchase(transaction?.courseId, getTransactionPurchaseDate(transaction));
  });

  return purchaseIndex;
};

const buildSessionTypeIndex = (transactions = []) => {
  const sessionTypeIndex = new Map();

  (Array.isArray(transactions) ? transactions : []).forEach((transaction) => {
    if (String(transaction?.status || "").toLowerCase() !== "approved") return;
    const courseId = toIdString(transaction?.courseId);
    if (!courseId || !transaction?.sessionType) return;

    const existing = sessionTypeIndex.get(courseId);
    if (existing === "live") return;
    sessionTypeIndex.set(courseId, transaction.sessionType);
  });

  return sessionTypeIndex;
};

const buildOverrideIndex = (student) => {
  const overrides = Array.isArray(student?.courseAccessOverrides)
    ? student.courseAccessOverrides
    : [];

  return overrides.reduce((acc, entry) => {
    const courseId = toIdString(entry?.courseId);
    if (!courseId) return acc;

    const purchasedAt = toValidDate(entry?.purchasedAt);
    const expiresAt = toValidDate(entry?.expiresAt);

    acc.set(courseId, {
      courseId,
      isLocked: normalizeLockedValue(
        entry?.isLocked ?? entry?.locked ?? entry?.is_locked ?? false
      ),
      purchasedAt,
      expiresAt,
      updatedAt: toValidDate(entry?.updatedAt),
    });
    return acc;
  }, new Map());
};

const dedupeCourseAccessOverrides = (overrides = []) => {
  const normalized = new Map();

  (Array.isArray(overrides) ? overrides : []).forEach((override) => {
    const courseId = toIdString(override?.courseId);
    if (!courseId) return;

    normalized.set(courseId, {
      ...override,
      courseId,
      isLocked: normalizeLockedValue(
        override?.isLocked ?? override?.locked ?? override?.is_locked ?? false
      ),
      purchasedAt: toValidDate(override?.purchasedAt),
      expiresAt: toValidDate(override?.expiresAt),
      updatedAt: toValidDate(override?.updatedAt),
    });
  });

  return Array.from(normalized.values());
};

export const normalizeCourseAccessOverride = (override, fallbackCourseId = null) => {
  if (!override && !fallbackCourseId) return null;

  const source = override || {};
  const courseId = toIdString(source?.courseId || fallbackCourseId);

  return {
    ...source,
    courseId,
    isLocked: normalizeLockedValue(
      source?.isLocked ?? source?.locked ?? source?.is_locked ?? false
    ),
    purchasedAt: toValidDate(source?.purchasedAt),
    expiresAt: toValidDate(source?.expiresAt),
    updatedAt: toValidDate(source?.updatedAt),
  };
};

export const normalizeCourseAccessOverrides = (student) =>
  dedupeCourseAccessOverrides(
    (Array.isArray(student?.courseAccessOverrides)
      ? student.courseAccessOverrides
      : []
    )
      .map((override) => normalizeCourseAccessOverride(override))
      .filter(Boolean)
  );

export const buildCourseAccessEntries = ({
  student,
  courses = [],
  bookings = [],
  transactions = [],
}) => {
  const purchaseIndex = buildPurchaseIndex({ bookings, transactions });
  const sessionTypeIndex = buildSessionTypeIndex(transactions);
  const overrideIndex = buildOverrideIndex(student);
  const batchLockIndex = normalizeBatchCourseLocks(student?.batchId);
  const fallbackDate = toValidDate(student?.createdAt) || new Date();

  return (Array.isArray(courses) ? courses : []).map((course) => {
    try {
      const baseCourse =
        course && typeof course.toObject === "function" ? course.toObject() : course || {};
      const courseId =
        toIdString(course?.courseId || course?._id || course?.id || course) ||
        toIdString(baseCourse?.courseId || baseCourse?._id || baseCourse?.id || baseCourse);
      const purchaseAt =
        purchaseIndex.get(courseId) ||
        toValidDate(baseCourse?.purchasedAt) ||
        fallbackDate;
      const expiresAt = toValidDate(baseCourse?.expiresAt) || addOneYear(purchaseAt);
      const override = overrideIndex.get(courseId);
      const batchLock = batchLockIndex.get(courseId);
      const batchAccessState = getBatchAccessState(batchLock);
      const isLocked = Boolean(override?.isLocked);
      const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;
      const isBatchExpired = batchAccessState.batchAccessState === "expired";
      const sessionType = sessionTypeIndex.get(courseId) || null;

      return {
        ...baseCourse,
        courseId:
          courseId ||
          toIdString(course?.courseId) ||
          toIdString(course?._id) ||
          toIdString(baseCourse?.courseId) ||
          toIdString(baseCourse?._id) ||
          null,
        purchasedAt: purchaseAt ? purchaseAt.toISOString() : null,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        isLocked,
        batchLockActive: batchAccessState.batchWindowActive,
        batchWindowActive: batchAccessState.batchWindowActive,
        batchPreviewOnly: batchAccessState.batchPreviewOnly,
        batchAccessState: batchAccessState.batchAccessState,
        batchLockStartsAt: batchLock?.start_time ? batchLock.start_time.toISOString() : null,
        batchLockEndsAt: batchLock?.end_time ? batchLock.end_time.toISOString() : null,
        batchChapters: batchLock?.chapters || [],
        isExpired,
        sessionType,
        status: isLocked || isExpired || isBatchExpired ? "Inactive" : "Active",
      };
    } catch (error) {
      const fallbackCourse =
        course && typeof course.toObject === "function" ? course.toObject() : course || {};
      const safeCourseId =
        toIdString(fallbackCourse?.courseId || fallbackCourse?._id || fallbackCourse?.id || fallbackCourse) ||
        toIdString(course?.courseId || course?._id || course?.id || course) ||
        null;

      console.error("Failed to build course access entry", {
        studentId: student?._id ? String(student._id) : null,
        courseId: safeCourseId,
        error: error?.message || error,
      });

      return {
        ...fallbackCourse,
        courseId: safeCourseId,
        purchasedAt: toValidDate(fallbackCourse?.purchasedAt)?.toISOString() || null,
        expiresAt: toValidDate(fallbackCourse?.expiresAt)?.toISOString() || null,
        isLocked: Boolean(fallbackCourse?.isLocked),
        isExpired: Boolean(fallbackCourse?.isExpired),
        status:
          Boolean(fallbackCourse?.isLocked) || Boolean(fallbackCourse?.isExpired)
            ? "Inactive"
            : "Active",
      };
    }
  });
};

export const upsertCourseAccessOverride = async ({
  student,
  courseId,
  isLocked,
  purchasedAt = null,
  expiresAt = null,
}) => {
  const normalizedCourseId = toIdString(courseId);
  if (!student || !normalizedCourseId) {
    return null;
  }

  const overrides = Array.isArray(student.courseAccessOverrides)
    ? student.courseAccessOverrides.map((override) =>
        override?.toObject ? override.toObject() : { ...override }
      )
    : [];
  const nextEntry = {
    courseId: normalizedCourseId,
    isLocked: Boolean(isLocked),
    purchasedAt: purchasedAt ? new Date(purchasedAt) : null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    updatedAt: new Date(),
  };

  const currentEntry = overrides.find(
    (item) => toIdString(item?.courseId) === normalizedCourseId
  );
  const nextOverrides = overrides.filter(
    (item) => toIdString(item?.courseId) !== normalizedCourseId
  );

  nextOverrides.push({
    ...(currentEntry || {}),
    ...nextEntry,
    purchasedAt: purchasedAt
      ? new Date(purchasedAt)
      : currentEntry?.purchasedAt ?? null,
    expiresAt: expiresAt
      ? new Date(expiresAt)
      : currentEntry?.expiresAt ?? null,
  });

  student.set?.("courseAccessOverrides", nextOverrides);
  student.markModified?.("courseAccessOverrides");
  await student.save();
  return nextOverrides[nextOverrides.length - 1];
};
