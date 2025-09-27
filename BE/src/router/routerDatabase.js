import { Router } from "express";
import {
  createDatabase,
  getDatabases,
  getDatabaseById,
  updateDatabase,
  deleteDatabase,
  getDatabaseMembers,
  updateUserRole
} from "../controllers/databaseController.js";


import {
  createTable,
  getTables,
  getTableById,
  updateTable,
  deleteTable,
  copyTable
} from "../controllers/tableController.js";

import {
  createColumn,
  getColumns,
  getColumnById,
  updateColumn,
  deleteColumn,
  getLinkedTableData,
  getLookupData
} from "../controllers/columnController.js";

import {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  deleteMultipleRecords,
  deleteAllRecords,
  getTableStructure
} from "../controllers/recordController.js";

import {
  getCommentsByRecord,
  createComment,
  updateComment,
  deleteComment,
  getCommentById
} from "../controllers/commentController.js";

import {
  getGroupPreference,
  saveGroupPreference,
  deleteGroupPreference,
  removeGroupRule,
  getAllGroupPreferences
} from "../controllers/groupPreferenceController.js";

import {
  getFilterPreference,
  saveFilterPreference,
  deleteFilterPreference,
  getAllFilterPreferences
} from "../controllers/filterController.js";

import {
  getFieldPreference,
  saveFieldPreference,
  deleteFieldPreference
} from "../controllers/fieldPreferenceController.js";

import {
  createView,
  getViews,
  getViewById,
  updateView,
  deleteView,
  copyView
} from "../controllers/viewController.js";
import {
  getKanbanData,
  updateRecordColumn,
  addKanbanColumn,
  getKanbanConfig,
  getFilterOperators
} from "../controllers/kanbanController.js";

import {
  getCalendarData,
  updateRecordDate,
  getCalendarConfig
} from "../controllers/calendarController.js";

import {
  exportDatabaseToExcel,
  importExcelToDatabase
} from "../controllers/excelController.js";

import {
  createViewValidation,
  updateViewValidation,
  copyViewValidation
} from "../validations/viewValidation.js";


import { requireAuthWithCookie } from "../middlewares/requireAuthWithCookie.js";
import { authAndSiteDetectionMiddleware } from "../middlewares/authAndSiteDetection.js";

import { uploadExcel } from "../middlewares/upload.js";

const router = Router();

// Database routes
router.post("/databases", createDatabase);
router.get("/databases", getDatabases);
router.get("/databases/:databaseId", getDatabaseById);

router.get("/databases/:databaseId/members", requireAuthWithCookie, getDatabaseMembers);
router.put("/databases/update-user-role", requireAuthWithCookie, updateUserRole);

// Add missing routes directly to routerDatabase
router.get("/databases/:databaseId/me", async (req, res, next) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user?._id;
    const BaseMember = (await import('../model/BaseMember.js')).default;
    const m = await BaseMember.findOne({ databaseId: databaseId, userId }).lean();
    if (!m) return res.status(200).json({ ok: true, isMember: false });
    
    return res.json({
      ok: true,
      isMember: true,
      member: {
        _id: m._id,
        role: m.role,
        canManageDatabase: m.role === "owner" || m.role === "manager",
      }
    });
  } catch (e) { return next(e); }
});


router.get("/databases/:databaseId/roles", async (req, res, next) => {
  try {
    const { databaseId } = req.params;
    const Base = (await import('../model/Base.js')).default;
    const BaseRole = (await import('../model/BaseRole.js')).default;
    
    const database = await Base.findById(databaseId).lean();
    if (!database) {
      return res.status(404).json({ ok: false, error: "database_not_found" });
    }
    
    const baseRoles = await BaseRole.find({ databaseId }).lean();
    
    const orgRoles = [
      { name: "Owner", role: "owner", canManageDatabase: true, builtin: true },
      { name: "Manager", role: "manager", canManageDatabase: true, builtin: true },
      { name: "Member", role: "member", canManageDatabase: false, builtin: true }
    ];
    
    baseRoles.forEach(role => {
      if (!role.builtin) {
        orgRoles.push({
          name: role.name,
          role: role.name.toLowerCase(),
          canManageDatabase: role.permissions?.canManageMembers || false,
          builtin: false,
          permissions: role.permissions
        });
      }
    });
    
    return res.json({ ok: true, data: orgRoles });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "get_roles_error" });
  }
});
router.put("/databases/:databaseId", updateDatabase);
router.delete("/databases/:databaseId", deleteDatabase);
// router.post("/databases/:databaseId/copy", copyDatabase); // Function not implemented yet

