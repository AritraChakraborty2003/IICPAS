import express from "express";
import Chapter from "../../models/Content/Chapter.js";
import Topic from "../../models/Content/Topic.js";
import Course from "../../models/Content/Course.js";
import { POPULATE_TOPICS_WITH_LESSONS, TOPIC_LESSON_POPULATE } from "../../utils/topicPopulation.js";

const router = express.Router();

// Get chapters for a specific course
router.get("/course/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;

    // Handle course lookup by both ObjectId and slug
    let course;
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(courseId);

    if (isValidObjectId) {
      course = await Course.findById(courseId).populate({
        path: "chapters",
        populate: {
          path: "topics",
          select: "_id title"
        },
      });
    } else {
      course = await Course.findOne({ slug: courseId }).populate({
        path: "chapters",
        populate: {
          path: "topics",
          select: "_id title"
        },
      });
    }

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({
      success: true,
      chapters: course.chapters,
    });
  } catch (error) {
    console.error("Error fetching chapters:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a specific chapter by ID
router.get("/:chapterId", async (req, res) => {
  try {
    const { chapterId } = req.params;

    const chapter = await Chapter.findById(chapterId).populate({
      path: "topics",
      populate: TOPIC_LESSON_POPULATE,
    });
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    res.json(chapter);
  } catch (error) {
    console.error("Error fetching chapter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get topics for a specific chapter
router.get("/:chapterId/topics", async (req, res) => {
  try {
    const { chapterId } = req.params;

    const chapter = await Chapter.findById(chapterId).populate({
      path: "topics",
      populate: TOPIC_LESSON_POPULATE,
    });

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    res.json({
      success: true,
      topics: chapter.topics,
    });
  } catch (error) {
    console.error("Error fetching topics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get specific topic content
router.get("/topics/:topicId", async (req, res) => {
  try {
    const { topicId } = req.params;

    const topic = await Topic.findById(topicId).populate(TOPIC_LESSON_POPULATE);

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    res.json({
      success: true,
      topic: topic,
    });
  } catch (error) {
    console.error("Error fetching topic:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reorder topics within a chapter
router.put("/:chapterId/topics/reorder", async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { topicIds } = req.body;

    if (!Array.isArray(topicIds)) {
      return res.status(400).json({ message: "topicIds must be an array" });
    }

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    // The new order must contain exactly the same topics as the chapter
    const existing = chapter.topics.map((id) => id.toString());
    const incoming = topicIds.map((id) => String(id));
    const sameSet =
      existing.length === incoming.length &&
      [...existing].sort().join(",") === [...incoming].sort().join(",");

    if (!sameSet) {
      return res.status(400).json({
        message: "topicIds must contain exactly the chapter's existing topics",
      });
    }

    chapter.topics = incoming;
    chapter.updatedAt = new Date();
    await chapter.save();

    res.json({ success: true, message: "Topics reordered", topicIds: incoming });
  } catch (error) {
    console.error("Error reordering topics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create a new chapter for a course
router.post("/by-course/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { 
      title, 
      order, 
      status, 
      seoTitle, 
      seoKeywords, 
      seoDescription,
      metaTitle, 
      metaKeywords, 
      metaDescription 
    } = req.body;

    // Validate input
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Chapter title is required" });
    }

    // Create new chapter
    const newChapter = new Chapter({
      title: title.trim(),
      order: order || 0,
      status: status || "Active",
      seoTitle: seoTitle || "",
      seoKeywords: seoKeywords || "",
      seoDescription: seoDescription || "",
      metaTitle: metaTitle || "",
      metaKeywords: metaKeywords || "",
      metaDescription: metaDescription || "",
      topics: [],
    });

    // Save the chapter
    const savedChapter = await newChapter.save();

    // Add chapter to course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.chapters.push(savedChapter._id);
    await course.save();

    res.status(201).json({
      success: true,
      message: "Chapter created successfully",
      chapter: savedChapter,
    });
  } catch (error) {
    console.error("Error creating chapter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a chapter
router.put("/:chapterId", async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { 
      title, 
      order, 
      status, 
      seoTitle, 
      seoKeywords, 
      seoDescription,
      metaTitle, 
      metaKeywords, 
      metaDescription 
    } = req.body;

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    if (title) chapter.title = title.trim();
    if (order !== undefined) chapter.order = order;
    if (status) chapter.status = status;
    if (seoTitle !== undefined) chapter.seoTitle = seoTitle;
    if (seoKeywords !== undefined) chapter.seoKeywords = seoKeywords;
    if (seoDescription !== undefined) chapter.seoDescription = seoDescription;
    if (metaTitle !== undefined) chapter.metaTitle = metaTitle;
    if (metaKeywords !== undefined) chapter.metaKeywords = metaKeywords;
    if (metaDescription !== undefined) chapter.metaDescription = metaDescription;

    const updatedChapter = await chapter.save();

    res.json({
      success: true,
      message: "Chapter updated successfully",
      chapter: updatedChapter,
    });
  } catch (error) {
    console.error("Error updating chapter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a chapter
router.delete("/:chapterId", async (req, res) => {
  try {
    const { chapterId } = req.params;

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    // Remove chapter from all courses that reference it
    await Course.updateMany(
      { chapters: chapterId },
      { $pull: { chapters: chapterId } }
    );

    // Delete the chapter
    await Chapter.findByIdAndDelete(chapterId);

    res.json({
      success: true,
      message: "Chapter deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chapter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
