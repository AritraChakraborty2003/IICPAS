import GroupPricing from "../models/GroupPricing.js";
import Course from "../models/Content/Course.js";
import Student from "../models/Students.js";
import mongoose from "mongoose";
import { upsertCourseAccessOverride } from "../utils/courseAccess.js";

// Get all group pricing configurations
export const getAllGroupPricing = async (req, res) => {
  try {
    const groupPricing = await GroupPricing.find({ status: "Active" })
      .populate({
        path: "courseIds",
        select: "title category level price",
        populate: {
          path: "chapters",
          select: "title topics",
        },
      })
      .sort({ level: 1, createdAt: -1 });

    // Ensure center pricing structures exist for all records and generate slugs if missing
    const groupPricingWithDefaults = groupPricing.map((pricing) => {
      // Generate slug if missing
      if (!pricing.slug && pricing.groupName) {
        pricing.slug = pricing.groupName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
          .replace(/\s+/g, "-") // Replace spaces with hyphens
          .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
          .trim("-"); // Remove leading/trailing hyphens
      }

      if (!pricing.pricing.recordedSessionCenter) {
        pricing.pricing.recordedSessionCenter = {
          title: "DIGITAL HUB+ RECORDED SESSION+ CENTER",
          buttonText: "Add Digital Hub+ Center",
          price: 0,
          discount: 0,
          finalPrice: 0,
        };
      }

      if (!pricing.pricing.liveSessionCenter) {
        pricing.pricing.liveSessionCenter = {
          title: "DIGITAL HUB+ LIVE SESSION+ CENTER",
          buttonText: "Add Digital Hub+ Center",
          price: 0,
          discount: 0,
          finalPrice: 0,
        };
      }

      return pricing;
    });

    res.json(groupPricingWithDefaults);
  } catch (error) {
    console.error("Error fetching group pricing:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch group pricing",
      error: error.message,
    });
  }
};

// Get group pricing by slug
export const getGroupPricingBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const groupPricing = await GroupPricing.findOne({ slug }).populate({
      path: "courseIds",
      select: "title category level price",
      populate: {
        path: "chapters",
        select: "title",
        populate: {
          path: "topics",
          select: "title",
        },
      },
    });

    if (!groupPricing) {
      return res.status(404).json({
        success: false,
        message: "Group package not found",
      });
    }

    // Ensure center pricing structures exist
    if (!groupPricing.pricing.recordedSessionCenter) {
      groupPricing.pricing.recordedSessionCenter = {
        title: "DIGITAL HUB+ RECORDED SESSION+ CENTER",
        buttonText: "Add Digital Hub+ Center",
        price: 0,
        discount: 0,
        finalPrice: 0,
      };
    }

    if (!groupPricing.pricing.liveSessionCenter) {
      groupPricing.pricing.liveSessionCenter = {
        title: "DIGITAL HUB+ LIVE SESSION+ CENTER",
        buttonText: "Add Digital Hub+ Center",
        price: 0,
        discount: 0,
        finalPrice: 0,
      };
    }

    res.json(groupPricing);
  } catch (error) {
    console.error("Error fetching group pricing by slug:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch group pricing",
      error: error.message,
    });
  }
};

// Get group pricing by ID
export const getGroupPricingById = async (req, res) => {
  try {
    const { id } = req.params;
    const groupPricing = await GroupPricing.findById(id).populate({
      path: "courseIds",
      select: "title category level price",
      populate: {
        path: "chapters",
        select: "title",
        populate: {
          path: "topics",
          select: "title",
        },
      },
    });

    if (!groupPricing) {
      return res.status(404).json({
        success: false,
        message: "Group pricing not found",
      });
    }

    // Ensure center pricing structures exist
    if (!groupPricing.pricing.recordedSessionCenter) {
      groupPricing.pricing.recordedSessionCenter = {
        title: "DIGITAL HUB+ RECORDED SESSION+ CENTER",
        buttonText: "Add Digital Hub+ Center",
        price: 0,
        discount: 0,
        finalPrice: 0,
      };
    }

    if (!groupPricing.pricing.liveSessionCenter) {
      groupPricing.pricing.liveSessionCenter = {
        title: "DIGITAL HUB+ LIVE SESSION+ CENTER",
        buttonText: "Add Digital Hub+ Center",
        price: 0,
        discount: 0,
        finalPrice: 0,
      };
    }

    res.json(groupPricing);
  } catch (error) {
    console.error("Error fetching group pricing:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch group pricing",
      error: error.message,
    });
  }
};

