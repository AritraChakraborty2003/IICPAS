import { resolveActorFromRequest } from "../services/authAuditService.js";

export const requireAnyAuthActor = async (req, res, next) => {
  try {
    const actor = await resolveActorFromRequest(req);
    if (!actor) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.authActor = actor;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
