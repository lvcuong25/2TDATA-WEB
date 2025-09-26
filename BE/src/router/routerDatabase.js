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
// Test route without any middleware
router.get("/databases/:databaseId/members-test", async (req, res) => {
  try {
    const { databaseId } = req.params;
    console.log(`🔍 Test route called for databaseId: ${databaseId}`);

    // Import models directly
    const BaseMember = (await import('../model/BaseMember.js')).default;

    const baseMembers = await BaseMember.find({ databaseId })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 });

    console.log(`🔍 Test route - BaseMembers found:`, baseMembers);

    const members = baseMembers.map(member => ({
      _id: member._id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.createdAt
    }));

    res.status(200).json({
      success: true,
      data: members,
      message: 'Test route success'
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({
      message: 'Test route error',
      error: error.message
    });
  }
});

// Test route to update user role
router.put("/databases/:databaseId/update-role-test", async (req, res) => {
  try {
    const { databaseId } = req.params;
    const { userId, newRole } = req.body;
    
    console.log(`🔍 Update role test route called:`, {
      databaseId,
      userId,
      newRole
    });

    // Import models directly
    const BaseMember = (await import('../model/BaseMember.js')).default;

    // Find the member to update
    const baseMember = await BaseMember.findOne({
      databaseId,
      userId
    });

    if (!baseMember) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found in this database' 
      });
    }

    // Update the role
    baseMember.role = newRole;
    await baseMember.save();

    console.log(`🔍 Updated user role:`, baseMember);

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: baseMember
    });

  } catch (error) {
    console.error('Update role test route error:', error);
    res.status(500).json({
      success: false,
      message: 'Update role test route error',
      error: error.message
    });
  }
});

router.get("/databases/:databaseId/members", requireAuthWithCookie, getDatabaseMembers);
router.put("/databases/update-user-role", requireAuthWithCookie, updateUserRole);
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

