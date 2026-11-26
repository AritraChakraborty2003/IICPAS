import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";

// Sets req.isContentStaff when the request carries a valid token of an active
// employee who may manage course content. Never rejects a request: public
// routes use it only to decide how much data (e.g. quiz answer keys) to return.
export const optionalStaff = async (req, _res, next) => {
  req.isContentStaff = false;
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return next();
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET || "default_jwt_secret_for_development");
    const user = decoded?.id ? await Employee.findById(decoded.id).select("role status permissions") : null;
    if (user && user.status === "Active") {
      req.isContentStaff =
        user.role === "Admin" || ["course", "blogs"].some((m) => user.hasPermission?.(m, "add") || user.hasPermission?.(m, "update"));
    }
  } catch {
    // Invalid / student token: treated as a regular visitor
  }
  next();
};
