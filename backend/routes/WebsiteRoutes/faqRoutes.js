import express from "express";
import FAQ from "../../models/Website/FAQ.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { isAdmin } from "../../middleware/isAdmin.js";

const router = express.Router();
const FAQ_SLUG = "faq";

const normalizeFaqPayload = (body = {}) => {
  const meta = body.meta || {};
  const normalized = {
    ...body,
    slug: body.slug || FAQ_SLUG,
    isActive: body.isActive ?? true,
    lastUpdated: new Date(),
  };

  if (meta.title ?? body.metaTitle) {
    normalized.metaTitle = meta.title ?? body.metaTitle;
  }

  if (meta.description ?? body.metaDescription) {
    normalized.metaDescription = meta.description ?? body.metaDescription;
  }

  if (Array.isArray(meta.keywords) && meta.keywords.length > 0) {
    normalized.metaKeywords = meta.keywords;
  } else if (Array.isArray(body.metaKeywords) && body.metaKeywords.length > 0) {
    normalized.metaKeywords = body.metaKeywords;
  } else if (typeof meta.keywords === "string" && meta.keywords.trim()) {
    normalized.metaKeywords = meta.keywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }

  return normalized;
};

const upsertFaq = async (body = {}) => {
  const faqData = normalizeFaqPayload(body);

  let faq =
    (await FAQ.findOne({ slug: faqData.slug }).sort({ updatedAt: -1 })) ||
    (await FAQ.findOne({ isActive: true }).sort({ updatedAt: -1 })) ||
    (await FAQ.findOne().sort({ updatedAt: -1 }));

  if (!faq) {
    await FAQ.updateMany({}, { isActive: false });
    faq = new FAQ(faqData);
  } else {
    faq.set(faqData);
    faq.isActive = true;
    await FAQ.updateMany({ _id: { $ne: faq._id } }, { isActive: false });
  }

  await faq.save();
  return faq;
};

// Get FAQ data for frontend
router.get("/", async (req, res) => {
  try {
    const faq = await FAQ.getActiveFAQ();

    if (!faq) {
      // Return default FAQ data if none exists
      const defaultFAQ = {
        hero: {
          title: "Frequently Asked Questions",
          subtitle:
            "Find answers to common questions about our courses, admissions, and services. Can't find what you're looking for? Contact us for personalized assistance.",
          button1: { text: "Contact Support", link: "/contact" },
          button2: { text: "Browse Courses", link: "/course" },
          backgroundGradient: {
            from: "from-blue-200",
            via: "via-white",
            to: "to-indigo-200",
          },
          textColor: "text-gray-800",
        },
        categories: [
          {
            title: "General Questions",
            icon: "FaQuestionCircle",
            faqs: [
              {
                question: "What is IICPA Institute?",
                answer:
                  "IICPA Institute is a leading online education platform specializing in finance and accounting courses. We provide comprehensive training programs, practical simulations, and career guidance to help students excel in their professional journey.",
              },
              {
                question: "How do I get started?",
                answer:
                  "Getting started is easy! Simply browse our courses, create an account, and enroll in the program that interests you. You can also contact our support team for personalized guidance on choosing the right course for your career goals.",
              },
              {
                question: "Do you offer certificates?",
                answer:
                  "Yes, we provide certificates upon successful completion of our courses. Our certificates are recognized in the industry and can help boost your professional profile.",
              },
            ],
          },
          {
            title: "Courses & Learning",
            icon: "FaGraduationCap",
            faqs: [
              {
                question: "What courses do you offer?",
                answer:
                  "We offer a wide range of courses including GST training, accounting fundamentals, tax preparation, financial analysis, and specialized certification programs. All courses are designed with practical applications in mind.",
              },
              {
                question: "How long are the courses?",
                answer:
                  "Course duration varies depending on the program. Most courses range from 4-12 weeks, with flexible learning schedules that accommodate working professionals and students.",
              },
              {
                question: "Are the courses self-paced?",
                answer:
                  "Yes, most of our courses are self-paced, allowing you to learn at your own convenience. However, we also offer live sessions and interactive workshops for enhanced learning.",
              },
            ],
          },
          {
            title: "Payment & Pricing",
            icon: "FaCreditCard",
            faqs: [
              {
                question: "What payment methods do you accept?",
                answer:
                  "We accept all major credit cards, debit cards, net banking, UPI, and digital wallets. We also offer EMI options for select courses to make learning more accessible.",
              },
              {
                question: "Do you offer refunds?",
                answer:
                  "Yes, we offer a 7-day money-back guarantee if you're not satisfied with the course content. Please refer to our refund policy for detailed terms and conditions.",
              },
              {
                question: "Are there any discounts available?",
                answer:
                  "We regularly offer discounts and special promotions. Students and early bird registrations often receive additional benefits. Follow our social media channels for the latest offers.",
              },
            ],
          },
          {
            title: "Account & Support",
            icon: "FaUser",
            faqs: [
              {
                question: "How do I reset my password?",
                answer:
                  "You can reset your password by clicking on 'Forgot Password' on the login page. Enter your registered email address, and we'll send you a reset link.",
              },
              {
                question: "How can I contact support?",
                answer:
                  "You can contact our support team through email, phone, or live chat. We also have a comprehensive help center with detailed guides and tutorials.",
              },
              {
                question: "Is my data secure?",

                answer:
                  "Absolutely. We use industry-standard encryption and security measures to protect your personal and payment information. Your privacy and security are our top priorities.",
              },
            ],
          },
        ],
        meta: {
          title: "FAQ - Frequently Asked Questions | IICPA Institute",
          description:
            "Find answers to common questions about IICPA Institute courses, admissions, payments, and support. Get help with your learning journey.",
          keywords: [
            "FAQ",
            "questions",
            "help",
            "support",
            "courses",
            "admissions",
            "IICPA",
          ],
        },
      };

      return res.status(200).json(defaultFAQ);
    }

    res.status(200).json(faq.getFormattedData());
  } catch (error) {
    console.error("Error fetching FAQ data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch FAQ data",
      error: error.message,
    });
  }
});

