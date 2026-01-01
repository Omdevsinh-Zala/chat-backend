import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public/assets/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || 
      file.mimetype.startsWith('video/') || 
      file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

export const uploadSingle = upload.single('file');

export const handleUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { filename, mimetype, size } = req.file;
  let fileType = 'file';

  if (mimetype.startsWith('image/')) fileType = 'image';
  else if (mimetype.startsWith('video/')) fileType = 'video';
  else if (mimetype === 'application/pdf') fileType = 'pdf';

  // Construct public URL
  const fileUrl = `uploads/${filename}`;

  return res.status(200).json({
    message: 'File uploaded successfully',
    file: {
      url: fileUrl,
      type: fileType,
      name: req.file.originalname,
      size: size,
      mimeType: mimetype
    }
  });
};
