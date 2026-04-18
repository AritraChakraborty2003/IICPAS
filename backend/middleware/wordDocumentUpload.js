import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDir = path.join("uploads", "topic_word_uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const allowedMimeTypes = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
]);

const fileFilter = (_req, file, cb) => {
  const lowerName = file.originalname.toLowerCase();
  if (
    lowerName.endsWith(".doc") ||
    lowerName.endsWith(".docx") ||
    allowedMimeTypes.has(file.mimetype)
  ) {
    cb(null, true);
    return;
  }

  cb(new Error("Only .doc and .docx Word files are allowed!"), false);
};

const uploadWordDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export default uploadWordDocument;

