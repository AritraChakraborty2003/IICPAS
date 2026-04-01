import Employee from "../models/Employee.js";
import jwt from "jsonwebtoken";
import { recordLogin, recordLogout } from "../services/authAuditService.js";
import { isLoginAllowed } from "../services/loginAccessService.js";

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
    const { email, password } = req.body;

    // Check for employee email
    const employee = await Employee.findOne({ email });
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
    console.error("Logout employee error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ role: { $ne: "Admin" } })
      .select("-password")
      .populate("createdBy", "name email");

    res.json(employees);
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Private
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
    const { name, email, role, status, permissions } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Update fields
    employee.name = name || employee.name;
    employee.email = email || employee.email;
    employee.role = role || employee.role;
    employee.status = status || employee.status;
    employee.permissions = permissions || employee.permissions;

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
