const express = require("express");
const multer = require("multer");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure upload directories exist
const ensureUploadDirectories = () => {
  const dirs = ["uploads", "uploads/images", "uploads/videos"];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

// Middleware
app.use(
  cors({
    origin: [
      "https://iicpa.in",
      "https://www.iicpa.in",
      "http://localhost:3000",
      "https://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB setup
let db;
let filesCollection;

const serializeFileDoc = (fileDoc) => ({
  ...fileDoc,
  id: fileDoc._id?.toString?.() || fileDoc.id,
});

const getUploadContextFromRequest = (req) => {
  const topicId = typeof req.body?.topicId === "string" ? req.body.topicId.trim() : "";
  const chapterId =
    typeof req.body?.chapterId === "string" ? req.body.chapterId.trim() : "";
  const courseId =
    typeof req.body?.courseId === "string" ? req.body.courseId.trim() : "";

  return {
    ...(topicId ? { topicId } : {}),
    ...(chapterId ? { chapterId } : {}),
    ...(courseId ? { courseId } : {}),
  };
};

const connectToMongoDB = async () => {
  try {
    const client = new MongoClient(
      process.env.MONGODB_URI || "mongodb://localhost:27017/static_backend"
    );
    await client.connect();
    console.log("Connected to MongoDB");

    db = client.db(process.env.MONGODB_DB_NAME || "static_backend");
    filesCollection = db.collection("files");

    // Create indexes for better performance
    await filesCollection.createIndex({ file_type: 1 });
    await filesCollection.createIndex({ upload_date: -1 });
    await filesCollection.createIndex({ filename: 1 });
    await filesCollection.createIndex({ topicId: 1, file_type: 1, upload_date: -1 });

    console.log("MongoDB indexes created");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Multer configuration for images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/images/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "img-" + uniqueSuffix + ext);
  },
});

// Multer configuration for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/videos/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "vid-" + uniqueSuffix + ext);
  },
});

// File filters
const imageFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_IMAGE_TYPES.split(",");
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid image file type"), false);
  }
};

const videoFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_VIDEO_TYPES.split(",");
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid video file type"), false);
  }
};

// Multer instances
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_IMAGE_SIZE) || 5242880, // 5MB
  },
});

const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_VIDEO_SIZE) || 367001600, // 350MB
  },
});

// Routes

// Welcome route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Static API",
    service: "static-backend",
    version: "1.0.0",
    endpoints: {
      welcome: "GET /",
      health: "GET /health",
      uploadImage: "POST /upload/image",
      uploadVideo: "POST /upload/video",
      uploadMultipleImages: "POST /upload/images",
      uploadMultipleVideos: "POST /upload/videos",
      bulkUpload: "POST /upload/bulk",
      getFiles: "GET /files",
      getImages: "GET /files/images",
      getVideos: "GET /files/videos",
      deleteFile: "DELETE /files/:id",
    },
    timestamp: new Date().toISOString(),
  });
});

// Upload single image
app.post("/upload/image", uploadImage.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const cdnUrl = `${process.env.CDN_BASE_URL}/uploads/images/${req.file.filename}`;

    // Save to MongoDB
    const uploadContext = getUploadContextFromRequest(req);
    const fileDoc = {
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      file_type: req.file.mimetype,
      cdn_url: cdnUrl,
      upload_date: new Date(),
      ...uploadContext,
    };

    const result = await filesCollection.insertOne(fileDoc);

    res.json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        id: result.insertedId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        cdnUrl: cdnUrl,
      },
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Upload multiple images
app.post(
  "/upload/images",
  uploadImage.array("images", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No image files provided" });
      }

      if (req.files.length > 10) {
        return res
          .status(400)
          .json({ error: "Maximum 10 images allowed per upload" });
      }

      const uploadedFiles = [];
      const errors = [];
      const uploadContext = getUploadContextFromRequest(req);

      for (const file of req.files) {
        try {
          const cdnUrl = `${process.env.CDN_BASE_URL}/uploads/images/${file.filename}`;

          // Save to MongoDB
          const fileDoc = {
            filename: file.filename,
            original_name: file.originalname,
            file_path: file.path,
            file_size: file.size,
            file_type: file.mimetype,
            cdn_url: cdnUrl,
            upload_date: new Date(),
            ...uploadContext,
          };

          const result = await filesCollection.insertOne(fileDoc);

          uploadedFiles.push({
            id: result.insertedId,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            cdnUrl: cdnUrl,
          });
        } catch (fileError) {
          console.error(`Error uploading ${file.originalname}:`, fileError);
          errors.push({
            filename: file.originalname,
            error: "Failed to save file metadata",
          });
        }
      }

      res.json({
        success: true,
        message: `Successfully uploaded ${uploadedFiles.length} images`,
        data: {
          uploaded: uploadedFiles,
          errors: errors,
          total: req.files.length,
          successful: uploadedFiles.length,
          failed: errors.length,
        },
      });
    } catch (error) {
      console.error("Multiple images upload error:", error);
      res.status(500).json({ error: "Failed to upload images" });
    }
  }
);

