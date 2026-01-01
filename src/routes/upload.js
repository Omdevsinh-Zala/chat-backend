import express from 'express';
import { uploadSingle, handleUpload } from '../controllers/uploadController.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

router.post('/', verifyToken, uploadSingle, handleUpload);

export const uploadRouter = router;
