import { Router } from 'express';
import { requireAuthWithCookie } from '../middlewares/requireAuthWithCookie.js';
import {
  createTablePermission,
  getTablePermissions,
  updateTablePermission,
  deleteTablePermission,
  getUserTablePermissions,
  getDatabaseMembers,
  getAvailablePermissionTargets
} from '../controllers/permissionController.js';

const router = Router();

// Tất cả routes đều cần authentication
router.use(requireAuthWithCookie);

// Table Permission Routes
router.post('/tables/:tableId/permissions', createTablePermission);
router.get('/tables/:tableId/permissions', getTablePermissions);
router.get('/tables/:tableId/available-targets', getAvailablePermissionTargets);
router.put('/tables/permissions/:permissionId', updateTablePermission);
router.delete('/tables/permissions/:permissionId', deleteTablePermission);
router.get('/tables/:tableId/user-permissions', getUserTablePermissions);

// Database Members Routes
router.get('/database/databases/:databaseId/members', getDatabaseMembers);

export default router;
