// The single purpose of this file and it's functionality is related to
// the recent migration where we now generate thumbnail image for uploaded
// image files. This script will generate thumbnail for all the uploads that
// happen before the migration.

import path from "path";
import fs from "fs";
import sharp from "sharp";
import { Attachment } from "../models/initModels.js";
import { Op } from "sequelize";
import { generateSmartThumbnail } from '../utils/mediaHelper.js';

export const generateThumb = async () => {
    console.log("Running generateThumb script");
    const BATCH_SIZE = 10; // Process 10 images concurrently

    try {
        const attachments = await Attachment.findAll({
            where: {
                file_type: {
                    [Op.or]: ['image', 'video']
                },
                thumbnail_url: {
                    [Op.or]: [null, '']
                }
            },
            attributes: ['id', 'file_url', 'version', 'file_type']
        });

        if (attachments.length === 0) {
            console.log("No attachments found to generate thumbnail");
            process.exit(0);
        }

        console.log(`Found ${attachments.length} attachments to process.`);

        // Process in chunks to control concurrency
        for (let i = 0; i < attachments.length; i += BATCH_SIZE) {
            const chunk = attachments.slice(i, i + BATCH_SIZE);

            await Promise.all(chunk.map(async (attachment) => {
                try {
                    if (!attachment.file_url) return;

                    const filePath = path.join(process.cwd(), 'public/assets', attachment.file_url);

                    if (!fs.existsSync(filePath)) {
                        console.warn(`File not found: ${filePath}`);
                        return;
                    }

                    const filename = path.basename(attachment.file_url);
                    let thumbFilename = `thumb_${filename}`;

                    // We will let generateSmartThumbnail determine final name (though it follows same convention)
                    // But for existence check, we need a path. 
                    // Video thumbs end in .jpg
                    if (attachment.file_type === 'video') thumbFilename += '.jpg';

                    const thumbPath = path.join(path.dirname(filePath), thumbFilename);

                    if(fs.existsSync(thumbPath)) {
                        fs.rmSync(thumbPath);
                    }

                    // Generate thumbnail if it doesn't exist
                    if (!fs.existsSync(thumbPath)) {
                        if (attachment.file_type === 'image') {
                            await sharp(filePath)
                                .resize(300, 300, { fit: 'inside' })
                                .toFile(thumbPath);
                        } else if (attachment.file_type === 'video') {
                            try {
                                const thumbDir = path.dirname(filePath);
                                const thumbName = await generateSmartThumbnail(filePath, thumbDir, filename);

                                // Ensure database has correct path
                                thumbFilename = thumbName; // Update this for the DB update below if needed
                                // Actually thumbFilename is used later for DB update, but generateSmartThumbnail returns the full filename
                                // We should make sure the variable used in db update logic matches
                            } catch (e) {
                                console.error(`Error generating video thumb for ${filename}:`, e);
                            }
                        }
                    }

                    // Construct relative URL consistent with file_url
                    if (fs.existsSync(thumbPath)) {
                        const thumbUrlDir = path.dirname(attachment.file_url);
                        const thumbUrl = `${thumbUrlDir}/${thumbFilename}`.replace(/\\/g, '/');

                        await attachment.update({
                            thumbnail_url: thumbUrl
                        });
                    }
                } catch (innerErr) {
                    console.error(`Failed to process attachment ${attachment.id}:`, innerErr.message);
                }
            }));

            console.log(`Processed ${Math.min(i + BATCH_SIZE, attachments.length)}/${attachments.length}`);
        }

        console.log("Thumbnail generation complete.");
        process.exit(0);
    } catch (error) {
        console.error("Error generating thumbnail: ", error);
        process.exit(1);
    }
}

generateThumb();