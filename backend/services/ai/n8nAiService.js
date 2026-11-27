// Single gateway to IICPA's existing AI integration: the n8n workflow behind
// the same webhook used by "Content Create AI" in the topic editor. Every AI
// feature in Course Management (course auto-fill, topic / case study /
// assignment generation, the editor's AI and Review tabs) goes through here.
//
// The workflow can return its result in two ways, both supported:
//   1. In the HTTP response itself (a "Respond to Webhook" node) - works on localhost.
//   2. Later, by POSTing to the `callbackUrl` sent with each request
//      (/api/ai/callback/:jobId?token=...) - the backend must be reachable from n8n.
import axios from "axios";
import crypto from "crypto";
import AiJob from "../../models/AiJob.js";
import { claudeEnabled, generateWithClaude, describeClaudeError } from "./claudeAiService.js";
import {
  toCleanHtml,
  parseJsonLoose,
  normalizeStructure,
  normalizeOutlineChapter,
  normalizeOutlineTopic,
  normalizeCourseDetails,
  normalizeReview,
  normalizeAssistJson,
} from "../../utils/aiText.js";
import { buildLessonFromJson } from "../../utils/lessonHtml.js";

const DEFAULT_WEBHOOK =
  "https://n8n.iicpa.in/webhook/de295ee3-3154-4d45-a907-fac35c4b2633";

const webhookUrl = () => process.env.N8N_AI_WEBHOOK_URL || DEFAULT_WEBHOOK;

// How long a job may stay pending before it is reported as timed out
export const JOB_TIMEOUT_MS = Number(process.env.AI_JOB_TIMEOUT_MS) || 5 * 60 * 1000;

const callbackBase = () => {
  const base = (
    process.env.AI_CALLBACK_BASE_URL ||
    process.env.API_BASE_URL ||
    "http://localhost:8080/api"
  ).replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
};

export const callbackToken = (jobId) =>
  crypto
    .createHmac("sha256", process.env.JWT_SECRET || "default_jwt_secret_for_development")
    .update(`ai-job:${jobId}`)
    .digest("hex")
    .slice(0, 40);

const JSON_TYPES = new Set(["structure", "chapter", "outline-topic", "topics", "lesson", "course-details", "review", "assist-json"]);

const OUTLINE_TYPES = new Set(["structure", "chapter", "outline-topic", "topics"]);

const ACK_MESSAGES = /^(workflow (was )?started|accepted|ok|success)\.?$/i;

