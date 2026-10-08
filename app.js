const http = require('node:http');

const items = [
  { id: 1, name: 'Laptop', price: 1200, category: 'electronics' },
  { id: 2, name: 'Mouse', price: 25, category: 'electronics' },
  { id: 3, name: 'Notebook', price: 5, category: 'stationery' },
];

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(data));
}

function createApp() {
  return http.createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');

    if (request.method !== 'GET') {
      return sendJson(response, 405, { error: 'Method not allowed' });
    }

    if (url.pathname === '/') {
      return sendJson(response, 200, {
        message: 'AWS Node Check API',
        paths: ['/health', '/api/items', '/api/items/1', '/api/echo?value=hello'],
      });
    }

    if (url.pathname === '/health') {
      return sendJson(response, 200, { status: 'ok' });
    }

    if (url.pathname === '/api/items') {
      const category = url.searchParams.get('category');
      const data = category
        ? items.filter((item) => item.category === category)
        : items;
      return sendJson(response, 200, { count: data.length, data });
    }

    const itemMatch = /^\/api\/items\/(\d+)$/.exec(url.pathname);
    if (itemMatch) {
      const item = items.find((entry) => entry.id === Number(itemMatch[1]));
      return item
        ? sendJson(response, 200, { data: item })
        : sendJson(response, 404, { error: 'Item not found' });
    }

    if (url.pathname === '/api/echo') {
      return sendJson(response, 200, {
        value: url.searchParams.get('value') ?? '',
      });
    }

    return sendJson(response, 404, { error: 'Path not found' });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 8080;
  createApp().listen(port, '0.0.0.0', () => {
    console.log(`API listening on port ${port}`);
  });
}

module.exports = { createApp };
