import Payment from "../models/Payment.js";
import Student from "../models/Students.js";
import Course from "../models/Content/Course.js";
import Admin from "../models/Admin.js";
import nodemailer from "nodemailer";

// Create payment record
export const createPayment = async (req, res) => {
  try {
    const { courseId, amount, paymentScreenshot } = req.body;
    const studentId = req.user.id; // Get student ID from authenticated user

    const payment = new Payment({
      student: studentId,
      course: courseId,
      amount,
      paymentScreenshot,
      status: "pending",
    });

    await payment.save();
    res.status(201).json({ message: "Payment record created", payment });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating payment", error: error.message });
  }
};

// Get all payments (for admin)
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("student", "name email phone")
      .populate("course", "title price")
      .populate("verifiedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ payments });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching payments", error: error.message });
  }
};

// Get payments by student
export const getStudentPayments = async (req, res) => {
  try {
    const { studentId } = req.params;
    const authenticatedStudentId = req.user?.id;

    if (!authenticatedStudentId || authenticatedStudentId !== studentId) {
      return res.status(403).json({
        message: "Forbidden: You can only access your own payments",
      });
    }

    const payments = await Payment.find({ student: studentId })
      .populate("course", "title price")
      .sort({ createdAt: -1 });

    res.status(200).json({ payments });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching student payments",
      error: error.message,
    });
  }
};

// Update payment status (admin verification)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, transactionId, notes } = req.body;
    const adminId = req.admin._id;

    const updateData = {
      status,
      verifiedBy: adminId,
      verifiedAt: new Date(),
    };

    if (transactionId) updateData.transactionId = transactionId;
    if (notes) updateData.notes = notes;

    const payment = await Payment.findByIdAndUpdate(paymentId, updateData, {
      new: true,
    })
      .populate("student", "name email phone")
      .populate("course", "title price");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json({ message: "Payment status updated", payment });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating payment", error: error.message });
  }
};

// Send invoice email
export const sendInvoiceEmail = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate("student", "name email phone")
      .populate("course", "title price");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "verified") {
      return res
        .status(400)
        .json({ message: "Payment must be verified before sending invoice" });
    }

    // Create email transporter
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email template
    const invoiceHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">IICPA Institute</h1>
          <p style="color: #666; margin: 5px 0;">Invoice</p>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #333;">Payment Confirmation</h2>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Student Details</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${
              payment.student.name
            }</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${
              payment.student.email
            }</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${
              payment.student.phone
            }</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Course Details</h3>
            <p style="margin: 5px 0;"><strong>Course:</strong> ${
              payment.course.title
            }</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> Rs. ${
              payment.amount
            }</p>
            <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${
              payment.transactionId || "N/A"
            }</p>
            <p style="margin: 5px 0;"><strong>Payment Date:</strong> ${new Date(
              payment.createdAt
            ).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: green; font-weight: bold;">Verified</span></p>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #2d5a2d;">Payment Confirmed!</h3>
            <p style="margin: 5px 0; color: #2d5a2d;">Your payment has been verified and you now have access to the course.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666;">Thank you for choosing IICPA Institute!</p>
            <p style="color: #666;">For any queries, please contact us.</p>
          </div>
        </div>
      </div>
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: payment.student.email,
      subject: `Payment Confirmation - ${payment.course.title} - IICPA Institute`,
      html: invoiceHtml,
    });

    // Update payment record
    await Payment.findByIdAndUpdate(paymentId, {
      invoiceSent: true,
      invoiceSentAt: new Date(),
    });

    res.status(200).json({ message: "Invoice email sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending invoice email", error: error.message });
  }
};

// Upload payment screenshot
export const uploadPaymentScreenshot = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { paymentScreenshot: req.file.path },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res
      .status(200)
      .json({ message: "Screenshot uploaded successfully", payment });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading screenshot", error: error.message });
  }
};
