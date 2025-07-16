import express from "express";
import { 
  getAllIframes,
  getIframeById,
  getIframeByDomain,
  createIframe,
  updateIframe,
  deleteIframe
} from "../controllers/iframe.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { checkIframeAccess } from "../middlewares/checkIframeAccess.js";

const router = express.Router();

// Public route for viewing iframe (with optional auth)
router.get("/view/:domain", checkIframeAccess, getIframeByDomain);

// Admin routes - require authentication
router.get("/", requireAuth, getAllIframes);
router.get("/:id", requireAuth, getIframeById);
router.get("/domain/:domain", requireAuth, getIframeByDomain);
router.post("/", requireAuth, createIframe);
router.put("/:id", requireAuth, updateIframe);
router.delete("/:id", requireAuth, deleteIframe);  

export default router;