// Table routes
router.post("/tables", requireAuthWithCookie, createTable);
router.get("/databases/:databaseId/tables", getTables);
router.get("/tables/:tableId", getTableById);
router.put("/tables/:tableId", updateTable);
router.delete("/tables/:tableId", deleteTable);
router.post("/tables/:tableId/copy", copyTable);

// Column routes
router.post("/columns", createColumn);
router.get("/tables/:tableId/columns", getColumns);
router.get("/columns/:columnId", getColumnById);
router.get("/columns/:columnId/linked-data", getLinkedTableData);
router.get("/columns/:columnId/lookup-data", getLookupData);
router.put("/columns/:columnId", updateColumn);
router.delete("/columns/:columnId", deleteColumn);

// Record routes - IMPORTANT: Specific routes MUST come before parameterized routes
router.post("/records", createRecord);
router.get("/tables/:tableId/records", getRecords);

// Bulk delete routes - MUST come before :recordId routes
router.delete("/records/bulk", deleteMultipleRecords);
router.delete("/tables/:tableId/records/all", deleteAllRecords);

// Individual record routes - MUST come after bulk routes
router.get("/records/:recordId", getRecordById);
router.put("/records/:recordId", updateRecord);
router.delete("/records/:recordId", deleteRecord);

// Comment routes
router.get("/records/:recordId/comments", getCommentsByRecord);
router.post("/records/:recordId/comments", createComment);
router.get("/comments/:commentId", getCommentById);
router.put("/comments/:commentId", updateComment);
router.delete("/comments/:commentId", deleteComment);

// Table structure route
router.get("/tables/:tableId/structure", getTableStructure);

// Group preference routes
router.get("/tables/:tableId/group-preference", getGroupPreference);
router.post("/tables/:tableId/group-preference", saveGroupPreference);
router.delete("/tables/:tableId/group-preference", deleteGroupPreference);
router.patch("/tables/:tableId/group-preference/remove", removeGroupRule);
router.get("/group-preferences", getAllGroupPreferences);

// Filter preference routes
router.get("/tables/:tableId/filter-preference", getFilterPreference);
router.post("/tables/:tableId/filter-preference", saveFilterPreference);
router.delete("/tables/:tableId/filter-preference", deleteFilterPreference);
router.get("/filter-preferences", getAllFilterPreferences);

// Field preference routes
router.get("/tables/:tableId/field-preference", getFieldPreference);
router.post("/tables/:tableId/field-preference", saveFieldPreference);
router.delete("/tables/:tableId/field-preference", deleteFieldPreference);

// View routes
router.post("/views", createViewValidation, createView);
router.get("/tables/:tableId/views", getViews);
router.get("/views/:viewId", getViewById);
router.put("/views/:viewId", updateViewValidation, updateView);
router.delete("/views/:viewId", deleteView);
router.post("/views/:viewId/copy", copyViewValidation, copyView);

// Kanban routes
router.get("/tables/:tableId/kanban", getKanbanData);
router.get("/tables/:tableId/kanban/config", getKanbanConfig);
router.get("/kanban/filter-operators/:fieldType", getFilterOperators);
router.put("/records/:recordId/kanban", updateRecordColumn);
router.post("/tables/:tableId/kanban/column", addKanbanColumn);

// Calendar routes
router.get("/tables/:tableId/calendar", getCalendarData);
router.get("/tables/:tableId/calendar/config", getCalendarConfig);
router.put("/records/:recordId/calendar", updateRecordDate);

// Excel routes
router.get("/databases/:databaseId/export/excel", authAndSiteDetectionMiddleware, exportDatabaseToExcel);
router.post("/databases/:databaseId/export/excel", authAndSiteDetectionMiddleware, exportDatabaseToExcel);
router.post("/databases/:databaseId/import/excel", authAndSiteDetectionMiddleware, uploadExcel, importExcelToDatabase);



export default router;
