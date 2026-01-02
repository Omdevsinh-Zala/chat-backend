import express from 'express';
import { uploadFiles, handleUpload } from '../controllers/uploadController.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

router.post('/', verifyToken, uploadFiles, handleUpload);

export const uploadRouter = router;
