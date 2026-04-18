import { Router } from "express";
import * as topicController from "../../controllers/content/topicControllers.js";
import uploadWordDocument from "../../middleware/wordDocumentUpload.js";

const router = Router();

router.get("/by-chapter/:chapterId", topicController.getTopicsByChapter);
router.post("/by-chapter/:chapterId", topicController.createTopic);
router.post(
  "/by-chapter/:chapterId/import-word",
  uploadWordDocument.single("document"),
  topicController.importWordContent
);
router.get("/:id", topicController.getTopic);
router.put("/:id", topicController.updateTopic);
router.delete("/:id", topicController.deleteTopic);

export default router;
