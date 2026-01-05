import express from 'express';
import { multerUpload } from '../utils/fileUpload.js';
import { handleUpload } from '../controllers/uploadController.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

router.post('/', verifyToken, multerUpload.array('files'), handleUpload);

export const uploadRouter = router;
