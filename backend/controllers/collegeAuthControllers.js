import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import College from "../models/College.js";
import { generateToken } from "../utils/generateToken.js";
import dotenv from "dotenv";
import { recordLogin, recordLogout } from "../services/authAuditService.js";

dotenv.config();

const getTokenExpiry = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) return null;
  return new Date(decoded.exp * 1000);
};
export const sendCollegeOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const college = await College.findOne({ email });
    if (!college) return res.status(404).json({ message: "College not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    college.otp = otp;
    college.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await college.save();

    // In real app, send this OTP via email or SMS
    console.log(`OTP for ${email}: ${otp}`);

    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const collegeSignup = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    const document = req.file?.path;

    const existing = await College.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const college = await College.create({
      name,
      phone,
      email,
      password: hashedPassword,
      document,
    });

    const token = generateToken(college);
    await recordLogin({
      role: "college",
      actorModel: "College",
      actorId: college._id,
      displayName: college.name,
      email: college.email,
      req,
      sessionExpiresAt: getTokenExpiry(token),
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ message: "Signup successful", college });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const collegeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const college = await College.findOne({ email });
    if (!college) return res.status(404).json({ message: "College not found" });

    const isMatch = await bcrypt.compare(password, college.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(college);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Login successful", college });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const collegeLogout = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "default_jwt_secret_for_development"
        );
        if (decoded?.id) {
          const college = await College.findById(decoded.id).select("_id name email");
          if (college) {
            await recordLogout({
              role: "college",
              actorModel: "College",
              actorId: college._id,
              displayName: college.name,
              email: college.email,
              req,
            });
          }
        }
      } catch {
        // Continue clearing cookie even when token is invalid.
      }
    }

    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
  } catch {
    res.status(200).json({ message: "Logged out successfully" });
  }
};

export const isCollegeLoggedIn = (req, res) => {
  // console.log("Hi");
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ isLoggedIn: false });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_jwt_secret_for_development"
    );
    if (decoded.role === "college") {
      // console.log(decoded.name, decoded.email, decoded);
      return res.status(200).json({
        isLoggedIn: true,
        name: decoded.name,
        user: decoded,
        email: decoded.email,
      });
    }
    return res.status(403).json({ isLoggedIn: false });
  } catch {
    return res.status(401).json({ isLoggedIn: false });
  }
};

export const forgotCollegePassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const college = await College.findOne({ email });
    if (!college) return res.status(404).json({ message: "Email not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    college.password = hashed;
    await college.save();

    res.status(200).json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resetCollegePassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const college = await College.findOne({ email });
    if (!college) return res.status(404).json({ message: "College not found" });

    if (college.otp !== otp || new Date() > college.otpExpiry) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    college.password = hashed;
    college.otp = null;
    college.otpExpiry = null;
    await college.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllColleges = async (req, res) => {
  try {
    const colleges = await College.find().sort({ createdAt: -1 });
    res.status(200).json({ colleges });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch colleges", error: err.message });
  }
};

// Approve a college by ID
export const approveCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const college = await College.findById(id);
    if (!college) return res.status(404).json({ message: "College not found" });

    college.status = "approved";
    await college.save();

    res.status(200).json({ message: "College approved", college });
  } catch (err) {
    res.status(500).json({ message: "Approval failed", error: err.message });
  }
};

// Update college profile
export const updateCollegeProfile = async (req, res) => {
  try {
    const { name, phone, password, confirmPassword } = req.body;
    const collegeId = req.user.id; // From JWT token

    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    // Update basic info
    if (name) college.name = name;
    if (phone) college.phone = phone;

    // Handle password update
    if (password) {
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      college.password = await bcrypt.hash(password, 10);
    }

    // Handle profile image upload
    if (req.file) {
      college.image = req.file.path.replace(/\\/g, "/");
    }

    await college.save();

    // Return updated college data (without password)
    const updatedCollege = {
      _id: college._id,
      name: college.name,
      email: college.email,
      phone: college.phone,
      image: college.image,
      document: college.document,
      status: college.status,
      createdAt: college.createdAt,
      updatedAt: college.updatedAt,
    };

    res.status(200).json({
      message: "College profile updated successfully",
      college: updatedCollege,
    });
  } catch (err) {
    console.error("College profile update error:", err);
    res
      .status(500)
      .json({ message: "Failed to update profile", error: err.message });
  }
};
