const MASTER_API_KEY =
  process.env.MASTER_CONTROL_API_KEY || "Galaxy@09IPO!FrS";

export const requireMasterApiKey = (req, res, next) => {
  const apiKey = req.headers["x-master-api-key"];
  if (!apiKey || apiKey !== MASTER_API_KEY) {
    return res.status(401).json({ message: "Invalid API key" });
  }
  next();
};
