import mongoose from "mongoose";

const quotationItemSchema = new mongoose.Schema(
  {
    description: { type: String, trim: true, default: "" },
    hsnSac: { type: String, trim: true, default: "" },
    quantity: { type: Number, default: 1 },
    unit: { type: String, trim: true, default: "NOS" },
    rate: { type: Number, default: 0 },
    discountType: {
      type: String,
      enum: ["percent", "flat"],
      default: "percent",
    },
    discountValue: { type: Number, default: 0 },
    gstRate: { type: Number, default: 18 },
  },
  { _id: true }
);

const quotationSchema = new mongoose.Schema(
  {
    quoteNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    quoteDate: {
      type: String,
      required: true,
      trim: true,
    },
    validUntil: {
      type: String,
      default: "",
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    terms: {
      type: String,
      trim: true,
      default: "",
    },
    company: {
      companyName: { type: String, trim: true, default: "" },
      legalName: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" },
      gstin: { type: String, trim: true, default: "" },
      addressLine1: { type: String, trim: true, default: "" },
      addressLine2: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      pincode: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "India" },
      invoicePrefix: { type: String, trim: true, default: "QTN" },
      invoiceNotes: { type: String, trim: true, default: "" },
    },
    customer: {
      customerName: { type: String, trim: true, default: "" },
      companyName: { type: String, trim: true, default: "" },
      gstin: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      billingAddress: { type: String, trim: true, default: "" },
      shippingAddress: { type: String, trim: true, default: "" },
      billingState: { type: String, trim: true, default: "" },
      shippingState: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      pincode: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "India" },
    },
    items: {
      type: [quotationItemSchema],
      default: [],
    },
    overallDiscountType: {
      type: String,
      enum: ["percent", "flat"],
      default: "percent",
    },
    overallDiscountValue: {
      type: Number,
      default: 0,
    },
    calculations: {
      isInterstate: { type: Boolean, default: false },
      subtotal: { type: Number, default: 0 },
      itemDiscountTotal: { type: Number, default: 0 },
      overallDiscountAmount: { type: Number, default: 0 },
      taxableAmount: { type: Number, default: 0 },
      cgstAmount: { type: Number, default: 0 },
      sgstAmount: { type: Number, default: 0 },
      igstAmount: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
    },
    lineSummaries: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "sent", "approved", "rejected"],
      default: "draft",
    },
    metadata: {
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
      source: { type: String, trim: true, default: "dashboard" },
    },
  },
  { timestamps: true }
);

quotationSchema.index({ quoteNumber: 1 }, { unique: true });
quotationSchema.index({ "customer.customerName": 1, createdAt: -1 });

export default mongoose.model("Quotation", quotationSchema);