// Upload single video
app.post("/upload/video", uploadVideo.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }

    const cdnUrl = `${process.env.CDN_BASE_URL}/uploads/videos/${req.file.filename}`;

    // Save to MongoDB
    const uploadContext = getUploadContextFromRequest(req);
    const fileDoc = {
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      file_type: req.file.mimetype,
      cdn_url: cdnUrl,
      upload_date: new Date(),
      ...uploadContext,
    };

    const result = await filesCollection.insertOne(fileDoc);

    res.json({
      success: true,
      message: "Video uploaded successfully",
      data: {
        id: result.insertedId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        cdnUrl: cdnUrl,
      },
    });
  } catch (error) {
    console.error("Video upload error:", error);
    res.status(500).json({ error: "Failed to upload video" });
  }
});

// Upload multiple videos
app.post("/upload/videos", uploadVideo.array("videos", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No video files provided" });
    }

    if (req.files.length > 5) {
      return res
        .status(400)
        .json({ error: "Maximum 5 videos allowed per upload" });
    }

    const uploadedFiles = [];
    const errors = [];
    const uploadContext = getUploadContextFromRequest(req);

    for (const file of req.files) {
      try {
        const cdnUrl = `${process.env.CDN_BASE_URL}/uploads/videos/${file.filename}`;

        // Save to MongoDB
        const fileDoc = {
          filename: file.filename,
          original_name: file.originalname,
          file_path: file.path,
          file_size: file.size,
          file_type: file.mimetype,
          cdn_url: cdnUrl,
          upload_date: new Date(),
          ...uploadContext,
        };

        const result = await filesCollection.insertOne(fileDoc);

        uploadedFiles.push({
          id: result.insertedId,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          cdnUrl: cdnUrl,
        });
      } catch (fileError) {
        console.error(`Error uploading ${file.originalname}:`, fileError);
        errors.push({
          filename: file.originalname,
          error: "Failed to save file metadata",
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} videos`,
      data: {
        uploaded: uploadedFiles,
        errors: errors,
        total: req.files.length,
        successful: uploadedFiles.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    console.error("Multiple videos upload error:", error);
    res.status(500).json({ error: "Failed to upload videos" });
  }
});

// Bulk upload - handle mixed file types (images and videos)
app.post("/upload/bulk", async (req, res) => {
  try {
    // Use multer to handle the upload
    const upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          // Determine destination based on file type
          if (file.mimetype.startsWith("image/")) {
            cb(null, "uploads/images/");
          } else if (file.mimetype.startsWith("video/")) {
            cb(null, "uploads/videos/");
          } else {
            cb(new Error("Invalid file type"), null);
          }
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          const prefix = file.mimetype.startsWith("image/") ? "img-" : "vid-";
          cb(null, prefix + uniqueSuffix + ext);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          ...process.env.ALLOWED_IMAGE_TYPES.split(","),
          ...process.env.ALLOWED_VIDEO_TYPES.split(","),
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Invalid file type: ${file.mimetype}`), false);
        }
      },
      limits: {
        fileSize: Math.max(
          parseInt(process.env.MAX_IMAGE_SIZE) || 5242880,
          parseInt(process.env.MAX_VIDEO_SIZE) || 367001600
        ),
      },
    }).array("files", 15); // Allow up to 15 files total

    upload(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File too large" });
          }
          if (err.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({ error: "Too many files (max 15)" });
          }
        }
        return res.status(400).json({ error: err.message });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      const uploadedFiles = [];
      const errors = [];

      for (const file of req.files) {
        try {
          const isImage = file.mimetype.startsWith("image/");
          const cdnUrl = `${process.env.CDN_BASE_URL}/uploads/${
            isImage ? "images" : "videos"
          }/${file.filename}`;

          // Save to MongoDB
          const fileDoc = {
            filename: file.filename,
            original_name: file.originalname,
            file_path: file.path,
            file_size: file.size,
            file_type: file.mimetype,
            cdn_url: cdnUrl,
            upload_date: new Date(),
            category: isImage ? "image" : "video",
          };

          const result = await filesCollection.insertOne(fileDoc);

          uploadedFiles.push({
            id: result.insertedId,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            cdnUrl: cdnUrl,
            type: isImage ? "image" : "video",
          });
        } catch (fileError) {
          console.error(`Error uploading ${file.originalname}:`, fileError);
          errors.push({
            filename: file.originalname,
            error: "Failed to save file metadata",
          });
        }
      }

      res.json({
        success: true,
        message: `Successfully uploaded ${uploadedFiles.length} files`,
        data: {
          uploaded: uploadedFiles,
          errors: errors,
          total: req.files.length,
          successful: uploadedFiles.length,
          failed: errors.length,
          summary: {
            images: uploadedFiles.filter((f) => f.type === "image").length,
            videos: uploadedFiles.filter((f) => f.type === "video").length,
          },
        },
      });
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ error: "Failed to process bulk upload" });
  }
});

