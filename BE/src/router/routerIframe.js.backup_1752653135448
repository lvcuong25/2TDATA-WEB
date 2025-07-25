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

const router = express.Router();

// Tất cả route iframe đều yêu cầu authentication
// Lấy danh sách tất cả iframe - yêu cầu auth
router.get("/", requireAuth, getAllIframes);

// Lấy 1 iframe theo id - yêu cầu auth
router.get("/:id", requireAuth, getIframeById);

// Lấy iframe theo domain - yêu cầu auth
router.get("/domain/:domain", requireAuth, getIframeByDomain);

// Thêm mới iframe - yêu cầu auth
router.post("/", requireAuth, createIframe);

// Sửa iframe - yêu cầu auth
router.put("/:id", requireAuth, updateIframe);

// Xóa iframe - yêu cầu auth
router.delete("/:id", requireAuth, deleteIframe);  

export default router;
