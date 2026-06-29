export const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  
  // Use environment variable or default to "Bearer Token" as requested
  const validApiKey = process.env.BLOG_CONTENT_API_KEY || "Bearer Token";

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({ message: "Unauthorized: Invalid x-api-key" });
  }

  next();
};
