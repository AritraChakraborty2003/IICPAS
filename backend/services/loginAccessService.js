import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import Admin from "../models/Admin.js";
import Student from "../models/Students.js";
import Individual from "../models/Individual.js";
import Center from "../models/Center.js";
import Company from "../models/Company.js";
import College from "../models/College.js";
import Teacher from "../models/Teacher.js";
import LoginAccessControl from "../models/LoginAccessControl.js";

export const LOGIN_ACCESS_ROLES = [
  "employee",
  "admin",
  "student",
  "individual",
  "center",
  "company",
  "college",
  "teacher",
];

const ROLE_CONFIG = {
  employee: {
    model: Employee,
    select: "_id name email status",
    displayName: (u) => u?.name || "Employee",
    email: (u) => u?.email || "",
    baseActive: (u) => u?.status === "Active",
  },
  admin: {
    model: Admin,
    select: "_id name email",
    displayName: (u) => u?.name || "Admin",
    email: (u) => u?.email || "",
    baseActive: () => true,
  },
  student: {
    model: Student,
    select: "_id name email status",
    displayName: (u) => u?.name || "Student",
    email: (u) => u?.email || "",
    baseActive: (u) => String(u?.status || "active").toLowerCase() !== "inactive",
  },
  individual: {
    model: Individual,
    select: "_id name email isActive",
    displayName: (u) => u?.name || "Individual",
    email: (u) => u?.email || "",
    baseActive: (u) => u?.isActive !== false,
  },
  center: {
    model: Center,
    select: "_id name email status",
    displayName: (u) => u?.name || "Center",
    email: (u) => u?.email || "",
    baseActive: (u) => ["approved", "active"].includes(String(u?.status || "").toLowerCase()),
  },
  company: {
    model: Company,
    select: "_id fullName email status",
    displayName: (u) => u?.fullName || "Company",
    email: (u) => u?.email || "",
    baseActive: (u) => String(u?.status || "").toLowerCase() === "approved",
  },
  college: {
    model: College,
    select: "_id name email status",
    displayName: (u) => u?.name || "College",
    email: (u) => u?.email || "",
    baseActive: (u) => String(u?.status || "").toLowerCase() === "approved",
  },
  teacher: {
    model: Teacher,
    select: "_id name email isActive",
    displayName: (u) => u?.name || "Teacher",
    email: (u) => u?.email || "",
    baseActive: (u) => u?.isActive !== false,
  },
};

const toObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const getOverrideMap = async (role, userIds) => {
  if (!userIds.length) return new Map();
  const controls = await LoginAccessControl.find({
    role,
    userId: { $in: userIds },
  }).select("userId isActive");

  const map = new Map();
  for (const item of controls) {
    map.set(String(item.userId), item.isActive);
  }
  return map;
};

const fetchRoleUsers = async (role, search = "") => {
  const cfg = ROLE_CONFIG[role];
  if (!cfg) return [];

  const searchQuery = search?.trim();
  let query = {};
  if (searchQuery) {
    query = {
      $or: [
        { name: { $regex: searchQuery, $options: "i" } },
        { fullName: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
      ],
    };
  }

  const users = await cfg.model.find(query).select(cfg.select);
  const ids = users.map((u) => u._id);
  const overrideMap = await getOverrideMap(role, ids);

  return users.map((user) => {
    const baseActive = cfg.baseActive(user);
    const override = overrideMap.get(String(user._id));
    const overrideActive = override === undefined ? true : override;
    const effectiveActive = Boolean(baseActive && overrideActive);

    return {
      user_id: user._id,
      role,
      name: cfg.displayName(user),
      email: cfg.email(user),
      baseStatus: baseActive ? "active" : "inactive",
      overrideStatus: overrideActive ? "active" : "inactive",
      effectiveStatus: effectiveActive ? "active" : "inactive",
      updatedAt: user.updatedAt || user.createdAt || null,
    };
  });
};

export const getLoginAccessUsers = async ({
  role = "all",
  search = "",
  status = "all",
  page = 1,
  limit = 20,
}) => {
  const roles =
    role === "all"
      ? LOGIN_ACCESS_ROLES
      : LOGIN_ACCESS_ROLES.includes(role)
      ? [role]
      : [];

  const byRole = {};
  let allRows = [];
  for (const r of roles) {
    const rows = await fetchRoleUsers(r, search);
    byRole[r] = rows;
    allRows = allRows.concat(rows);
  }

  if (status === "active" || status === "inactive") {
    allRows = allRows.filter((row) => row.effectiveStatus === status);
    for (const r of roles) {
      byRole[r] = byRole[r].filter((row) => row.effectiveStatus === status);
    }
  }

  allRows.sort((a, b) => {
    if (a.effectiveStatus !== b.effectiveStatus) {
      return a.effectiveStatus === "active" ? -1 : 1;
    }
    return String(a.name).localeCompare(String(b.name));
  });

  const total = allRows.length;
  const skip = (page - 1) * limit;
  const items = allRows.slice(skip, skip + limit);

  return {
    role,
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    countsByRole: Object.fromEntries(
      roles.map((r) => [r, byRole[r]?.length || 0])
    ),
    items,
  };
};

export const setUserLoginStatus = async ({
  role,
  userId,
  status,
  updatedBy = "",
}) => {
  if (!LOGIN_ACCESS_ROLES.includes(role)) {
    throw new Error("Invalid role");
  }
  const objectId = toObjectId(userId);
  if (!objectId) {
    throw new Error("Invalid user id");
  }
  const isActive = status === "active";
  if (status !== "active" && status !== "inactive") {
    throw new Error("Invalid status");
  }

  const cfg = ROLE_CONFIG[role];
  const user = await cfg.model.findById(objectId).select(cfg.select);
  if (!user) {
    throw new Error("User not found");
  }

  await LoginAccessControl.findOneAndUpdate(
    { role, userId: objectId },
    { $set: { isActive, updatedBy } },
    { upsert: true, new: true }
  );

  const baseActive = cfg.baseActive(user);
  return {
    user_id: user._id,
    role,
    name: cfg.displayName(user),
    email: cfg.email(user),
    baseStatus: baseActive ? "active" : "inactive",
    overrideStatus: isActive ? "active" : "inactive",
    effectiveStatus: baseActive && isActive ? "active" : "inactive",
  };
};

export const setBulkLoginStatus = async ({
  role = "all",
  status,
  search = "",
  updatedBy = "",
}) => {
  if (status !== "active" && status !== "inactive") {
    throw new Error("Invalid status");
  }
  const isActive = status === "active";
  const roles =
    role === "all"
      ? LOGIN_ACCESS_ROLES
      : LOGIN_ACCESS_ROLES.includes(role)
      ? [role]
      : [];
  if (!roles.length) throw new Error("Invalid role");

  let affected = 0;
  for (const r of roles) {
    const users = await fetchRoleUsers(r, search);
    if (!users.length) continue;

    const operations = users.map((u) => ({
      updateOne: {
        filter: { role: r, userId: u.user_id },
        update: { $set: { isActive, updatedBy } },
        upsert: true,
      },
    }));

    if (operations.length) {
      await LoginAccessControl.bulkWrite(operations, { ordered: false });
      affected += operations.length;
    }
  }

  return { role, status, affected };
};

export const isLoginAllowed = async (role, userId) => {
  if (!LOGIN_ACCESS_ROLES.includes(role)) return true;
  const objectId = toObjectId(userId);
  if (!objectId) return false;

  const access = await LoginAccessControl.findOne({
    role,
    userId: objectId,
  }).select("isActive");
  if (!access) return true;
  return access.isActive === true;
};
