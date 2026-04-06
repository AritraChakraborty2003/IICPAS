import Student from "../models/Students.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { isLoginAllowed } from "../services/loginAccessService.js";

const isProd = process.env.NODE_ENV === "production";

export const registerStudent = async (req, res) => {
  const { name, email, phone, password, location, course, teacher } = req.body;
  try {
    const existing = await Student.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Student already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const student = await Student.create({
      name,
      email,
      phone,
      password: hashedPassword,
      location,
      course,
      teacher,
    });

    res.status(201).json({
      message: "Student registered successfully",
      student,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

export const loginStudent = async (req, res) => {
  const { email, password } = req.body;
  try {
    const student = await Student.findOne({ email });
    if (!student)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });
    const allowed = await isLoginAllowed("student", student._id);
    if (!allowed) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    const token = jwt.sign(
      {
        id: student._id,
        role: "student",
        name: student.name,
        email: student.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "None" : "Lax",
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
      })
      .status(200)
      .json({
        message: "Login successful",
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          course: student.course,
          teacher: student.teacher,
          digitalHubAccessOverride: student.digitalHubAccessOverride ?? false,
        },
      });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

export const logoutStudent = (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
    })
    .json({ message: "Logout successful" });
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Delete student request received for ID:", id);
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("Invalid ObjectId format:", id);
      return res.status(400).json({ message: "Invalid student ID format" });
    }
    
    const student = await Student.findByIdAndDelete(id);
    
    if (!student) {
      console.log("Student not found with ID:", id);
      return res.status(404).json({ message: "Student not found" });
    }
    
    console.log("Student deleted successfully:", student.name);
    res.status(200).json({ message: "Student deleted successfully", deletedStudent: { id: student._id, name: student.name } });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Failed to delete student", error: error.message });
  }
};

export const updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log("Update student status request received for ID:", id, "Status:", status);
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("Invalid ObjectId format:", id);
      return res.status(400).json({ message: "Invalid student ID format" });
    }
    
    const student = await Student.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!student) {
      console.log("Student not found with ID:", id);
      return res.status(404).json({ message: "Student not found" });
    }
    
    console.log("Student status updated successfully:", student.name, "New status:", status);
    res.status(200).json({ 
      message: "Student status updated successfully",
      student: {
        id: student._id,
        name: student.name,
        status: student.status
      }
    });
  } catch (error) {
    console.error("Error updating student status:", error);
    res.status(500).json({ message: "Failed to update student status", error: error.message });
  }
};
