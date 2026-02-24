import Company from "../models/Company.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { recordLogin, recordLogout } from "../services/authAuditService.js";

dotenv.config();

const JWT_SECRET =
  process.env.JWT_SECRET || "default_jwt_secret_for_development";
const isProd = process.env.NODE_ENV === "production";

const getTokenExpiry = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) return null;
  return new Date(decoded.exp * 1000);
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// Register
export const registerCompany = async (req, res) => {
  const { fullName, phone, email, password } = req.body;
  const document = req.file;

  if (!fullName || !email || !phone || !password || !document)
    return res.status(400).json({ message: "All fields required" });

  const exists = await Company.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const company = await Company.create({
    fullName,
    phone,
    email,
    password: hashedPassword,
    documentPath: document.path,
  });

  res.status(201).json({ message: "Company registered, pending approval" });
};

export const loginCompany = async (req, res) => {
  const { email, password } = req.body;

  try {
    const company = await Company.findOne({ email });
    if (!company) return res.status(404).json({ message: "Not registered" });

    if (company.status !== "approved") {
      return res.status(403).json({ message: "Not approved by admin" });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    console.log(JWT_SECRET);
    const token = jwt.sign(
      {
        id: company._id,
        role: "company",
        name: company.fullName,
        email: company.email,
        documentPath: company.documentPath,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    await recordLogin({
      role: "company",
      actorModel: "Company",
      actorId: company._id,
      displayName: company.fullName,
      email: company.email,
      req,
      sessionExpiresAt: getTokenExpiry(token),
    });

    // Set token in HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd, // only use HTTPS cookies in production
      sameSite: isProd ? "None" : "Lax", // Lax for dev, None for cross-site prod
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return response
    res.status(200).json({
      message: "Login successful",
      company: {
        id: company._id,
        name: company.name,
        email: company.email,
        status: company.status,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const logoutCompany = (req, res) => {
  const doLogout = async () => {
    const token = req.cookies.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded?.id) {
          const company = await Company.findById(decoded.id).select("_id fullName email");
          if (company) {
            await recordLogout({
              role: "company",
              actorModel: "Company",
              actorId: company._id,
              displayName: company.fullName,
              email: company.email,
              req,
            });
          }
        }
      } catch {
        // Continue clearing cookie even when token is invalid.
      }
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    res.status(200).json({ message: "Logout successful" });
  };

  doLogout().catch(() => {
    res.status(200).json({ message: "Logout successful" });
  });
};

// Forgot password — send OTP
export const sendOtp = async (req, res) => {
  const { email } = req.body;
  const company = await Company.findOne({ email });
  if (!company)
    return res.status(404).json({ message: "Email not registered" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  company.otp = otp;
  company.otpExpiry = expiry;
  await company.save();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "IICPA Company OTP Verification",
    html: `<h2>Your OTP is ${otp}</h2><p>It is valid for 10 minutes</p>`,
  });

  res.json({ message: "OTP sent" });
};

// Reset password using OTP
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const company = await Company.findOne({ email });

  if (!company || company.otp !== otp || company.otpExpiry < new Date())
    return res.status(400).json({ message: "Invalid or expired OTP" });

  company.password = await bcrypt.hash(newPassword, 10);
  company.otp = null;
  company.otpExpiry = null;
  await company.save();

  res.json({ message: "Password reset successful" });
};

// Admin: Get all companies
export const getAllCompanies = async (_, res) => {
  const companies = await Company.find().sort({ createdAt: -1 });
  res.json(companies);
};

// Admin: Approve company
export const approveCompany = async (req, res) => {
  const company = await Company.findByIdAndUpdate(
    req.params.id,
    { status: "approved" },
    { new: true }
  );
  res.json({ message: "Approved", company });
};

// Update company profile
export const updateCompanyProfile = async (req, res) => {
  try {
    const { name, phone, password, confirmPassword } = req.body;
    const profileImage = req.file;
    const companyId = req.company.id;

    // Find the company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Update basic fields (company name cannot be changed)
    if (phone) company.phone = phone;

    // Handle password update
    if (password) {
      if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
      }
      company.password = await bcrypt.hash(password, 10);
    }

    // Handle profile image upload
    if (profileImage) {
      company.image = profileImage.path;
    }

    await company.save();

    res.status(200).json({
      message: "Company profile updated successfully",
      company: {
        name: company.fullName,
        email: company.email,
        phone: company.phone,
        image: company.image,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update company profile" });
  }
};

// Get company documents by email
export const getCompanyDocuments = async (req, res) => {
  try {
    const { email } = req.body;
    const companyId = req.company.id;

    // Find the company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Verify the email matches the authenticated company
    if (company.email !== email) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const documents = [];

    // Add profile image if exists
    if (company.image) {
      documents.push({
        name: "Profile Image",
        filename: company.image.split("/").pop(),
        path: company.image,
        type: "image",
        uploadedAt: company.updatedAt || company.createdAt,
      });
    }

    // Add registration document if exists
    if (company.documentPath) {
      documents.push({
        name: "Registration Document",
        filename: company.documentPath.split("/").pop(),
        path: company.documentPath,
        type: "document",
        uploadedAt: company.createdAt,
      });
    }

    res.status(200).json({
      documents: documents,
    });
  } catch (error) {
    console.error("Documents fetch error:", error);
    res.status(500).json({ error: "Failed to fetch company documents" });
  }
};
