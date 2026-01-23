import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'child_process';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Extracts video duration in seconds using ffmpeg-static with buffer (no file writes).
 */
export const getVideoDuration = async (buffer) => {
  return new Promise((resolve) => {
    const process = spawn(ffmpegPath, [
      '-i', 'pipe:0',
      '-f', 'null',
      '-'
    ]);

    let stderrOutput = '';

    process.stderr.on('data', (data) => {
      stderrOutput += data.toString();
    });

    process.on('close', () => {
      // Extract duration from format: Duration: HH:MM:SS.ms
      const match = stderrOutput.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseFloat(match[3]);
        
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        resolve(totalSeconds);
      } else {
        resolve(0);
      }
    });

    process.on('error', (error) => {
      console.error('Error spawning ffmpeg:', error);
      resolve(0);
    });

    process.stdin.on('error', () => {
      // Ignore stdin errors
    });

    // Write the entire buffer at once and immediately close
    process.stdin.end(buffer);
  });
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
export const generateSmartThumbnail = async (buffer, baseFilename) => {
  const duration = await getVideoDuration(buffer);
  const checkpoints = [1];
  if (duration > 5) {
    checkpoints.push(duration * 0.2, duration * 0.5);
  }

  const validCheckpoints = checkpoints
    .filter(t => t < duration)
    .map(t => Math.max(0, t));

  if (validCheckpoints.length === 0) validCheckpoints.push(0);

  const outputDir = path.join(process.cwd(), 'tmp-thumbs');
  fs.mkdirSync(outputDir, { recursive: true });

  const finalThumbFilename = `thumb_${baseFilename}.jpg`;
  const finalThumbPath = path.join(outputDir, finalThumbFilename);

  for (const timestamp of validCheckpoints) {
    const tempPath = path.join(
      outputDir,
      `.__tmp_thumb_${timestamp.toFixed(2)}.jpg`
    );

    try {
      await extractFrameAtTimestamp(buffer, timestamp, tempPath);

      if (await isImageUsable(tempPath)) {
        fs.renameSync(tempPath, finalThumbPath);
        return finalThumbFilename;
      }

      fs.existsSync(tempPath) && fs.unlinkSync(tempPath);
    } catch (e) {
      console.error(`Error processing video frame at ${timestamp}:`, e);
    }
  }

  return null;
};

// Helper function to extract frame using spawn
const extractFrameAtTimestamp = (buffer, timestamp, outputPath) => {
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpegPath, [
      '-y',
      '-ss', timestamp.toString(),
      '-i', 'pipe:0',
      '-frames:v', '1',
      '-update', '1',
      outputPath
    ]);

    let stderrOutput = '';

    process.stderr.on('data', (data) => {
      stderrOutput += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderrOutput}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });

    process.stdin.on('error', () => {
      // Ignore stdin errors
    });

    // Write buffer to stdin
    process.stdin.end(buffer);
  });
};