// Create new group pricing configuration
export const createGroupPricing = async (req, res) => {
  try {
    const {
      groupName,
      level,
      courseIds,
      groupPrice,
      description,
      duration,
      metaTitle,
      metaDescription,
      metaKeywords,
      certificateText,
      recordedPrice,
      recordedFinalPrice,
      recordedDiscount,
      livePrice,
      liveFinalPrice,
      liveDiscount,
      recordedPriceCenter,
      recordedFinalPriceCenter,
      recordedDiscountCenter,
      livePriceCenter,
      liveFinalPriceCenter,
      liveDiscountCenter,
    } = req.body;
    const image = req.files?.image?.[0]
      ? `/uploads/group_pricing_images/${req.files.image[0].filename}`
      : "";
    const certificateImage = req.files?.certificateImage?.[0]
      ? `/uploads/group_pricing_images/${req.files.certificateImage[0].filename}`
      : "";

    // Parse courseIds if it's a string (from FormData)
    let parsedCourseIds = courseIds;
    if (typeof courseIds === "string") {
      try {
        parsedCourseIds = JSON.parse(courseIds);
      } catch (e) {
        console.log("Error parsing courseIds:", e);
        return res.status(400).json({
          success: false,
          message: "Invalid courseIds format",
        });
      }
    }

    console.log("Parsed courseIds:", parsedCourseIds);

    // Validate required fields
    if (
      !groupName ||
      !level ||
      !parsedCourseIds ||
      !Array.isArray(parsedCourseIds) ||
      parsedCourseIds.length === 0 ||
      !groupPrice ||
      !recordedPrice ||
      !recordedFinalPrice ||
      !livePrice ||
      !liveFinalPrice ||
      !recordedPriceCenter ||
      !recordedFinalPriceCenter ||
      !livePriceCenter ||
      !liveFinalPriceCenter
    ) {
      console.log("=== VALIDATION FAILED ===");
      console.log("groupName:", groupName);
      console.log("level:", level);
      console.log("parsedCourseIds:", parsedCourseIds);
      console.log("groupPrice:", groupPrice);
      console.log("recordedPrice:", recordedPrice);
      console.log("recordedFinalPrice:", recordedFinalPrice);
      console.log("livePrice:", livePrice);
      console.log("liveFinalPrice:", liveFinalPrice);
      console.log("recordedPriceCenter:", recordedPriceCenter);
      console.log("recordedFinalPriceCenter:", recordedFinalPriceCenter);
      console.log("livePriceCenter:", livePriceCenter);
      console.log("liveFinalPriceCenter:", liveFinalPriceCenter);
      console.log("========================");
      return res.status(400).json({
        success: false,
        message:
          "Group name, level, courseIds, groupPrice, and pricing details are required",
      });
    }

    // Validate that all courses exist (removed level filter)
    console.log("Looking for courses with IDs:", parsedCourseIds);
    const courses = await Course.find({
      _id: { $in: parsedCourseIds },
      status: "Active",
    });

    console.log(
      "Found courses:",
      courses.length,
      "out of",
      parsedCourseIds.length
    );

    if (courses.length !== parsedCourseIds.length) {
      console.log("=== COURSE VALIDATION FAILED ===");
      console.log("Requested course IDs:", parsedCourseIds);
      console.log(
        "Found courses:",
        courses.map((c) => ({ id: c._id, title: c.title, level: c.level }))
      );
      console.log("Expected count:", parsedCourseIds.length);
      console.log("Found count:", courses.length);
      console.log("================================");
      return res.status(400).json({
        success: false,
        message: "Some courses not found or are inactive",
      });
    }

    // Generate slug from groupName
    const slug = groupName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .trim("-"); // Remove leading/trailing hyphens

    const newGroupPricing = new GroupPricing({
      groupName,
      slug,
      level,
      courseIds: parsedCourseIds,
      groupPrice: parseFloat(groupPrice),
      description: description || "",
      duration: duration || "",
      metaTitle: metaTitle || "",
      metaDescription: metaDescription || "",
      metaKeywords: metaKeywords || "",
      image: image,
      certificate: {
        image: certificateImage,
        text: certificateText || "",
      },
      pricing: {
        recordedSession: {
          price: parseFloat(recordedPrice),
          finalPrice: parseFloat(recordedFinalPrice),
          discount: parseFloat(recordedDiscount) || 0,
        },
        liveSession: {
          price: parseFloat(livePrice),
          finalPrice: parseFloat(liveFinalPrice),
          discount: parseFloat(liveDiscount) || 0,
        },
        recordedSessionCenter: {
          price: parseFloat(recordedPriceCenter),
          finalPrice: parseFloat(recordedFinalPriceCenter),
          discount: parseFloat(recordedDiscountCenter) || 0,
        },
        liveSessionCenter: {
          price: parseFloat(livePriceCenter),
          finalPrice: parseFloat(liveFinalPriceCenter),
          discount: parseFloat(liveDiscountCenter) || 0,
        },
      },
    });

    const savedGroupPricing = await newGroupPricing.save();
    await savedGroupPricing.populate({
      path: "courseIds",
      select: "title category level price",
      populate: {
        path: "chapters",
        select: "title",
        populate: {
          path: "topics",
          select: "title",
        },
      },
    });

    // Calculate average rating from included courses
    await savedGroupPricing.calculateAverageRating();
    await savedGroupPricing.save();

    res.status(201).json({
      success: true,
      message: "Group pricing created successfully",
      data: savedGroupPricing,
    });
  } catch (error) {
    console.error("Error creating group pricing:", error);
    console.error("Error stack:", error.stack);

    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A group pricing package with this name already exists. Please choose a different group name.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create group pricing",
      error: error.message,
    });
  }
};

