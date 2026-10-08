const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const app = require('../src/server');
const pool = require('../src/db');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('health responds without a database connection', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'ok',
    message: 'Node API is running',
  });
});

test('GET /users returns rows from PostgreSQL', async () => {
  const originalQuery = pool.query;
  pool.query = async (sql) => {
    assert.equal(sql, 'SELECT * FROM users ORDER BY id DESC');
    return { rows: [{ id: 2, name: 'Tam', email: 'tam@example.com' }] };
  };

  try {
    const response = await fetch(`${baseUrl}/users`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [
      { id: 2, name: 'Tam', email: 'tam@example.com' },
    ]);
  } finally {
    pool.query = originalQuery;
  }
});

test('POST /users uses parameters and returns the inserted row', async () => {
  const originalQuery = pool.query;
  pool.query = async (sql, values) => {
    assert.equal(sql, 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *');
    assert.deepEqual(values, ['Tam', 'tam@example.com']);
    return { rows: [{ id: 1, name: values[0], email: values[1] }] };
  };

  try {
    const response = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: ' Tam ', email: 'tam@example.com' }),
    });
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), {
      id: 1,
      name: 'Tam',
      email: 'tam@example.com',
    });
  } finally {
    pool.query = originalQuery;
  }
});

test('POST /users rejects missing fields', async () => {
  const response = await fetch(`${baseUrl}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Tam' }),
  });
  assert.equal(response.status, 400);
});
