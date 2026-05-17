import mongoose from "mongoose";
import Course from "../models/Content/Course.js";
import Assignment from "../models/Assignment.js";
import DigitalHubChapterProgress from "../models/DigitalHubChapterProgress.js";
import Student from "../models/Students.js";
import { getStudentCourseBatchAccessState } from "../utils/courseAccess.js";

const toIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;

  if (typeof value === "object" && value !== null) {
    if (typeof value.toString === "function") {
      const asString = value.toString();
      if (asString && asString !== "[object Object]") {
        return asString;
      }
    }

    if ("_id" in value) {
      const maybeId = value._id;
      if (maybeId && maybeId === value) {
        return "";
      }
      return toIdString(maybeId);
    }
  }

  return String(value);
};

const toObjectId = (value) => {
  if (value instanceof mongoose.Types.ObjectId) return value;
  const normalized = toIdString(value);
  if (!normalized) return new mongoose.Types.ObjectId();
  return new mongoose.Types.ObjectId(normalized);
};

const sanitizeCompletionIds = (completedIds, allowedIds) => {
  const allowed = new Set((allowedIds || []).map(toIdString));
  const uniqueIds = new Set();

  for (const value of completedIds || []) {
    const id = toIdString(value);
    if (id && allowed.has(id)) {
      uniqueIds.add(id);
    }
  }

  return Array.from(uniqueIds);
};

const sortByOrder = (left, right) => {
  const leftOrder = Number(left?.order || 0);
  const rightOrder = Number(right?.order || 0);
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return String(left?.title || "").localeCompare(String(right?.title || ""));
};

const buildCompletionPercent = ({
  completedTopicCount,
  totalTopicCount,
  completedAssignmentCount,
  totalAssignmentCount,
  completedQuestionSetCount,
  totalQuestionSetCount,
}) => {
  const totalRequiredCount =
    totalTopicCount + totalAssignmentCount + totalQuestionSetCount;

  if (totalRequiredCount === 0) {
    return 100;
  }

  const completedRequiredCount =
    completedTopicCount +
    completedAssignmentCount +
    completedQuestionSetCount;

  return Math.round((completedRequiredCount / totalRequiredCount) * 100);
};

const loadCourseStructure = async (courseId) => {
  const course = await Course.findById(courseId)
    .populate({
      path: "chapters",
      populate: {
        path: "topics",
        model: "Topic",
      },
    })
    .lean();

  if (!course) {
    return null;
  }

  const chapters = Array.isArray(course.chapters)
    ? [...course.chapters].sort(sortByOrder)
    : [];

  const chapterIds = chapters.map((chapter) => chapter._id);
  const assignments = chapterIds.length
    ? await Assignment.find({
        chapterId: { $in: chapterIds },
        isActive: true,
      })
        .select("_id title order chapterId questionSets._id")
        .lean()
    : [];

  const assignmentsByChapter = assignments.reduce((acc, assignment) => {
    const key = toIdString(assignment.chapterId);
    if (!acc.has(key)) {
      acc.set(key, []);
    }
    acc.get(key).push(assignment);
    return acc;
  }, new Map());

  for (const groupedAssignments of assignmentsByChapter.values()) {
    groupedAssignments.sort(sortByOrder);
  }

  return {
    course,
    chapters,
    assignmentsByChapter,
  };
};

const buildChapterSummary = ({
  chapter,
  assignments,
  progressRecord,
  unlocked,
}) => {
  const topicIds = Array.isArray(chapter.topics)
    ? chapter.topics.map((topic) => topic?._id).filter(Boolean)
    : [];
  const assignmentIds = assignments.map((assignment) => assignment._id).filter(Boolean);
  const questionSetIds = assignments.flatMap((assignment) =>
    Array.isArray(assignment.questionSets)
      ? assignment.questionSets.map((questionSet) => questionSet?._id).filter(Boolean)
      : []
  );

  const completedTopicIds = sanitizeCompletionIds(
    progressRecord?.topicCompletion,
    topicIds
  );
  const completedAssignmentIds = sanitizeCompletionIds(
    progressRecord?.assignmentCompletion,
    assignmentIds
  );
  const completedQuestionSetIds = sanitizeCompletionIds(
    progressRecord?.questionSetCompletion,
    questionSetIds
  );

  const totalTopicCount = topicIds.length;
  const totalAssignmentCount = assignmentIds.length;
  const totalQuestionSetCount = questionSetIds.length;
  const completedTopicCount = completedTopicIds.length;
  const completedAssignmentCount = completedAssignmentIds.length;
  const completedQuestionSetCount = completedQuestionSetIds.length;

  const chapterCompleted =
    completedTopicCount >= totalTopicCount &&
    completedAssignmentCount >= totalAssignmentCount &&
    completedQuestionSetCount >= totalQuestionSetCount;

  return {
    chapterId: toIdString(chapter._id),
    isLocked: !unlocked,
    unlocked,
    isCompleted: chapterCompleted,
    chapterCompleted,
    totalTopicCount,
    completedTopicCount,
    totalAssignmentCount,
    completedAssignmentCount,
    totalQuestionSetCount,
    completedQuestionSetCount,
    completedTopicIds,
    completedAssignmentIds,
    completedQuestionSetIds,
    completionPercent: buildCompletionPercent({
      completedTopicCount,
      totalTopicCount,
      completedAssignmentCount,
      totalAssignmentCount,
      completedQuestionSetCount,
      totalQuestionSetCount,
    }),
  };
};

