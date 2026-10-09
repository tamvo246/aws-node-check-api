require('dotenv').config();

const path = require('node:path');
const express = require('express');
const usersRouter = require('./routes/users');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Node API is running',
  });
});

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/users', usersRouter);

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;
