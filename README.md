# AWS Node Demo

An Express API connected to PostgreSQL, with `/health`, `GET /users`, and `POST /users` endpoints. The source code is in `src/server.js`, `src/db.js`, and `src/routes/users.js`.

## Run locally

Requires Node.js 20 or later and PostgreSQL. Install the dependencies, create a configuration file, and enter your database settings:

```bash
cd aws-node-check-api
npm ci
cp .env.example .env
```

Create the `aws_node_demo` database (or change `DB_NAME` in `.env`), then run `sql/init.sql` against that database to create the `users` table. For example, with `psql`:

```bash
psql -h localhost -U postgres -d aws_node_demo -f sql/init.sql
```

Start the API:

```bash
npm run dev
# Or: npm start
```

The application uses port `3000` by default. Set `PORT` to use a different port.

## Test the API

```bash
curl http://localhost:3000/health
curl http://localhost:3000/users
curl -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Tam","email":"tam@example.com"}'
curl http://localhost:3000/users
```

`/health` reports the web server's status. `GET /users` reads records from PostgreSQL in descending ID order. `POST /users` creates a user and returns HTTP `201`; missing `name` or `email` returns `400`, and a duplicate email returns `409`.

Run `npm test` to check the endpoints with a mocked database. These tests do not verify a real PostgreSQL connection.

## Deploy to AWS Elastic Beanstalk

1. Set up PostgreSQL (for example, on Amazon RDS), run `sql/init.sql` against the database, and ensure the Elastic Beanstalk environment can connect to it.
2. Create a source bundle from the project directory. Do not include `.env` in the ZIP file:

   ```bash
   zip -FS -r ../aws-node-check-api.zip src package.json package-lock.json .ebextensions
   ```

3. Create a **Web server environment** in Elastic Beanstalk using the **Node.js 24 running on Amazon Linux 2023** platform, then upload the ZIP file. Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` as environment properties. Elastic Beanstalk provides `PORT` to the application.
4. After deployment, test `/health`, `GET /users`, and `POST /users` using the environment URL.

`.ebextensions/healthcheck.config` sets the health check path to `/health`. The `.env` file is for local use only and is ignored by Git.

AWS documentation: [Node.js platform](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs.container.html), [creating a source bundle](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/applications-sourcebundle.html), [supported platforms](https://docs.aws.amazon.com/elasticbeanstalk/latest/platforms/platforms-supported.html).
