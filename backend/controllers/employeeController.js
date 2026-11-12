import Employee from "../models/Employee.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { recordLogin, recordLogout } from "../services/authAuditService.js";
import { isLoginAllowed } from "../services/loginAccessService.js";

// ---- Admin login email OTP -------------------------------------------------
const LOGIN_OTP_TTL_MS = 10 * 60 * 1000; // code valid for 10 minutes
const LOGIN_OTP_RESEND_MS = 30 * 1000; // min gap between emails
const LOGIN_OTP_MAX_ATTEMPTS = 5; // wrong guesses before the code is burned

// Set ADMIN_LOGIN_OTP=off in backend/.env to turn the email step off
// (emergency escape hatch if outgoing email breaks).
const requiresLoginOtp = (employee) =>
  employee.role === "Admin" && process.env.ADMIN_LOGIN_OTP !== "off";

const hashLoginOtp = (employeeId, code) =>
  crypto
    .createHmac("sha256", process.env.JWT_SECRET || "login-otp")
    .update(`${employeeId}:${code}`)
    .digest("hex");

const maskEmail = (email) => {
  const [user, domain] = email.split("@");
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}${"*".repeat(Math.max(user.length - visible.length, 3))}@${domain}`;
};

const sendLoginOtpEmail = async (to, name, code) => {
  // Built per call so it always sees the env loaded at startup.
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({
    from: `"IICPA Institute" <${process.env.EMAIL_USER}>`,
    to,
    subject: `IICPA admin login code: ${code}`,
    text: `Hello ${name},\n\nYour IICPA admin login code is ${code}. It expires in 10 minutes.\n\nIf you did not try to sign in, change your password immediately.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px">
      <p>Hello ${name},</p>
      <p>Your IICPA admin login code is:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:6px;margin:16px 0">${code}</p>
      <p>It expires in 10 minutes.</p>
      <p style="color:#888;font-size:12px">If you did not try to sign in, change your password immediately.</p>
    </div>`,
  });
};

// Emails a fresh code. Responds with otpRequired so the client shows the code step.
const issueLoginOtp = async (employee, res) => {
  const now = Date.now();
  const current = await Employee.findById(employee._id).select(
    "+loginOtpSentAt +loginOtpExpiresAt"
  );
  const sentAt = current?.loginOtpSentAt?.getTime() || 0;
  const stillValid = current?.loginOtpExpiresAt?.getTime() > now;
  if (stillValid && now - sentAt < LOGIN_OTP_RESEND_MS) {
    const wait = Math.ceil((LOGIN_OTP_RESEND_MS - (now - sentAt)) / 1000);
    return res.status(429).json({
      otpRequired: true,
      email: maskEmail(employee.email),
      retryAfter: wait,
      message: `A code was just sent. Please wait ${wait}s before requesting another.`,
    });
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  await Employee.updateOne(
    { _id: employee._id },
    {
      $set: {
        loginOtpHash: hashLoginOtp(employee._id, code),
        loginOtpExpiresAt: new Date(now + LOGIN_OTP_TTL_MS),
        loginOtpSentAt: new Date(now),
        loginOtpAttempts: 0,
      },
    }
  );

  try {
    await sendLoginOtpEmail(employee.email, employee.name, code);
  } catch (err) {
    console.error("Admin login OTP email failed:", err.message);
    await Employee.updateOne(
      { _id: employee._id },
      { $unset: { loginOtpHash: 1, loginOtpExpiresAt: 1, loginOtpSentAt: 1 } }
    );
    return res
      .status(500)
      .json({ message: "Could not send the login code email. Please try again later." });
  }

  return res.json({
    otpRequired: true,
    email: maskEmail(employee.email),
    retryAfter: LOGIN_OTP_RESEND_MS / 1000,
    message: `We sent a 6-digit code to ${maskEmail(employee.email)}.`,
  });
};

// Returns null when the code is accepted (and consumes it), else an error payload.
const checkLoginOtp = async (employeeId, rawCode) => {
  const code = String(rawCode).trim();
  if (!/^\d{6}$/.test(code)) {
    return { status: 400, message: "Enter the 6-digit code from your email." };
  }

  // Count the attempt atomically before comparing, so parallel guesses can't skip the limit.
  const record = await Employee.findOneAndUpdate(
    {
      _id: employeeId,
      loginOtpHash: { $exists: true },
      loginOtpAttempts: { $lt: LOGIN_OTP_MAX_ATTEMPTS },
    },
    { $inc: { loginOtpAttempts: 1 } },
    { new: true }
  ).select("+loginOtpHash +loginOtpExpiresAt +loginOtpAttempts");

  if (!record) {
    await Employee.updateOne(
      { _id: employeeId },
      { $unset: { loginOtpHash: 1, loginOtpExpiresAt: 1, loginOtpSentAt: 1 } }
    );
    return { status: 400, message: "This code is no longer valid. Request a new code." };
  }
  if (record.loginOtpExpiresAt.getTime() < Date.now()) {
    return { status: 400, message: "This code has expired. Request a new code." };
  }

  const expected = Buffer.from(record.loginOtpHash, "hex");
  const given = Buffer.from(hashLoginOtp(employeeId, code), "hex");
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    const left = LOGIN_OTP_MAX_ATTEMPTS - record.loginOtpAttempts;
    return {
      status: 400,
      message: left > 0
        ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`
        : "Too many incorrect attempts. Request a new code.",
    };
  }

  // Consume: only one request can unset this exact hash.
  const consumed = await Employee.updateOne(
    { _id: employeeId, loginOtpHash: record.loginOtpHash },
    {
      $unset: { loginOtpHash: 1, loginOtpExpiresAt: 1, loginOtpSentAt: 1 },
      $set: { loginOtpAttempts: 0 },
    }
  );
  if (consumed.modifiedCount !== 1) {
    return { status: 400, message: "This code has already been used. Request a new code." };
  }
  return null;
};

