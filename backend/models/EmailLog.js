import mongoose from "mongoose";

const EmailLogSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  htmlContent: {
    type: String,
    required: false
  },
  textContent: {
    type: String,
    required: false
  },
  recipientTypes: [{
    type: String,
    enum: ['Student', 'Teacher', 'College', 'Company', 'Individual', 'Newsletter', 'Test']
  }],
  totalRecipients: {
    type: Number,
    required: true
  },
  successCount: {
    type: Number,
    required: true,
    default: 0
  },
  failureCount: {
    type: Number,
    required: true,
    default: 0
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  sentByName: {
    type: String,
    required: true
  },
  sentByEmail: {
    type: String,
    required: true
  },
  senderAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BulkEmailSenderAccount",
    default: null
  },
  senderAccountEmail: {
    type: String,
    default: ""
  },
  senderAccountLabel: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ['pending', 'sending', 'completed', 'failed'],
    default: 'pending'
  },
  // Keep log payload flexible to avoid blocking successful sends
  // when the result shape varies across routes/providers.
  results: [{
    type: mongoose.Schema.Types.Mixed
  }],
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  isTestEmail: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
EmailLogSchema.index({ sentBy: 1, createdAt: -1 });
EmailLogSchema.index({ status: 1 });
EmailLogSchema.index({ isTestEmail: 1 });

export default mongoose.model("EmailLog", EmailLogSchema);