// Pull the generated text out of whatever shape n8n responds with
export const extractOutput = (data) => {
  if (data == null) return "";
  if (typeof data === "string") {
    const s = data.trim();
    if (!s || ACK_MESSAGES.test(s)) return "";
    // A JSON string may wrap the real payload
    if (/^[[{]/.test(s)) {
      try {
        return extractOutput(JSON.parse(s)) || s;
      } catch {
        return s;
      }
    }
    return s;
  }
  if (Array.isArray(data)) {
    if (data.length === 1) return extractOutput(data[0]);
    // An array of chapters is itself a valid result
    return data.length ? JSON.stringify(data) : "";
  }
  if (typeof data === "object") {
    if (data.chapters || (data.title && (data.topics || data.objectives))) {
      return JSON.stringify(data);
    }
    for (const key of ["output", "content", "html", "response", "text", "result", "data", "json", "message"]) {
      if (data[key] != null) {
        const value = extractOutput(data[key]);
        if (value) return value;
      }
    }
    // OpenAI / Gemini style payloads forwarded as-is
    const choice = data.choices?.[0]?.message?.content || data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (choice) return extractOutput(choice);
  }
  return "";
};

const processOutput = (type, raw, input = {}) => {
  if (!JSON_TYPES.has(type)) {
    const html = toCleanHtml(raw);
    if (!html) throw new Error("The AI returned empty content.");
    return { html };
  }
  const parsed = parseJsonLoose(raw);
  if (!parsed) throw new Error("The AI response was not valid JSON. Please try again.");
  if (type === "lesson") {
    const lesson = buildLessonFromJson(parsed);
    if (!lesson) throw new Error("The AI response did not contain a usable lesson. Please try again.");
    return lesson;
  }
  if (type === "topics") {
    const list = Array.isArray(parsed) ? parsed : parsed.topics || parsed.lessons || [];
    const topics = (Array.isArray(list) ? list : []).map(normalizeOutlineTopic).filter(Boolean).slice(0, 10);
    if (!topics.length) throw new Error("The AI response did not contain any topics.");
    return { topics };
  }
  if (type === "course-details") {
    const fields = normalizeCourseDetails(parsed);
    if (!fields) throw new Error("The AI response did not contain any course details.");
    return { fields };
  }
  if (type === "review") {
    const review = normalizeReview(parsed);
    if (!review) throw new Error("The AI response did not contain a review.");
    return { review };
  }
  if (type === "assist-json") {
    const items = normalizeAssistJson(parsed);
    if (!items) throw new Error("The AI response did not contain any usable items.");
    return items;
  }
  if (type === "structure") {
    // A course has at most 10 chapters, including the ones it already has
    const room = Math.max(1, 10 - (input?.existingChapterTitles?.length || 0));
    const chapters = normalizeStructure(parsed).slice(0, room);
    if (!chapters.length) throw new Error("The AI response did not contain any chapters.");
    return { chapters };
  }
  if (type === "chapter") {
    const chapter = normalizeOutlineChapter(parsed.chapter || parsed.chapters?.[0] || parsed);
    if (!chapter) throw new Error("The AI response did not contain a chapter.");
    return { chapter };
  }
  const topic = normalizeOutlineTopic(parsed.topic || parsed.lesson || parsed);
  if (!topic) throw new Error("The AI response did not contain a lesson.");
  return { topic };
};

export const failJob = async (job, message) => {
  job.status = "failed";
  job.error = message;
  job.completedAt = new Date();
  await job.save();
  return job;
};

export const completeJob = async (job, raw) => {
  if (job.status !== "pending") return job; // ignore duplicate deliveries
  const text = typeof raw === "string" ? raw : JSON.stringify(raw);
  job.rawOutput = text.slice(0, 500000);
  try {
    job.result = processOutput(job.type, text, job.input);
  } catch (err) {
    return failJob(job, err.message);
  }
  job.status = "completed";
  job.error = "";
  job.completedAt = new Date();
  await job.save();
  return job;
};

// Marks a long-pending job as failed so the UI can stop waiting
export const expireIfStale = async (job) => {
  if (job.status === "pending" && Date.now() - new Date(job.createdAt).getTime() > JOB_TIMEOUT_MS) {
    await failJob(
      job,
      claudeEnabled()
        ? "Timed out waiting for Claude. Please try again (very long content can take a few minutes)."
        : "Timed out waiting for the AI workflow. The n8n workflow must either return the result in its response or post it to the callback URL."
    );
  }
  return job;
};

/**
 * Create a job, send it to n8n, and return the job (completed if n8n answered
 * synchronously, otherwise pending until the callback arrives).
 */
export const runAiJob = async ({ type, prompt, content = "", input = {}, userId = null, meta = {} }) => {
  const job = await AiJob.create({
    type,
    prompt,
    input,
    createdBy: userId,
  });
  const jobId = String(job._id);

  // Claude directly (ANTHROPIC_API_KEY set): run in the background, the admin
  // UI polls /api/ai/jobs/:id until the job completes.
  if (claudeEnabled()) {
    // Outlines (titles + short descriptions) don't need deep reasoning: low effort is much faster
    generateWithClaude({ prompt, json: JSON_TYPES.has(type), effort: OUTLINE_TYPES.has(type) ? "low" : undefined })
      .then((text) => completeJob(job, text))
      .catch((err) => {
        console.error(`Claude AI job ${jobId} failed:`, err?.message || err);
        return failJob(job, describeClaudeError(err));
      })
      .catch((err) => console.error("Failed to store AI job result:", err));
    return job;
  }

  const callbackUrl = `${callbackBase()}/ai/callback/${jobId}?token=${callbackToken(jobId)}`;

  try {
    const res = await axios.post(
      webhookUrl(),
      {
        // Same fields the existing topic-editor integration sends
        content: content || prompt,
        prompt,
        topicId: jobId,
        topicName: meta.title || `ai-${type}-${jobId}`,
        callbackUrl,
        // Extra context for the workflow
        task: type,
        jobId,
        responseFormat: JSON_TYPES.has(type) ? "json" : "html",
        source: "iicpa-ai-studio",
      },
      { timeout: Number(process.env.AI_WEBHOOK_TIMEOUT_MS) || 180000 }
    );

    const output = extractOutput(res.data);
    if (output) await completeJob(job, output);
  } catch (err) {
    const detail = err.response
      ? `AI service responded with HTTP ${err.response.status}`
      : err.code === "ECONNABORTED"
      ? "AI service did not respond in time"
      : `Could not reach the AI service (${err.code || err.message || "network error"})`;
    await failJob(job, detail);
  }

  return AiJob.findById(job._id);
};

export const publicJob = (job) =>
  job && {
    _id: job._id,
    type: job.type,
    status: job.status,
    result: job.status === "completed" ? job.result : null,
    error: job.error,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
  };
