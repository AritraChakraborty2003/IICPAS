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
  slots: [simulationGroupSlotSchema],
});

const caseStudySchema = new mongoose.Schema({
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

caseStudySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("CaseStudy", caseStudySchema);