// Create JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const getTokenExpiry = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) return null;
  return new Date(decoded.exp * 1000);
};

// @desc    Register new employee
// @route   POST /api/employees
// @access  Private (Admin only)
const registerEmployee = async (req, res) => {
  try {
    const { name, email, password, role, permissions } = req.body;

    // Check if employee exists
    const employeeExists = await Employee.findOne({ email });
    if (employeeExists) {
      return res.status(400).json({ message: "Employee already exists" });
    }

    // Create employee
    const employee = await Employee.create({
      name,
      email,
      password,
      role,
      permissions,
      createdBy: req.user.id,
    });

    if (employee) {
      res.status(201).json({
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        status: employee.status,
        permissions: employee.permissions,
        token: generateToken(employee._id),
      });
    } else {
      res.status(400).json({ message: "Invalid employee data" });
    }
  } catch (error) {
    console.error("Register employee error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Register initial admin (public)
// @route   POST /api/employees/register-admin
// @access  Public
const registerInitialAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if any admin already exists
    const existingAdmin = await Employee.findOne({ role: "Admin" });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Check if employee exists
    const employeeExists = await Employee.findOne({ email });
    if (employeeExists) {
      return res.status(400).json({ message: "Employee already exists" });
    }

    // Create admin with all permissions
    const adminPermissions = {
      "course-category": { add: true, read: true, update: true, delete: true, active: true },
      course: { add: true, read: true, update: true, delete: true, active: true },
      "live-session": { add: true, read: true, update: true, delete: true, active: true },
      "class-management": { add: true, read: true, update: true, delete: true, active: true },
      blogs: { add: true, read: true, update: true, delete: true, active: true },
      testimonials: { add: true, read: true, update: true, delete: true, active: true },
      about: { add: true, read: true, update: true, delete: true, active: true },
      meta: { add: true, read: true, update: true, delete: true, active: true },
      alert: { add: true, read: true, update: true, delete: true, active: true },
      enquiries: { add: true, read: true, update: true, delete: true, active: true },
      jobs: { add: true, read: true, update: true, delete: true, active: true },
      news: { add: true, read: true, update: true, delete: true, active: true },
      center: { add: true, read: true, update: true, delete: true, active: true },
      students: { add: true, read: true, update: true, delete: true, active: true },
      staff: { add: true, read: true, update: true, delete: true, active: true },
      companies: { add: true, read: true, update: true, delete: true, active: true },
      colleges: { add: true, read: true, update: true, delete: true, active: true },
      calendar: { add: true, read: true, update: true, delete: true, active: true },
      team: { add: true, read: true, update: true, delete: true, active: true },
      topics: { add: true, read: true, update: true, delete: true, active: true },
      revision: { add: true, read: true, update: true, delete: true, active: true },
      support: { add: true, read: true, update: true, delete: true, active: true },
      "booking-settings": { add: true, read: true, update: true, delete: true, active: true },
      "invoice-company-settings": { add: true, read: true, update: true, delete: true, active: true },
      quotation: { add: true, read: true, update: true, delete: true, active: true },
      "job-sidebar-marquee": { add: true, read: true, update: true, delete: true, active: true },
      "our-partners": { add: true, read: true, update: true, delete: true, active: true },
      bookings: { add: true, read: true, update: true, delete: true, active: true },
    };

    const admin = await Employee.create({
      name: name || "Admin User",
      email,
      password,
      role: "Admin",
      status: "Active",
      permissions: adminPermissions,
      createdBy: null, // No creator for initial admin
    });

    if (admin) {
      res.status(201).json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        permissions: admin.permissions,
        token: generateToken(admin._id),
        message: "Initial admin created successfully",
      });
    } else {
      res.status(400).json({ message: "Invalid admin data" });
    }
  } catch (error) {
    console.error("Register initial admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Authenticate employee
// @route   POST /api/employees/login
// @access  Public
const loginEmployee = async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check for employee email (case-insensitive)
    const employee = await Employee.findOne({
      email: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
    });
    if (!employee) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if employee is active
    if (employee.status !== "Active") {
      return res.status(401).json({ message: "Account is inactive" });
    }

    // Check password
    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const allowed = await isLoginAllowed("employee", employee._id);
    if (!allowed) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    // Second factor: password alone sends a code; password + code signs in.
    if (requiresLoginOtp(employee)) {
      if (!otp) return issueLoginOtp(employee, res);
      const otpError = await checkLoginOtp(employee._id, otp);
      if (otpError) {
        return res
          .status(otpError.status)
          .json({ otpRequired: true, message: otpError.message });
      }
    }

    const token = generateToken(employee._id);
    await recordLogin({
      role: "employee",
      actorModel: "Employee",
      actorId: employee._id,
      displayName: employee.name,
      email: employee.email,
      req,
      sessionExpiresAt: getTokenExpiry(token),
    });

    res.json({
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      status: employee.status,
      permissions: employee.permissions,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Logout employee
// @route   POST /api/employees/logout
// @access  Private
const logoutEmployee = async (req, res) => {
  try {
    await recordLogout({
      role: "employee",
      actorModel: "Employee",
      actorId: req.user._id,
      displayName: req.user.name,
      email: req.user.email,
      req,
    });

    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (Admin only)
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({})
      .select("-password")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Private (Admin only)
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select("-password")
      .populate("createdBy", "name email");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    console.error("Get employee error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
const updateEmployee = async (req, res) => {
  try {
    const { name, email, password, role, status, permissions } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Update fields
    if (name) employee.name = name;
    if (email) employee.email = email.trim().toLowerCase();
    if (password && password.trim()) employee.password = password;
    if (role) employee.role = role;
    if (status) employee.status = status;
    if (permissions) employee.permissions = permissions;

    const updatedEmployee = await employee.save();

    res.json({
      _id: updatedEmployee._id,
      name: updatedEmployee.name,
      email: updatedEmployee.email,
      role: updatedEmployee.role,
      status: updatedEmployee.status,
      permissions: updatedEmployee.permissions,
    });
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update employee permissions
// @route   PUT /api/employees/:id/permissions
// @access  Private
const updateEmployeePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.permissions = permissions;
    const updatedEmployee = await employee.save();

    res.json({
      _id: updatedEmployee._id,
      permissions: updatedEmployee.permissions,
    });
  } catch (error) {
    console.error("Update permissions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await employee.deleteOne();
    res.json({ message: "Employee removed" });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get current employee profile
// @route   GET /api/employees/profile
// @access  Private
const getEmployeeProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.id).select("-password");
    res.json(employee);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update employee password
// @route   PUT /api/employees/password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const employee = await Employee.findById(req.user.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check current password
    const isMatch = await employee.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    employee.password = newPassword;
    await employee.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export {
  registerEmployee,
  registerInitialAdmin,
  loginEmployee,
  logoutEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  updateEmployeePermissions,
  deleteEmployee,
  getEmployeeProfile,
  updatePassword,
};
