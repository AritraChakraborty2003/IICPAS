import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Center from "../models/Center.js";
import dotenv from "dotenv";
import { recordLogin, recordLogout } from "../services/authAuditService.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_for_development";

const getTokenExpiry = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) return null;
  return new Date(decoded.exp * 1000);
};

// Register new center
export const registerCenter = async (req, res) => {
  try {
    const { name, email, phone, password, location, address, type } = req.body;
    const document = req.file;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Name, email, phone, and password are required" 
      });
    }

    // Check if center already exists
    const existingCenter = await Center.findOne({ email });
    if (existingCenter) {
      return res.status(400).json({ 
        success: false,
        message: "Center with this email already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new center
    const newCenter = new Center({
      name,
      email,
      phone,
      password: hashedPassword,
      location: location || "",
      address: address || "",
      type: type || "",
      documentPath: document ? document.path : "",
      status: "pending", // Awaiting admin approval
      // Set default values for required fields
      city: location || "Unknown",
      state: "Unknown",
      pincode: "000000",
      manager: {
        name: name,
        phone: phone,
        email: email
      }
    });

    await newCenter.save();

    res.status(201).json({
      success: true,
      message: "Center registered successfully. Please wait for admin approval.",
      data: {
        id: newCenter._id,
        name: newCenter.name,
        email: newCenter.email,
        status: newCenter.status
      }
    });
  } catch (error) {
    console.error("Center registration error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register center",
      error: error.message
    });
  }
};

// Login center
export const loginCenter = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    // Find center by email
    const center = await Center.findOne({ email });
    if (!center) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check if center has a password (self-registered)
    if (!center.password) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, center.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check center status
    if (center.status === "pending") {
      return res.status(403).json({ 
        success: false,
        message: "Your account is pending approval" 
      });
    }

    if (center.status === "rejected") {
      return res.status(403).json({ 
        success: false,
        message: "Your account has been rejected" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: center._id, 
        email: center.email, 
        role: "center" 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    await recordLogin({
      role: "center",
      actorModel: "Center",
      actorId: center._id,
      displayName: center.name,
      email: center.email,
      req,
      sessionExpiresAt: getTokenExpiry(token),
    });

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        center: {
          id: center._id,
          name: center.name,
          email: center.email,
          phone: center.phone,
          location: center.location,
          address: center.address,
          type: center.type,
          status: center.status
        }
      }
    });
  } catch (error) {
    console.error("Center login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
};

// Logout center
export const logoutCenter = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded?.id) {
          const center = await Center.findById(decoded.id).select("_id name email");
          if (center) {
            await recordLogout({
              role: "center",
              actorModel: "Center",
              actorId: center._id,
              displayName: center.name,
              email: center.email,
              req,
            });
          }
        }
      } catch {
        // Continue clearing cookie even when token is invalid.
      }
    }

    res.clearCookie("token");
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch {
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  }
};

// Get center profile
export const getCenterProfile = async (req, res) => {
  try {
    const center = await Center.findById(req.user.id).select("-password");
    if (!center) {
      return res.status(404).json({
        success: false,
        message: "Center not found"
      });
    }

    res.status(200).json({
      success: true,
      center
    });
  } catch (error) {
    console.error("Get center profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get center profile",
      error: error.message
    });
  }
};
