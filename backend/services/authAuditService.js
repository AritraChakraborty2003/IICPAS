import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import AuthAuditLog from "../models/AuthAuditLog.js";
import AuthActiveSession from "../models/AuthActiveSession.js";
import Employee from "../models/Employee.js";
import Admin from "../models/Admin.js";
import Student from "../models/Students.js";
import Individual from "../models/Individual.js";
import Center from "../models/Center.js";
import Company from "../models/Company.js";
import College from "../models/College.js";
import Teacher from "../models/Teacher.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "default_jwt_secret_for_development";
const STALE_WINDOW_MS = 90 * 1000;

const getClientIp = (req) =>
  req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
  req?.ip ||
  req?.socket?.remoteAddress ||
  "";

const getSessionKey = (role, actorId) => `${role}:${String(actorId)}`;

const decodeTokenExpiry = (token) => {
  if (!token) return null;
  const decoded = jwt.decode(token);
  if (!decoded?.exp) return null;
  return new Date(decoded.exp * 1000);
};

const normalizeObjectId = (id) => {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
};

const modelFetchers = {
  employee: {
    modelName: "Employee",
    findById: (id) => Employee.findById(id).select("_id name role"),
    displayName: (doc) => doc?.name || "Employee",
  },
  admin: {
    modelName: "Admin",
    findById: (id) => Admin.findById(id).select("_id name role"),
    displayName: (doc) => doc?.name || "Admin",
  },
  student: {
    modelName: "Student",
    findById: (id) => Student.findById(id).select("_id name"),
    displayName: (doc) => doc?.name || "Student",
  },
  individual: {
    modelName: "Individual",
    findById: (id) => Individual.findById(id).select("_id name"),
    displayName: (doc) => doc?.name || "Individual",
  },
  center: {
    modelName: "Center",
    findById: (id) => Center.findById(id).select("_id name"),
    displayName: (doc) => doc?.name || "Center",
  },
  company: {
    modelName: "Company",
    findById: (id) => Company.findById(id).select("_id fullName"),
    displayName: (doc) => doc?.fullName || "Company",
  },
  college: {
    modelName: "College",
    findById: (id) => College.findById(id).select("_id name"),
    displayName: (doc) => doc?.name || "College",
  },
  teacher: {
    modelName: "Teacher",
    findById: (id) => Teacher.findById(id).select("_id name"),
    displayName: (doc) => doc?.name || "Teacher",
  },
};

export const recordLogin = async ({
  role,
  actorModel,
  actorId,
  displayName,
  req,
  sessionExpiresAt = null,
}) => {
  const normalizedId = normalizeObjectId(actorId);
  if (!normalizedId) return;

  const now = new Date();
  const payload = {
    role,
    actorModel,
    actorId: normalizedId,
    displayName: displayName || "User",
  };

  await Promise.all([
    AuthAuditLog.create({
      ...payload,
      eventType: "LOGIN",
      occurredAt: now,
      ip: getClientIp(req),
      userAgent: req?.headers?.["user-agent"] || "",
    }),
    AuthActiveSession.updateOne(
      { sessionKey: getSessionKey(role, normalizedId) },
      {
        $set: {
          ...payload,
          isOnline: true,
          loginAt: now,
          lastSeenAt: now,
          logoutAt: null,
          sessionExpiresAt,
        },
      },
      { upsert: true }
    ),
  ]);
};

export const recordLogout = async ({
  role,
  actorModel,
  actorId,
  displayName,
  req,
}) => {
  const normalizedId = normalizeObjectId(actorId);
  if (!normalizedId) return;

  const now = new Date();
  const payload = {
    role,
    actorModel,
    actorId: normalizedId,
    displayName: displayName || "User",
  };

  await Promise.all([
    AuthAuditLog.create({
      ...payload,
      eventType: "LOGOUT",
      occurredAt: now,
      ip: getClientIp(req),
      userAgent: req?.headers?.["user-agent"] || "",
    }),
    AuthActiveSession.updateOne(
      { sessionKey: getSessionKey(role, normalizedId) },
      {
        $set: {
          ...payload,
          isOnline: false,
          lastSeenAt: now,
          logoutAt: now,
        },
      },
      { upsert: true }
    ),
  ]);
};

