import express from 'express';
import {
  getPublicTemplates,
  getTemplateById,
  copyTemplateToDatabase,
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateCategories,
  createTemplateFromDatabase,
  createCategory,
  updateCategory,
  deleteCategory,
  // New template table management endpoints
  getTemplateTable,
  updateTemplateTable,
  addTemplateColumn,
  updateTemplateColumn,
  deleteTemplateColumn,
  reorderTemplateColumns,
  addTemplateRecord,
  getTemplateRecords,
  updateTemplateRecord,
  deleteTemplateRecord
} from '../controllers/tableTemplateController.js';
import { requireAuthWithCookie } from '../middlewares/requireAuthWithCookie.js';

const router = express.Router();

// Public routes (for all authenticated users)
router.get('/public', requireAuthWithCookie, getPublicTemplates);
router.get('/categories', requireAuthWithCookie, getTemplateCategories);
router.get('/:id', requireAuthWithCookie, getTemplateById);
router.post('/:templateId/copy', requireAuthWithCookie, copyTemplateToDatabase);

// Super Admin only routes
router.get('/admin/all', requireAuthWithCookie, getAllTemplates);
router.post('/admin', requireAuthWithCookie, createTemplate);
router.post('/admin/from-database', requireAuthWithCookie, createTemplateFromDatabase);
router.put('/admin/:id', requireAuthWithCookie, updateTemplate);
router.delete('/admin/:id', requireAuthWithCookie, deleteTemplate);

// Category management routes (Super Admin only)
router.post('/admin/categories', requireAuthWithCookie, createCategory);
router.put('/admin/categories/:id', requireAuthWithCookie, updateCategory);
router.delete('/admin/categories/:id', requireAuthWithCookie, deleteCategory);

// Template table management routes (Super Admin only)
router.get('/admin/:templateId/tables/:tableIndex', requireAuthWithCookie, getTemplateTable);
router.put('/admin/:templateId/tables/:tableIndex', requireAuthWithCookie, updateTemplateTable);
router.post('/admin/:templateId/tables/:tableIndex/columns', requireAuthWithCookie, addTemplateColumn);
router.put('/admin/:templateId/tables/:tableIndex/columns/:columnId', requireAuthWithCookie, updateTemplateColumn);
router.delete('/admin/:templateId/tables/:tableIndex/columns/:columnId', requireAuthWithCookie, deleteTemplateColumn);
router.put('/:templateId/tables/:tableIndex/columns/reorder', requireAuthWithCookie, reorderTemplateColumns);
router.post('/admin/:templateId/tables/:tableIndex/records', requireAuthWithCookie, addTemplateRecord);
router.get('/admin/:templateId/tables/:tableIndex/records', requireAuthWithCookie, getTemplateRecords);
router.put('/admin/:templateId/tables/:tableIndex/records/:recordId', requireAuthWithCookie, updateTemplateRecord);
router.delete('/admin/:templateId/tables/:tableIndex/records/:recordId', requireAuthWithCookie, deleteTemplateRecord);

export default router;
