// Run: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateQuizQuestions,
  randomizeAnswerPositions,
  normalizeAssignment,
  renderAssignmentHtml,
  quizToQuestionSet,
  validateEditedQuiz,
  matchTopic,
  AssessmentValidationError,
} from "../utils/assessmentValidation.js";
import { buildQuizPrompt, buildAssignmentPrompt } from "../services/ai/assessmentPrompts.js";

const ctx = {
  course: { title: "Power BI for Business Reporting", category: "Data", level: "" },
  chapter: { title: "Power BI Fundamentals", position: 1, total: 6, objectives: [] },
  topics: [
    { id: "t1", title: "Overview of Power BI" },
    { id: "t2", title: "Importing and Transforming Data" },
    { id: "t3", title: "Creating Interactive Visualisations" },
  ],
  difficulty: "Beginner",
};

const q = (over = {}) => ({
  question: "Which Power BI component is primarily used for cleaning and transforming imported datasets?",
  options: ["Power BI Service", "Power Query Editor", "Report View", "Dashboard Tiles"],
  answer: 1,
  explanation: "Power Query Editor is used to clean, shape and transform data before loading it into the model.",
  difficulty: "Beginner",
  type: "conceptual",
  topic: "Importing and Transforming Data",
  ...over,
});

test("accepts a well-formed question and maps its topic", () => {
  const { accepted, rejected } = validateQuizQuestions([q()], ctx);
  assert.equal(rejected.length, 0);
  assert.equal(accepted[0].topic, "Importing and Transforming Data");
  assert.equal(accepted[0].topicId, "t2");
});

test("rejects malformed, ambiguous, off-topic and duplicate questions", () => {
  const { accepted, rejected } = validateQuizQuestions(
    [
      q(),
      q({ question: "Which Power BI component is mainly used for cleaning and transforming imported datasets?" }), // near duplicate
      q({ question: "Which of these is a visual type available in Power BI reports?", options: ["A", "B", "C"] }),
      q({ question: "Which feature lets users filter visuals on a report page interactively?", options: ["Slicer", "Slicer", "Card", "Gauge"] }),
      q({ question: "Which statement about Power BI Desktop is accurate for report authors?", options: ["One", "Two", "Three", "All of the above"] }),
      q({ question: "Which tax applies to the supply of goods within one Indian state?", topic: "GST Basics" }),
      q({ question: "Which view in Power BI Desktop shows table relationships graphically?", answer: 7 }),
      q({ question: "Which Power BI pane is used to add fields to a visual in a report?", explanation: "" }),
    ],
    ctx
  );
  assert.equal(accepted.length, 1);
  assert.equal(rejected.length, 7);
});

test("rejects questions duplicating existing material", () => {
  const { accepted } = validateQuizQuestions([q()], ctx, [
    "Which Power BI component is primarily used for cleaning and transforming imported datasets?",
  ]);
  assert.equal(accepted.length, 0);
});

test("accepts letter and text answers", () => {
  const { accepted } = validateQuizQuestions(
    [q({ answer: "B" }), q({ question: "Which Power BI product is used to share published reports online?", answer: "Power BI Service" })],
    ctx
  );
  assert.equal(accepted[0].answer, 1);
  assert.equal(accepted[1].answer, 0);
});

test("randomizes answer positions evenly and keeps the right answer", () => {
  const base = Array.from({ length: 20 }, (_, i) => ({ ...q(), question: `Q${i}`, answer: 0, options: [`right${i}`, "x", "y", "z"] }));
  const out = randomizeAnswerPositions(base);
  const counts = [0, 0, 0, 0];
  out.forEach((x, i) => {
    counts[x.answer] += 1;
    assert.equal(x.options[x.answer], `right${i}`);
    assert.equal(x.options.length, 4);
  });
  assert.deepEqual(counts, [5, 5, 5, 5]);
});

test("question set keeps existing student format (correctAnswer = option text)", () => {
  const qs = quizToQuestionSet({ title: "Chapter Assessment", description: "d", questions: [q()] });
  assert.equal(qs.questions[0].correctAnswer, "Power Query Editor");
  assert.equal(qs.totalQuestions, 1);
});

test("assignment: validates, rescales marks, flags question-style title and uncovered topics", () => {
  const { draft, instructorGuide, report } = normalizeAssignment(
    {
      title: "What is Power BI?",
      overview: "Build a dashboard.",
      tasks: [{ title: "Import", description: "Import the data", topic: "Importing and Transforming Data" }],
      instructions: ["Open Power BI", "Import data", "Build visuals"],
      assessmentCriteria: [
        { criterion: "Accuracy", marks: 30 },
        { criterion: "Design", marks: 20 },
      ],
      datasets: [{ title: "Sales", columns: ["Region", "Revenue"], rows: [["North", "₹1,25,000"]] }],
      instructorGuide: { solutionOverview: "Expected totals...", expectedResults: ["Total ₹1,25,000"] },
    },
    ctx
  );
  assert.equal(draft.assessmentCriteria.reduce((s, c) => s + c.marks, 0), 100);
  assert.ok(report.warnings.some((w) => /question-style/.test(w)));
  assert.ok(report.warnings.some((w) => /not clearly covered/.test(w)));
  assert.equal(instructorGuide.expectedResults[0], "Total ₹1,25,000");
  const html = renderAssignmentHtml(draft);
  assert.match(html, /<table>/);
  assert.doesNotMatch(html, /Expected totals/); // instructor guide never in student HTML
});

test("assignment without tasks is rejected", () => {
  assert.throws(() => normalizeAssignment({ title: "X", overview: "Y", instructions: ["a", "b", "c"] }, ctx), AssessmentValidationError);
});

test("edited quiz enforces 4 distinct options and an answer", () => {
  const { errors } = validateEditedQuiz({ questions: [{ question: "Q?", options: ["a", "a", "b", "c"], answer: 9 }] }, ctx);
  assert.ok(errors.length >= 2);
});

test("topic matching is tolerant but not loose", () => {
  assert.equal(matchTopic("importing and transforming data", ctx.topics).id, "t2");
  assert.equal(matchTopic("Interactive Visualisations", ctx.topics).id, "t3");
  assert.equal(matchTopic("Goods and Services Tax", ctx.topics), null);
});

test("prompts carry the chapter topics and duplicate list", () => {
  const p = buildQuizPrompt({ ...ctx, instructions: "" }, { count: 24, avoidQuestions: ["Old question?"] });
  assert.match(p, /Importing and Transforming Data/);
  assert.match(p, /Old question\?/);
  assert.match(buildAssignmentPrompt({ ...ctx, instructions: "" }), /instructorGuide/);
});
