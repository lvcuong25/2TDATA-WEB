import { Router } from "express";
import routerAuth from "./routerAuth.js";
import routerService from "./routerService.js";
import routerUser from "./routerUser.js";
import routerBlog from "./routerBlog.js";
import routerUserService from "./userService.js";
import userInfoRouter from "./userInfoRouter.js";
import routerIframe from "./routerIframe.js";
import routerOrganization from "./routerOrganization.js";




const router = Router();

router.use("/auth", routerAuth);
router.use("/service", routerService);
router.use("/user", routerUser);
router.use("/blogs", routerBlog);
router.use("/requests", routerUserService);
router.use("/userInfo", userInfoRouter);
router.use("/iframe", routerIframe);
router.use("/organization", routerOrganization);
export default router;
 