// Test route for column permissions (bypass permission check)
router.get("/databases/:databaseId/tables/:tableId/columns-permissions-test", async (req, res) => {
  try {
    const { tableId } = req.params;
    
    console.log(`🔍 Test column permissions called for tableId: ${tableId}`);

    // Import models
    const Column = (await import('../model/Column.js')).default;
    const ColumnPermission = (await import('../model/ColumnPermission.js')).default;

    // Get all columns of the table
    const columns = await Column.find({ tableId });
    const columnIds = columns.map(col => col._id);

    console.log(`🔍 Found ${columns.length} columns:`, columns.map(c => ({ id: c._id, name: c.name })));

    // Get all permissions for these columns
    const permissions = await ColumnPermission.find({ 
      columnId: { $in: columnIds } 
    })
      .populate('userId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    console.log(`🔍 Found ${permissions.length} permissions:`, permissions);

    res.status(200).json({
      success: true,
      data: permissions,
      message: 'Test column permissions retrieved successfully',
      debug: {
        tableId,
        columnsCount: columns.length,
        columnIds,
        permissionsCount: permissions.length
      }
    });

  } catch (error) {
    console.error('Error getting test column permissions:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Test route for record permissions (bypass permission check)
router.get("/databases/:databaseId/tables/:tableId/records-permissions-test", async (req, res) => {
  try {
    const { tableId } = req.params;
    
    console.log(`🔍 Test record permissions called for tableId: ${tableId}`);

    // Import models
    const Record = (await import('../model/Record.js')).default;
    const RecordPermission = (await import('../model/RecordPermission.js')).default;

    // Get all records of the table
    const records = await Record.find({ tableId });
    const recordIds = records.map(rec => rec._id);

    console.log(`🔍 Found ${records.length} records:`, records.map(r => ({ id: r._id })));

    // Get all permissions for these records
    const permissions = await RecordPermission.find({ 
      recordId: { $in: recordIds } 
    })
      .populate('userId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    console.log(`🔍 Found ${permissions.length} record permissions:`, permissions);

    res.status(200).json({
      success: true,
      data: permissions,
      message: 'Test record permissions retrieved successfully',
      debug: {
        tableId,
        recordsCount: records.length,
        recordIds,
        permissionsCount: permissions.length
      }
    });

  } catch (error) {
    console.error('Error getting test record permissions:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Test route for cell permissions (bypass permission check)
router.get("/databases/:databaseId/tables/:tableId/cells-permissions-test", async (req, res) => {
  try {
    const { tableId } = req.params;
    
    console.log(`🔍 Test cell permissions called for tableId: ${tableId}`);

    // Import models
    const Record = (await import('../model/Record.js')).default;
    const Column = (await import('../model/Column.js')).default;
    const CellPermission = (await import('../model/CellPermission.js')).default;

    // Get all records and columns of the table
    const records = await Record.find({ tableId });
    const columns = await Column.find({ tableId });
    const recordIds = records.map(rec => rec._id);
    const columnIds = columns.map(col => col._id);

    console.log(`🔍 Found ${records.length} records and ${columns.length} columns`);

    // Get all permissions for these cells
    const permissions = await CellPermission.find({ 
      recordId: { $in: recordIds },
      columnId: { $in: columnIds }
    })
      .populate('userId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    console.log(`🔍 Found ${permissions.length} cell permissions:`, permissions);

    res.status(200).json({
      success: true,
      data: permissions,
      message: 'Test cell permissions retrieved successfully',
      debug: {
        tableId,
        recordsCount: records.length,
        columnsCount: columns.length,
        recordIds,
        columnIds,
        permissionsCount: permissions.length
      }
    });

  } catch (error) {
    console.error('Error getting test cell permissions:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Create default cell permissions for all cells in a table
router.post("/databases/:databaseId/tables/:tableId/create-default-cell-permissions", async (req, res) => {
  try {
    const { tableId, databaseId } = req.params;
    const { createdBy } = req.body; // User ID who creates the permissions
    
    console.log(`🔧 Creating default cell permissions for tableId: ${tableId}`);

    // Import models
    const Record = (await import('../model/Record.js')).default;
    const Column = (await import('../model/Column.js')).default;
    const CellPermission = (await import('../model/CellPermission.js')).default;

    // Get all records and columns of the table
    const records = await Record.find({ tableId });
    const columns = await Column.find({ tableId });

    console.log(`🔧 Found ${records.length} records and ${columns.length} columns`);

    const permissionsToCreate = [];
    let createdCount = 0;

    // Create permissions for each cell (record + column combination)
    for (const record of records) {
      for (const column of columns) {
        // Check if permission already exists
        const existingPermission = await CellPermission.findOne({
          recordId: record._id,
          columnId: column._id,
          targetType: 'all_members'
        });

        if (!existingPermission) {
          permissionsToCreate.push({
            recordId: record._id,
            columnId: column._id,
            tableId: tableId,
            databaseId: databaseId,
            targetType: 'all_members',
            canView: true,
            canEdit: true,
            note: 'Default cell permission',
            createdBy: createdBy,
            isDefault: true
          });
        }
      }
    }

    if (permissionsToCreate.length > 0) {
      const createdPermissions = await CellPermission.insertMany(permissionsToCreate);
      createdCount = createdPermissions.length;
      console.log(`🔧 Created ${createdCount} default cell permissions`);
    } else {
      console.log(`🔧 All cell permissions already exist`);
    }

    res.status(200).json({
      success: true,
      message: `Created ${createdCount} default cell permissions`,
      data: {
        tableId,
        recordsCount: records.length,
        columnsCount: columns.length,
        totalCells: records.length * columns.length,
        createdPermissions: createdCount,
        existingPermissions: (records.length * columns.length) - createdCount
      }
    });

  } catch (error) {
    console.error('Error creating default cell permissions:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});


export default router;
