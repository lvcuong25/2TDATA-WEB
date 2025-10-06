import express from 'express';
import {
  getTableFormattingRules,
  createFormattingRule,
  updateFormattingRule,
  deleteFormattingRule,
  previewFormatting
} from '../controllers/conditionalFormattingController.js';
import { requireAuthWithCookie } from '../middlewares/requireAuthWithCookie.js';

const router = express.Router();

// Lấy tất cả formatting rules cho một table
router.get('/tables/:tableId/rules', requireAuthWithCookie, getTableFormattingRules);

// Tạo formatting rule mới
router.post('/tables/:tableId/rules', requireAuthWithCookie, createFormattingRule);

// Cập nhật formatting rule
router.put('/rules/:ruleId', requireAuthWithCookie, updateFormattingRule);

// Xóa formatting rule
router.delete('/rules/:ruleId', requireAuthWithCookie, deleteFormattingRule);

// Preview formatting
router.post('/tables/:tableId/preview', requireAuthWithCookie, previewFormatting);

export default router;
