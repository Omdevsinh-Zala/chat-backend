import ffmpegPath from 'ffmpeg-static';
import { exec } from 'child_process';
import util from 'util';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);

/**
 * Extracts video duration in seconds.
 * Uses ffmpeg output parsing since we might not have ffprobe.
 */
export const getVideoDuration = async (filePath) => {
    try {
        const command = `"${ffmpegPath}" -i "${filePath}"`;
        // ffmpeg outputs info to stderr even without input options
        const { stderr } = await execPromise(command).catch(err => err); // catch because ffmpeg errors without output file

        // Look for "Duration: 00:00:05.32"
        const match = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (match) {
            const hours = parseFloat(match[1]);
            const minutes = parseFloat(match[2]);
            const seconds = parseFloat(match[3]);
            return (hours * 3600) + (minutes * 60) + seconds;
        }
        return 0;
    } catch (error) {
        console.error("Error getting video duration:", error);
        return 0;
    }
};

/**
 * Checks if an image is "good" (not too dark).
 * Returns true if usable, false if too dark.
 */
export const isImageUsable = async (imagePath) => {
    try {
        if (!fs.existsSync(imagePath)) return false;

        const stats = await sharp(imagePath).stats();
        // Check average brightness of channels. If all are excessively dark, return false.
        // stats.channels array: [ { mean, stdev, min, max }, ... ] for r, g, b
        // A completely black image has mean 0. A very dark one might be < 10 or 15.

        const isTooDark = stats.channels.every(c => c.mean < 15);
        return !isTooDark;
    } catch (error) {
        console.error("Error analyzing image brightness:", error);
        return true; // Assume usable if we fail to check, to avoid infinite loops or no thumb
    }
};

/**
 * Generates a usable thumbnail for a video.
 * Tries multiple timestamps if the first one yields a black frame.
 */
export const generateSmartThumbnail = async (videoPath, outputDir, baseFilename) => {
  // ensure output folder exists
  fs.mkdirSync(outputDir, { recursive: true });

  const duration = await getVideoDuration(videoPath);

  const checkpoints = [1];
  if (duration > 5) {
    checkpoints.push(duration * 0.2, duration * 0.5);
  }

  const validCheckpoints = checkpoints
    .filter(t => t < duration)
    .map(t => Math.max(0, t));

  if (validCheckpoints.length === 0) validCheckpoints.push(0);

  const finalThumbFilename = `thumb_${baseFilename}.jpg`;
  const finalThumbPath = path.join(outputDir, finalThumbFilename);

  for (const timestamp of validCheckpoints) {
    // temp file per attempt
    const tempPath = path.join(
      outputDir,
      `.__tmp_thumb_${timestamp.toFixed(2)}.jpg`
    );

    try {
      const command = `"${ffmpegPath}" -y -ss ${timestamp} -i "${videoPath}" -frames:v 1 -update 1 "${tempPath}"`;
      await execPromise(command);

      if (await isImageUsable(tempPath)) {
        fs.renameSync(tempPath, finalThumbPath);
        return finalThumbFilename;
      }

      fs.existsSync(tempPath) && fs.unlinkSync(tempPath);
    } catch (e) {
      console.error(`Error processing video frame at ${timestamp}:`, e);
    }
  }

  return fs.existsSync(finalThumbPath) ? finalThumbFilename : null;
};