const getChapterUnlockedForBatchPhase = ({
  batchPhase,
  chapterIndex,
  forceUnlockAll,
}) => {
  if (forceUnlockAll) {
    return true;
  }

  if (batchPhase === "expired") {
    return false;
  }

  if (batchPhase === "preview") {
    return chapterIndex === 0;
  }

  return true;
};

export const getDigitalHubCourseProgress = async (studentId, courseId) => {
  const structure = await loadCourseStructure(courseId);
  if (!structure) {
    return null;
  }

  const { chapters, assignmentsByChapter } = structure;
  const student = await Student.findById(studentId)
    .populate("batchId", "courseLocks")
    .select("digitalHubAccessOverride batchId")
    .lean();
  const forceUnlockAll = Boolean(student?.digitalHubAccessOverride);
  const batchAccessState = getStudentCourseBatchAccessState(student, courseId);
  const batchPhase = batchAccessState.batchAccessState || "none";
  const chapterIds = chapters.map((chapter) => chapter._id);
  const progressRecords = chapterIds.length
    ? await DigitalHubChapterProgress.find({
        studentId,
        courseId,
        chapterId: { $in: chapterIds },
      }).lean()
    : [];

  const progressByChapter = progressRecords.reduce((acc, record) => {
    acc.set(toIdString(record.chapterId), record);
    return acc;
  }, new Map());

  const rawLocks = Array.isArray(student?.batchId?.courseLocks) ? student.batchId.courseLocks : [];
  const courseLock = rawLocks.find(lock => {
    const lockCourseId = toIdString(lock.courseId || lock.course || lock._id);
    return lockCourseId === toIdString(courseId);
  });

  const chapterSummaries = chapters.map((chapter, index) => {
    const chapterId = toIdString(chapter._id);
    let unlocked = getChapterUnlockedForBatchPhase({
      batchPhase,
      chapterIndex: index,
      forceUnlockAll,
    });

    // Resolve the chapter-level batch lock entry (hoisted so it's accessible
    // for both chapter unlock logic and per-topic window computation below).
    let chapterLock = null;
    if (courseLock && Array.isArray(courseLock.chapters)) {
      chapterLock = courseLock.chapters.find(
        (c) => toIdString(c.chapterId || c._id) === chapterId
      ) || null;
    }

    if (!forceUnlockAll && chapterLock && (chapterLock.start_time || chapterLock.end_time)) {
      const cStartsAt = chapterLock.start_time ? new Date(chapterLock.start_time) : null;
      const cEndsAt = chapterLock.end_time ? new Date(chapterLock.end_time) : null;
      const now = Date.now();

      if (cStartsAt && cEndsAt && !isNaN(cStartsAt.getTime()) && !isNaN(cEndsAt.getTime())) {
        unlocked = now >= cStartsAt.getTime() && now <= cEndsAt.getTime();
      } else if (cStartsAt && !isNaN(cStartsAt.getTime())) {
        unlocked = now >= cStartsAt.getTime();
      } else if (cEndsAt && !isNaN(cEndsAt.getTime())) {
        unlocked = now <= cEndsAt.getTime();
      }
    }

    const rawTopics = Array.isArray(chapter.topics) ? chapter.topics : [];
    const chapterTopicBatchWindows = rawTopics.map((topic) => {
      const topicId = toIdString(topic._id);
      const topicLock = Array.isArray(chapterLock?.topics)
        ? chapterLock.topics.find((t) => toIdString(t.topicId || t._id) === topicId)
        : null;
      if (!topicLock || (!topicLock.start_time && !topicLock.end_time)) {
        return { topicId, hasBatchWindow: false, isLocked: false };
      }
      const tStart = topicLock.start_time ? new Date(topicLock.start_time) : null;
      const tEnd = topicLock.end_time ? new Date(topicLock.end_time) : null;
      const now = Date.now();
      let topicActive = true;
      if (tStart && tEnd) topicActive = now >= tStart.getTime() && now <= tEnd.getTime();
      else if (tStart) topicActive = now >= tStart.getTime();
      else if (tEnd) topicActive = now <= tEnd.getTime();
      return {
        topicId,
        hasBatchWindow: true,
        isLocked: !topicActive,
        startsAt: tStart ? tStart.toISOString() : null,
        endsAt: tEnd ? tEnd.toISOString() : null,
      };
    });

    const chapterSummary = buildChapterSummary({
      chapter,
      assignments: assignmentsByChapter.get(chapterId) || [],
      progressRecord: progressByChapter.get(chapterId),
      unlocked,
    });

    return forceUnlockAll
      ? {
          ...chapterSummary,
          topicBatchWindows: chapterTopicBatchWindows,
          isLocked: false,
          unlocked: true,
        }
      : { ...chapterSummary, topicBatchWindows: chapterTopicBatchWindows };
  });

  if (chapterSummaries.length > 0) {
    await DigitalHubChapterProgress.bulkWrite(
      chapterSummaries.map((summary) => ({
        updateOne: {
          filter: {
            studentId: toObjectId(studentId),
            courseId: toObjectId(courseId),
            chapterId: toObjectId(summary.chapterId),
          },
          update: {
            $setOnInsert: {
              studentId: toObjectId(studentId),
              courseId: toObjectId(courseId),
              chapterId: toObjectId(summary.chapterId),
            },
            $set: {
              topicCompletion: summary.completedTopicIds.map(toObjectId),
              assignmentCompletion: summary.completedAssignmentIds.map(toObjectId),
              questionSetCompletion: summary.completedQuestionSetIds.map(toObjectId),
              chapterCompleted: summary.chapterCompleted,
            },
          },
          upsert: true,
        },
      }))
    );
  }

  const overallProgress = chapterSummaries.length
    ? Math.round(
        chapterSummaries.reduce(
          (sum, chapter) => sum + Number(chapter.completionPercent || 0),
          0
        ) / chapterSummaries.length
      )
    : 0;

  let latestUnlockedChapterId = null;
  for (const chapter of chapterSummaries) {
    if (!chapter.isLocked) {
      latestUnlockedChapterId = chapter.chapterId;
    }
  }

  return {
    courseId: toIdString(courseId),
    overallProgress,
    latestUnlockedChapterId,
    digitalHubAccessOverride: forceUnlockAll,
    chapters: chapterSummaries,
  };
};

