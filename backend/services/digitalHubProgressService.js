import mongoose from "mongoose";
import Course from "../models/Content/Course.js";
import Assignment from "../models/Assignment.js";
import DigitalHubChapterProgress from "../models/DigitalHubChapterProgress.js";

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

export const getDigitalHubCourseProgress = async (studentId, courseId) => {
  const structure = await loadCourseStructure(courseId);
  if (!structure) {
    return null;
  }

  const { chapters, assignmentsByChapter } = structure;
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

  let unlocked = true;
  const chapterSummaries = chapters.map((chapter) => {
    const chapterId = toIdString(chapter._id);
    const chapterSummary = buildChapterSummary({
      chapter,
      assignments: assignmentsByChapter.get(chapterId) || [],
      progressRecord: progressByChapter.get(chapterId),
      unlocked,
    });

    unlocked = unlocked && chapterSummary.chapterCompleted;
    return chapterSummary;
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
