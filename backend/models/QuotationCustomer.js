import mongoose from "mongoose";

const quotationCustomerSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: "",
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    billingAddress: {
      type: String,
      trim: true,
      default: "",
    },
    shippingAddress: {
      type: String,
      trim: true,
      default: "",
    },
    billingState: {
      type: String,
      trim: true,
      default: "",
    },
    shippingState: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    pincode: {
      type: String,
      trim: true,
      default: "",
    },
    country: {
      type: String,
      trim: true,
      default: "India",
    },
    metadata: {
      source: { type: String, trim: true, default: "manual" },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    },
  },
  { timestamps: true }
);

quotationCustomerSchema.index({ customerName: 1, phone: 1 });

export default mongoose.model("QuotationCustomer", quotationCustomerSchema);