const validateCourseEntity = async ({
  courseId,
  chapterId,
  itemId,
  itemType,
}) => {
  const structure = await loadCourseStructure(courseId);
  if (!structure) {
    return { error: "Course not found", status: 404 };
  }

  const { chapters, assignmentsByChapter } = structure;
  const chapter = chapters.find((entry) => toIdString(entry._id) === toIdString(chapterId));
  if (!chapter) {
    return { error: "Chapter not found in course", status: 404 };
  }

  if (itemType === "topic") {
    const topicExists = (chapter.topics || []).some(
      (topic) => toIdString(topic?._id) === toIdString(itemId)
    );
    if (!topicExists) {
      return { error: "Topic not found in chapter", status: 404 };
    }
  }

  if (itemType === "assignment") {
    const assignmentExists = (assignmentsByChapter.get(toIdString(chapter._id)) || []).some(
      (assignment) => toIdString(assignment._id) === toIdString(itemId)
    );
    if (!assignmentExists) {
      return { error: "Assignment not found in chapter", status: 404 };
    }
  }

  if (itemType === "questionSet") {
    const questionSetExists = (
      assignmentsByChapter.get(toIdString(chapter._id)) || []
    ).some((assignment) =>
      (assignment.questionSets || []).some(
        (questionSet) => toIdString(questionSet?._id) === toIdString(itemId)
      )
    );
    if (!questionSetExists) {
      return { error: "Question set not found in chapter", status: 404 };
    }
  }

  return { structure, chapter };
};

export const markDigitalHubCompletion = async ({
  studentId,
  courseId,
  chapterId,
  itemId,
  itemType,
}) => {
  const validation = await validateCourseEntity({
    courseId,
    chapterId,
    itemId,
    itemType,
  });

  if (validation.error) {
    const error = new Error(validation.error);
    error.status = validation.status;
    throw error;
  }

  const updateField =
    itemType === "topic"
      ? "topicCompletion"
      : itemType === "assignment"
      ? "assignmentCompletion"
      : "questionSetCompletion";

  await DigitalHubChapterProgress.updateOne(
    {
      studentId: toObjectId(studentId),
      courseId: toObjectId(courseId),
      chapterId: toObjectId(chapterId),
    },
    {
      $setOnInsert: {
        studentId: toObjectId(studentId),
        courseId: toObjectId(courseId),
        chapterId: toObjectId(chapterId),
      },
      $addToSet: {
        [updateField]: toObjectId(itemId),
      },
    },
    { upsert: true }
  );

  return getDigitalHubCourseProgress(studentId, courseId);
};