// Get all FAQ data for admin (including inactive)
router.get("/admin/all", requireAuth, isAdmin, async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ updatedAt: -1 });
    res.status(200).json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    console.error("Error fetching all FAQ data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch FAQ data",
      error: error.message,
    });
  }
});

// Get specific FAQ by ID for admin
router.get("/admin/:id", requireAuth, isAdmin, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    res.status(200).json({
      success: true,
      data: faq,
    });
  } catch (error) {
    console.error("Error fetching FAQ:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch FAQ",
      error: error.message,
    });
  }
});

// Create new FAQ
router.post("/admin/create", requireAuth, isAdmin, async (req, res) => {
  try {
    const faq = await upsertFaq(req.body);

    res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      data: faq,
    });
  } catch (error) {
    console.error("Error creating FAQ:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create FAQ",
      error: error.message,
    });
  }
});

// Update FAQ
router.put("/admin/:id", requireAuth, isAdmin, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    const faqData = normalizeFaqPayload(req.body);
    faq.set(faqData);
    faq.isActive = true;
    await FAQ.updateMany({ _id: { $ne: faq._id } }, { isActive: false });
    await faq.save();

    res.status(200).json({
      success: true,
      message: "FAQ updated successfully",
      data: faq,
    });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update FAQ",
      error: error.message,
    });
  }
});

// Delete FAQ
router.delete("/admin/:id", requireAuth, isAdmin, async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete FAQ",
      error: error.message,
    });
  }
});

// Toggle FAQ active status
router.patch("/admin/:id/toggle", requireAuth, isAdmin, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    // If activating this FAQ, deactivate all others
    if (!faq.isActive) {
      await FAQ.updateMany({}, { isActive: false });
    }

    faq.isActive = !faq.isActive;
    await faq.save();

    res.status(200).json({
      success: true,
      message: `FAQ ${faq.isActive ? "activated" : "deactivated"} successfully`,
      data: faq,
    });
  } catch (error) {
    console.error("Error toggling FAQ status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle FAQ status",
      error: error.message,
    });
  }
});

export default router;
