import express from 'express';
import {
  getAllIframes,
  getIframeById,
  getIframeByDomain,
  createIframe,
  updateIframe,
  deleteIframe
} from '../controllers/iframe.js';

const router = express.Router();

// Lấy danh sách tất cả iframe
router.get('/', getAllIframes);

// Lấy 1 iframe theo id
router.get('/:id', getIframeById);

// Lấy iframe theo domain
router.get('/domain/:domain', getIframeByDomain);

// Thêm mới iframe
router.post('/', createIframe);

// Sửa iframe
router.put('/:id', updateIframe);

// Xóa iframe
router.delete('/:id', deleteIframe);

export default router; 