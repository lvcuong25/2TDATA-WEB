import { Router } from "express";
import routerUser from "./routerUser.js";
import routerAuth from "./routerAuth.js";
import routerService from "./routerService.js";
import routerBlog from "./routerBlog.js";
import routerIframe from "./routerIframe.js";
import routerFooterUpload from "./routerFooterUpload.js";
import routerViewUpload from "./routerViewUpload.js";
import routerServer from "./routerServer.js";

import userInfoRouter from "./userInfoRouter.js";
import userServiceRouter from "./userService.js";
import routerSite from "./routerSite.js";
import siteAdminRoutes from "./siteAdminRoutes.js";
import routerAsset from "./routerAsset.js";
import adminRouter from "./adminRouter.js";

import routerOrganization from "./routerOrganization.js";
import routerDatabase from "./routerDatabase.js";
// import testRouter from "./testRouter.js"; // File deleted
import tableTemplateRouter from "./tableTemplateRouter.js";
import templateCompleteRoutes from "../routes/templateCompleteRoutes.js";
import routerOrder from "./orderRouter.js";
import routerCell from "./routerCell.js";
import basesRouter from "./bases.routes.js";
import membersRouter from "./members.routes.js";
import baseRolesRouter from "./baseRoles.routes.js";
import locksRouter from "./locks.routes.js";
import columnsReadRouter from "./columns.read.routes.js";
import tableRouter from "./table.routes.js";
import tableRoutesSimple from "../routes/tableRoutesSimple.js";
import columnPermsRouter from "./column-perms.routes.js";
import rolesPermsRouter from "./roles-perms.routes.js";
import permissionRouter from "./permission.routes.js";
import postgresRoutes from "../routes/postgresRoutes.js";
import columnPermissionRouter from "../routes/columnPermissionRoutes.js";
import cellPermissionRouter from "../routes/cellPermissionRoutes.js";

const router = Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "2TDATA-WEB Backend is running!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    database: "connected",
    uptime: process.uptime(),
  });
});


// Root endpoint - UPDATED to include iframe
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
      sites: "/api/sites",
      server: "/api/server",
      iframe: "/api/iframe",
      iframe_n8n: "/api/iframe/n8n/upsert",
      database: "/api/database",
      templates: "/api/templates",
    },
  });
});

router.use("/auth", routerAuth);
router.use("/service", routerService);
router.use("/user", routerUser);
router.use("/blogs", routerBlog);
router.use("/requests", userServiceRouter);
router.use("/userInfo", userInfoRouter);
router.use("/server", routerServer);

router.use("/iframe", routerIframe);
router.use("/footer", routerFooterUpload);
router.use("/view", routerViewUpload);
router.use("/sites", routerSite);
router.use("/site-admins", siteAdminRoutes);
router.use("/assets", routerAsset);
router.use("/orders", routerOrder);
router.use("/action", routerCell);

router.use(basesRouter);
router.use(locksRouter);
router.use(columnsReadRouter);
router.use("/tables", tableRouter);
router.use("/postgres", postgresRoutes); // PostgreSQL routes for data models

router.use("/database", tableRoutesSimple); // Simple PostgreSQL routes for testing - ENABLED

router.use(columnPermsRouter);
router.use(rolesPermsRouter);
router.use("/permissions", permissionRouter);
router.use("/permissions", columnPermissionRouter);
router.use("/permissions", cellPermissionRouter);
// router.use("/conditional-formatting", conditionalFormattingRouter);
// Admin routes with proper admin interface support
router.use("/admin", adminRouter);

router.use("/organization", routerOrganization);
// Mount members and roles routes under /database first to avoid conflicts
router.use("/database", membersRouter);
router.use("/database", baseRolesRouter);
router.use("/database", tableRoutesSimple); // Simple PostgreSQL routes for testing (fallback)
router.use("/database", routerDatabase); // Database routes with permission checks
router.use("/templates", tableTemplateRouter); // Old template routes (legacy)
router.use("/api/templates", templateCompleteRoutes); // New complete template routes
// router.use("/test", testRouter); // File deleted
export default router;
