import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'child_process';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Extracts video duration in seconds using ffmpeg-static.
 */
export const getVideoDuration = async (filePath) => {
  return new Promise((resolve) => {
    const process = spawn(ffmpegPath, [
      '-i', filePath,
      '-f', 'null',
      '-'
    ]);

    let stderrOutput = '';
    process.stderr.on('data', (data) => {
      stderrOutput += data.toString();
    });

    process.on('close', () => {
      const match = stderrOutput.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseFloat(match[3]);
        resolve(hours * 3600 + minutes * 60 + seconds);
      } else {
        resolve(0);
      }
    });

    process.on('error', (error) => {
      console.error('Error spawning ffmpeg:', error);
      resolve(0);
    });
  });
};

/**
 * Calculates the average brightness of an image.
 * Returns a score (0-255).
 */
export const getImageBrightness = async (imagePath) => {
  try {
    if (!fs.existsSync(imagePath)) return 0;
    const stats = await sharp(imagePath).stats();
    // Return average of R, G, B channel means
    return stats.channels.reduce((sum, c) => sum + c.mean, 0) / stats.channels.length;
  } catch (error) {
    console.error("Error calculating brightness:", error);
    return 0;
  }
};

/**
 * Generates a usable thumbnail for a video.
 * Analyzes multiple timestamps and picks the brightest frame.
 */
export const generateSmartThumbnail = async (buffer, baseFilename) => {
  const outputDir = path.join(process.cwd(), 'tmp-thumbs');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const tempVideoPath = path.join(outputDir, `.__tmp_vid_${uniqueId}_${baseFilename}`);
  fs.writeFileSync(tempVideoPath, buffer);

  const candidates = [];

  try {
    const duration = await getVideoDuration(tempVideoPath);
    const timestamps = [1]; // Always try 1s mark
    if (duration > 5) {
      timestamps.push(duration * 0.2, duration * 0.5, duration * 0.8);
    }

    const uniqueTimestamps = [...new Set(timestamps)]
      .filter(t => t < duration)
      .map(t => Math.max(0, t));

    if (uniqueTimestamps.length === 0) uniqueTimestamps.push(0);

    for (const timestamp of uniqueTimestamps) {
      const tempThumbPath = path.join(outputDir, `.__tmp_thumb_${uniqueId}_${timestamp.toFixed(2)}.jpg`);
      try {
        await extractFrameAtTimestamp(tempVideoPath, timestamp, tempThumbPath);
        if (fs.existsSync(tempThumbPath)) {
          const brightness = await getImageBrightness(tempThumbPath);
          candidates.push({ path: tempThumbPath, brightness });
        }
      } catch (e) {
        console.error(`Failed to extract frame at ${timestamp}:`, e);
      }
    }

    if (candidates.length === 0) return null;

    // Pick the brightest candidate
    candidates.sort((a, b) => b.brightness - a.brightness);
    const bestCandidate = candidates[0];

    // Final thumbnail name (use .webp for quality and consistency)
    const finalThumbFilename = `thumb_${baseFilename.split('.')[0]}.webp`;
    const finalThumbPath = path.join(outputDir, finalThumbFilename);

    // Process with Sharp for high quality WebP
    await sharp(bestCandidate.path)
      .webp({ quality: 90 })
      .toFile(finalThumbPath);

    // Cleanup all candidate files
    candidates.sort((a, b) => b.brightness - a.brightness);
    candidates.forEach(c => {
      if (fs.existsSync(c.path)) {
        try { fs.unlinkSync(c.path); } catch (e) { }
      }
    });

    return finalThumbFilename;

  } finally {
    // Cleanup temporary video file
    if (fs.existsSync(tempVideoPath)) {
      fs.unlinkSync(tempVideoPath);
    }
  }
};

// Helper function to extract frame using spawn
const extractFrameAtTimestamp = (videoPath, timestamp, outputPath) => {
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpegPath, [
      '-y',
      '-ss', timestamp.toString(),
      '-i', videoPath,
      '-frames:v', '1',
      '-q:v', '2', // High quality extraction
      '-vf', 'scale=1280:-1', // Higher resolution
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
        const errorMsg = `ffmpeg exited with code ${code}. Stderr: ${stderrOutput}`;
        console.error(errorMsg);
        reject(new Error(errorMsg));
      }
    });

    process.on('error', reject);
  });
};
