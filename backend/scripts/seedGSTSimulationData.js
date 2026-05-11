import GSTReturn from "../models/GSTReturn.js";
import GSTSimulation from "../models/GSTSimulation.js";
import connectDB from "../config/db.js";

// Sample data for GST simulations
const sampleGSTReturns = [
  {
    returnType: "GSTR-1A",
    financialYear: "2024-25",
    quarter: "Quarter 1 (Apr - Jun)",
    period: "April",
    gstin: "09ABCDE1234F1Z5",
    recordDetails: {
      b2bInvoices: {
        count: 15,
        taxableValue: 250000,
        taxAmount: 45000,
        isCompleted: true,
      },
      b2cLargeInvoices: {
        count: 8,
        taxableValue: 120000,
        taxAmount: 21600,
        isCompleted: true,
      },
      exportInvoices: {
        count: 5,
        taxableValue: 180000,
        taxAmount: 0,
        isCompleted: true,
      },
      b2cOthers: {
        count: 25,
        taxableValue: 75000,
        taxAmount: 13500,
        isCompleted: true,
      },
      nilRatedSupplies: {
        count: 3,
        taxableValue: 15000,
        isCompleted: true,
      },
      creditDebitNotesRegistered: {
        count: 2,
        taxableValue: -5000,
        taxAmount: -900,
        isCompleted: true,
      },
      creditDebitNotesUnregistered: {
        count: 1,
        taxableValue: -2000,
        taxAmount: -360,
        isCompleted: true,
      },
      taxLiabilityAdvances: {
        count: 4,
        taxableValue: 30000,
        taxAmount: 5400,
        isCompleted: true,
      },
      adjustmentAdvances: {
        count: 2,
        taxableValue: -8000,
        taxAmount: -1440,
        isCompleted: true,
      },
      hsnSummary: {
        count: 12,
        taxableValue: 500000,
        taxAmount: 90000,
        isCompleted: true,
      },
      documentsIssued: {
        count: 50,
        taxableValue: 600000,
        taxAmount: 108000,
        isCompleted: true,
      },
      ecoSupplies: {
        count: 0,
        taxableValue: 0,
        taxAmount: 0,
        isCompleted: true,
      },
    },
    taxSummary: {
      totalTaxableValue: 600000,
      totalCgstAmount: 54000,
      totalSgstAmount: 54000,
      totalIgstAmount: 0,
      totalCessAmount: 0,
      totalTaxAmount: 108000,
      grandTotal: 708000,
    },
    returnStatus: "FILED",
    filingDate: new Date("2024-05-15"),
    acknowledgmentNumber: "ACK20240515001",
    simulationConfig: {
      isSimulation: true,
      difficulty: "INTERMEDIATE",
      hints: [
        {
          field: "gstin",
          hint: "GSTIN should be 15 characters long",
          order: 1,
        },
        {
          field: "recordDetails",
          hint: "Complete all record details before filing",
          order: 2,
        },
      ],
      validationRules: {
        requiredFields: ["gstin", "financialYear", "quarter", "period"],
        autoCalculate: true,
        showErrors: true,
      },
    },
    learningProgress: {
      completedSteps: ["record-details", "tax-calculation", "return-submitted"],
      currentStep: "completed",
      score: 85,
      timeSpent: 45,
      attempts: 1,
    },
  },
  {
    returnType: "GSTR-3B",
    financialYear: "2024-25",
    quarter: "Quarter 1 (Apr - Jun)",
    period: "April",
    gstin: "09ABCDE1234F1Z5",
    recordDetails: {
      b2bInvoices: {
        count: 0,
        taxableValue: 0,
        taxAmount: 0,
        isCompleted: false,
      },
      b2cLargeInvoices: {
        count: 0,
        taxableValue: 0,
        taxAmount: 0,
        isCompleted: false,
      },
      exportInvoices: {
        count: 0,
        taxableValue: 0,
        taxAmount: 0,
        isCompleted: false,
      },
      b2cOthers: {
        count: 0,
        taxableValue: 0,
        taxAmount: 0,
        isCompleted: false,
      },
      nilRatedSupplies: {
        count: 0,
        taxableValue: 0,
        isCompleted: false,
      },
      creditDebitNotesRegistered: {
        count: 0,
        taxableValue: 0,
        taxAmount: 0,
        isCompleted: false,
      },
      creditDebitNotesUnregistered: {
        count: 0,
        taxableValue: 0,
        taxAmount: 0,
        isCompleted: false,
      },
      taxLiabilityAdvances: {
        count: 0,
        taxableValue: 0,
        taxAmount: 0,
        isCompleted: false,
      },
      adjustmentAdvances: {
        count: 0,
        taxableValue: 0,
        taxAmount: 0,
        isCompleted: false,
      },
      hsnSummary: {
        count: 0,
        taxableValue: 0,
        taxAmount: 0,
        isCompleted: false,
      },
      documentsIssued: {
        count: 0,
        taxableValue: 0,
        taxAmount: 0,
        isCompleted: false,
      },
      ecoSupplies: {
        count: 0,
        taxableValue: 0,
        taxAmount: 0,
        isCompleted: false,
      },
    },
    taxSummary: {
      totalTaxableValue: 0,
      totalCgstAmount: 0,
      totalSgstAmount: 0,
      totalIgstAmount: 0,
      totalCessAmount: 0,
      totalTaxAmount: 0,
      grandTotal: 0,
    },
    returnStatus: "DRAFT",
    simulationConfig: {
      isSimulation: true,
      difficulty: "ADVANCED",
      hints: [
        {
          field: "taxLiability",
          hint: "Calculate tax liability based on outward supplies",
          order: 1,
        },
        {
          field: "itcReversal",
          hint: "Reverse ITC for non-business use",
          order: 2,
        },
      ],
      validationRules: {
        requiredFields: ["gstin", "financialYear", "quarter", "period"],
        autoCalculate: true,
        showErrors: true,
      },
    },
    learningProgress: {
      completedSteps: [],
      currentStep: "tax-liability",
      score: 0,
      timeSpent: 0,
      attempts: 0,
    },
  },
];

