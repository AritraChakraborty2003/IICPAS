import mongoose from "mongoose";

// GST Invoice Item Schema
const gstItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  hsnCode: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{4,8}$/.test(v); // HSN code should be 4-8 digits
      },
      message: "HSN code must be 4-8 digits",
    },
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01,
  },
  unit: {
    type: String,
    required: true,
    enum: [
      "NOS",
      "KGS",
      "LTR",
      "MTR",
      "SQM",
      "CBM",
      "PCS",
      "SET",
      "PAIR",
      "DOZ",
      "GRM",
      "ML",
      "OTHER",
    ],
    default: "NOS",
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  taxableAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  cgstRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  sgstRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  igstRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  cessRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  cgstAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  sgstAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  igstAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  cessAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
});

// GST Invoice Schema
const gstInvoiceSchema = new mongoose.Schema(
  {
    // Basic Invoice Details
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: Date,

    // Supplier Details (Seller)
    supplier: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      gstin: {
        type: String,
        required: true,
        validate: {
          validator: function (v) {
            return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
              v
            );
          },
          message: "Invalid GSTIN format",
        },
      },
      address: {
        street: String,
        city: String,
        state: String,
        pincode: {
          type: String,
          validate: {
            validator: function (v) {
              return /^[1-9][0-9]{5}$/.test(v);
            },
            message: "Invalid pincode format",
          },
        },
        country: {
          type: String,
          default: "India",
        },
      },
      contact: {
        phone: String,
        email: {
          type: String,
          validate: {
            validator: function (v) {
              return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: "Invalid email format",
          },
        },
      },
    },

    // Recipient Details (Buyer)
    recipient: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      gstin: {
        type: String,
        validate: {
          validator: function (v) {
            if (!v) return true; // GSTIN is optional for B2C
            return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
              v
            );
          },
          message: "Invalid GSTIN format",
        },
      },
      address: {
        street: String,
        city: String,
        state: String,
        pincode: {
          type: String,
          validate: {
            validator: function (v) {
              return /^[1-9][0-9]{5}$/.test(v);
            },
            message: "Invalid pincode format",
          },
        },
        country: {
          type: String,
          default: "India",
        },
      },
      contact: {
        phone: String,
        email: {
          type: String,
          validate: {
            validator: function (v) {
              return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: "Invalid email format",
          },
        },
      },
    },

    // Invoice Items
    items: [gstItemSchema],

    // Tax Summary
    taxSummary: {
      totalTaxableAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      totalCgstAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalSgstAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalIgstAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalCessAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalTaxAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      grandTotal: {
        type: Number,
        required: true,
        min: 0,
      },
    },

    // Additional Details
    transportDetails: {
      vehicleNumber: String,
      transportMode: {
        type: String,
        enum: ["Road", "Rail", "Air", "Ship", "Other"],
      },
      distance: Number,
      transporterName: String,
      transporterGstin: String,
    },

    // E-Invoice Specific Fields
    einvoiceDetails: {
      irn: String, // Invoice Reference Number
      qrCode: String, // QR Code data
      ackNo: String, // Acknowledgment Number
      ackDate: Date,
      status: {
        type: String,
        enum: ["DRAFT", "GENERATED", "CANCELLED", "REJECTED"],
        default: "DRAFT",
      },
      ewayBillNo: String,
      ewayBillDate: Date,
    },

    // Simulation Specific Fields
    simulationConfig: {
      isSimulation: {
        type: Boolean,
        default: true,
      },
      difficulty: {
        type: String,
        enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
        default: "BEGINNER",
      },
      hints: [
        {
          field: String,
          hint: String,
          order: Number,
        },
      ],
      validationRules: {
        requiredFields: [String],
        autoCalculate: {
          type: Boolean,
          default: true,
        },
        showErrors: {
          type: Boolean,
          default: true,
        },
      },
    },

    // Learning Progress
    learningProgress: {
      completedSteps: [String],
      currentStep: String,
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      timeSpent: {
        type: Number,
        default: 0, // in minutes
      },
      attempts: {
        type: Number,
        default: 0,
      },
    },

    // Metadata
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
    },
    caseStudyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CaseStudy",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate totals
gstInvoiceSchema.pre("save", function (next) {
  if (this.items && this.items.length > 0) {
    let totalTaxableAmount = 0;
    let totalCgstAmount = 0;
    let totalSgstAmount = 0;
    let totalIgstAmount = 0;
    let totalCessAmount = 0;

    this.items.forEach((item) => {
      // Calculate taxable amount
      item.taxableAmount = item.quantity * item.unitPrice;

      // Calculate tax amounts
      item.cgstAmount = (item.taxableAmount * item.cgstRate) / 100;
      item.sgstAmount = (item.taxableAmount * item.sgstRate) / 100;
      item.igstAmount = (item.taxableAmount * item.igstRate) / 100;
      item.cessAmount = (item.taxableAmount * item.cessRate) / 100;

      // Calculate total amount for item
      item.totalAmount =
        item.taxableAmount +
        item.cgstAmount +
        item.sgstAmount +
        item.igstAmount +
        item.cessAmount;

      // Add to totals
      totalTaxableAmount += item.taxableAmount;
      totalCgstAmount += item.cgstAmount;
      totalSgstAmount += item.sgstAmount;
      totalIgstAmount += item.igstAmount;
      totalCessAmount += item.cessAmount;
    });

    // Update tax summary
    this.taxSummary = {
      totalTaxableAmount,
      totalCgstAmount,
      totalSgstAmount,
      totalIgstAmount,
      totalCessAmount,
      totalTaxAmount:
        totalCgstAmount + totalSgstAmount + totalIgstAmount + totalCessAmount,
      grandTotal:
        totalTaxableAmount +
        totalCgstAmount +
        totalSgstAmount +
        totalIgstAmount +
        totalCessAmount,
    };
  }

  next();
});

// Virtual for determining if it's interstate or intrastate
gstInvoiceSchema.virtual("isInterstate").get(function () {
  return this.supplier.address.state !== this.recipient.address.state;
});

// Virtual for determining tax type (CGST+SGST or IGST)
gstInvoiceSchema.virtual("taxType").get(function () {
  return this.isInterstate ? "IGST" : "CGST+SGST";
});

gstInvoiceSchema.index({ "supplier.gstin": 1 });
gstInvoiceSchema.index({ "recipient.gstin": 1 });
gstInvoiceSchema.index({ chapterId: 1 });
gstInvoiceSchema.index({ createdBy: 1 });

// Prevent OverwriteModelError
const GSTSimulation =
  mongoose.models.GSTSimulation ||
  mongoose.model("GSTSimulation", gstInvoiceSchema);

export default GSTSimulation;
