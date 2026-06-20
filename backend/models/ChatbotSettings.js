import mongoose from "mongoose";

const quickReplySchema = new mongoose.Schema({
  label: { type: String, required: true },
  trigger: { type: String, required: true },
}, { _id: false });

const responseActionSchema = new mongoose.Schema({
  label: { type: String, required: true },
  trigger: { type: String, required: true },
}, { _id: false });

const responseSchema = new mongoose.Schema({
  trigger: { type: String, required: true },
  text: { type: String, required: true },
  showCourses: { type: Boolean, default: false },
  actions: { type: [responseActionSchema], default: [] },
}, { _id: false });

const chatbotSettingsSchema = new mongoose.Schema({
  assistantName: {
    type: String,
    required: true,
    default: "Neha Singh"
  },
  profilePicture: {
    type: String,
    required: true,
    default: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
  },
  welcomeMessage: {
    type: String,
    required: true,
    default: "Hi! I'm your course assistant. To provide you with personalized assistance, I'll need a few details from you.\n\nLet's start with your **Full Name** please:"
  },
  status: {
    type: String,
    required: true,
    default: "Online",
    enum: ["Online", "Away", "Busy", "Offline"]
  },
  welcomeQuickReplies: {
    type: [quickReplySchema],
    default: [
      { label: "Check Prices", trigger: "get prices" },
      { label: "View Courses", trigger: "what courses do you offer?" },
      { label: "Course Duration", trigger: "what is the duration?" },
      { label: "Certificates", trigger: "do you provide certificates?" }
    ]
  },
  responses: {
    type: [responseSchema],
    default: [
      {
        trigger: "what courses do you offer?",
        text: "We offer courses in Accounting, HR, Finance, US CMA, and Excel. Here are our top courses:",
        showCourses: true,
        actions: [
          { label: "Check Prices", trigger: "get prices" },
          { label: "Course Duration", trigger: "what is the duration?" }
        ]
      },
      {
        trigger: "how much do courses cost?",
        text: "Course prices vary by level and content. Here is a list of our courses with their prices:",
        showCourses: true,
        actions: [
          { label: "View Courses", trigger: "what courses do you offer?" },
          { label: "Certificates", trigger: "do you provide certificates?" }
        ]
      },
      {
        trigger: "get prices",
        text: "Sure! Here are our available courses and their pricing:",
        showCourses: true,
        actions: [
          { label: "How do I enroll?", trigger: "how do i enroll?" },
          { label: "Certificates", trigger: "do you provide certificates?" }
        ]
      },
      {
        trigger: "what is the duration?",
        text: "Course duration depends on the level and content. Foundation courses typically take 2-4 weeks, Core courses 4-8 weeks, and Expert courses 8-12 weeks. Check individual course pages for specific details.",
        showCourses: false,
        actions: [
          { label: "Check Prices", trigger: "get prices" },
          { label: "How do I enroll?", trigger: "how do i enroll?" }
        ]
      },
      {
        trigger: "do you provide certificates?",
        text: "Yes! We provide completion certificates for all our courses. These certificates are industry-recognized and can help boost your career prospects.",
        showCourses: false,
        actions: [
          { label: "View Courses", trigger: "what courses do you offer?" },
          { label: "How do I enroll?", trigger: "how do i enroll?" }
        ]
      },
      {
        trigger: "how do i enroll?",
        text: "Simply click the 'Enroll Now' button on any course card, or visit the course detail page. You'll be redirected to our enrollment process where you can complete your registration.",
        showCourses: false,
        actions: [
          { label: "Check Prices", trigger: "get prices" },
          { label: "Prerequisites", trigger: "what are the prerequisites?" }
        ]
      },
      {
        trigger: "what are the prerequisites?",
        text: "Prerequisites vary by course level. Foundation courses have no prerequisites, Core courses may require basic knowledge, and Expert courses typically require intermediate to advanced knowledge in the subject area.",
        showCourses: false,
        actions: [
          { label: "View Courses", trigger: "what courses do you offer?" }
        ]
      }
    ]
  },
  defaultResponse: {
    type: String,
    default: "I'm here to help with course-related questions! Here are our available courses and their pricing. You can also ask me about specific details like certificates or enrollment."
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
chatbotSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

export default mongoose.model("ChatbotSettings", chatbotSettingsSchema);

