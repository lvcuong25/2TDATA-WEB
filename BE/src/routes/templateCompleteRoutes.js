import express from 'express';
import {
  // Basic template operations
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate,
  incrementTemplateUsage
} from '../controllers/templateController.js';

import {
  // Template structure management
  createTemplateTable,
  getTemplateTables,
  getTemplateTableById,
  updateTemplateTable,
  deleteTemplateTable,
  reorderTemplateTables,
  createTemplateColumn,
  getTemplateColumns,
  getTemplateColumnById,
  updateTemplateColumn,
  deleteTemplateColumn,
  reorderTemplateColumns
} from '../controllers/templateStructureController.js';

import {
  // Template advanced features
  copyTemplate,
  duplicateTemplate,
  exportTemplate,
  importTemplate,
  validateTemplate,
  getTemplateStatistics,
  searchTemplates,
  getTemplateCategories
} from '../controllers/templateAdvancedController.js';

import {
  // Template record management
  createTemplateRecord,
  getTemplateRecords,
  getTemplateRecordById,
  updateTemplateRecord,
  deleteTemplateRecord,
  deleteMultipleTemplateRecords,
  getTemplateStructure
} from '../controllers/templateRecordController.js';

import {
  // Template view management
  createTemplateView,
  getTemplateViews,
  getTemplateViewById,
  updateTemplateView,
  deleteTemplateView,
  copyTemplateView
} from '../controllers/templateViewController.js';

import {
  // Template kanban management
  getTemplateKanbanData,
  getTemplateKanbanConfig,
  addTemplateKanbanColumn,
  updateTemplateRecordColumn,
  getTemplateFilterOperators
} from '../controllers/templateKanbanController.js';

import {
  // Template filter management
  getTemplateFilterPreference,
  saveTemplateFilterPreference,
  deleteTemplateFilterPreference,
  getAllTemplateFilterPreferences
} from '../controllers/templateFilterController.js';

import {
  // Template conditional formatting
  getTemplateFormattingRules,
  createTemplateFormattingRule,
  updateTemplateFormattingRule,
  deleteTemplateFormattingRule,
  previewTemplateFormatting
} from '../controllers/templateConditionalFormattingController.js';

import {
  // Template comment management
  createTemplateComment,
  getTemplateComments,
  getTemplateCommentById,
  updateTemplateComment,
  deleteTemplateComment
} from '../controllers/templateCommentController.js';

// Template permission management - REMOVED (not needed)

