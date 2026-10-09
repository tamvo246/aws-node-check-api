require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  ssl: {
    ca: fs.readFileSync(
      path.join(__dirname, "../certs/global-bundle.pem"),
      "utf8"
    ),
    servername:
      "node-db-demo.ctuek6imkxau.ap-southeast-2.rds.amazonaws.com",
    rejectUnauthorized: true,
  },
});

module.exports = pool;
