import mongoose from "mongoose";
import CaseStudy from "../models/CaseStudy.js";
import Assignment from "../models/Assignment.js";
import Course from "../models/Content/Course.js";
import Employee from "../models/Employee.js";
import Student from "../models/Students.js";
import CourseBooking from "../models/CourseBooking.js";
import Transaction from "../models/Transaction.js";
import { resolveActorFromRequest } from "../services/authAuditService.js";
import { buildCourseAccessEntries } from "../utils/courseAccess.js";

// Employees (non-Admin role) need read access to one of these modules to
// open a group preview — the same people who can see course content in the
// admin dashboard.
const EMPLOYEE_PREVIEW_MODULES = ["course", "topics"];

const isEmployeeAllowed = async (actorId) => {
  const employee = await Employee.findById(actorId).select("role status permissions");
  if (!employee || employee.status !== "Active") return false;
  if (employee.role === "Admin" || employee.role === "superadmin") return true;
  return EMPLOYEE_PREVIEW_MODULES.some((module) =>
    employee.hasPermission(module, "read")
  );
};

// A student may preview a group only while they hold an active (not locked,
// not expired) purchase of the course that contains the group's chapter.
const isStudentAllowed = async (studentId, chapterId) => {
  if (!chapterId) return false;
  const course = await Course.findOne({ chapters: chapterId }).select("_id");
  if (!course) return false;
  const courseId = String(course._id);

  const student = await Student.findById(studentId)
    .select("course courseAccessOverrides batchId createdAt")
    .populate("batchId", "courseLocks");
  if (!student) return false;

  const enrolled = (student.course || []).some((id) => String(id) === courseId);
  if (!enrolled) return false;

  const [bookings, transactions] = await Promise.all([
    CourseBooking.find({
      studentId: student._id,
      itemType: "single_course",
      courseId: course._id,
    })
      .select("courseId itemType status payments paymentVerifiedAt updatedAt createdAt")
      .lean(),
    Transaction.find({ studentId: student._id, courseId: course._id })
      .select("courseId sessionType status verifiedAt updatedAt createdAt")
      .lean(),
  ]);

  const [entry] = buildCourseAccessEntries({
    student,
    courses: [course._id],
    bookings,
    transactions,
  });
  return entry?.status === "Active";
};

// GET /api/simulation-groups/preview/:parentId/:groupIndex
// Returns one simulation group of a case study or assignment for the
// slide-style preview player, only to admins, permitted employees and
// students who have purchased the course.
export const getSimulationGroupPreview = async (req, res) => {
  try {
    const { parentId } = req.params;
    const groupIndex = Number(req.params.groupIndex);
    if (!mongoose.Types.ObjectId.isValid(parentId) || !Number.isInteger(groupIndex) || groupIndex < 0) {
      return res.status(400).json({ message: "Invalid preview link" });
    }

    const actor = await resolveActorFromRequest(req);
    if (!actor) {
      return res.status(401).json({ message: "Please log in to open this preview" });
    }

    let parentType = "case-study";
    let parent = await CaseStudy.findById(parentId)
      .select("title chapterId simulationGroups")
      .lean();
    if (!parent) {
      parentType = "assignment";
      parent = await Assignment.findById(parentId)
        .select("title chapterId simulationGroups")
        .lean();
    }
    if (!parent) {
      return res.status(404).json({ message: "Case study or assignment not found" });
    }

    let allowed = false;
    if (actor.role === "admin") {
      allowed = true;
    } else if (actor.role === "employee") {
      allowed = await isEmployeeAllowed(actor.actorId);
    } else if (actor.role === "student") {
      allowed = await isStudentAllowed(actor.actorId, parent.chapterId);
    }
    if (!allowed) {
      return res.status(403).json({
        message: "You don't have access to this simulation group",
      });
    }

    const group = (parent.simulationGroups || [])[groupIndex];
    if (!group || !(group.slots || []).length) {
      return res.status(404).json({ message: "Simulation group not found" });
    }

    res.json({
      parentType,
      parentTitle: parent.title || "",
      groupIndex,
      groupCount: (parent.simulationGroups || []).length,
      name: group.name || "",
      bgImageUrl: group.bgImageUrl || "",
      slots: (group.slots || []).map((slot) => ({
        url: slot.url || "",
        title: slot.title || "",
        imageUrl: slot.imageUrl || "",
      })),
    });
  } catch (error) {
    console.error("Error loading simulation group preview:", error);
    res.status(500).json({ message: "Failed to load simulation group preview" });
  }
};
