import { Router } from "express";
import * as topicController from "../../controllers/content/topicControllers.js";
import uploadWordDocument from "../../middleware/wordDocumentUpload.js";

const router = Router();

const handleWordUpload = (req, res, next) => {
  uploadWordDocument.single("document")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Invalid Word file" });
    }
    return next();
  });
};

router.get("/by-chapter/:chapterId", topicController.getTopicsByChapter);
router.post("/by-chapter/:chapterId", topicController.createTopic);
router.post(
  "/by-chapter/:chapterId/import-word",
  handleWordUpload,
  topicController.importWordContent
);
router.get("/:id", topicController.getTopic);
router.put("/:id", topicController.updateTopic);
router.delete("/:id", topicController.deleteTopic);

export default router;
