import fs from 'fs/promises';
import { b2 } from '../config/b2.js';
import { config } from '../config/app.js';

export async function uploadToB2(localFilePath, remoteFileName, mimeType) {
  const fileBuffer = await fs.readFile(localFilePath);

  const uploadUrlResponse = await b2.getUploadUrl({
    bucketId: config.b2.bucketID
  });
  await b2.uploadFile({
    uploadUrl: uploadUrlResponse.data.uploadUrl,
    uploadAuthToken: uploadUrlResponse.data.authorizationToken,
    fileName: remoteFileName,
    data: fileBuffer,
    contentType: mimeType
  });
}

export async function removeFromB2(remoteFileName) {
  const versions = await b2.listFileVersions({
    bucketId: config.b2.bucketID,
    prefix: remoteFileName,
    maxFileCount: 1
  });

  if (!versions.data.files.length) return;

  const { fileId, fileName } = versions.data.files[0];

  await b2.deleteFileVersion({
    fileId,
    fileName
  });
}