import { authMiddleware as authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * COMPLETE TEMPLATE ROUTES
 * 
 * Tất cả chức năng database nhưng loại bỏ organization
 * Template = Bản copy database structure (không có organization & permissions)
 */

// ===========================================
// BASIC TEMPLATE OPERATIONS
// ===========================================

// GET /api/templates - Get all templates
router.get('/', getAllTemplates);

// GET /api/templates/search - Search templates
router.get('/search', searchTemplates);

// GET /api/templates/categories - Get template categories
router.get('/categories', getTemplateCategories);

// GET /api/templates/:id - Get template by ID
router.get('/:id', getTemplateById);

// POST /api/templates - Create template
router.post('/', authenticateToken, createTemplate);

// PUT /api/templates/:id - Update template
router.put('/:id', authenticateToken, updateTemplate);

// DELETE /api/templates/:id - Delete template
router.delete('/:id', authenticateToken, deleteTemplate);

// POST /api/templates/:id/apply - Apply template to database
router.post('/:id/apply', authenticateToken, applyTemplate);

// POST /api/templates/:id/usage - Increment template usage
router.post('/:id/usage', incrementTemplateUsage);

// ===========================================
// TEMPLATE ADVANCED FEATURES
// ===========================================

// POST /api/templates/:id/copy - Copy template
router.post('/:id/copy', authenticateToken, copyTemplate);

// POST /api/templates/:id/duplicate - Duplicate template
router.post('/:id/duplicate', duplicateTemplate);

// GET /api/templates/:id/export - Export template
router.get('/:id/export', exportTemplate);

// POST /api/templates/import - Import template
router.post('/import', authenticateToken, importTemplate);

// GET /api/templates/:id/validate - Validate template
router.get('/:id/validate', validateTemplate);

// GET /api/templates/:id/statistics - Get template statistics
router.get('/:id/statistics', getTemplateStatistics);

// ===========================================
// TEMPLATE STRUCTURE MANAGEMENT
// ===========================================

// Template Tables
// POST /api/templates/:template_id/tables - Create template table
router.post('/:template_id/tables', authenticateToken, createTemplateTable);

// GET /api/templates/:template_id/tables - Get template tables
router.get('/:template_id/tables', getTemplateTables);

// GET /api/templates/tables/:table_id - Get template table by ID
router.get('/tables/:table_id', getTemplateTableById);

// PUT /api/templates/tables/:table_id - Update template table
router.put('/tables/:table_id', authenticateToken, updateTemplateTable);

// DELETE /api/templates/tables/:table_id - Delete template table
router.delete('/tables/:table_id', authenticateToken, deleteTemplateTable);

// PUT /api/templates/:template_id/tables/reorder - Reorder template tables
router.put('/:template_id/tables/reorder', authenticateToken, reorderTemplateTables);

// Template Columns
// POST /api/templates/tables/:table_id/columns - Create template column
router.post('/tables/:table_id/columns', authenticateToken, createTemplateColumn);

// GET /api/templates/tables/:table_id/columns - Get template columns
router.get('/tables/:table_id/columns', getTemplateColumns);

// GET /api/templates/columns/:column_id - Get template column by ID
router.get('/columns/:column_id', getTemplateColumnById);

// PUT /api/templates/columns/:column_id - Update template column
router.put('/columns/:column_id', authenticateToken, updateTemplateColumn);

// DELETE /api/templates/columns/:column_id - Delete template column
router.delete('/columns/:column_id', authenticateToken, deleteTemplateColumn);

// PUT /api/templates/tables/:table_id/columns/reorder - Reorder template columns
router.put('/tables/:table_id/columns/reorder', authenticateToken, reorderTemplateColumns);

// ===========================================
// TEMPLATE RECORD MANAGEMENT
// ===========================================

// POST /api/templates/:template_id/tables/:table_id/records - Create template record
router.post('/:template_id/tables/:table_id/records', authenticateToken, createTemplateRecord);

// GET /api/templates/:template_id/tables/:table_id/records - Get template records
router.get('/:template_id/tables/:table_id/records', getTemplateRecords);

// GET /api/templates/:template_id/tables/:table_id/records/:record_id - Get template record by ID
router.get('/:template_id/tables/:table_id/records/:record_id', getTemplateRecordById);

// PUT /api/templates/:template_id/tables/:table_id/records/:record_id - Update template record
router.put('/:template_id/tables/:table_id/records/:record_id', authenticateToken, updateTemplateRecord);

// DELETE /api/templates/:template_id/tables/:table_id/records/:record_id - Delete template record
router.delete('/:template_id/tables/:table_id/records/:record_id', authenticateToken, deleteTemplateRecord);

// DELETE /api/templates/:template_id/tables/:table_id/records - Delete multiple template records
router.delete('/:template_id/tables/:table_id/records', authenticateToken, deleteMultipleTemplateRecords);

// GET /api/templates/:template_id/structure - Get template structure
router.get('/:template_id/structure', getTemplateStructure);

// ===========================================
// TEMPLATE VIEW MANAGEMENT
// ===========================================

// POST /api/templates/:template_id/views - Create template view
router.post('/:template_id/views', authenticateToken, createTemplateView);

// GET /api/templates/:template_id/views - Get template views
router.get('/:template_id/views', getTemplateViews);

// GET /api/templates/:template_id/views/:view_id - Get template view by ID
router.get('/:template_id/views/:view_id', getTemplateViewById);

// PUT /api/templates/:template_id/views/:view_id - Update template view
router.put('/:template_id/views/:view_id', authenticateToken, updateTemplateView);

// DELETE /api/templates/:template_id/views/:view_id - Delete template view
router.delete('/:template_id/views/:view_id', authenticateToken, deleteTemplateView);

// POST /api/templates/:template_id/views/:view_id/copy - Copy template view
router.post('/:template_id/views/:view_id/copy', authenticateToken, copyTemplateView);

// ===========================================
// TEMPLATE KANBAN MANAGEMENT
// ===========================================

// GET /api/templates/:template_id/tables/:table_id/kanban - Get template kanban data
router.get('/:template_id/tables/:table_id/kanban', getTemplateKanbanData);

// GET /api/templates/:template_id/tables/:table_id/kanban/config - Get template kanban config
router.get('/:template_id/tables/:table_id/kanban/config', getTemplateKanbanConfig);

// POST /api/templates/:template_id/tables/:table_id/kanban/columns - Add template kanban column
router.post('/:template_id/tables/:table_id/kanban/columns', authenticateToken, addTemplateKanbanColumn);

// PUT /api/templates/:template_id/tables/:table_id/records/:record_id/columns/:column_name - Update template record column
router.put('/:template_id/tables/:table_id/records/:record_id/columns/:column_name', authenticateToken, updateTemplateRecordColumn);

// GET /api/templates/:template_id/tables/:table_id/kanban/operators - Get template filter operators
router.get('/:template_id/tables/:table_id/kanban/operators', getTemplateFilterOperators);

// ===========================================
// TEMPLATE FILTER MANAGEMENT
// ===========================================

// GET /api/templates/:template_id/tables/:table_id/filters - Get template filter preference
router.get('/:template_id/tables/:table_id/filters', getTemplateFilterPreference);

// POST /api/templates/:template_id/tables/:table_id/filters - Save template filter preference
router.post('/:template_id/tables/:table_id/filters', authenticateToken, saveTemplateFilterPreference);

// DELETE /api/templates/:template_id/tables/:table_id/filters/:preference_id - Delete template filter preference
router.delete('/:template_id/tables/:table_id/filters/:preference_id', authenticateToken, deleteTemplateFilterPreference);

// GET /api/templates/:template_id/tables/:table_id/filters/all - Get all template filter preferences
router.get('/:template_id/tables/:table_id/filters/all', getAllTemplateFilterPreferences);

// ===========================================
// TEMPLATE CONDITIONAL FORMATTING
// ===========================================

// GET /api/templates/:template_id/tables/:table_id/formatting - Get template formatting rules
router.get('/:template_id/tables/:table_id/formatting', getTemplateFormattingRules);

// POST /api/templates/:template_id/tables/:table_id/formatting - Create template formatting rule
router.post('/:template_id/tables/:table_id/formatting', authenticateToken, createTemplateFormattingRule);

// PUT /api/templates/:template_id/tables/:table_id/formatting/:rule_id - Update template formatting rule
router.put('/:template_id/tables/:table_id/formatting/:rule_id', authenticateToken, updateTemplateFormattingRule);

// DELETE /api/templates/:template_id/tables/:table_id/formatting/:rule_id - Delete template formatting rule
router.delete('/:template_id/tables/:table_id/formatting/:rule_id', authenticateToken, deleteTemplateFormattingRule);

// POST /api/templates/:template_id/tables/:table_id/formatting/preview - Preview template formatting
router.post('/:template_id/tables/:table_id/formatting/preview', previewTemplateFormatting);

// ===========================================
// TEMPLATE COMMENT MANAGEMENT
// ===========================================

// POST /api/templates/:template_id/tables/:table_id/records/:record_id/comments - Create template comment
router.post('/:template_id/tables/:table_id/records/:record_id/comments', authenticateToken, createTemplateComment);

// GET /api/templates/:template_id/tables/:table_id/records/:record_id/comments - Get template comments
router.get('/:template_id/tables/:table_id/records/:record_id/comments', getTemplateComments);

// GET /api/templates/:template_id/tables/:table_id/records/:record_id/comments/:comment_id - Get template comment by ID
router.get('/:template_id/tables/:table_id/records/:record_id/comments/:comment_id', getTemplateCommentById);

// PUT /api/templates/:template_id/tables/:table_id/records/:record_id/comments/:comment_id - Update template comment
router.put('/:template_id/tables/:table_id/records/:record_id/comments/:comment_id', authenticateToken, updateTemplateComment);

// DELETE /api/templates/:template_id/tables/:table_id/records/:record_id/comments/:comment_id - Delete template comment
router.delete('/:template_id/tables/:table_id/records/:record_id/comments/:comment_id', authenticateToken, deleteTemplateComment);

// ===========================================
// TEMPLATE PERMISSION MANAGEMENT - REMOVED
// ===========================================
// Template permissions are not needed - templates are public/private only

export default router;
