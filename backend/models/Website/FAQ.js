import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    // Hero section
    hero: {
      title: {
        type: String,
        required: true,
        default: "Frequently Asked Questions"
      },
      subtitle: {
        type: String,
        required: true,
        default: "Find answers to common questions about our courses, admissions, and services. Can't find what you're looking for? Contact us for personalized assistance."
      },
      button1: {
        text: {
          type: String,
          required: true,
          default: "Contact Support"
        },
        link: {
          type: String,
          required: true,
          default: "/contact"
        }
      },
      button2: {
        text: {
          type: String,
          required: true,
          default: "Browse Courses"
        },
        link: {
          type: String,
          required: true,
          default: "/course"
        }
      },
      backgroundGradient: {
        from: { type: String, default: "from-blue-200" },
        via: { type: String, default: "via-white" },
        to: { type: String, default: "to-indigo-200" }
      },
      textColor: { type: String, default: "text-gray-800" }
    },

    // FAQ Categories
    categories: [
      {
        title: {
          type: String,
          required: true
        },
        icon: {
          type: String,
          required: true,
          default: "FaQuestionCircle"
        },
        faqs: [
          {
            question: {
              type: String,
              required: true
            },
            answer: {
              type: String,
              required: true
            }
          }
        ]
      }
    ],

    // Meta information
    metaTitle: {
      type: String,
      default: "FAQ - Frequently Asked Questions | IICPA Institute"
    },
    metaDescription: {
      type: String,
      default: "Find answers to common questions about IICPA Institute courses, admissions, payments, and support. Get help with your learning journey."
    },
    metaKeywords: {
      type: [String],
      default: ["FAQ", "questions", "help", "support", "courses", "admissions", "IICPA"]
    },

    // SEO
    slug: {
      type: String,
      unique: true,
      default: "faq"
    },

    // Status
    isActive: {
      type: Boolean,
      default: true
    },

    // Timestamps
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

faqSchema.index({ isActive: 1 });

// Pre-save middleware to update lastUpdated
faqSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to get active FAQ
faqSchema.statics.getActiveFAQ = function() {
  return this.findOne({ isActive: true }).sort({ updatedAt: -1 });
};

// Instance method to get formatted data for frontend
faqSchema.methods.getFormattedData = function() {
  return {
    hero: this.hero,
    categories: this.categories,
    meta: {
      title: this.metaTitle,
      description: this.metaDescription,
      keywords: this.metaKeywords
    },
    lastUpdated: this.lastUpdated
  };
};

const FAQ = mongoose.model("FAQ", faqSchema);

export default FAQ;
