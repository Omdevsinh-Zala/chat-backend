import { successResponse, errorResponse } from "../utils/response.js";
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { generateSmartThumbnail } from '../utils/mediaHelper.js';
import { uploadToB2 } from '../services/b2Upload.js';

export const handleUpload = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return errorResponse({ res, message: 'No files uploaded', details: null });
  }

  try {
    const uploadedFiles = await Promise.all(req.files.map(async file => {
      const { filename, mimetype, size, path: filePath, destination } = file;
      let fileType = 'file';
      let thumbUrl = null;

      await uploadToB2(filePath, `uploads/${filename}`, mimetype);

      if(mimetype.split('/')[0] !== 'video') {
        fs.unlinkSync(filePath);
      }

      if (mimetype.startsWith('image/')) {
        fileType = 'image';
        // Generate thumbnail
        const thumbFilename = `thumb_${filename}`;
        const thumbPath = path.join(destination, thumbFilename);

        try {
          await sharp(filePath)
            .resize(300, 300, { fit: 'inside' })
            .toFile(thumbPath);

          thumbUrl = `thumbs/${thumbFilename}`;
          await uploadToB2(thumbPath, `thumbs/${thumbFilename}`, mimetype);
        } catch (sharpError) {
          console.error("Error generating thumbnail:", sharpError);
        }
      }
      else if (mimetype.startsWith('video/')) {
        fileType = 'video';

        try {
          // Generate smart thumbnail (avoids black screens)
          const generatedThumbName = await generateSmartThumbnail(filePath, destination, filename);

          if (generatedThumbName) {
            thumbUrl = `thumbs/videos/${generatedThumbName}`;
            await uploadToB2(path.join(destination, generatedThumbName), `thumbs/videos/${generatedThumbName}`, mimetype);

            fs.unlinkSync(path.join(destination, generatedThumbName));
            fs.unlinkSync(filePath);
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
