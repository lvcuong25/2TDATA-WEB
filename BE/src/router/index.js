import { Router } from "express";
import routerAuth from "./routerAuth.js";
import routerService from "./routerService.js";
import routerUser from "./routerUser.js";
import routerBlog from "./routerBlog.js";



const router = Router();

router.use("/auth", routerAuth);
router.use("/service", routerService);
router.use("/user", routerUser);
router.use("/blogs", routerBlog);
export default router;
 