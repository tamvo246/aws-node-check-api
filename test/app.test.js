const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { createApp } = require('../app');

const server = createApp();
let baseUrl;

before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('health check returns ok', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('items can be listed and filtered', async () => {
  const all = await (await fetch(`${baseUrl}/api/items`)).json();
  assert.equal(all.count, 3);

  const filtered = await (await fetch(`${baseUrl}/api/items?category=electronics`)).json();
  assert.equal(filtered.count, 2);
  assert.ok(filtered.data.every((item) => item.category === 'electronics'));
});

test('item lookup returns the matching item or 404', async () => {
  const found = await fetch(`${baseUrl}/api/items/2`);
  assert.deepEqual(await found.json(), {
    data: { id: 2, name: 'Mouse', price: 25, category: 'electronics' },
  });

  const missing = await fetch(`${baseUrl}/api/items/99`);
  assert.equal(missing.status, 404);
});

test('echo preserves query data', async () => {
  const response = await fetch(`${baseUrl}/api/echo?value=hello%20AWS`);
  assert.deepEqual(await response.json(), { value: 'hello AWS' });
});
