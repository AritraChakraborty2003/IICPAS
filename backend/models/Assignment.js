import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: true,
    trim: true,
  },
  instructions: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    default: 0,
  },
});

const contentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["video", "text", "rich"],
    default: "text",
  },
  videoUrl: String,
  videoBase64: String,
  textContent: String,
  richTextContent: String,
  order: {
    type: Number,
    default: 0,
  },
});

const simulationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["accounting", "financial", "custom", "gst"],
    default: "accounting",
  },
  title: String,
  description: String,
  statement: String,
  correctEntries: [
    {
      id: String,
      date: String,
      type: { type: String },
      particulars: String,
      debit: String,
      credit: String,
    }
  ],
  config: {
    accountTypes: [String],
    accountOptions: [String],
    columns: [String],
    validationRules: Object,
    // GST specific config
    gstConfig: {
      difficulty: {
        type: String,
        enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
        default: "BEGINNER",
      },
      hints: [
        {
          field: String,
          hint: String,
          order: Number,
        },
      ],
      autoCalculate: {
        type: Boolean,
        default: true,
      },
      showErrors: {
        type: Boolean,
        default: true,
      },
    },
  },
  isOptional: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
});

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, default: "" },
    context: { type: String, default: "" },
    type: { type: String, default: "" },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, default: "" },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const questionSetSchema = new mongoose.Schema({
  name: String,
  description: String,
  excelFile: String,
  excelBase64: String,
  questions: { type: [questionSchema], default: [] },
  totalQuestions: Number,
  timeLimit: Number,
  passingScore: Number,
  order: {
    type: Number,
    default: 0,
  },
});

const simulationGroupSlotSchema = new mongoose.Schema({
  _id: false,
  url: { type: String, required: true },
  title: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  overrideId: { type: String, default: "" },
  order: { type: Number, default: 0 },
});

const simulationGroupSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  order: { type: Number, default: 0 },
  bgImageUrl: { type: String, default: "" },
  slots: [simulationGroupSlotSchema],
});

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chapter",
    required: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  tasks: [taskSchema],
  content: [contentSchema],
  simulations: [simulationSchema],
  // Links to portal simulation pages (/simulations/...). The URL carries
  // ?simCfg=<id> when per-insert credentials are attached.
  topicSimulations: [
    {
      _id: false,
      url: { type: String, required: true },
      title: { type: String, default: "" },
      imageUrl: { type: String, default: "" },
    },
  ],
  // Ordered groups of existing /simulations/... pages that auto-advance
  // one after another for the student (each slot has its own credential
  // override, same ?simCfg= mechanism as topicSimulations).
  simulationGroups: [simulationGroupSchema],
  questionSets: [questionSetSchema],

  // --- AI chapter assessments (absent on manually created assignments) ---
  // kind "assignment" = AI practical assignment, "quiz" = AI chapter
  // assessment quiz (rendered through questionSets). One of each per chapter.
  // The generated content waits in ai.draft until an admin publishes it, so
  // regeneration never touches what students currently see.
  ai: {
    type: new mongoose.Schema(
      {
        kind: { type: String, enum: ["assignment", "quiz"], required: true },
        status: {
          type: String,
          enum: ["pending", "generating", "generated", "review", "published", "failed"],
          default: "pending",
        },
        trigger: { type: String, enum: ["auto", "manual"], default: "manual" },
        jobIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
        attempts: { type: Number, default: 0 },
        error: { type: String, default: "" },
        // Normalised, validated AI output (select:false - never sent to students)
        draft: { type: mongoose.Schema.Types.Mixed, default: null, select: false },
        validation: { type: mongoose.Schema.Types.Mixed, default: null },
        // Topics used as generation context (detects topic changes)
        topicIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
        topicsHash: { type: String, default: "" },
        difficulty: { type: String, default: "" },
        instructions: { type: String, default: "" },
        startedAt: Date,
        generatedAt: Date,
        draftEditedAt: Date,
        liveEditedAt: Date, // published copy changed in the regular Assignment editor
        publishedAt: Date,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
      },
      { _id: false }
    ),
    default: undefined,
  },
  // Reference solution / evaluation guidelines for instructors only
  instructorGuide: { type: mongoose.Schema.Types.Mixed, default: undefined, select: false },
  seo: {
    seoTitle: { type: String },
    metaDescription: { type: String },
    slug: { type: String },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

assignmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// At most one AI assignment and one AI quiz per chapter (idempotent generation)
assignmentSchema.index(
  { chapterId: 1, "ai.kind": 1 },
  { unique: true, partialFilterExpression: { "ai.kind": { $exists: true } } }
);

export default mongoose.model("Assignment", assignmentSchema);
