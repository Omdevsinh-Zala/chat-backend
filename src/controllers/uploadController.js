import { successResponse, errorResponse } from "../utils/response.js";
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { generateSmartThumbnail } from '../utils/mediaHelper.js';
import { uploadToB2 } from '../services/b2Upload.js';
import { generateHash } from "../utils/fileHash.js";

export const handleUpload = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return errorResponse({ res, message: 'No files uploaded', details: null });
  }

  try {
    const uploadedFiles = await Promise.all(
      req.files.map(async file => {
        const { originalname, mimetype, size, buffer } = file;
        let fileType = 'file';
        let thumbUrl = null;

        const hash = await generateHash({ buffer });
        const ext = path.extname(originalname);
        const filename = `${hash}${ext}`;

        const chatPath = req.body.chatPath;
        const b2FilePath = `${chatPath}/${filename}`;

        // Prepare upload tasks
        const uploadTasks = [
          uploadToB2({ buffer }, b2FilePath, mimetype)
        ];

        let thumbnailPromise = null;

        if (mimetype.startsWith('image/')) {
          fileType = 'image';
          thumbnailPromise = (async () => {
            try {
              const thumbBuffer = await sharp(buffer).webp({ quality: 90 }).toBuffer();
              thumbUrl = `${chatPath}/thumbs/${filename}`;
              await uploadToB2({ buffer: thumbBuffer }, thumbUrl, 'image/webp');
            } catch (sharpError) {
              console.error("Error generating thumbnail:", sharpError);
            }
          })();
        } else if (mimetype.startsWith('video/')) {
          fileType = 'video';
          thumbnailPromise = (async () => {
            try {
              const generatedThumbName = await generateSmartThumbnail(buffer, filename);
              if (generatedThumbName) {
                const currentDir = path.join(process.cwd(), 'tmp-thumbs');
                const destination = path.join(currentDir, generatedThumbName);
                const thumbHash = await generateHash({ filePath: destination });
                const thumbExt = path.extname(generatedThumbName);
                const thumbFilename = `${thumbHash}${thumbExt}`;
                thumbUrl = `${chatPath}/thumbs/${thumbFilename}`;
                await uploadToB2({ path: destination }, thumbUrl, 'image/webp');
                fs.unlinkSync(destination);
              }
            } catch (ffmpegError) {
              console.error("Error generating video thumbnail:", ffmpegError);
            }
          })();
        } else if (mimetype === 'application/pdf') {
          fileType = 'pdf';
        }

        if (thumbnailPromise) {
          uploadTasks.push(thumbnailPromise);
        }

        // Wait for all upload tasks for this file
        await Promise.all(uploadTasks);

        return {
          file_url: b2FilePath,
          thumbnail_url: thumbUrl,
          file_type: fileType,
          file_name: originalname,
          file_size: size,
          mime_type: mimetype
        };
      })
    );

    return successResponse({ res, data: { files: uploadedFiles }, message: null, statusCode: 200 });
  } catch (err) {
    return errorResponse({ res, message: err.message, statusCode: 500, data: null });
  }
};
