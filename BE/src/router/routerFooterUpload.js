import express from 'express';
import { requireAuth } from '../middlewares/requireAuth.js';
import { uploadFooterLogo, deleteFooterLogo, upload } from '../controllers/footerUpload.js';

const router = express.Router();

// Upload footer logo - requires authentication
router.post('/upload', requireAuth, upload.single('image'), uploadFooterLogo);

// Delete footer logo
router.delete('/delete/:filename', requireAuth, deleteFooterLogo);

export default router;
