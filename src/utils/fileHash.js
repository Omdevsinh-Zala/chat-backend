import fs from 'fs';
import crypto from 'crypto';

export const generateHash = async ({ buffer, filePath }) => {
  if (buffer) {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  return await generateFileHashFromPath(filePath);
};

const generateFileHashFromPath = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);

    stream.on('data', chunk => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
  });
};