// Update group pricing configuration
export const updateGroupPricing = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      groupName,
      level,
      courseIds,
      groupPrice,
      status,
      description,
      duration,
      metaTitle,
      metaDescription,
      metaKeywords,
      certificateText,
      recordedPrice,
      recordedFinalPrice,
      recordedDiscount,
      livePrice,
      liveFinalPrice,
      liveDiscount,
      recordedPriceCenter,
      recordedFinalPriceCenter,
      recordedDiscountCenter,
      livePriceCenter,
      liveFinalPriceCenter,
      liveDiscountCenter,
    } = req.body;
    const image = req.files?.image?.[0]
      ? `/uploads/group_pricing_images/${req.files.image[0].filename}`
      : undefined;
    const certificateImage = req.files?.certificateImage?.[0]
      ? `/uploads/group_pricing_images/${req.files.certificateImage[0].filename}`
      : undefined;

    // Parse courseIds if it's a string (from FormData)
    let parsedCourseIds = courseIds;
    if (courseIds && typeof courseIds === "string") {
      try {
        parsedCourseIds = JSON.parse(courseIds);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: "Invalid courseIds format",
        });
      }
    }

    const groupPricing = await GroupPricing.findById(id);
    if (!groupPricing) {
      return res.status(404).json({
        success: false,
        message: "Group pricing not found",
      });
    }

    // Validate required fields if provided
    if (
      parsedCourseIds &&
      (!Array.isArray(parsedCourseIds) || parsedCourseIds.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "courseIds must be a non-empty array",
      });
    }

    // If courseIds are being updated, validate courses exist
    if (parsedCourseIds) {
      const targetCourseIds = parsedCourseIds;

      const courses = await Course.find({
        _id: { $in: targetCourseIds },
        status: "Active",
      });

      if (courses.length !== targetCourseIds.length) {
        return res.status(400).json({
          success: false,
          message: "Some courses not found or are inactive",
        });
      }
    }

    // Update fields
    if (groupName) {
      groupPricing.groupName = groupName;
      // Regenerate slug when groupName changes
      groupPricing.slug = groupName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
        .trim("-"); // Remove leading/trailing hyphens
    }
    if (level) groupPricing.level = level;
    if (parsedCourseIds) groupPricing.courseIds = parsedCourseIds;
    if (groupPrice) groupPricing.groupPrice = parseFloat(groupPrice);
    if (description !== undefined) groupPricing.description = description;
    if (duration !== undefined) groupPricing.duration = duration;
    if (metaTitle !== undefined) groupPricing.metaTitle = metaTitle;
    if (metaDescription !== undefined)
      groupPricing.metaDescription = metaDescription;
    if (metaKeywords !== undefined) groupPricing.metaKeywords = metaKeywords;
    if (status) groupPricing.status = status;
    if (image) groupPricing.image = image;
    if (certificateImage) groupPricing.certificate.image = certificateImage;
    if (certificateText !== undefined) groupPricing.certificate.text = certificateText;

    // Update pricing structure
    if (recordedPrice || recordedFinalPrice || recordedDiscount !== undefined) {
      if (recordedPrice)
        groupPricing.pricing.recordedSession.price = parseFloat(recordedPrice);
      if (recordedFinalPrice)
        groupPricing.pricing.recordedSession.finalPrice =
          parseFloat(recordedFinalPrice);
      if (recordedDiscount !== undefined)
        groupPricing.pricing.recordedSession.discount =
          parseFloat(recordedDiscount);
    }

    if (livePrice || liveFinalPrice || liveDiscount !== undefined) {
      if (livePrice)
        groupPricing.pricing.liveSession.price = parseFloat(livePrice);
      if (liveFinalPrice)
        groupPricing.pricing.liveSession.finalPrice =
          parseFloat(liveFinalPrice);
      if (liveDiscount !== undefined)
        groupPricing.pricing.liveSession.discount = parseFloat(liveDiscount);
    }

    // Initialize center pricing structures if they don't exist
    if (!groupPricing.pricing.recordedSessionCenter) {
      groupPricing.pricing.recordedSessionCenter = {
        title: "DIGITAL HUB+ RECORDED SESSION+ CENTER",
        buttonText: "Add Digital Hub+ Center",
        price: 0,
        discount: 0,
        finalPrice: 0,
      };
    }

    if (!groupPricing.pricing.liveSessionCenter) {
      groupPricing.pricing.liveSessionCenter = {
        title: "DIGITAL HUB+ LIVE SESSION+ CENTER",
        buttonText: "Add Digital Hub+ Center",
        price: 0,
        discount: 0,
        finalPrice: 0,
      };
    }

    // Update recorded session center pricing
    if (
      recordedPriceCenter ||
      recordedFinalPriceCenter ||
      recordedDiscountCenter !== undefined
    ) {
      if (recordedPriceCenter)
        groupPricing.pricing.recordedSessionCenter.price =
          parseFloat(recordedPriceCenter);
      if (recordedFinalPriceCenter)
        groupPricing.pricing.recordedSessionCenter.finalPrice = parseFloat(
          recordedFinalPriceCenter
        );
      if (recordedDiscountCenter !== undefined)
        groupPricing.pricing.recordedSessionCenter.discount = parseFloat(
          recordedDiscountCenter
        );
    }

    // Update live session center pricing
    if (
      livePriceCenter ||
      liveFinalPriceCenter ||
      liveDiscountCenter !== undefined
    ) {
      if (livePriceCenter)
        groupPricing.pricing.liveSessionCenter.price =
          parseFloat(livePriceCenter);
      if (liveFinalPriceCenter)
        groupPricing.pricing.liveSessionCenter.finalPrice =
          parseFloat(liveFinalPriceCenter);
      if (liveDiscountCenter !== undefined)
        groupPricing.pricing.liveSessionCenter.discount =
          parseFloat(liveDiscountCenter);
    }

    const updatedGroupPricing = await groupPricing.save();

    // Recalculate average rating if courses changed
    if (parsedCourseIds) {
      await updatedGroupPricing.calculateAverageRating();
      await updatedGroupPricing.save();
    }
    await updatedGroupPricing.populate({
      path: "courseIds",
      select: "title category level price",
      populate: {
        path: "chapters",
        select: "title",
        populate: {
          path: "topics",
          select: "title",
        },
      },
    });

    res.json({
      success: true,
      message: "Group pricing updated successfully",
      data: updatedGroupPricing,
    });
  } catch (error) {
    console.error("Error updating group pricing:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A group pricing package with this name already exists. Please choose a different group name.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update group pricing",
      error: error.message,
    });
  }
};

