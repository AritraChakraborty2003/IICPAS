import Topic from "../../models/Content/Topic.js";
import Chapter from "../../models/Content/Chapter.js";
import { TOPIC_LESSON_POPULATE } from "../../utils/topicPopulation.js";
import { normalizeTopicLessons } from "../../utils/topicLessonNormalizer.js";

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
