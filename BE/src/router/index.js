import { Router } from "express";
import routerAuth from "./routerAuth.js";
import routerService from "./routerService.js";
import routerUser from "./routerUser.js";
import routerBlog from "./routerBlog.js";
import routerUserService from "./userService.js";
import userInfoRouter from "./userInfoRouter.js";




const router = Router();

router.use("/auth", routerAuth);
router.use("/service", routerService);
router.use("/user", routerUser);
router.use("/blogs", routerBlog);
router.use("/requests", routerUserService);
router.use("/userInfo", userInfoRouter);
export default router;
 