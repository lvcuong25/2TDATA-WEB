import express from 'express';
import {
  createServer,
  getServers,
  getServerById,
  updateServer,
  deleteServer
} from '../controllers/serverController.js';

const router = express.Router();

// Thêm server
router.post('/', createServer);
// Lấy danh sách server
router.get('/', getServers);
// Lấy chi tiết server
router.get('/:id', getServerById);
// Sửa server
router.put('/:id', updateServer);
// Xóa server
router.delete('/:id', deleteServer);

export default router; 