import { successResponse, errorResponse } from "../utils/response.js";

export const handleUpload = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return errorResponse({ res, message: 'No files uploaded', details: null });
  }

  try {
    const uploadedFiles = req.files.map(file => {
      const { filename, mimetype, size } = file;
      let fileType = 'file';

      if (mimetype.startsWith('image/')) fileType = 'image';
      else if (mimetype.startsWith('video/')) fileType = 'video';
      else if (mimetype === 'application/pdf') fileType = 'pdf';

      return {
        url: `uploads/${filename}`,
        type: fileType,
        name: file.originalname,
        size: size,
        mimeType: mimetype
      };
    });

    return successResponse({ res, data: { files: uploadedFiles }, message: 'Files uploaded successfully', statusCode: 200 });
  } catch (err) {
    return errorResponse({ res, message: err, statusCode: 500, data: null });
  }

};
