// controllers/authController.js
import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Individual from "../models/Individual.js";
import { signJwt, cookieOptions } from "../utils/auth.js";
import {
  recordLogin,
  recordLogout,
  resolveActorFromRequest,
} from "../services/authAuditService.js";
import { isLoginAllowed } from "../services/loginAccessService.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "default_jwt_secret_for_development";

const getTokenExpiry = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) return null;
  return new Date(decoded.exp * 1000);
};

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const exists = await Admin.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Admin already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ name, email, password: hashed, role });

    res.status(201).json({ message: "Registered", admin });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const allowed = await isLoginAllowed("admin", admin._id);
    if (!allowed) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, role: admin.role, name: admin.name },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    await recordLogin({
      role: "admin",
      actorModel: "Admin",
      actorId: admin._id,
      displayName: admin.name,
      email: admin.email,
      req,
      sessionExpiresAt: getTokenExpiry(token),
    });

    // Return complete admin data with all fields
    res.status(200).json({
      message: "Logged in",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone || "",
        role: admin.role,
        image: admin.image || "",
        bio: admin.bio || "",
        address: admin.address || {
          street: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
        },
        dateOfBirth: admin.dateOfBirth || "",
        gender: admin.gender || "",
        department: admin.department || "",
        designation: admin.designation || "",
        employeeId: admin.employeeId || "",
        joiningDate: admin.joiningDate || "",
        experience: admin.experience || "",
        qualifications: admin.qualifications || "",
        socialLinks: admin.socialLinks || {
          linkedin: "",
          twitter: "",
          facebook: "",
          instagram: "",
          website: "",
        },
        preferences: admin.preferences || {
          theme: "light",
          language: "en",
          timezone: "Asia/Kolkata",
          notifications: {
            email: true,
            sms: true,
            push: true,
          },
        },
        fieldVisibility: admin.fieldVisibility || {
          phone: true,
          address: false,
          dateOfBirth: false,
          gender: false,
          department: true,
          designation: true,
          employeeId: false,
          joiningDate: false,
          experience: true,
          qualifications: true,
          socialLinks: true,
          bio: true,
        },
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};

export const logout = (req, res) => {
  const handleLogout = async () => {
    try {
      const actor = await resolveActorFromRequest(req);
      if (actor) {
        await recordLogout({
          role: actor.role,
          actorModel: actor.actorModel,
          actorId: actor.actorId,
          displayName: actor.displayName,
          email: actor.email,
          req,
        });
      }
    } catch {
      // Continue logout even if audit logging fails.
    }
    res.clearCookie("jwt", cookieOptions);
    res.json({ message: "Logged out" });
  };

  handleLogout().catch(() => {
    res.clearCookie("jwt", cookieOptions);
    res.json({ message: "Logged out" });
  });
};

// User (Individual) signup
export const userSignup = async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const exists = await Individual.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });
    const user = await Individual.create({ name, email, password, phone });
    const token = signJwt(user._id, user.email, user.name);
    await recordLogin({
      role: "individual",
      actorModel: "Individual",
      actorId: user._id,
      displayName: user.name,
      email: user.email,
      req,
      sessionExpiresAt: getTokenExpiry(token),
    });
    res.cookie("jwt", token, cookieOptions);
    res.status(201).json({
      message: "Registered",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};

// User (Individual) login
export const userLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await Individual.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ message: "Invalid credentials" });
    const allowed = await isLoginAllowed("individual", user._id);
    if (!allowed) {
      return res.status(403).json({ message: "Account is inactive" });
    }
    const token = signJwt(user._id, user.email, user.name);
    res.cookie("jwt", token, cookieOptions);
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};

// Admin profile update
export const updateAdminProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      image,
      bio,
      address,
      dateOfBirth,
      gender,
      department,
      designation,
      employeeId,
      joiningDate,
      experience,
      qualifications,
      socialLinks,
      preferences,
      fieldVisibility,
    } = req.body;
    const adminId = req.user.id; // From isAdmin middleware

    // Check if email is being changed and if it already exists
    if (email) {
      const existingAdmin = await Admin.findOne({
        email,
        _id: { $ne: adminId },
      });
      if (existingAdmin) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Prepare update object with only provided fields
    const updateData = {
      name,
      email,
      phone,
      role,
      image,
      bio,
      address,
      dateOfBirth,
      gender,
      department,
      designation,
      employeeId,
      joiningDate,
      experience,
      qualifications,
      socialLinks,
      preferences,
      fieldVisibility,
      updatedAt: new Date(),
    };

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Update admin profile
    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({
      message: "Profile updated successfully",
      admin: {
        id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        phone: updatedAdmin.phone,
        role: updatedAdmin.role,
        image: updatedAdmin.image,
        bio: updatedAdmin.bio,
        address: updatedAdmin.address,
        dateOfBirth: updatedAdmin.dateOfBirth,
        gender: updatedAdmin.gender,
        department: updatedAdmin.department,
        designation: updatedAdmin.designation,
        employeeId: updatedAdmin.employeeId,
        joiningDate: updatedAdmin.joiningDate,
        experience: updatedAdmin.experience,
        qualifications: updatedAdmin.qualifications,
        socialLinks: updatedAdmin.socialLinks,
        preferences: updatedAdmin.preferences,
        fieldVisibility: updatedAdmin.fieldVisibility,
        createdAt: updatedAdmin.createdAt,
        updatedAt: updatedAdmin.updatedAt,
      },
    });
  } catch (err) {
    console.error("Admin profile update error:", err);
    res
      .status(500)
      .json({ message: "Error updating profile", error: err.message });
  }
};
