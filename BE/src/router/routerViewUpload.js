import express from 'express';
import { requireAuthWithCookie } from '../middlewares/requireAuthWithCookie.js';
import { uploadViewImage, upload } from '../controllers/viewUpload.js';

const router = express.Router();

// Upload view image - requires authentication (supports both Bearer token and cookies)
router.post('/upload', requireAuthWithCookie, upload.single('image'), uploadViewImage);

export default router;
