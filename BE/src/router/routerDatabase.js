import { Router } from "express";
import {
  createDatabase,
  getDatabases,
  getDatabaseById,
  updateDatabase,
  deleteDatabase
} from "../controllers/databaseController.js";

import {
  createTable,
  getTables,
  getTableById,
  updateTable,
  deleteTable
} from "../controllers/tableController.js";

import {
  createColumn,
  getColumns,
  getColumnById,
  updateColumn,
  deleteColumn
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
  getGroupPreference,
  saveGroupPreference,
  deleteGroupPreference,
  getAllGroupPreferences
} from "../controllers/groupPreferenceController.js";

const router = Router();

// Database routes
router.post("/databases", createDatabase);
router.get("/databases", getDatabases);
router.get("/databases/:databaseId", getDatabaseById);
router.put("/databases/:databaseId", updateDatabase);
router.delete("/databases/:databaseId", deleteDatabase);

// Table routes
router.post("/tables", createTable);
router.get("/databases/:databaseId/tables", getTables);
router.get("/tables/:tableId", getTableById);
router.put("/tables/:tableId", updateTable);
router.delete("/tables/:tableId", deleteTable);

// Column routes
router.post("/columns", createColumn);
router.get("/tables/:tableId/columns", getColumns);
router.get("/columns/:columnId", getColumnById);
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

// Table structure route
router.get("/tables/:tableId/structure", getTableStructure);

// Group preference routes
router.get("/tables/:tableId/group-preference", getGroupPreference);
router.post("/tables/:tableId/group-preference", saveGroupPreference);
router.delete("/tables/:tableId/group-preference", deleteGroupPreference);
router.get("/group-preferences", getAllGroupPreferences);

export default router;
