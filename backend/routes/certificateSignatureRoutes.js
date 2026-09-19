import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  getCertificateSignatures,
  updateCertificateSignatures,
} from "../controllers/certificateSignatureController.js";

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads", "signatures");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const signatureUploadFields = upload.fields([
  { name: "lokeshSign", maxCount: 1 },
  { name: "poonamSign", maxCount: 1 },
]);

router.get("/", getCertificateSignatures);
router.post("/", signatureUploadFields, updateCertificateSignatures);
router.put("/", signatureUploadFields, updateCertificateSignatures);

export default router;
