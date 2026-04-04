import mongoose from "mongoose";

const digitalHubChapterProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
      index: true,
    },
    topicCompletion: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
      },
    ],
    assignmentCompletion: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
      },
    ],
    questionSetCompletion: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    chapterCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

digitalHubChapterProgressSchema.index(
  { studentId: 1, courseId: 1, chapterId: 1 },
  { unique: true, name: "student_course_chapter_progress_unique" }
);

export default mongoose.model(
  "DigitalHubChapterProgress",
  digitalHubChapterProgressSchema
);
