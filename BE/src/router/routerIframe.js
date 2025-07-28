import express from "express";
import { 
  getAllIframes,
  getIframeById,
  getIframeByDomain,
  createIframe,
  updateIframe,
  deleteIframe,
  checkAuthStatus
} from "../controllers/iframe.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { checkIframeAccess } from "../middlewares/checkIframeAccess.js";
import { requestLogger } from "../middlewares/requestLogger.js";

const router = express.Router();
// Check authentication status
router.get("/auth/status", checkIframeAccess, checkAuthStatus);

// Public route for viewing iframe (with optional auth)
router.get("/view/:domain", requestLogger, checkIframeAccess, getIframeByDomain);

// Admin routes - require authentication
router.get("/", requireAuth, getAllIframes);
router.get("/:id", requireAuth, getIframeById);
router.get("/domain/:domain", requireAuth, getIframeByDomain);
router.post("/", requireAuth, createIframe);
router.put("/:id", requireAuth, updateIframe);
router.delete("/:id", requireAuth, deleteIframe);  

export default router;
