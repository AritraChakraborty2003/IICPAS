import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";

const router = express.Router();

const UPLOAD_DIR = path.resolve("uploads", "topic-videos");

// In-memory job state. Single-process only.
const jobs = {};

async function getZoomAccessToken() {
  const basic = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  const { data } = await axios.post(
    "https://zoom.us/oauth/token",
    new URLSearchParams({
      grant_type: "account_credentials",
      account_id: process.env.ZOOM_ACCOUNT_ID,
    }),
    { headers: { Authorization: `Basic ${basic}` } }
  );
  return data.access_token;
}

// Zoom's clip download endpoint 302s to a CloudFront-signed URL and also sets
// a `_zm_presig` cookie that CloudFront requires alongside the signed URL —
// without it the CDN rejects the request with 403 CDN_MissingJWTInfo. Axios
// (like plain curl -L) doesn't carry cookies across a redirect on its own, so
// the hop has to be done manually.
async function fetchClipDownloadStream(clipId, token) {
  const redirectRes = await axios.get(
    `https://api.zoom.us/v2/clips/${clipId}/download`,
    {
      headers: { Authorization: `Bearer ${token}` },
      maxRedirects: 0,
      validateStatus: (status) => status === 302,
    }
  );

  const redirectUrl = redirectRes.headers.location;
  const cookieHeader = (redirectRes.headers["set-cookie"] || [])
    .map((c) => c.split(";")[0])
    .join("; ");

  return axios.get(redirectUrl, {
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
    responseType: "stream",
  });
}

function getPublicVideoUrlForFragment(req, fragment) {
  const base =
    process.env.API_URL ||
    (process.env.API_BASE_URL || "").replace(/\/api\/?$/, "") ||
    `${req.protocol}://${req.get("host")}`;
  return `${base}/uploads/topic-videos/${fragment}.mp4`;
}

async function runDynamicDownload(req, fragment) {
  jobs[fragment] = { status: "downloading", progress: 0, error: null };
  try {
    const token = await getZoomAccessToken();

    const { data: listData } = await axios.get("https://api.zoom.us/v2/clips", {
      headers: { Authorization: `Bearer ${token}` },
      params: { page_size: 100 },
    });
    const clip = (listData.data || []).find((c) =>
      c.share_link?.includes(fragment)
    );
    if (!clip) throw new Error("Clip not found in Zoom account");

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const outputFile = path.join(UPLOAD_DIR, `${fragment}.mp4`);
    const tmpFile = `${outputFile}.part`;

    const response = await fetchClipDownloadStream(clip.clip_id, token);

    const totalBytes = clip.file_size || 0;
    let downloadedBytes = 0;

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(tmpFile);
      response.data.on("data", (chunk) => {
        downloadedBytes += chunk.length;
        jobs[fragment].progress = totalBytes
          ? Math.min(99, Math.round((downloadedBytes / totalBytes) * 100))
          : jobs[fragment].progress;
      });
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
      response.data.on("error", reject);
    });

    fs.renameSync(tmpFile, outputFile);

    jobs[fragment] = { status: "ready", progress: 100, error: null };
  } catch (err) {
    jobs[fragment] = {
      status: "error",
      progress: 0,
      error: err.response?.data?.message || err.message,
    };
  }
}

function extractFragment(link) {
  if (!link) return null;
  const match = link.match(/\/share\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

router.get("/dynamic-status", (req, res) => {
  const link = req.query.link;
  const fragment = extractFragment(link);
  if (!fragment) return res.status(400).json({ error: "Invalid link format" });

  const outputFile = path.join(UPLOAD_DIR, `${fragment}.mp4`);
  const jobState = jobs[fragment] || { status: "idle", progress: 0, error: null };

  if (fs.existsSync(outputFile) && jobState.status !== "downloading") {
    return res.json({ status: "ready", progress: 100, url: getPublicVideoUrlForFragment(req, fragment) });
  }
  res.json(jobState);
});

router.post("/dynamic-download", (req, res) => {
  const { link } = req.body;
  const fragment = extractFragment(link);
  if (!fragment) return res.status(400).json({ error: "Invalid link format" });

  const outputFile = path.join(UPLOAD_DIR, `${fragment}.mp4`);
  const jobState = jobs[fragment] || { status: "idle", progress: 0, error: null };

  if (fs.existsSync(outputFile)) {
    return res.json({ status: "ready", progress: 100, url: getPublicVideoUrlForFragment(req, fragment) });
  }
  if (jobState.status === "downloading") {
    return res.status(202).json(jobState);
  }

  runDynamicDownload(req, fragment);
  res.status(202).json({ status: "downloading", progress: 0, error: null });
});

export default router;