// Delete group pricing configuration
export const deleteGroupPricing = async (req, res) => {
  try {
    const { id } = req.params;

    const groupPricing = await GroupPricing.findById(id);
    if (!groupPricing) {
      return res.status(404).json({
        success: false,
        message: "Group pricing not found",
      });
    }

    await GroupPricing.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Group pricing deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting group pricing:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete group pricing",
      error: error.message,
    });
  }
};

// Get group pricing by level
export const getGroupPricingByLevel = async (req, res) => {
  try {
    const { level } = req.params;

    const groupPricing = await GroupPricing.find({
      level: level,
      status: "Active",
    })
      .populate("courseIds", "title category level price")
      .sort({ createdAt: -1, groupName: 1 });

    if (!groupPricing.length) {
      return res.status(404).json({
        success: false,
        message: "No active group pricing found for this level",
      });
    }

    res.json({
      success: true,
      level,
      groupPricing,
    });
  } catch (error) {
    console.error("Error fetching group pricing by level:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch group pricing",
      error: error.message,
    });
  }
};

// Get available courses for a specific level
export const getCoursesByLevel = async (req, res) => {
  try {
    const { level } = req.params;

    const courses = await Course.find({
      level: level,
      status: "Active",
    }).select("_id title category level price");

    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses by level:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
      error: error.message,
    });
  }
};

