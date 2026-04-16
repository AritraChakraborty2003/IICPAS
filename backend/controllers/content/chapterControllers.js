import Chapter from "../../models/Content/Chapter.js";
import Course from "../../models/Content/Course.js";
import { POPULATE_TOPICS_WITH_LESSONS } from "../../utils/topicPopulation.js";

export const getChaptersByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Handle course lookup by both ObjectId and slug
    let course;
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(courseId);

    if (isValidObjectId) {
      course = await Course.findById(courseId);
    } else {
      course = await Course.findOne({ slug: courseId });
    }

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const chapters = await Chapter.find({
      _id: { $in: course.chapters },
    }).populate(POPULATE_TOPICS_WITH_LESSONS);
    res.json(chapters);
  } catch (error) {
    console.error("Error fetching chapters:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id).populate(
      POPULATE_TOPICS_WITH_LESSONS
    );
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });
    res.json(chapter);
  } catch (error) {
    console.error("Error fetching chapter:", error);
    res.status(500).json({ error: "Failed to fetch chapter" });
  }
};

export const createChapter = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { 
      title, 
      status, 
      order, 
      seoTitle, 
      seoKeywords, 
      seoDescription,
      metaTitle, 
      metaKeywords, 
      metaDescription,
      publishAt
    } = req.body;

    // Handle course lookup by both ObjectId and slug
    let course;
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(courseId);

    if (isValidObjectId) {
      course = await Course.findById(courseId);
    } else {
      course = await Course.findOne({ slug: courseId });
    }

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const chapter = new Chapter({
      title,
      status: status || "Active",
      order: order || 0,
      seoTitle,
      seoKeywords,
      seoDescription,
      metaTitle,
      metaKeywords,
      metaDescription,
      ...(publishAt ? { publishAt: new Date(publishAt) } : {}),
    });
    await chapter.save();

    // Add chapter to course using the course's _id
    await Course.findByIdAndUpdate(course._id, {
      $push: { chapters: chapter._id },
    });
    res.status(201).json(chapter);
  } catch (error) {
    console.error("Error creating chapter:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      status, 
      order, 
      seoTitle, 
      seoKeywords, 
      seoDescription,
      metaTitle, 
      metaKeywords, 
      metaDescription,
      publishAt
    } = req.body;

    const updateData = {
      title,
      status,
      order,
      seoTitle,
      seoKeywords,
      seoDescription,
      metaTitle,
      metaKeywords,
      metaDescription,
      updatedAt: new Date(),
    };

    if (publishAt !== undefined) {
      updateData.publishAt = new Date(publishAt);
    }

    const chapter = await Chapter.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });
    res.json(chapter);
  } catch (error) {
    console.error("Error updating chapter:", error);
    res.status(500).json({ error: "Failed to update chapter" });
  }
};

export const deleteChapter = async (req, res) => {
  const chapter = await Chapter.findByIdAndDelete(req.params.id);
  if (!chapter) return res.status(404).json({ error: "Chapter not found" });
  // Remove chapter from any course
  await Course.updateMany({}, { $pull: { chapters: chapter._id } });
  res.json({ message: "Chapter deleted" });
};
