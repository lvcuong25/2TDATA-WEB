import { Router } from "express";
import routerUser from "./routerUser.js";
import routerAuth from "./routerAuth.js";
import routerService from "./routerService.js";
import routerBlog from "./routerBlog.js";
import routerIframe from "./routerIframe.js";
import routerFooterUpload from "./routerFooterUpload.js";

import userInfoRouter from "./userInfoRouter.js";
import userServiceRouter from "./userService.js";
import routerSite from "./routerSite.js";
import siteAdminRoutes from "./siteAdminRoutes.js";
import routerAsset from "./routerAsset.js";
import adminRouter from "./adminRouter.js";

import routerOrganization from "./routerOrganization.js";

const router = Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "2TDATA-WEB Backend is running!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    database: "connected",
    uptime: process.uptime()
  });
});

// Root endpoint
router.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to 2TDATA-WEB API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      users: "/api/user",
      services: "/api/service",
      blogs: "/api/blogs",
      sites: "/api/sites"
    }
  });
});

router.use("/auth", routerAuth);
router.use("/service", routerService);
router.use("/user", routerUser);
router.use("/blogs", routerBlog);
router.use("/requests", userServiceRouter);
router.use("/userInfo", userInfoRouter);

router.use("/iframe", routerIframe);
router.use("/footer", routerFooterUpload);
router.use("/sites", routerSite);
router.use("/site-admins", siteAdminRoutes);
router.use("/assets", routerAsset);

// Admin routes with proper admin interface support
router.use("/admin", adminRouter);


router.use("/organization", routerOrganization);
export default router;
 