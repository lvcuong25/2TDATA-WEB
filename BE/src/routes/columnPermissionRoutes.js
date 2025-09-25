import express from 'express';
import {
  createColumnPermission,
  getColumnPermissions,
  updateColumnPermission,
  deleteColumnPermission,
  getUserColumnPermission,
  getTableColumnPermissions
} from '../controllers/columnPermissionController.js';
import { requireAuthWithCookie } from '../middlewares/requireAuthWithCookie.js';

const router = express.Router();

// Tạo permission cho column
router.post('/columns/:columnId/permissions', requireAuthWithCookie, createColumnPermission);

// Lấy tất cả permissions của column
router.get('/columns/:columnId/permissions', requireAuthWithCookie, getColumnPermissions);

// Lấy tất cả permissions của tất cả columns trong table
router.get('/tables/:tableId/columns/permissions', requireAuthWithCookie, getTableColumnPermissions);

// Lấy quyền của user cho column
router.get('/columns/:columnId/user-permission', requireAuthWithCookie, getUserColumnPermission);

// Cập nhật permission
router.put('/columns/permissions/:permissionId', requireAuthWithCookie, updateColumnPermission);

// Xóa permission
router.delete('/columns/permissions/:permissionId', requireAuthWithCookie, deleteColumnPermission);

export default router;
