import Testimonial from "../models/Testimonials.js";
import { awardCoins, getCoinSettings } from "../services/coinService.js";

// Create a new testimonial (admin only)
export const createTestimonial = async (req, res) => {
  try {
    const { name, designation, message, rating } = req.body;

    // Handle image upload
    let imagePath = "";
    if (req.file) {
      imagePath = req.file.path; // Path to uploaded file
    }

    // Validate rating
    const validRating = rating ? Math.max(1, Math.min(5, parseInt(rating))) : 5;

    const testimonial = new Testimonial({
      name,
      designation,
      message,
      rating: validRating,
      image: imagePath,
      status: true, // Admin-created testimonials are auto-approved
    });

    await testimonial.save();
    res
      .status(201)
      .json({ message: "Testimonial created successfully", testimonial });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    res.status(500).json({ error: "Failed to create testimonial" });
  }
};

// Submit a new testimonial
export const submitTestimonial = async (req, res) => {
  try {
    const { name, designation, message, rating } = req.body;
    const studentId = req.user.id;

    // Handle image upload
    let imagePath = "";
    if (req.file) {
      imagePath = req.file.path; // Path to uploaded file
    }

    // Validate rating
    const validRating = rating ? Math.max(1, Math.min(5, parseInt(rating))) : 5;

    const testimonial = new Testimonial({
      name,
      designation,
      message,
      rating: validRating,
      image: imagePath,
      studentId,
      status: false, // Pending approval
    });

    await testimonial.save();
    res
      .status(201)
      .json({ message: "Testimonial submitted successfully", testimonial });
  } catch (error) {
    console.error("Error submitting testimonial:", error);
    res.status(500).json({ error: "Failed to submit testimonial" });
  }
};


// Get testimonials submitted by a specific student
export const getStudentTestimonials = async (req, res) => {
  try {
    const studentId = req.user.id;
    const testimonials = await Testimonial.find({ studentId }).sort({
      createdAt: -1,
    });
    res.json(testimonials);
  } catch (error) {
    console.error("Error fetching student testimonials:", error);
    res.status(500).json({ error: "Failed to fetch testimonials" });
  }
};

// Get all testimonials (admin only)
export const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (error) {
    console.error("Error fetching all testimonials:", error);
    res.status(500).json({ error: "Failed to fetch testimonials" });
  }
};

// Get approved testimonials for public display
export const getApprovedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ status: true }).sort({
      createdAt: -1,
    });
    res.json(testimonials);
  } catch (error) {
    console.error("Error fetching approved testimonials:", error);
    res.status(500).json({ error: "Failed to fetch testimonials" });
  }
};

// Approve a testimonial (admin only)
export const approveTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Testimonial.findById(id);

    if (!existing) {
      return res.status(404).json({ error: "Testimonial not found" });
    }

    const wasPending = existing.status !== true;
    existing.status = true;
    await existing.save();

    if (wasPending && existing.studentId) {
      try {
        const settings = await getCoinSettings();
        await awardCoins({
          studentId: existing.studentId.toString(),
          eventType: "TESTIMONIAL_APPROVED",
          coins: settings.testimonialApprovedCoins,
          metadata: {
            testimonialId: existing._id.toString(),
          },
          idempotencyKey: `testimonial:${existing._id}:approved`,
        });
      } catch (coinError) {
        console.error("Testimonial coin reward failed:", coinError);
      }
    }

    res.json({ message: "Testimonial approved successfully", testimonial: existing });
  } catch (error) {
    console.error("Error approving testimonial:", error);
    res.status(500).json({ error: "Failed to approve testimonial" });
  }
};

// Reject a testimonial (admin only)
export const rejectTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findByIdAndUpdate(
      id,
      { status: false },
      { new: true }
    );

    if (!testimonial) {
      return res.status(404).json({ error: "Testimonial not found" });
    }

    res.json({ message: "Testimonial rejected successfully", testimonial });
  } catch (error) {
    console.error("Error rejecting testimonial:", error);
    res.status(500).json({ error: "Failed to reject testimonial" });
  }
};

// Toggle featured status (admin only)
export const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({ error: "Testimonial not found" });
    }

    testimonial.featured = !testimonial.featured;
    await testimonial.save();

    res.json({ message: "Featured status toggled successfully", testimonial });
  } catch (error) {
    console.error("Error toggling featured status:", error);
    res.status(500).json({ error: "Failed to toggle featured status" });
  }
};

// Delete a testimonial (admin only)
export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findByIdAndDelete(id);

    if (!testimonial) {
      return res.status(404).json({ error: "Testimonial not found" });
    }

    res.json({ message: "Testimonial deleted successfully" });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).json({ error: "Failed to delete testimonial" });
  }
};

// Update a testimonial (admin only)
export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle image upload
    if (req.file) {
      updateData.image = req.file.path;
    }

    // Validate rating if provided
    if (updateData.rating) {
      updateData.rating = Math.max(1, Math.min(5, parseInt(updateData.rating)));
    }

    const testimonial = await Testimonial.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!testimonial) {
      return res.status(404).json({ error: "Testimonial not found" });
    }

    res.json({ message: "Testimonial updated successfully", testimonial });
  } catch (error) {
    console.error("Error updating testimonial:", error);
    res.status(500).json({ error: "Failed to update testimonial" });
  }
};

// Get testimonial statistics (admin only)
export const getTestimonialStats = async (req, res) => {
  try {
    const total = await Testimonial.countDocuments();
    const approved = await Testimonial.countDocuments({ status: true });
    const pending = await Testimonial.countDocuments({ status: false });
    const featured = await Testimonial.countDocuments({ featured: true });

    res.json({
      total,
      approved,
      pending,
      featured,
    });
  } catch (error) {
    console.error("Error fetching testimonial stats:", error);
    res.status(500).json({ error: "Failed to fetch testimonial statistics" });
  }
};
