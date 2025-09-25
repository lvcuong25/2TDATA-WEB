import express from 'express';
import {
  createCellPermission,
  getCellPermissions,
  getTableCellPermissions,
  updateCellPermission,
  deleteCellPermission,
  getUserCellPermission
} from '../controllers/cellPermissionController.js';
import { requireAuthWithCookie } from '../middlewares/requireAuthWithCookie.js';

const router = express.Router();

// Tạo permission cho cell
router.post('/cells/:recordId/:columnId/permissions', requireAuthWithCookie, createCellPermission);

// Lấy tất cả permissions của cell
router.get('/cells/:recordId/:columnId/permissions', requireAuthWithCookie, getCellPermissions);

// Lấy tất cả permissions của tất cả cells trong table
router.get('/tables/:tableId/cells/permissions', requireAuthWithCookie, getTableCellPermissions);

// Lấy quyền của user cho cell
router.get('/cells/:recordId/:columnId/user-permission', requireAuthWithCookie, getUserCellPermission);

// Cập nhật permission
router.put('/cells/permissions/:permissionId', requireAuthWithCookie, updateCellPermission);

// Xóa permission
router.delete('/cells/permissions/:permissionId', requireAuthWithCookie, deleteCellPermission);

export default router;
