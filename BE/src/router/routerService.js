import { Router } from "express";
import { 
    getServices, 
    getServiceById, 
    createService, 
    updateService, 
    deleteService,
    getServiceBySlug
} from "../controllers/service.js";
import { checkServiceAccess } from "../middlewares/checkServiceAccess.js";
import { getUser } from "../middlewares/getUser.js";


const routerService = Router();

// Các route cần xác thực
// routerService.use(getUser);

// Lấy danh sách dịch vụ
routerService.get("/", getServices);

// Lấy chi tiết một dịch vụ theo ID - chỉ cho phép truy cập dịch vụ đã đăng ký
routerService.get("/:id",getUser, getServiceById);

// Lấy chi tiết một dịch vụ theo slug - chỉ cho phép truy cập dịch vụ đã đăng ký
routerService.get("/slug/:slug",getUser, getServiceBySlug);

// Tạo dịch vụ mới (chỉ admin mới có quyền)
routerService.post("/",getUser, createService);

// Cập nhật dịch vụ (chỉ admin mới có quyền)
routerService.put("/:id",getUser, updateService);

// Xóa dịch vụ (chỉ admin mới có quyền)
routerService.delete("/:id",getUser, deleteService);

export default routerService; 