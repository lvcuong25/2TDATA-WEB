import express from 'express';
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate,
  incrementTemplateUsage
} from '../controllers/templateController.js';
import { authMiddleware as authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * TEMPLATE ROUTES
 * 
 * Template = Bản copy database structure (không có organization & permissions)
 * 
 * MongoDB: Template metadata
 * PostgreSQL: Template structure data
 */

// ===========================================
// PUBLIC ROUTES
// ===========================================

// GET /api/templates - Get all public templates
router.get('/', getAllTemplates);

// GET /api/templates/:id - Get template by ID
router.get('/:id', getTemplateById);

// ===========================================
// PROTECTED ROUTES
// ===========================================

// POST /api/templates - Create new template
router.post('/', authenticateToken, createTemplate);

// PUT /api/templates/:id - Update template
router.put('/:id', authenticateToken, updateTemplate);

// DELETE /api/templates/:id - Delete template
router.delete('/:id', authenticateToken, deleteTemplate);

// POST /api/templates/:id/apply - Apply template to database
router.post('/:id/apply', authenticateToken, applyTemplate);

// POST /api/templates/:id/usage - Increment template usage
router.post('/:id/usage', incrementTemplateUsage);

export default router;
