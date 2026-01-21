import { successResponse, errorResponse } from "../utils/response.js";
import sharp from 'sharp';
import path from 'path';
import { generateSmartThumbnail } from '../utils/mediaHelper.js';
import fs from 'fs';

export const handleUpload = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return errorResponse({ res, message: 'No files uploaded', details: null });
  }

  try {
    const uploadedFiles = await Promise.all(req.files.map(async file => {
      const { filename, mimetype, size, path: filePath, destination } = file;
      let fileType = 'file';
      let thumbUrl = null;

      if (mimetype.startsWith('image/')) {
        fileType = 'image';
        // Generate thumbnail
        const thumbFilename = `thumb_${filename}`;
        const thumbPath = path.join(destination, thumbFilename);

        try {
          await sharp(filePath)
            .resize(300, 300, { fit: 'inside' })
            .toFile(thumbPath);

          thumbUrl = `uploads/${thumbFilename}`;
        } catch (sharpError) {
          console.error("Error generating thumbnail:", sharpError);
          // Fallback: no thumbnail if generation fails
        }
      }
      else if (mimetype.startsWith('video/')) {
        fileType = 'video';

        try {
          // Generate smart thumbnail (avoids black screens)
          const generatedThumbName = await generateSmartThumbnail(filePath, destination, filename);

          if (generatedThumbName) {
            thumbUrl = `uploads/${generatedThumbName}`;
          }
        } catch (ffmpegError) {
          console.error("Error generating video thumbnail:", ffmpegError);
        }
      }
      else if (mimetype === 'application/pdf') fileType = 'pdf';

      return {
        file_url: `uploads/${filename}`,
        thumbnail_url: thumbUrl,
        file_type: fileType,
        file_name: file.originalname,
        file_size: size,
        mime_type: mimetype
      };
    }));

    return successResponse({ res, data: { files: uploadedFiles }, message: null, statusCode: 200 });
  } catch (err) {
    return errorResponse({ res, message: err.message, statusCode: 500, data: null });
  }
};
