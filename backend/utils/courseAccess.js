const toIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value._id === "string") {
    return value._id;
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
      isLocked: Boolean(entry?.isLocked),
      purchasedAt,
      expiresAt,
      updatedAt: toValidDate(entry?.updatedAt),
    });
    return acc;
  }, new Map());
};

export const buildCourseAccessEntries = ({
  student,
  courses = [],
  bookings = [],
  transactions = [],
}) => {
  const purchaseIndex = buildPurchaseIndex({ bookings, transactions });
  const overrideIndex = buildOverrideIndex(student);
  const fallbackDate = toValidDate(student?.createdAt) || new Date();

  return (Array.isArray(courses) ? courses : []).map((course) => {
    const baseCourse =
      course && typeof course.toObject === "function" ? course.toObject() : course || {};
    const courseId = toIdString(course?._id || course?.courseId);
    const purchaseAt =
      purchaseIndex.get(courseId) ||
      toValidDate(baseCourse?.purchasedAt) ||
      fallbackDate;
    const expiresAt = toValidDate(baseCourse?.expiresAt) || addOneYear(purchaseAt);
    const override = overrideIndex.get(courseId);
    const isLocked = Boolean(override?.isLocked);
    const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;

    return {
      ...baseCourse,
      courseId: courseId || course?._id || null,
      purchasedAt: purchaseAt ? purchaseAt.toISOString() : null,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      isLocked,
      isExpired,
      status: isLocked || isExpired ? "Inactive" : "Active",
    };
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

  if (!Array.isArray(student.courseAccessOverrides)) {
    student.courseAccessOverrides = [];
  }

  let entry = student.courseAccessOverrides.find(
    (item) => toIdString(item?.courseId) === normalizedCourseId
  );

  if (!entry) {
    entry = {
      courseId: normalizedCourseId,
      isLocked: Boolean(isLocked),
      purchasedAt: purchasedAt ? new Date(purchasedAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      updatedAt: new Date(),
    };
    student.courseAccessOverrides.push(entry);
  } else {
    entry.isLocked = Boolean(isLocked);
    if (purchasedAt) {
      entry.purchasedAt = new Date(purchasedAt);
    }
    if (expiresAt) {
      entry.expiresAt = new Date(expiresAt);
    }
    entry.updatedAt = new Date();
  }

  student.markModified?.("courseAccessOverrides");
  await student.save();
  return entry;
};
