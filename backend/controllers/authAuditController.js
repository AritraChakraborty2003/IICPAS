import AuthAuditLog from "../models/AuthAuditLog.js";
import AuthActiveSession from "../models/AuthActiveSession.js";
import { markStaleOffline, touchHeartbeat } from "../services/authAuditService.js";

const ALLOWED_ROLES = [
  "employee",
  "student",
  "individual",
  "center",
  "company",
  "college",
  "teacher",
  "admin",
];

const ALLOWED_EVENTS = ["LOGIN", "LOGOUT"];

export const getPublicAuditLogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.role && ALLOWED_ROLES.includes(req.query.role)) {
      query.role = req.query.role;
    }
    if (req.query.eventType && ALLOWED_EVENTS.includes(req.query.eventType)) {
      query.eventType = req.query.eventType;
    }
    if (req.query.from || req.query.to) {
      query.occurredAt = {};
      if (req.query.from) query.occurredAt.$gte = new Date(req.query.from);
      if (req.query.to) query.occurredAt.$lte = new Date(req.query.to);
    }

    const [total, rows] = await Promise.all([
      AuthAuditLog.countDocuments(query),
      AuthAuditLog.find(query)
        .sort({ occurredAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("actorId email role displayName eventType occurredAt -_id"),
    ]);

    const items = rows.map((row) => ({
      user_id: row.actorId,
      email: row.email || "",
      role: row.role,
      displayName: row.displayName,
      eventType: row.eventType,
      occurredAt: row.occurredAt,
    }));

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      items,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch audit logs",
      error: error.message,
    });
  }
};

const toPublicSession = (item) => ({
  user_id: item.actorId,
  email: item.email || "",
  role: item.role,
  displayName: item.displayName,
  loginAt: item.loginAt,
  lastSeenAt: item.lastSeenAt,
  status: item.isOnline ? "online" : "offline",
});

export const getPublicLoggedInUsers = async (req, res) => {
  try {
    await markStaleOffline();

    const selectedRole = req.query.role;
    const isSingleRoleMode = selectedRole && ALLOWED_ROLES.includes(selectedRole);

    const baseQuery = {};
    if (isSingleRoleMode) {
      baseQuery.role = selectedRole;
    }

    const countsByRole = await AuthActiveSession.aggregate([
      { $match: {} },
      { $group: { _id: "$role", total: { $sum: 1 }, online: { $sum: { $cond: ["$isOnline", 1, 0] } } } },
    ]);

    const totals = {
      all: 0,
      online: 0,
      byRole: {},
    };
    for (const row of countsByRole) {
      totals.byRole[row._id] = { total: row.total, online: row.online };
      totals.all += row.total;
      totals.online += row.online;
    }

    if (isSingleRoleMode) {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
      const skip = (page - 1) * limit;

      const [total, rows] = await Promise.all([
        AuthActiveSession.countDocuments(baseQuery),
        AuthActiveSession.find(baseQuery)
          .sort({ isOnline: -1, lastSeenAt: -1 })
          .skip(skip)
          .limit(limit)
          .select("actorId email role displayName loginAt lastSeenAt isOnline -_id"),
      ]);

      return res.status(200).json({
        generatedAt: new Date(),
        totals,
        role: selectedRole,
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        items: rows.map(toPublicSession),
      });
    }

    const limitPerRole = Math.min(
      Math.max(parseInt(req.query.limitPerRole, 10) || 10, 1),
      50
    );
    const rows = await AuthActiveSession.find({})
      .sort({ isOnline: -1, lastSeenAt: -1 })
      .select("actorId email role displayName loginAt lastSeenAt isOnline -_id");

    const grouped = {};
    for (const role of ALLOWED_ROLES) {
      grouped[role] = [];
    }

    for (const row of rows) {
      if (!grouped[row.role]) grouped[row.role] = [];
      if (grouped[row.role].length < limitPerRole) {
        grouped[row.role].push(toPublicSession(row));
      }
    }

    return res.status(200).json({
      generatedAt: new Date(),
      totals,
      limitPerRole,
      roles: grouped,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch logged in users",
      error: error.message,
    });
  }
};

export const postHeartbeat = async (req, res) => {
  try {
    const actor = req.authActor;
    const updated = await touchHeartbeat({
      role: actor.role,
      actorId: actor.actorId,
    });

    if (!updated) {
      return res.status(404).json({ message: "Active session not found" });
    }

    return res.status(200).json({
      ok: true,
      role: actor.role,
      lastSeenAt: updated.lastSeenAt,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update heartbeat",
      error: error.message,
    });
  }
};
