import express from "express";
import { createChatbotLead } from "../controllers/chatbotLeadController.js";

const router = express.Router();

router.post("/", createChatbotLead);

export default router;