export const touchHeartbeat = async ({ role, actorId }) => {
  const normalizedId = normalizeObjectId(actorId);
  if (!normalizedId) return null;

  const now = new Date();
  const updated = await AuthActiveSession.findOneAndUpdate(
    { sessionKey: getSessionKey(role, normalizedId) },
    {
      $set: {
        isOnline: true,
        lastSeenAt: now,
      },
    },
    { new: true }
  );
  return updated;
};

export const markStaleOffline = async () => {
  const now = new Date();
  const staleCutoff = new Date(now.getTime() - STALE_WINDOW_MS);

  await AuthActiveSession.updateMany(
    {
      isOnline: true,
      $or: [
        { lastSeenAt: { $lt: staleCutoff } },
        {
          sessionExpiresAt: { $ne: null, $lte: now },
        },
      ],
    },
    {
      $set: {
        isOnline: false,
        logoutAt: now,
      },
    }
  );
};

const resolveFromBearer = async (req) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const tokenId = decoded?.id || decoded?._id;
    if (!tokenId) return null;

    const employee = await modelFetchers.employee.findById(tokenId);
    if (employee) {
      return {
        role: "employee",
        actorModel: "Employee",
        actorId: employee._id,
        displayName: employee.name,
        token,
      };
    }

    const admin = await modelFetchers.admin.findById(tokenId);
    if (admin) {
      return {
        role: "admin",
        actorModel: "Admin",
        actorId: admin._id,
        displayName: admin.name,
        token,
      };
    }
  } catch {
    return null;
  }
  return null;
};

const resolveFromTokenCookie = async (req) => {
  const token = req?.cookies?.token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const tokenId = decoded?.id || decoded?._id;
    if (!tokenId) return null;

    if (decoded.role && modelFetchers[decoded.role]) {
      const config = modelFetchers[decoded.role];
      const user = await config.findById(tokenId);
      if (!user) return null;

      return {
        role: decoded.role,
        actorModel: config.modelName,
        actorId: user._id,
        displayName: config.displayName(user),
        token,
      };
    }

    const student = await modelFetchers.student.findById(tokenId);
    if (student) {
      return {
        role: "student",
        actorModel: "Student",
        actorId: student._id,
        displayName: student.name,
        token,
      };
    }
  } catch {
    return null;
  }
  return null;
};

const resolveFromJwtCookie = async (req) => {
  const token = req?.cookies?.jwt;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const tokenId = decoded?._id || decoded?.id;
    if (!tokenId) return null;

    const teacher = await modelFetchers.teacher.findById(tokenId);
    if (teacher) {
      return {
        role: "teacher",
        actorModel: "Teacher",
        actorId: teacher._id,
        displayName: teacher.name,
        token,
      };
    }

    const individual = await modelFetchers.individual.findById(tokenId);
    if (individual) {
      return {
        role: "individual",
        actorModel: "Individual",
        actorId: individual._id,
        displayName: individual.name,
        token,
      };
    }
  } catch {
    return null;
  }
  return null;
};

export const resolveActorFromRequest = async (req) => {
  const fromBearer = await resolveFromBearer(req);
  if (fromBearer) {
    return {
      ...fromBearer,
      sessionExpiresAt: decodeTokenExpiry(fromBearer.token),
    };
  }

  const fromTokenCookie = await resolveFromTokenCookie(req);
  if (fromTokenCookie) {
    return {
      ...fromTokenCookie,
      sessionExpiresAt: decodeTokenExpiry(fromTokenCookie.token),
    };
  }

  const fromJwtCookie = await resolveFromJwtCookie(req);
  if (fromJwtCookie) {
    return {
      ...fromJwtCookie,
      sessionExpiresAt: decodeTokenExpiry(fromJwtCookie.token),
    };
  }

  return null;
};
