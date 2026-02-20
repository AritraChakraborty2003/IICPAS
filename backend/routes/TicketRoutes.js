import express from "express";
import jwt from "jsonwebtoken";
import Ticket from "../models/Ticket.js";
import Employee from "../models/Employee.js";
import Student from "../models/Students.js";

const router = express.Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "default_jwt_secret_for_development";

const canEmployeeReadSupport = (actor) =>
  actor?.role === "Admin" || Boolean(actor?.permissions?.support?.read);

const canEmployeeUpdateSupport = (actor) =>
  actor?.role === "Admin" || Boolean(actor?.permissions?.support?.update);

const canEmployeeDeleteSupport = (actor) =>
  actor?.role === "Admin" || Boolean(actor?.permissions?.support?.delete);

const resolveActor = async (req) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const employee = await Employee.findById(decoded.id).select("-password");

    if (!employee || employee.status !== "Active") {
      throw new Error("INVALID_EMPLOYEE");
    }

    return {
      type: "employee",
      id: employee._id.toString(),
      email: employee.email,
      role: employee.role,
      permissions: employee.permissions || {},
    };
  }

  const studentToken = req.cookies?.token;
  if (!studentToken) {
    return null;
  }

  const decoded = jwt.verify(studentToken, JWT_SECRET);
  if (decoded.role && decoded.role !== "student") {
    throw new Error("INVALID_STUDENT_ROLE");
  }

  const student = await Student.findById(decoded.id).select("email");
  if (!student) {
    throw new Error("INVALID_STUDENT");
  }

  return {
    type: "student",
    id: student._id.toString(),
    email: student.email,
  };
};

const requireTicketActor = async (req, res, next) => {
  try {
    const actor = await resolveActor(req);
    if (!actor) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.ticketActor = actor;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const requireEmployeeSupportUpdate = (req, res, next) => {
  const actor = req.ticketActor;
  if (!actor || actor.type !== "employee") {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!canEmployeeUpdateSupport(actor)) {
    return res.status(403).json({ error: "Access denied" });
  }

  next();
};

const requireEmployeeSupportDelete = (req, res, next) => {
  const actor = req.ticketActor;
  if (!actor || actor.type !== "employee") {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!canEmployeeDeleteSupport(actor)) {
    return res.status(403).json({ error: "Access denied" });
  }

  next();
};

// CREATE
router.post("/", async (req, res) => {
  try {
    const ticket = new Ticket(req.body);
    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ ALL
router.get("/", requireTicketActor, async (req, res) => {
  try {
    const actor = req.ticketActor;
    const { email } = req.query;
    const query = {};

    if (actor.type === "student") {
      query.email = actor.email;
    } else {
      if (!canEmployeeReadSupport(actor)) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (email) query.email = email;
    }

    const tickets = await Ticket.find(query).sort({
      createdAt: -1,
    });

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ONE
router.get("/:id", requireTicketActor, async (req, res) => {
  try {
    const actor = req.ticketActor;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (actor.type === "student") {
      if (ticket.email !== actor.email) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else if (!canEmployeeReadSupport(actor)) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put(
  "/:id",
  requireTicketActor,
  requireEmployeeSupportUpdate,
  async (req, res) => {
    try {
      const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      res.json(ticket);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// DELETE
router.delete(
  "/:id",
  requireTicketActor,
  requireEmployeeSupportDelete,
  async (req, res) => {
    try {
      const ticket = await Ticket.findByIdAndDelete(req.params.id);
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      res.json({ message: "Ticket deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PATCH only resolve field
router.patch(
  "/:id/resolve",
  requireTicketActor,
  requireEmployeeSupportUpdate,
  async (req, res) => {
    try {
      const resolveText = req.body?.resolve;
      if (typeof resolveText !== "string" || !resolveText.trim()) {
        return res
          .status(400)
          .json({ error: "resolve must be a non-empty string" });
      }

      const ticket = await Ticket.findByIdAndUpdate(
        req.params.id,
        { resolve: resolveText.trim() },
        { new: true }
      );
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      res.json(ticket);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

export default router;