// Get all files
app.get("/files", async (req, res) => {
  try {
    const files = await filesCollection
      .find({})
      .sort({ upload_date: -1 })
      .toArray();
    res.json({ success: true, data: files.map(serializeFileDoc) });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// Get files by type
app.get("/files/:type", async (req, res) => {
  try {
    const type = req.params.type; // 'images' or 'videos'
    const topicId =
      typeof req.query.topicId === "string" ? req.query.topicId.trim() : "";

    if (type === "images") {
      const query = {
        file_type: { $regex: /^image\// },
        ...(topicId ? { topicId } : {}),
      };
      const images = await filesCollection
        .find(query)
        .sort({ upload_date: -1 })
        .toArray();
      res.json({ success: true, data: images.map(serializeFileDoc) });
    } else if (type === "videos") {
      const query = {
        file_type: { $regex: /^video\// },
        ...(topicId ? { topicId } : {}),
      };
      const videos = await filesCollection
        .find(query)
        .sort({ upload_date: -1 })
        .toArray();
      res.json({ success: true, data: videos.map(serializeFileDoc) });
    } else {
      res
        .status(400)
        .json({ error: 'Invalid file type. Use "images" or "videos"' });
    }
  } catch (error) {
    console.error("Error fetching files by type:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// Delete file
app.delete("/files/:id", async (req, res) => {
  try {
    const fileId = req.params.id;

    // Validate ObjectId format
    if (!ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: "Invalid file ID format" });
    }

    const file = await filesCollection.findOne({ _id: new ObjectId(fileId) });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Delete file from filesystem
    try {
      if (fs.existsSync(file.file_path)) {
        fs.unlinkSync(file.file_path);
        console.log(`File deleted from filesystem: ${file.file_path}`);
      } else {
        console.log(`File not found on filesystem: ${file.file_path}`);
      }
    } catch (unlinkErr) {
      console.error("Error deleting file from filesystem:", unlinkErr);
    }

    // Delete from MongoDB
    await filesCollection.deleteOne({ _id: new ObjectId(fileId) });

    res.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "static-backend",
    timestamp: new Date().toISOString(),
    cdnBaseUrl: process.env.CDN_BASE_URL,
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large" });
    }
  }

  console.error("Error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectToMongoDB();

    // Ensure upload directories exist
    ensureUploadDirectories();

    // Start the server
    app.listen(PORT, () => {
      console.log(`Static-backend microservice running on port ${PORT}`);
      console.log(`CDN Base URL: ${process.env.CDN_BASE_URL}`);
      console.log(`Image size limit: ${process.env.MAX_IMAGE_SIZE} bytes`);
      console.log(`Video size limit: ${process.env.MAX_VIDEO_SIZE} bytes`);
      console.log(
        `MongoDB connected to: ${
          process.env.MONGODB_URI || "mongodb://localhost:27017/static_backend"
        }`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down static-backend microservice...");
  try {
    if (db) {
      await db.client.close();
      console.log("MongoDB connection closed");
    }
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
  }
  process.exit(0);
});

// Start the server
startServer();
