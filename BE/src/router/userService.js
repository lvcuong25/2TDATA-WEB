import { Router } from "express";
import { getUser } from "../middlewares/getUser.js";
import { checkPermission } from "../middlewares/checkPermission.js";
import { 
    getPendingServices, 
    approveUserService, 
    addServiceToUser, 
    getUserServices,
    getUserServiceDetail,
    removeUserService,
    updateUserServiceLinks,
    updateAutoUpdateSettings,
    getServicesForAutoUpdate,
    updateLastUpdateTime
} from "../controllers/userService.js";

const routerUserService = Router();

// Lấy danh sách service đang chờ xác nhận (chỉ admin)
routerUserService.get("/pending", checkPermission(), getPendingServices);

// Lấy danh sách service của user
routerUserService.get("/user/:userId", getUserServices);

// Thêm service vào user (sẽ ở trạng thái chờ xác nhận)
routerUserService.post("/add", getUser, addServiceToUser);

// Admin xác nhận/từ chối service cho user
routerUserService.put("/:id/approve", getUser, checkPermission(), approveUserService);

// Lấy chi tiết của một user service
routerUserService.get("/:id", getUserServiceDetail);

// Xóa service khỏi user
routerUserService.delete("/:id", getUser, removeUserService);

// Cập nhật link cho user service
routerUserService.put("/:id/links", getUser, updateUserServiceLinks);

// Cập nhật cài đặt auto update cho user service
routerUserService.put("/:id/auto-update", getUser, updateAutoUpdateSettings);

// Lấy danh sách service cần cập nhật tự động (cho cron job)
routerUserService.get("/auto-update/list", getServicesForAutoUpdate);

// Cập nhật thời gian cập nhật cuối cùng
routerUserService.put("/:id/update-time", updateLastUpdateTime);

export default routerUserService;
