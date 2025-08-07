import express from "express";
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizations,
  getOrganizationById,
  addMember,
  updateMemberRole,
  removeMember,
  getOrganizationsByUserId,
  getAvailableUsers
} from "../controllers/organizationController.js";
import {
  getPendingOrganizationServices,
  getOrganizationServices,
  addServiceToOrganization,
  approveOrganizationService,
  getOrganizationServiceDetail,
  removeOrganizationService,
  updateOrganizationServiceLinks
} from "../controllers/organizationService.js";
import { getUser } from "../middlewares/getUser.js";

const router = express.Router();

router.use(getUser); // Áp dụng cho tất cả các route bên dưới

// ===== OrganizationService routes =====
// Lấy danh sách service đang chờ xác nhận (admin)
router.get("/pending", getPendingOrganizationServices);
// Lấy chi tiết 1 service của tổ chức
router.get("/services/:id", getOrganizationServiceDetail);
// Duyệt trạng thái service (admin)
router.put("/services/:id/approve", approveOrganizationService);
// Xóa service khỏi tổ chức
router.delete("/services/:id", removeOrganizationService);
// Cập nhật link cho service
router.put("/services/:id/links", updateOrganizationServiceLinks);
// Lấy danh sách service của 1 tổ chức
router.get("/:orgId/services", getOrganizationServices);
// Thêm service vào tổ chức
router.post("/:orgId/services", addServiceToOrganization);

// Các route tổ chức
router.post("/", createOrganization);
router.put("/:id", updateOrganization);
router.delete("/:id", deleteOrganization);
router.get("/",  getOrganizations);
router.get("/available-users", getAvailableUsers); // Lấy users chưa thuộc tổ chức nào
router.get("/user/:userId", getOrganizationsByUserId);
router.get("/:id", getOrganizationById);

// Quản lý thành viên (Members)
router.post("/:orgId/members", addMember);
router.put("/:orgId/members/:userId", updateMemberRole);
router.delete("/:orgId/members/:userId", removeMember);

export default router;
