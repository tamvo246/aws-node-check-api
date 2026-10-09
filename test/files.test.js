const assert = require('node:assert/strict');
const { test } = require('node:test');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../src/config/s3');
const { uploadFile } = require('../src/routes/files');

function mockResponse() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('uploads a file to the configured bucket and returns its key', async () => {
  const originalSend = s3.send;
  const originalBucket = process.env.S3_BUCKET;
  const buffer = Buffer.from('hello');
  let uploadedKey;
  process.env.S3_BUCKET = 'demo-bucket';
  s3.send = async (command) => {
    assert.ok(command instanceof PutObjectCommand);
    assert.equal(command.input.Bucket, 'demo-bucket');
    assert.match(command.input.Key, /^uploads\/[0-9a-f-]+-hello.txt$/);
    uploadedKey = command.input.Key;
    assert.equal(command.input.Body, buffer);
    assert.equal(command.input.ContentType, 'text/plain');
    return {};
  };

  try {
    const response = mockResponse();
    await uploadFile({ file: {
      originalname: 'hello.txt',
      buffer,
      mimetype: 'text/plain',
      size: buffer.length,
    } }, response);

    assert.equal(response.statusCode, 201);
    assert.deepEqual(response.body, {
      key: uploadedKey,
      filename: 'hello.txt',
      size: buffer.length,
    });
  } finally {
    s3.send = originalSend;
    if (originalBucket === undefined) delete process.env.S3_BUCKET;
    else process.env.S3_BUCKET = originalBucket;
  }
});

test('rejects a missing file before calling S3', async () => {
  const response = mockResponse();
  await uploadFile({}, response);
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { error: 'Select a file to upload' });
});
