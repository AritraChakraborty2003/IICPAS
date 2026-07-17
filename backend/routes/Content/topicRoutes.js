import { Router } from "express";
import * as topicController from "../../controllers/content/topicControllers.js";
import uploadWordDocument from "../../middleware/wordDocumentUpload.js";
import { requireAuth } from "../../middleware/requireAuth.js";

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
// Single fixed webhook: n8n posts { topicName, content } here
router.post("/ai-webhook", topicController.receiveAiContent);
// Frontend polls this with ?topicName=... to retrieve the AI content
router.get("/ai-content", topicController.getAiContent);

router.get("/:id", topicController.getTopic);
router.put("/:id", requireAuth, topicController.updateTopic);
router.delete("/:id", requireAuth, topicController.deleteTopic);

export default router;