const sampleGSTSimulations = [
  {
    invoiceNumber: "INV-2024-001",
    invoiceDate: new Date("2024-04-15"),
    supplier: {
      name: "ABC XYZ Private Limited",
      gstin: "09ABCDE1234F1Z5",
      address: {
        street: "123 Business Park, Sector 5",
        city: "Noida",
        state: "Uttar Pradesh",
        pincode: "110001",
        country: "India",
      },
      contact: {
        phone: "+91-11-12345678",
        email: "info@abcxyz.example",
      },
    },
    recipient: {
      name: "ZZZZ Enterprises LLP",
      gstin: "09ZZZZZ6789K1Z2",
      address: {
        street: "456 Industrial Area",
        city: "Noida",
        state: "Uttar Pradesh",
        pincode: "201301",
        country: "India",
      },
      contact: {
        phone: "+91-22-87654321",
        email: "contact@abcconstruction.com",
      },
    },
    items: [
      {
        itemName: "Portland Cement",
        description: "Grade 53 Portland Cement",
        hsnCode: "25232910",
        quantity: 100,
        unit: "BAGS",
        unitPrice: 350,
        taxableAmount: 35000,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 18,
        cessRate: 0,
        cgstAmount: 3150,
        sgstAmount: 3150,
        igstAmount: 0,
        cessAmount: 0,
        totalAmount: 41300,
      },
      {
        itemName: "Steel Rods",
        description: "TMT Steel Rods 12mm",
        hsnCode: "72142000",
        quantity: 50,
        unit: "TONS",
        unitPrice: 50000,
        taxableAmount: 2500000,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 18,
        cessRate: 0,
        cgstAmount: 225000,
        sgstAmount: 225000,
        igstAmount: 0,
        cessAmount: 0,
        totalAmount: 2950000,
      },
    ],
    taxSummary: {
      totalTaxableAmount: 2535000,
      totalCgstAmount: 228150,
      totalSgstAmount: 228150,
      totalIgstAmount: 0,
      totalCessAmount: 0,
      totalTaxAmount: 456300,
      grandTotal: 2991300,
    },
    einvoiceDetails: {
      irn: "IRN20240415001",
      qrCode: JSON.stringify({
        irn: "IRN20240415001",
        ackNo: "ACK20240415001",
        ackDate: "2024-04-15T10:30:00Z",
        invoiceNumber: "INV-2024-001",
        totalAmount: 2991300,
      }),
      ackNo: "ACK20240415001",
      ackDate: new Date("2024-04-15T10:30:00Z"),
      status: "GENERATED",
    },
    simulationConfig: {
      isSimulation: true,
      difficulty: "BEGINNER",
      hints: [
        {
          field: "supplier.gstin",
          hint: "Enter valid GSTIN format",
          order: 1,
        },
        {
          field: "items",
          hint: "Add at least one item to the invoice",
          order: 2,
        },
      ],
      validationRules: {
        requiredFields: ["supplier.gstin", "recipient.name", "items"],
        autoCalculate: true,
        showErrors: true,
      },
    },
    learningProgress: {
      completedSteps: [
        "supplier-details",
        "recipient-details",
        "items",
        "einvoice-generated",
      ],
      currentStep: "completed",
      score: 92,
      timeSpent: 25,
      attempts: 1,
    },
  },
];

// Function to seed sample data
const seedGSTSimulationData = async () => {
  try {
    await connectDB();
    console.log("Connected to database");

    // Clear existing data
    await GSTReturn.deleteMany({});
    await GSTSimulation.deleteMany({});
    console.log("Cleared existing data");

    // Insert sample GST returns
    const createdReturns = await GSTReturn.insertMany(sampleGSTReturns);
    console.log(`Created ${createdReturns.length} GST returns`);

    // Insert sample GST simulations
    const createdSimulations = await GSTSimulation.insertMany(
      sampleGSTSimulations
    );
    console.log(`Created ${createdSimulations.length} GST simulations`);

    console.log("Sample data seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

// Run the seeding function
seedGSTSimulationData();
