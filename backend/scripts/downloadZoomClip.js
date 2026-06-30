import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const SHARE_LINK = "https://us06web.zoom.us/clips/share/cpv9bM-FQjy7V-ISDE23nQ";
const UPLOAD_DIR = path.resolve("uploads", "topic-videos");
const OUTPUT_FILE = path.join(UPLOAD_DIR, "accounting-overview-intro.mp4");

async function getAccessToken() {
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

async function findClipId(token) {
  const { data } = await axios.get("https://api.zoom.us/v2/clips", {
    headers: { Authorization: `Bearer ${token}` },
    params: { page_size: 100 },
  });

  const match = (data.data || []).find((clip) =>
    clip.share_link?.includes("cpv9bM-FQjy7V-ISDE23nQ")
  );

  if (!match) {
    throw new Error(
      `No clip found matching ${SHARE_LINK}. Got ${data.data?.length || 0} clips back — confirm this account owns the clip.`
    );
  }

  return match.clip_id;
}

async function downloadClip(token, clipId) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const response = await axios.get(
    `https://api.zoom.us/v2/clips/${clipId}/download`,
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "stream",
    }
  );

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(OUTPUT_FILE);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function main() {
  console.log("Requesting Zoom access token...");
  const token = await getAccessToken();

  console.log("Looking up clip_id for", SHARE_LINK);
  const clipId = await findClipId(token);
  console.log("Found clip_id:", clipId);

  console.log("Downloading clip to", OUTPUT_FILE);
  await downloadClip(token, clipId);

  const { size } = fs.statSync(OUTPUT_FILE);
  console.log(`Done. Saved ${(size / 1024 / 1024).toFixed(2)} MB to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Failed:", err.response?.data || err.message);
  process.exit(1);
});