// Enroll student in group package
export const enrollInGroupPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, sessionType } = req.body;

    // Validate student ID format
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID format",
      });
    }

    // Validate group pricing ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group pricing ID format",
      });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check if group pricing exists
    const groupPricing = await GroupPricing.findById(id).populate({
      path: "courseIds",
      select: "title category level price",
      populate: {
        path: "chapters",
        select: "title",
        populate: {
          path: "topics",
          select: "title",
        },
      },
    });
    if (!groupPricing) {
      return res.status(404).json({
        success: false,
        message: "Group package not found",
      });
    }

    // Validate session type
    if (!sessionType || !["recorded", "live"].includes(sessionType)) {
      return res.status(400).json({
        success: false,
        message: "Session type must be 'recorded' or 'live'",
      });
    }

    // Check if student is already enrolled in any of the courses in this package
    const enrolledCourses = groupPricing.courseIds.filter(
      (course) =>
        student.enrolledRecordedSessions.includes(course._id) ||
        student.enrolledLiveSessions.includes(course._id)
    );

    if (enrolledCourses.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Student is already enrolled in some courses from this package: ${enrolledCourses
          .map((c) => c.title)
          .join(", ")}`,
      });
    }

    // Enroll student in all courses in the package
    const courseIds = groupPricing.courseIds.map((course) => course._id);

    if (sessionType === "recorded") {
      // Add all courses to recorded sessions
      student.enrolledRecordedSessions.push(...courseIds);
    } else {
      // Add all courses to live sessions
      student.enrolledLiveSessions.push(...courseIds);
    }

    const purchasedAt = new Date();
    const expiresAt = new Date(purchasedAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    for (const courseId of courseIds) {
      // Use the package approval time as the purchase reference for each course.
      await upsertCourseAccessOverride({
        student,
        courseId,
        isLocked: false,
        purchasedAt,
        expiresAt,
      });
    }

    await student.save();

    res.json({
      success: true,
      message: `Successfully enrolled in ${groupPricing.level} package with ${sessionType} sessions`,
      data: {
        packageId: groupPricing._id,
        packageName: `${groupPricing.level} Course Package`,
        sessionType,
        enrolledCourses: courseIds.length,
        courseTitles: groupPricing.courseIds.map((course) => course.title),
      },
    });
  } catch (error) {
    console.error("Error enrolling in group package:", error);
    res.status(500).json({
      success: false,
      message: "Failed to enroll in group package",
      error: error.message,
    });
  }
};
