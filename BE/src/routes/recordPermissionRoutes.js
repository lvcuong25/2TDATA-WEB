import express from 'express';
import {
  createRecordPermission,
  getRecordPermissions,
  getTableRecordPermissions,
  updateRecordPermission,
  deleteRecordPermission,
  getUserRecordPermission
} from '../controllers/recordPermissionController.js';
import { requireAuthWithCookie } from '../middlewares/requireAuthWithCookie.js';

const router = express.Router();

// Tạo permission cho record
router.post('/records/:recordId/permissions', requireAuthWithCookie, createRecordPermission);

// Lấy tất cả permissions của record
router.get('/records/:recordId/permissions', requireAuthWithCookie, getRecordPermissions);

// Lấy tất cả permissions của tất cả records trong table
router.get('/tables/:tableId/records/permissions', requireAuthWithCookie, getTableRecordPermissions);

// Lấy quyền của user cho record
router.get('/records/:recordId/user-permission', requireAuthWithCookie, getUserRecordPermission);

// Cập nhật permission
router.put('/records/permissions/:permissionId', requireAuthWithCookie, updateRecordPermission);

// Xóa permission
router.delete('/records/permissions/:permissionId', requireAuthWithCookie, deleteRecordPermission);

export default router;
