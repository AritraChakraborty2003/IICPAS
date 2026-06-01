import Topic from "../../models/Content/Topic.js";
import Chapter from "../../models/Content/Chapter.js";
import { TOPIC_LESSON_POPULATE } from "../../utils/topicPopulation.js";
import { normalizeTopicLessons } from "../../utils/topicLessonNormalizer.js";
import fs from "fs/promises";
import path from "path";
import { convertWordDocumentToHtml } from "../../utils/wordImport.js";

export const getTopicsByChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.chapterId).populate({
      path: "topics",
      populate: TOPIC_LESSON_POPULATE,
    });

    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    res.json(chapter.topics || []);
  } catch (error) {
    console.error("Error fetching topics by chapter:", error);
    res.status(500).json({ error: "Failed to fetch topics" });
  }
};

export const getTopic = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id).populate(
      TOPIC_LESSON_POPULATE
    );
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    res.json(topic);
  } catch (error) {
    console.error("Error fetching topic:", error);
    res.status(500).json({ error: "Failed to fetch topic" });
  }
};

export const createTopic = async (req, res) => {
  try {
    const { publishAt, lessons, ...rest } = req.body;
    const topic = new Topic({
      ...rest,
      ...(publishAt ? { publishAt: new Date(publishAt) } : {}),
      ...(lessons !== undefined ? { lessons: normalizeTopicLessons(lessons) } : {}),
    });
    await topic.save();
    // Add topic to chapter
    await Chapter.findByIdAndUpdate(req.params.chapterId, {
      $push: { topics: topic._id },
    });
    res.status(201).json(topic);
  } catch (error) {
    console.error("Error creating topic:", error);
    res.status(400).json({ error: error.message || "Failed to create topic" });
  }
};

export const updateTopic = async (req, res) => {
  try {
    const { publishAt, lessons, ...rest } = req.body;
    const updateData = {
      ...rest,
      updatedAt: new Date(),
    };
    if (publishAt !== undefined) {
      updateData.publishAt = new Date(publishAt);
    }
    if (lessons !== undefined) {
      updateData.lessons = normalizeTopicLessons(lessons);
    }
    const topic = await Topic.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate(TOPIC_LESSON_POPULATE);
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    res.json(topic);
  } catch (error) {
    console.error("Error updating topic:", error);
    res.status(400).json({ error: error.message || "Failed to update topic" });
  }
};

export const deleteTopic = async (req, res) => {
  const topic = await Topic.findByIdAndDelete(req.params.id);
  if (!topic) return res.status(404).json({ error: "Topic not found" });
  // Remove topic from any chapter
  await Chapter.updateMany({}, { $pull: { topics: topic._id } });
  res.json({ message: "Topic deleted" });
};

const escapeRegex = (str = "") =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Find a topic by its title. Titles aren't unique, so prefer the most
// recently updated match. Matching is case-insensitive, trims whitespace, and
// treats any run of whitespace (incl. non-breaking spaces) as equivalent so
// minor formatting differences from n8n don't cause a miss.
const findTopicByName = (topicName) => {
  const normalized = String(topicName || "")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return null;
  const pattern = `^${escapeRegex(normalized).replace(/ /g, "\\s+")}$`;
  return Topic.findOne({
    title: { $regex: pattern, $options: "i" },
  }).sort({ updatedAt: -1 });
};

// Single fixed webhook for n8n: receives humanized content tagged with topicName
export const receiveAiContent = async (req, res) => {
  try {
    const body = req.body || {};
    const topicName = body.topicName ?? body.title ?? "";

    // n8n may send the content under any of these keys, or as a raw string
    let aiContent =
      body.content ?? body.output ?? body.response ?? body.text ?? "";

    if (aiContent && typeof aiContent !== "string") {
      aiContent = JSON.stringify(aiContent);
    }

    if (!String(topicName).trim()) {
      return res.status(400).json({ error: "topicName is required" });
    }
    if (!aiContent || !String(aiContent).trim()) {
      return res.status(400).json({ error: "No AI content provided" });
    }

    const topic = await findTopicByName(topicName);
    if (!topic) {
      return res
        .status(404)
        .json({ error: `No topic found with name "${topicName}"` });
    }

    topic.aiContent = String(aiContent);
    topic.aiContentUpdatedAt = new Date();
    await topic.save();

    res.json({ success: true, topicId: topic._id, title: topic.title });
  } catch (error) {
    console.error("Error receiving AI content:", error);
    res.status(500).json({ error: "Failed to store AI content" });
  }
};

// Frontend polls this (by topic name) to fetch the AI content n8n delivered
export const getAiContent = async (req, res) => {
  try {
    const topicName = req.query.topicName || req.query.title || "";
    if (!String(topicName).trim()) {
      return res.status(400).json({ error: "topicName is required" });
    }

    const topic = await findTopicByName(topicName);
    if (!topic) {
      return res
        .status(404)
        .json({ error: `No topic found with name "${topicName}"` });
    }

    res.json({
      success: true,
      aiContent: topic.aiContent || "",
      aiContentUpdatedAt: topic.aiContentUpdatedAt || null,
    });
  } catch (error) {
    console.error("Error fetching AI content:", error);
    res.status(500).json({ error: "Failed to fetch AI content" });
  }
};

export const importWordContent = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "A Word document is required" });
    }

    const originalName = req.file.originalname || "imported-document";
    const filePath = req.file.path;

    try {
      const result = await convertWordDocumentToHtml(filePath, originalName);
      return res.json({
        success: true,
        html: result.html,
        pageBreakCount: result.pageBreakCount,
        pageCount: result.pageCount,
        warnings: result.warnings,
        sourceDocument: {
          ...result.sourceDocument,
          originalName,
          mimeType: req.file.mimetype,
          size: req.file.size,
          uploadedFileName: path.basename(filePath),
        },
      });
    } finally {
      await fs.unlink(filePath).catch(() => {});
    }
  } catch (error) {
    console.error("Word import failed:", error);
    return res.status(400).json({
      error:
        error?.message ||
        "Failed to import the Word document. Please try another file.",
    });
  }
};
