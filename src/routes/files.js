const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const express = require('express');
const multer = require('multer');
const s3 = require('../config/s3');

const router = express.Router();
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});

async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Select a file to upload' });
  }

  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    return res.status(503).json({ error: 'S3_BUCKET is not configured' });
  }

  const filename = path.basename(req.file.originalname.replaceAll('\\', '/'));
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'file';
  const key = `uploads/${randomUUID()}-${safeName}`;

  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype || 'application/octet-stream',
    }));

    res.status(201).json({ key, filename, size: req.file.size });
  } catch (error) {
    console.error('POST /files failed:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
}

router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      return res.status(tooLarge ? 413 : 400).json({
        error: tooLarge ? 'File must be 10 MB or smaller' : 'Invalid file upload',
      });
    }
    if (error) {
      return res.status(400).json({ error: 'Invalid file upload' });
    }
    next();
  });
}, uploadFile);

module.exports = router;
module.exports.uploadFile = uploadFile;
