import Course from "../../models/Content/Course.js";
import Student from "../../models/Students.js";
import { POPULATE_TOPICS_WITH_LESSONS } from "../../utils/topicPopulation.js";

export const getAllCourses = async (req, res) => {
  const courses = await Course.find().populate({
    path: "chapters",
    populate: POPULATE_TOPICS_WITH_LESSONS,
  });
  res.json(courses);
};

export const getStudentCourses = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Find student and populate their enrolled courses
    const student = await Student.findById(studentId).populate({
      path: "course",
      populate: {
        path: "chapters",
        populate: POPULATE_TOPICS_WITH_LESSONS,
      },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      courses: student.course || [],
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
      },
    });
  } catch (error) {
    console.error("Error fetching student courses:", error);
    res.status(500).json({ error: "Failed to fetch student courses" });
  }
};

export const getAvailableCourses = async (req, res) => {
  try {
    // Get all active courses
    const courses = await Course.find({ status: "Active" }).populate({
      path: "chapters",
      populate: POPULATE_TOPICS_WITH_LESSONS,
    });
    res.json(courses);
  } catch (error) {
    console.error("Error fetching available courses:", error);
    res.status(500).json({ error: "Failed to fetch available courses" });
  }
};

export const getCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the id is a valid ObjectId format
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    let course;
    if (isValidObjectId) {
      // If it's a valid ObjectId, search by _id
      course = await Course.findById(id).populate({
        path: "chapters",
        populate: POPULATE_TOPICS_WITH_LESSONS,
      });
    } else {
      // If it's not a valid ObjectId, search by slug
      course = await Course.findOne({ slug: id }).populate({
        path: "chapters",
        populate: POPULATE_TOPICS_WITH_LESSONS,
      });
    }

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
};

export const createCourse = async (req, res) => {
  try {
    // Destructure all expected fields from req.body
    const {
      category,
      title,
      price,
      slug,
      level,
      discount,
      status,
      duration,
      description,
      examCert,
      caseStudy,
      assignment,
      simulations: simulationsRaw,
      video,
      seoTitle,
      seoKeywords,
      seoDescription,
      metaTitle,
      metaKeywords,
      metaDescription,
      chapters, // optional
      pricing, // dynamic pricing configuration
      tabs, // dynamic tab configuration
    } = req.body;

    // Parse simulations data if it's a JSON string
    let simulations = [];
    if (simulationsRaw) {
      try {
        simulations =
          typeof simulationsRaw === "string"
            ? JSON.parse(simulationsRaw)
            : simulationsRaw;
      } catch (error) {
        console.error("Error parsing simulations data:", error);
        simulations = [];
      }
    }

    // Parse pricing data if it's a JSON string
    let parsedPricing = {};
    if (pricing) {
      try {
        parsedPricing =
          typeof pricing === "string" ? JSON.parse(pricing) : pricing;
      } catch (error) {
        console.error("Error parsing pricing data:", error);
        parsedPricing = {};
      }
    }

    // Parse tabs data if it's a JSON string
    let parsedTabs = {};
    if (tabs) {
      try {
        parsedTabs = typeof tabs === "string" ? JSON.parse(tabs) : tabs;
      } catch (error) {
        console.error("Error parsing tabs data:", error);
        parsedTabs = {};
      }
    }

    // Handle uploaded image (if present)
    let imageUrl = "";
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Create course document
    const course = new Course({
      category,
      title,
      slug,
      price,
      image: imageUrl,
      level,
      discount,
      status,
      duration,
      description,
      examCert,
      caseStudy,
      assignment,
      simulations,
      video,
      seoTitle,
      seoKeywords,
      seoDescription,
      metaTitle,
      metaKeywords,
      metaDescription,
      chapters,
      pricing: parsedPricing,
      tabs: parsedTabs,
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    // Prepare update data
    const updateData = { ...req.body };

    // Handle uploaded image (if present)
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    // Handle assignment and simulations data
    if (req.body.assignment) {
      updateData.assignment = req.body.assignment;
    }

    if (req.body.simulations) {
      try {
        // Parse simulations JSON string to object
        updateData.simulations = JSON.parse(req.body.simulations);
      } catch (error) {
        console.error("Error parsing simulations data:", error);
        // If parsing fails, keep as string or set to empty array
        updateData.simulations = [];
      }
    }

    // Handle pricing data
    if (req.body.pricing) {
      try {
        updateData.pricing = JSON.parse(req.body.pricing);
      } catch (error) {
        console.error("Error parsing pricing data:", error);
        // If parsing fails, keep existing pricing or set default
      }
    }

    const course = await Course.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteCourse = async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) return res.status(404).json({ error: "Course not found" });
  res.json({ message: "Course deleted" });
};

export const toggleCourseStatus = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Toggle status
    course.status = course.status === "Active" ? "Inactive" : "Active";
    await course.save();

    res.json({
      message: "Course status updated successfully",
      course: course,
      newStatus: course.status,
    });
  } catch (error) {
    console.error("Error toggling course status:", error);
    res.status(500).json({ error: "Failed to toggle course status" });
  }
};

// Course Level Management Functions
export const getCourseLevels = async (req, res) => {
  try {
    // Default course levels
    const defaultLevels = [
      { value: "Executive Level", label: "Executive Level" },
      { value: "Professional Level", label: "Professional Level" },
      { value: "Digital Hub+Center", label: "Digital Hub+Center" },
    ];

    // For now, return default levels. In the future, this could be stored in a database
    res.json(defaultLevels);
  } catch (error) {
    console.error("Error fetching course levels:", error);
    res.status(500).json({ error: "Failed to fetch course levels" });
  }
};

export const uploadSimulationImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      imageUrl: imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("Error uploading simulation image:", error);
    res.status(500).json({ error: "Failed to upload simulation image" });
  }
};
