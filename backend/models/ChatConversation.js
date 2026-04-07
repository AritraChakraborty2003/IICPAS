import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  text: { type: String, required: true },
  isBot: { type: Boolean, required: true },
  timestamp: { type: Date, required: true }
});

const ChatConversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userDetails: {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" }
  },
  messages: [ChatMessageSchema],
  status: { 
    type: String, 
    enum: ["active", "completed", "abandoned"], 
    default: "active" 
  },
  startedAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  userAgent: { type: String, default: "" },
  ipAddress: { type: String, default: "" }
}, {
  timestamps: true
});

ChatConversationSchema.index({ 'userDetails.email': 1 });
ChatConversationSchema.index({ status: 1 });
ChatConversationSchema.index({ lastMessageAt: -1 });

const ChatConversation = mongoose.models.ChatConversation || mongoose.model("ChatConversation", ChatConversationSchema);

export default ChatConversation;
