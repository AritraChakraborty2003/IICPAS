// Protects mutating admin routes with a static bearer token stored in .env.
// Send header: Authorization: Bearer <CONTENT_ADMIN_TOKEN>
const ADMIN_TOKEN = process.env.CONTENT_ADMIN_TOKEN;

export const requireBearerToken = (req, res, next) => {
  if (!ADMIN_TOKEN) {
    return res
      .status(500)
      .json({ message: "Server auth not configured (missing CONTENT_ADMIN_TOKEN)" });
  }

  const header = req.headers["authorization"] || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};

export default requireBearerToken;
