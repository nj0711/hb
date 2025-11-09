// backend/routes/messageRoutes.js
import express from "express";
import {
  getAdminConversations,
  getConversation,
  getUserConversations,
  markMessagesRead,
  sendMessage,
} from "../controllers/messageController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// ✅ All routes need authentication
router.use(auth);

// ✅ Send a message
router.post("/", sendMessage);

// ✅ Static paths BEFORE dynamic ones
router.get("/my/conversations", getUserConversations);
router.get("/admin/conversations/all", getAdminConversations);
router.put("/read/:userId", markMessagesRead);   // <-- move this above

// ✅ Dynamic route LAST
router.get("/:userId", getConversation);

export default router;
