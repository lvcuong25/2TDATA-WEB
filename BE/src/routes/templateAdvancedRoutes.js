import express from 'express';
import {
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
import { authMiddleware as authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * TEMPLATE ADVANCED ROUTES
 * 
 * Các tính năng nâng cao cho template system
 * Tương tự như database system
 */

// ===========================================
// TEMPLATE COPY & DUPLICATE
// ===========================================

// POST /api/templates/:id/copy - Copy template
router.post('/:id/copy', authenticateToken, copyTemplate);

// POST /api/templates/:id/duplicate - Duplicate template
router.post('/:id/duplicate', duplicateTemplate);

// ===========================================
// TEMPLATE EXPORT & IMPORT
// ===========================================

// GET /api/templates/:id/export - Export template
router.get('/:id/export', exportTemplate);

// POST /api/templates/import - Import template
router.post('/import', authenticateToken, importTemplate);

// ===========================================
// TEMPLATE VALIDATION & STATISTICS
// ===========================================

// GET /api/templates/:id/validate - Validate template
router.get('/:id/validate', validateTemplate);

// GET /api/templates/:id/statistics - Get template statistics
router.get('/:id/statistics', getTemplateStatistics);

// ===========================================
// TEMPLATE SEARCH & CATEGORIES
// ===========================================

// GET /api/templates/search - Search templates
router.get('/search', searchTemplates);

// GET /api/templates/categories - Get template categories
router.get('/categories', getTemplateCategories);

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

export default router;
