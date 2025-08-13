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
import { authAndSiteDetectionMiddleware } from "../middlewares/authAndSiteDetection.js";
import { getUser } from "../middlewares/getUser.js";
import { requestLogger } from "../middlewares/requestLogger.js";

const router = express.Router();

// Check authentication status
router.get("/auth/status", authAndSiteDetectionMiddleware, checkAuthStatus);

// Public route for viewing iframe (with optional auth)
router.get("/view/:domain", requestLogger, authAndSiteDetectionMiddleware, getIframeByDomain);

// Admin routes - require authentication with cookie support
router.get("/", authAndSiteDetectionMiddleware, getAllIframes);
router.get("/:id", authAndSiteDetectionMiddleware, getIframeById);
router.get("/domain/:domain", authAndSiteDetectionMiddleware, getIframeByDomain);
router.post("/", authAndSiteDetectionMiddleware, createIframe);
router.put("/:id", authAndSiteDetectionMiddleware, updateIframe);
router.delete("/:id", authAndSiteDetectionMiddleware, deleteIframe);  

export default router;
