import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import Course from "../models/Content/Course.js";
import Chapter from "../models/Content/Chapter.js";
import Topic from "../models/Content/Topic.js";

const router = express.Router();

// Single hardcoded clip this feature was built for. If more topics need this
// later, this should become a per-topic config/DB field instead.
const COURSE_ID = "6883d69cdac73382a0aa2b15";
const CHAPTER_TITLE = "Introduction to Basic Accounting";
const TOPIC_TITLE = "Overview";
const ZOOM_SHARE_LINK_FRAGMENT = "cpv9bM-FQjy7V-ISDE23nQ";
const OUTPUT_FILENAME = "accounting-overview-intro.mp4";
const UPLOAD_DIR = path.resolve("uploads", "topic-videos");
const OUTPUT_FILE = path.join(UPLOAD_DIR, OUTPUT_FILENAME);

function publicVideoUrl(req) {
  const base =
    process.env.API_URL ||
    (process.env.API_BASE_URL || "").replace(/\/api\/?$/, "") ||
    `${req.protocol}://${req.get("host")}`;
  return `${base}/uploads/topic-videos/${OUTPUT_FILENAME}`;
}

// In-memory job state. Single-process only — fine for this single-clip feature.
let job = { status: "idle", progress: 0, error: null };

async function findTargetTopic() {
  const course = await Course.findById(COURSE_ID).populate({
    path: "chapters",
    populate: { path: "topics" },
  });
  if (!course) throw new Error("Course not found");

  const chapter = course.chapters.find((c) => c.title === CHAPTER_TITLE);
  if (!chapter) throw new Error("Chapter not found");

  const topic = chapter.topics.find((t) => t.title === TOPIC_TITLE);
  if (!topic) throw new Error("Topic not found");

  return topic;
}

async function getZoomAccessToken() {
  const basic = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  const { data } = await axios.post(
    "https://zoom.us/oauth/token",
    new URLSearchParams({
      grant_type: "account_credentials",
      account_id: process.env.ZOOM_ACCOUNT_ID,
    }),
    { headers: { Authorization: `Basic ${basic}` } }
  );
  return data.access_token;
}

async function runDownload(req) {
  job = { status: "downloading", progress: 0, error: null };
  try {
    const token = await getZoomAccessToken();

    const { data: listData } = await axios.get("https://api.zoom.us/v2/clips", {
      headers: { Authorization: `Bearer ${token}` },
      params: { page_size: 100 },
    });
    const clip = (listData.data || []).find((c) =>
      c.share_link?.includes(ZOOM_SHARE_LINK_FRAGMENT)
    );
    if (!clip) throw new Error("Clip not found in Zoom account");

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const tmpFile = `${OUTPUT_FILE}.part`;

    const response = await axios.get(
      `https://api.zoom.us/v2/clips/${clip.clip_id}/download`,
      { headers: { Authorization: `Bearer ${token}` }, responseType: "stream" }
    );

    const totalBytes = clip.file_size || 0;
    let downloadedBytes = 0;

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(tmpFile);
      response.data.on("data", (chunk) => {
        downloadedBytes += chunk.length;
        job.progress = totalBytes
          ? Math.min(99, Math.round((downloadedBytes / totalBytes) * 100))
          : job.progress;
      });
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
      response.data.on("error", reject);
    });

    fs.renameSync(tmpFile, OUTPUT_FILE);

    const topic = await findTargetTopic();
    topic.introVideo = publicVideoUrl(req);
    await topic.save();

    job = { status: "ready", progress: 100, error: null };
  } catch (err) {
    job = {
      status: "error",
      progress: 0,
      error: err.response?.data?.message || err.message,
    };
  }
}

router.get("/accounting-overview/status", (req, res) => {
  if (fs.existsSync(OUTPUT_FILE) && job.status !== "downloading") {
    return res.json({ status: "ready", progress: 100, url: publicVideoUrl(req) });
  }
  res.json(job);
});

router.post("/accounting-overview/download", (req, res) => {
  if (fs.existsSync(OUTPUT_FILE)) {
    return res.json({ status: "ready", progress: 100, url: publicVideoUrl(req) });
  }
  if (job.status === "downloading") {
    return res.status(202).json(job);
  }
  runDownload(req);
  res.status(202).json({ status: "downloading", progress: 0, error: null });
});

export default router;
